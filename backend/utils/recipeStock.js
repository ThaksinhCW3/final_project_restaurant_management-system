const EPSILON = 0.000001;

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatQuantity = (value) => {
    const rounded = Math.round((toNumber(value) + Number.EPSILON) * 1000) / 1000;
    return String(rounded).replace(/\.?0+$/, '');
};

const normalizeItems = (items) => {
    const byMenu = new Map();

    for (const item of items) {
        const menuId = Number(item.menu_id ?? item.menuId ?? item.id);
        const quantity = Number(item.quantity ?? item.qty);

        if (!Number.isInteger(menuId) || !Number.isFinite(quantity) || quantity <= 0) {
            continue;
        }

        byMenu.set(menuId, (byMenu.get(menuId) ?? 0) + quantity);
    }

    return Array.from(byMenu.entries()).map(([menuId, quantity]) => ({ menuId, quantity }));
};

const getStockRequirements = (connection, items, options, callback) => {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    const normalizedItems = normalizeItems(items);
    const menuIds = normalizedItems.map((item) => item.menuId);

    if (menuIds.length === 0) {
        callback(null, []);
        return;
    }

    const itemQuantityByMenu = new Map(
        normalizedItems.map((item) => [item.menuId, item.quantity]),
    );

    const query = `
        SELECT
            recipes.menu_id,
            recipes.ingredient_id,
            recipes.quantity_used,
            ingredients.ingredient_name,
            ingredients.unit,
            ingredients.stock_quantity
        FROM recipes
        JOIN ingredients ON recipes.ingredient_id = ingredients.ingredient_id
        WHERE recipes.menu_id IN (?)
        ${options.lock ? 'FOR UPDATE' : ''}
    `;

    connection.query(query, [menuIds], (err, rows) => {
        if (err) return callback(err);

        const requirements = new Map();

        for (const row of rows) {
            const menuId = Number(row.menu_id);
            const ingredientId = Number(row.ingredient_id);
            const menuQuantity = itemQuantityByMenu.get(menuId) ?? 0;
            const requiredQuantity = menuQuantity * toNumber(row.quantity_used);

            if (!Number.isInteger(ingredientId) || requiredQuantity <= 0) {
                continue;
            }

            const existing = requirements.get(ingredientId) ?? {
                ingredientId,
                ingredientName: row.ingredient_name || `Ingredient ${ingredientId}`,
                unit: row.unit || '',
                requiredQuantity: 0,
                availableQuantity: toNumber(row.stock_quantity),
            };

            existing.requiredQuantity += requiredQuantity;
            existing.availableQuantity = toNumber(row.stock_quantity);
            requirements.set(ingredientId, existing);
        }

        callback(null, Array.from(requirements.values()));
    });
};

const getSessionOrderItems = (connection, sessionId, callback) => {
    const query = `
        SELECT order_items.menu_id, SUM(order_items.quantity) AS quantity
        FROM orders
        JOIN order_items ON orders.order_id = order_items.order_id
        WHERE orders.session_id = ?
        GROUP BY order_items.menu_id
    `;

    connection.query(query, [sessionId], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows.map((row) => ({
            menuId: Number(row.menu_id),
            quantity: toNumber(row.quantity),
        })));
    });
};

const findShortages = (requirements) =>
    requirements.filter(
        (item) => item.requiredQuantity - item.availableQuantity > EPSILON,
    );

const stockShortagePayload = (shortages) => ({
    message: `Insufficient stock: ${shortages
        .map((item) =>
            `${item.ingredientName} needs ${formatQuantity(item.requiredQuantity)}${item.unit ? ` ${item.unit}` : ''}, available ${formatQuantity(item.availableQuantity)}${item.unit ? ` ${item.unit}` : ''}`,
        )
        .join('; ')}`,
    shortages: shortages.map((item) => ({
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        unit: item.unit,
        requiredQuantity: formatQuantity(item.requiredQuantity),
        availableQuantity: formatQuantity(item.availableQuantity),
    })),
});

const deductStockForRequirements = (connection, requirements, callback) => {
    const deductable = requirements.filter((item) => item.requiredQuantity > 0);
    let index = 0;

    const next = () => {
        if (index >= deductable.length) {
            callback(null);
            return;
        }

        const item = deductable[index];
        index += 1;

        connection.query(
            'UPDATE ingredients SET stock_quantity = stock_quantity - ? WHERE ingredient_id = ?',
            [item.requiredQuantity, item.ingredientId],
            (err) => {
                if (err) return callback(err);
                next();
            },
        );
    };

    next();
};

module.exports = {
    deductStockForRequirements,
    findShortages,
    getSessionOrderItems,
    getStockRequirements,
    normalizeItems,
    stockShortagePayload,
};
