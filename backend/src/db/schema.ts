import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, varchar, index, foreignKey, decimal, datetime, text, tinyint, mysqlEnum, unique } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const categories = mysqlTable("categories", {
	categoryId: int("category_id").autoincrement().notNull(),
	categoryName: varchar("category_name", { length: 100 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.categoryId], name: "categories_category_id"}),
]);

export const importDetails = mysqlTable("import_details", {
	importDetailId: int("import_detail_id").autoincrement().notNull(),
	importId: int("import_id").notNull().references(() => imports.importId, { onDelete: "cascade" } ),
	ingredientId: int("ingredient_id").notNull().references(() => ingredients.ingredientId),
	receivedQuantity: decimal("received_quantity", { precision: 10, scale: 2 }).notNull(),
	costPrice: decimal("cost_price", { precision: 10, scale: 2 }).notNull(),
},
(table) => [
	index("import_id").on(table.importId),
	index("ingredient_id").on(table.ingredientId),
	primaryKey({ columns: [table.importDetailId], name: "import_details_import_detail_id"}),
]);

export const imports = mysqlTable("imports", {
	importId: int("import_id").autoincrement().notNull(),
	supplierOrderId: int("supplier_order_id").references(() => supplyOrders.supplyOrderId),
	importDate: datetime("import_date", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	receivedBy: int("received_by").notNull().references(() => staff.staffId),
	remark: text(),
},
(table) => [
	index("received_by").on(table.receivedBy),
	index("supplier_order_id").on(table.supplierOrderId),
	primaryKey({ columns: [table.importId], name: "imports_import_id"}),
]);

export const ingredients = mysqlTable("ingredients", {
	ingredientId: int("ingredient_id").autoincrement().notNull(),
	ingredientName: varchar("ingredient_name", { length: 150 }).notNull(),
	ingredientImage: text("ingredient_image"),
	stockQuantity: decimal("stock_quantity", { precision: 10, scale: 2 }).default('0.00'),
	unit: mysqlEnum(['kg','g','pcs']),
	costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).default('0.00'),
	minThereshold: decimal("min_thereshold", { precision: 10, scale: 2 }).default('0.00'),
	supplierId: int("supplier_id").references(() => suppliers.supplierId, { onDelete: "set null" } ),
},
(table) => [
	index("supplier_id").on(table.supplierId),
	primaryKey({ columns: [table.ingredientId], name: "ingredients_ingredient_id"}),
]);

export const menus = mysqlTable("menus", {
	menuId: int("menu_id").autoincrement().notNull(),
	menuName: varchar("menu_name", { length: 150 }).notNull(),
	menuImage: text("menu_image"),
	categoryId: int("category_id").references(() => categories.categoryId, { onDelete: "set null" } ),
	price: decimal({ precision: 10, scale: 2 }).notNull(),
	availability: tinyint().default(1),
},
(table) => [
	index("category_id").on(table.categoryId),
	primaryKey({ columns: [table.menuId], name: "menus_menu_id"}),
]);

export const attributeTypes = mysqlTable("attribute_types", {
	attributeTypeId: int("attribute_type_id").autoincrement().notNull(),
	typeName: varchar("type_name", { length: 100 }).notNull(),
	selectionType: mysqlEnum("selection_type", ['single','multiple']).default('single').notNull(),
	required: tinyint("required").default(0),
},
(table) => [
	primaryKey({ columns: [table.attributeTypeId], name: "attribute_types_attribute_type_id"}),
]);

export const attributes = mysqlTable("attributes", {
	attributeId: int("attribute_id").autoincrement().notNull(),
	attributeTypeId: int("attribute_type_id").notNull(),
	attributeName: varchar("attribute_name", { length: 100 }).notNull(),
	priceDelta: decimal("price_delta", { precision: 10, scale: 2 }).default('0.00'),
},
(table) => [
	index("attribute_type_id").on(table.attributeTypeId),
	foreignKey({
		columns: [table.attributeTypeId],
		foreignColumns: [attributeTypes.attributeTypeId],
		name: "attrs_type_fk",
	}).onDelete("cascade"),
	primaryKey({ columns: [table.attributeId], name: "attributes_attribute_id"}),
]);

export const menuAttributes = mysqlTable("menu_attributes", {
	menuAttributeId: int("menu_attribute_id").autoincrement().notNull(),
	menuId: int("menu_id").notNull(),
	attributeId: int("attribute_id").notNull(),
},
(table) => [
	index("menu_id").on(table.menuId),
	index("attribute_id").on(table.attributeId),
	foreignKey({
		columns: [table.menuId],
		foreignColumns: [menus.menuId],
		name: "menu_attrs_menu_fk",
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.attributeId],
		foreignColumns: [attributes.attributeId],
		name: "menu_attrs_attr_fk",
	}).onDelete("cascade"),
	primaryKey({ columns: [table.menuAttributeId], name: "menu_attributes_menu_attribute_id"}),
	unique("menu_attributes_menu_id_attribute_id_unique").on(table.menuId, table.attributeId),
]);

export const orderItems = mysqlTable("order_items", {
	orderItemId: int("order_item_id").autoincrement().notNull(),
	orderId: int("order_id").references(() => orders.orderId, { onDelete: "cascade" } ),
	menuId: int("menu_id").references(() => menus.menuId, { onDelete: "restrict" } ),
	quantity: int().notNull(),
	note: text(),
},
(table) => [
	index("menu_id").on(table.menuId),
	index("order_id").on(table.orderId),
	primaryKey({ columns: [table.orderItemId], name: "order_items_order_item_id"}),
]);

export const orders = mysqlTable("orders", {
	orderId: int("order_id").autoincrement().notNull(),
	sessionId: int("session_id").references(() => serviceSessions.sessionId, { onDelete: "cascade" } ),
	staffId: int("staff_id").references(() => staff.staffId, { onDelete: "set null" } ),
	orderedAt: datetime("ordered_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	status: mysqlEnum(['Pending','Preparing','Served']).default('Pending'),
	cancellationStatus: varchar("cancellation_status", { length: 20 }).default('none'),
	cancellationReason: text("cancellation_reason"),
	cancellationRequestedAt: datetime("cancellation_requested_at", { mode: 'string'}),
	cancellationDecidedAt: datetime("cancellation_decided_at", { mode: 'string'}),
	cancellationDecidedBy: int("cancellation_decided_by"),
},
(table) => [
	index("session_id").on(table.sessionId),
	index("staff_id").on(table.staffId),
	primaryKey({ columns: [table.orderId], name: "orders_order_id"}),
]);

export const recipes = mysqlTable("recipes", {
	recipeId: int("recipe_id").autoincrement().notNull(),
	menuId: int("menu_id").references(() => menus.menuId, { onDelete: "cascade" } ),
	ingredientId: int("ingredient_id").references(() => ingredients.ingredientId, { onDelete: "cascade" } ),
	quantityUsed: decimal("quantity_used", { precision: 10, scale: 2 }).notNull(),
	unit: mysqlEnum(['kg','g','pcs']).default('pcs').notNull(),
},
(table) => [
	index("ingredient_id").on(table.ingredientId),
	index("menu_id").on(table.menuId),
	primaryKey({ columns: [table.recipeId], name: "recipes_recipe_id"}),
]);

export const sales = mysqlTable("sales", {
	salesId: int("sales_id").autoincrement().notNull(),
	sessionId: int("session_id").references(() => serviceSessions.sessionId, { onDelete: "restrict" } ),
	totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
	paidAt: datetime("paid_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	index("session_id").on(table.sessionId),
	primaryKey({ columns: [table.salesId], name: "sales_sales_id"}),
]);

export const tables = mysqlTable("tables", {
	tableId: int("table_id").autoincrement().notNull(),
	tableName: varchar("table_name", { length: 50 }),
	tableNumber: int("table_number").notNull(),
	capacity: int("capacity").default(4),
	status: mysqlEnum("status", ['available','occupied','reserved','disabled']).default('available').notNull(),
},
(table) => [
	primaryKey({ columns: [table.tableId], name: "tables_table_id"}),
	unique("tables_table_number_unique").on(table.tableNumber),
]);

export const serviceSessions = mysqlTable("service_sessions", {
	sessionId: int("session_id").autoincrement().notNull(),
	sessionType: mysqlEnum("session_type", ['dine-in','takeaway']),
	tableId: int("table_id"),
	tableNumber: int("table_number"),
	staffId: int("staff_id").references(() => staff.staffId, { onDelete: "set null" } ),
	startedAt: datetime("started_at", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	endedAt: datetime("ended_at", { mode: 'string'}),
	status: mysqlEnum(['Active','PendingPayment','Completed']).default('Active'),
},
(table) => [
	index("table_id").on(table.tableId),
	index("staff_id").on(table.staffId),
	foreignKey({
		columns: [table.tableId],
		foreignColumns: [tables.tableId],
		name: "sessions_table_fk",
	}).onDelete("set null"),
	primaryKey({ columns: [table.sessionId], name: "service_sessions_session_id"}),
]);

export const staff = mysqlTable("staff", {
	staffId: int("staff_id").autoincrement().notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	phone: varchar({ length: 10 }),
	role: mysqlEnum(['employee','manager']).default('employee').notNull(),
	username: varchar({ length: 50 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
},
(table) => [
	primaryKey({ columns: [table.staffId], name: "staff_staff_id"}),
	unique("username").on(table.username),
]);

export const suppliers = mysqlTable("suppliers", {
	supplierId: int("supplier_id").autoincrement().notNull(),
	supplierName: varchar("supplier_name", { length: 150 }).notNull(),
	phone: varchar({ length: 10 }),
},
(table) => [
	primaryKey({ columns: [table.supplierId], name: "suppliers_supplier_id"}),
]);

export const supplyOrderDetails = mysqlTable("supply_order_details", {
	supplyOrderDetailId: int("supply_order_detail_id").autoincrement().notNull(),
	supplyOrderId: int("supply_order_id").notNull(),
	ingredientId: int("ingredient_id").notNull(),
	quantity: decimal({ precision: 10, scale: 2 }).notNull(),
	unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
},
(table) => [
	index("ingredient_id").on(table.ingredientId),
	index("supplier_order_id").on(table.supplyOrderId),
	foreignKey({
		columns: [table.supplyOrderId],
		foreignColumns: [supplyOrders.supplyOrderId],
		name: "sod_order_fk",
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.ingredientId],
		foreignColumns: [ingredients.ingredientId],
		name: "sod_ingredient_fk",
	}),
	primaryKey({ columns: [table.supplyOrderDetailId], name: "supply_order_details_supply_order_detail_id"}),
]);

export const supplyOrders = mysqlTable("supply_orders", {
	supplyOrderId: int("supply_order_id").autoincrement().notNull(),
	supplierId: int("supplier_id").notNull().references(() => suppliers.supplierId),
	staffId: int("staff_id").notNull().references(() => staff.staffId),
	orderDate: datetime("order_date", { mode: 'string'}).default(sql`(CURRENT_TIMESTAMP)`),
	totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default('0.00'),
	status: mysqlEnum(['pending','completed','cancelled']).default('pending'),
},
(table) => [
	index("staff_id").on(table.staffId),
	index("supplier_id").on(table.supplierId),
	primaryKey({ columns: [table.supplyOrderId], name: "supply_orders_supply_order_id"}),
]);
