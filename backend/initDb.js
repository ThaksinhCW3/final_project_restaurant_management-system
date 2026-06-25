const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const seedIfEmpty = async (db, table, sql, values = []) => {
  const [rows] = await db.query(`SELECT COUNT(*) AS count FROM ${table}`);
  if (Number(rows[0]?.count ?? 0) === 0) {
    try {
      await db.query(sql, values);
    } catch (err) {
      console.warn(`Skipping seed for ${table}: ${err.message}`);
    }
  }
};

const waitForDatabase = async (db) => {
  let lastError;

  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      await db.query("SELECT 1");
      return;
    } catch (err) {
      lastError = err;
      await sleep(1000);
    }
  }

  throw lastError;
};

const createTables = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS categories (
      category_id INT AUTO_INCREMENT PRIMARY KEY,
      category_name VARCHAR(100) NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS staff (
      staff_id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      role VARCHAR(30) NOT NULL DEFAULT 'employee',
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      supplier_id INT AUTO_INCREMENT PRIMARY KEY,
      supplier_name VARCHAR(150) NOT NULL,
      phone VARCHAR(20),
      address VARCHAR(255)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS ingredients (
      ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
      ingredient_name VARCHAR(150) NOT NULL,
      ingredient_image LONGTEXT,
      stock_quantity DECIMAL(10,2) DEFAULT 0.00,
      unit VARCHAR(20),
      cost_per_unit DECIMAL(10,2) DEFAULT 0.00,
      min_thereshold DECIMAL(10,2) DEFAULT 0.00,
      supplier_id INT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS menus (
      menu_id INT AUTO_INCREMENT PRIMARY KEY,
      menu_name VARCHAR(150) NOT NULL,
      menu_image LONGTEXT,
      category_id INT NULL,
      price DECIMAL(10,2) NOT NULL,
      availability TINYINT DEFAULT 1
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS attribute_types (
      attribute_type_id INT AUTO_INCREMENT PRIMARY KEY,
      type_name VARCHAR(100) NOT NULL,
      selection_type ENUM('single','multiple') NOT NULL DEFAULT 'single',
      required TINYINT DEFAULT 0
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS attributes (
      attribute_id INT AUTO_INCREMENT PRIMARY KEY,
      attribute_type_id INT NOT NULL,
      attribute_name VARCHAR(100) NOT NULL,
      price_delta DECIMAL(10,2) DEFAULT 0.00,
      INDEX attribute_type_id (attribute_type_id),
      CONSTRAINT attrs_type_fk
        FOREIGN KEY (attribute_type_id)
        REFERENCES attribute_types(attribute_type_id)
        ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS menu_attributes (
      menu_attribute_id INT AUTO_INCREMENT PRIMARY KEY,
      menu_id INT NOT NULL,
      attribute_id INT NOT NULL,
      INDEX menu_id (menu_id),
      INDEX attribute_id (attribute_id),
      UNIQUE KEY menu_attributes_menu_id_attribute_id_unique (menu_id, attribute_id),
      CONSTRAINT menu_attrs_menu_fk
        FOREIGN KEY (menu_id)
        REFERENCES menus(menu_id)
        ON DELETE CASCADE,
      CONSTRAINT menu_attrs_attr_fk
        FOREIGN KEY (attribute_id)
        REFERENCES attributes(attribute_id)
        ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS recipes (
      recipe_id INT AUTO_INCREMENT PRIMARY KEY,
      menu_id INT NULL,
      ingredient_id INT NULL,
      quantity_used DECIMAL(10,2) NOT NULL,
      unit VARCHAR(20) DEFAULT 'pcs'
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS tables (
      table_id INT AUTO_INCREMENT PRIMARY KEY,
      table_number INT NOT NULL UNIQUE,
      capacity INT DEFAULT 4,
      status VARCHAR(30) DEFAULT 'available',
      zone VARCHAR(50)
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS service_sessions (
      session_id INT AUTO_INCREMENT PRIMARY KEY,
      session_type VARCHAR(30) DEFAULT 'dine-in',
      note VARCHAR(255),
      table_id INT NULL,
      table_number INT NULL,
      staff_id INT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME NULL,
      status VARCHAR(30) DEFAULT 'Active'
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      order_id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NULL,
      staff_id INT NULL,
      ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(30) DEFAULT 'Pending',
      cancellation_status VARCHAR(20) DEFAULT 'none',
      cancellation_reason TEXT NULL,
      cancellation_requested_at DATETIME NULL,
      cancellation_decided_at DATETIME NULL,
      cancellation_decided_by INT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      order_item_id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NULL,
      menu_id INT NULL,
      quantity INT NOT NULL DEFAULT 1,
      note TEXT NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS sales (
      sales_id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS supply_orders (
      supply_order_id INT AUTO_INCREMENT PRIMARY KEY,
      supplier_id INT NULL,
      staff_id INT NULL,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_amount DECIMAL(10,2) DEFAULT 0.00,
      status VARCHAR(30) DEFAULT 'pending'
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS supply_order_details (
      supply_order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
      supply_order_id INT NULL,
      ingredient_id INT NULL,
      quantity DECIMAL(10,2) NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      received_quantity DECIMAL(10,2) NULL,
      actual_unit_price DECIMAL(10,2) NULL
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS imports (
      import_id INT AUTO_INCREMENT PRIMARY KEY,
      supplier_order_id INT NULL,
      import_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      received_by INT NULL,
      remark TEXT
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS import_details (
      import_detail_id INT AUTO_INCREMENT PRIMARY KEY,
      import_id INT NULL,
      ingredient_id INT NULL,
      received_quantity DECIMAL(10,2) NOT NULL,
      cost_price DECIMAL(10,2) NOT NULL,
      expiry_date DATE NULL
    )
  `);
};

const ensureColumn = async (db, table, column, definition) => {
  const [rows] = await db.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
    `,
    [table, column],
  );

  if (Number(rows[0]?.count ?? 0) === 0) {
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

const updateExistingTables = async (db) => {
  await ensureColumn(db, "service_sessions", "note", "VARCHAR(255) NULL");
  await ensureColumn(db, "service_sessions", "table_id", "INT NULL");
  await ensureColumn(db, "orders", "cancellation_status", "VARCHAR(20) DEFAULT 'none'");
  await ensureColumn(db, "orders", "cancellation_reason", "TEXT NULL");
  await ensureColumn(db, "orders", "cancellation_requested_at", "DATETIME NULL");
  await ensureColumn(db, "orders", "cancellation_decided_at", "DATETIME NULL");
  await ensureColumn(db, "orders", "cancellation_decided_by", "INT NULL");
  await ensureColumn(db, "order_items", "note", "TEXT NULL");
  await ensureColumn(db, "imports", "received_by", "INT NULL");
  await ensureColumn(db, "supply_order_details", "received_quantity", "DECIMAL(10,2) NULL");
  await ensureColumn(db, "supply_order_details", "actual_unit_price", "DECIMAL(10,2) NULL");
  await db.query("ALTER TABLE menus MODIFY menu_image LONGTEXT NULL");
  await db.query("ALTER TABLE ingredients MODIFY ingredient_image LONGTEXT NULL");
};

const seedData = async (db) => {
  await seedIfEmpty(db, "categories", `
    INSERT INTO categories (category_id, category_name) VALUES
      (1, 'Khao Soi'),
      (2, 'Noodles'),
      (3, 'Drinks'),
      (4, 'Extras')
  `);

  await seedIfEmpty(db, "staff", `
    INSERT INTO staff (staff_id, first_name, last_name, role, phone, username, password) VALUES
      (1, 'Olay', 'Owner', 'manager', '0200000001', 'olay', 'password'),
      (2, 'Som', 'Cook', 'employee', '0200000002', 'som', 'password'),
      (3, 'Daeng', 'Cook', 'employee', '0200000003', 'daeng', 'password')
  `);

  await seedIfEmpty(db, "suppliers", `
    INSERT INTO suppliers (supplier_id, supplier_name, phone) VALUES
      (1, 'Morning Market', '0200001001'),
      (2, 'Fresh Meat Supplier', '0200001002')
  `);

  await seedIfEmpty(db, "ingredients", `
    INSERT INTO ingredients
      (ingredient_id, ingredient_name, stock_quantity, unit, cost_per_unit, min_thereshold, supplier_id)
    VALUES
      (1, 'Noodles', 8.00, 'kg', 18000.00, 10.00, 1),
      (2, 'Chicken', 5.00, 'kg', 45000.00, 5.00, 2),
      (3, 'Pork', 15.00, 'kg', 50000.00, 5.00, 2),
      (4, 'Tomato', 20.00, 'kg', 12000.00, 5.00, 1),
      (5, 'Coconut Milk', 3.00, 'L', 18000.00, 5.00, 1),
      (6, 'Curry Paste', 350.00, 'g', 250.00, 200.00, 1),
      (7, 'Egg', 60.00, 'pcs', 1500.00, 24.00, 1),
      (8, 'Fruit Juice', 4.00, 'L', 10000.00, 2.00, 1)
  `);

  await seedIfEmpty(db, "menus", `
    INSERT INTO menus (menu_id, menu_name, menu_image, category_id, price, availability) VALUES
      (1, 'Khao Soi Chicken', NULL, 1, 25000.00, 1),
      (2, 'Khao Soi Pork', NULL, 1, 25000.00, 1),
      (3, 'Khao Soi Beef', NULL, 1, 30000.00, 1),
      (4, 'Khao Soi Soup', NULL, 1, 20000.00, 1),
      (5, 'Stir-fried Noodle', NULL, 2, 30000.00, 1),
      (6, 'Noodle Soup', NULL, 2, 25000.00, 0),
      (7, 'Fruit Juice', NULL, 3, 15000.00, 1),
      (8, 'Water', NULL, 3, 5000.00, 1),
      (9, 'Extra Egg', NULL, 4, 5000.00, 1),
      (10, 'Extra Pork', NULL, 4, 10000.00, 1)
  `);

  await seedIfEmpty(db, "recipes", `
    INSERT INTO recipes (menu_id, ingredient_id, quantity_used, unit) VALUES
      (1, 1, 0.10, 'kg'),
      (1, 2, 0.15, 'kg'),
      (1, 5, 0.30, 'L'),
      (2, 1, 0.10, 'kg'),
      (2, 3, 0.15, 'kg'),
      (3, 1, 0.10, 'kg'),
      (4, 5, 0.35, 'L'),
      (7, 8, 0.25, 'L'),
      (9, 7, 1.00, 'pcs')
  `);

  await seedIfEmpty(db, "tables", `
    INSERT INTO tables (table_id, table_number, capacity, status, zone) VALUES
      (1, 1, 4, 'occupied', 'main'),
      (2, 2, 4, 'occupied', 'main'),
      (3, 3, 4, 'occupied', 'main'),
      (4, 4, 4, 'available', 'main'),
      (5, 5, 4, 'available', 'main'),
      (6, 6, 4, 'available', 'main'),
      (7, 7, 5, 'available', 'main'),
      (8, 8, 4, 'available', 'main'),
      (9, 9, 4, 'available', 'main'),
      (10, 10, 4, 'available', 'main'),
      (11, 11, 4, 'available', 'main')
  `);

  await seedIfEmpty(db, "service_sessions", `
    INSERT INTO service_sessions
      (session_id, session_type, table_id, table_number, staff_id, started_at, ended_at, status)
    VALUES
      (1, 'dine-in', 1, 1, 1, '2026-06-12 10:32:00', NULL, 'Active'),
      (2, 'dine-in', 2, 2, 1, '2026-06-12 11:05:00', NULL, 'Active'),
      (3, 'dine-in', 5, 5, 2, '2026-06-12 09:48:00', NULL, 'Active'),
      (4, 'takeaway', NULL, NULL, 1, '2026-06-12 08:30:00', '2026-06-12 08:55:00', 'Completed')
  `);

  await seedIfEmpty(db, "orders", `
    INSERT INTO orders (order_id, session_id, staff_id, ordered_at, status) VALUES
      (1, 1, 2, '2026-06-12 10:35:00', 'Preparing'),
      (2, 2, 2, '2026-06-12 11:10:00', 'Served'),
      (3, 3, 3, '2026-06-12 09:55:00', 'Pending'),
      (4, 4, 2, '2026-06-12 08:35:00', 'Served')
  `);

  await seedIfEmpty(db, "order_items", `
    INSERT INTO order_items (order_id, menu_id, quantity) VALUES
      (1, 1, 2),
      (1, 8, 2),
      (2, 2, 1),
      (2, 7, 1),
      (3, 3, 2),
      (3, 9, 2),
      (4, 1, 1),
      (4, 8, 1)
  `);

  await seedIfEmpty(db, "sales", `
    INSERT INTO sales (sales_id, session_id, total_amount, paid_at) VALUES
      (1, 4, 55000.00, '2026-06-12 08:55:00')
  `);
};

const initializeDatabase = async (pool) => {
  const db = pool.promise();
  await waitForDatabase(db);
  await createTables(db);
  await updateExistingTables(db);
  await seedData(db);
};

module.exports = { initializeDatabase };
