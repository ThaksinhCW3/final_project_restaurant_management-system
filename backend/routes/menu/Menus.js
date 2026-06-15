const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    const queryAsync = (query, params = []) =>
        new Promise((resolve, reject) => {
            pool.query(query, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

    const groupOptionRows = (rows) => {
        const groups = {};

        rows.forEach((row) => {
            if (!row.attributeTypeId) return;

            groups[row.attributeTypeId] ??= {
                id: row.attributeTypeId,
                name: row.typeName,
                selectionType: row.selectionType || 'single',
                required: Boolean(row.required),
                values: [],
            };

            if (row.attributeId) {
                groups[row.attributeTypeId].values.push({
                    id: row.attributeId,
                    name: row.attributeName,
                    priceDelta: Number(row.priceDelta || 0),
                });
            }
        });

        return Object.values(groups);
    };

    const loadMenuOptions = async (menuIds) => {
        if (!menuIds.length) return new Map();

        const rows = await queryAsync(
            `
                SELECT
                    menu_attributes.menu_id AS menuId,
                    attribute_types.attribute_type_id AS attributeTypeId,
                    attribute_types.type_name AS typeName,
                    attribute_types.selection_type AS selectionType,
                    attribute_types.required AS required,
                    attributes.attribute_id AS attributeId,
                    attributes.attribute_name AS attributeName,
                    attributes.price_delta AS priceDelta
                FROM menu_attributes
                INNER JOIN attributes ON menu_attributes.attribute_id = attributes.attribute_id
                INNER JOIN attribute_types ON attributes.attribute_type_id = attribute_types.attribute_type_id
                WHERE menu_attributes.menu_id IN (?)
                ORDER BY attribute_types.attribute_type_id, attributes.attribute_id
            `,
            [menuIds],
        );

        const rowsByMenu = new Map();
        rows.forEach((row) => {
            const current = rowsByMenu.get(row.menuId) || [];
            current.push(row);
            rowsByMenu.set(row.menuId, current);
        });

        const optionsByMenu = new Map();
        rowsByMenu.forEach((optionRows, menuId) => {
            optionsByMenu.set(menuId, groupOptionRows(optionRows));
        });

        return optionsByMenu;
    };

    const saveMenuOptions = async (menuId, optionGroups) => {
        if (!Array.isArray(optionGroups)) return;

        const existingTypes = await queryAsync(
            `
                SELECT DISTINCT attributes.attribute_type_id AS attributeTypeId
                FROM menu_attributes
                INNER JOIN attributes ON menu_attributes.attribute_id = attributes.attribute_id
                WHERE menu_attributes.menu_id = ?
            `,
            [menuId],
        );
        const existingTypeIds = existingTypes.map((row) => row.attributeTypeId);

        await queryAsync('DELETE FROM menu_attributes WHERE menu_id = ?', [menuId]);

        if (existingTypeIds.length) {
            await queryAsync('DELETE FROM attributes WHERE attribute_type_id IN (?)', [existingTypeIds]);
            await queryAsync('DELETE FROM attribute_types WHERE attribute_type_id IN (?)', [existingTypeIds]);
        }

        for (const group of optionGroups) {
            const groupName = String(group.name || '').trim();
            const values = Array.isArray(group.values)
                ? group.values.filter((value) => String(value.name || '').trim())
                : [];

            if (!groupName || !values.length) continue;

            const typeResult = await queryAsync(
                'INSERT INTO attribute_types (type_name, selection_type, required) VALUES (?, ?, ?)',
                [
                    groupName,
                    group.selectionType === 'multiple' ? 'multiple' : 'single',
                    group.required ? 1 : 0,
                ],
            );
            const attributeTypeId = typeResult.insertId;

            for (const value of values) {
                const attrResult = await queryAsync(
                    'INSERT INTO attributes (attribute_type_id, attribute_name, price_delta) VALUES (?, ?, ?)',
                    [
                        attributeTypeId,
                        String(value.name || '').trim(),
                        Number(value.priceDelta || 0),
                    ],
                );

                await queryAsync(
                    'INSERT INTO menu_attributes (menu_id, attribute_id) VALUES (?, ?)',
                    [menuId, attrResult.insertId],
                );
            }
        }
    };

    // GET all menus
    router.get('/', async (req, res) => {
        const query = `
            SELECT
                menus.menu_id AS menuId,
                menus.menu_id AS menu_id,
                menus.menu_name AS menuName,
                menus.menu_name AS menu_name,
                menus.menu_image AS menuImage,
                menus.menu_image AS menu_image,
                menus.category_id AS categoryId,
                menus.category_id AS category_id,
                menus.price,
                menus.availability,
                categories.category_id AS categoryRelationId,
                categories.category_name AS categoryName,
                categories.category_name AS category_name
            FROM menus 
            LEFT JOIN categories ON menus.category_id = categories.category_id
        `;
        try {
            const results = await queryAsync(query);
            const optionsByMenu = await loadMenuOptions(results.map((row) => row.menuId));
            res.status(200).json(results.map((row) => ({
                ...row,
                optionGroups: optionsByMenu.get(row.menuId) || [],
                option_groups: optionsByMenu.get(row.menuId) || [],
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ADD menu
    router.post('/', async (req, res) => {
        const {
            menu_name,
            menuName,
            menu_image,
            menuImage,
            category_id,
            categoryId,
            price,
            availability,
            option_groups,
            optionGroups,
        } = req.body;
        const finalName = menu_name ?? menuName;
        const finalImage = menu_image ?? menuImage ?? null;
        const finalCategory = category_id ?? categoryId ?? null;
        const query = 'INSERT INTO menus (menu_name, menu_image, category_id, price, availability) VALUES (?, ?, ?, ?, ?)';

        try {
            const result = await queryAsync(query, [finalName, finalImage, finalCategory, price, availability ?? 1]);
            const finalOptionGroups = option_groups ?? optionGroups ?? [];
            await saveMenuOptions(result.insertId, finalOptionGroups);
            res.status(201).json({
                message: "Menu item added successfully!",
                menu_id: result.insertId,
                menuId: result.insertId,
                menu_name: finalName,
                menuName: finalName,
                menu_image: finalImage,
                menuImage: finalImage,
                category_id: finalCategory,
                categoryId: finalCategory
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // UPDATE menu
    router.put('/:id', async (req, res) => {
        const { id } = req.params;
        const {
            menu_name,
            menuName,
            menu_image,
            menuImage,
            category_id,
            categoryId,
            price,
            availability,
            option_groups,
            optionGroups,
        } = req.body;
        const finalName = menu_name ?? menuName;
        const finalImage = menu_image ?? menuImage ?? null;
        const finalCategory = category_id ?? categoryId ?? null;
        const query = 'UPDATE menus SET menu_name = ?, menu_image = ?, category_id = ?, price = ?, availability = ? WHERE menu_id = ?';
        try {
            await queryAsync(query, [finalName, finalImage, finalCategory, price, availability, id]);
            await saveMenuOptions(Number(id), option_groups ?? optionGroups);
            res.status(200).json({
                message: "Menu item updated succesfully!",
                menuId: Number(id),
                menuName: finalName,
                menuImage: finalImage,
                categoryId: finalCategory
            });
        } catch (err) {
            res.status(500).json({ error: err.message});
        }
    })

    // DELETE menu
    router.delete('/:id', (req, res) => {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid menu id' });
        }

        const query = 'DELETE FROM menus WHERE menu_id = ?';
        pool.query(query, [id], (err, result) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({
                        message: 'This menu item is used in existing orders and cannot be deleted. Set availability to 0 instead.'
                    });
                }

                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Menu item not found"});
            }

            res.json({ message: 'Menu has been deleted successfully!'});
        });
    });

    return router;
};
