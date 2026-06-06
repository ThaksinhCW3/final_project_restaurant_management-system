import { relations } from "drizzle-orm/relations";
import { imports, importDetails, ingredients, suppliersOrders, staff, suppliers, categories, menus, orders, orderItems, serviceSessions, recipes, sales, supplierOrderDetails } from "./schema";

export const importDetailsRelations = relations(importDetails, ({one}) => ({
	import: one(imports, {
		fields: [importDetails.importId],
		references: [imports.importId]
	}),
	ingredient: one(ingredients, {
		fields: [importDetails.ingredientId],
		references: [ingredients.ingredientId]
	}),
}));

export const importsRelations = relations(imports, ({one, many}) => ({
	importDetails: many(importDetails),
	suppliersOrder: one(suppliersOrders, {
		fields: [imports.orderId],
		references: [suppliersOrders.supplierOrderId]
	}),
	staff: one(staff, {
		fields: [imports.receivedBy],
		references: [staff.staffId]
	}),
}));

export const ingredientsRelations = relations(ingredients, ({one, many}) => ({
	importDetails: many(importDetails),
	supplier: one(suppliers, {
		fields: [ingredients.supplierId],
		references: [suppliers.supplierId]
	}),
	recipes: many(recipes),
	supplierOrderDetails: many(supplierOrderDetails),
}));

export const suppliersOrdersRelations = relations(suppliersOrders, ({one, many}) => ({
	imports: many(imports),
	supplierOrderDetails: many(supplierOrderDetails),
	supplier: one(suppliers, {
		fields: [suppliersOrders.supplierId],
		references: [suppliers.supplierId]
	}),
	staff: one(staff, {
		fields: [suppliersOrders.staffId],
		references: [staff.staffId]
	}),
}));

export const staffRelations = relations(staff, ({many}) => ({
	imports: many(imports),
	orders: many(orders),
	serviceSessions: many(serviceSessions),
	suppliersOrders: many(suppliersOrders),
}));

export const suppliersRelations = relations(suppliers, ({many}) => ({
	ingredients: many(ingredients),
	suppliersOrders: many(suppliersOrders),
}));

export const menusRelations = relations(menus, ({one, many}) => ({
	category: one(categories, {
		fields: [menus.categoryId],
		references: [categories.categoryId]
	}),
	orderItems: many(orderItems),
	recipes: many(recipes),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	menus: many(menus),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.orderId]
	}),
	menu: one(menus, {
		fields: [orderItems.menuId],
		references: [menus.menuId]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderItems: many(orderItems),
	serviceSession: one(serviceSessions, {
		fields: [orders.sessionId],
		references: [serviceSessions.sessionId]
	}),
	staff: one(staff, {
		fields: [orders.staffId],
		references: [staff.staffId]
	}),
}));

export const serviceSessionsRelations = relations(serviceSessions, ({one, many}) => ({
	orders: many(orders),
	sales: many(sales),
	staff: one(staff, {
		fields: [serviceSessions.staffId],
		references: [staff.staffId]
	}),
}));

export const recipesRelations = relations(recipes, ({one}) => ({
	menu: one(menus, {
		fields: [recipes.menuId],
		references: [menus.menuId]
	}),
	ingredient: one(ingredients, {
		fields: [recipes.ingredientId],
		references: [ingredients.ingredientId]
	}),
}));

export const salesRelations = relations(sales, ({one}) => ({
	serviceSession: one(serviceSessions, {
		fields: [sales.sessionId],
		references: [serviceSessions.sessionId]
	}),
}));

export const supplierOrderDetailsRelations = relations(supplierOrderDetails, ({one}) => ({
	suppliersOrder: one(suppliersOrders, {
		fields: [supplierOrderDetails.supplierOrderId],
		references: [suppliersOrders.supplierOrderId]
	}),
	ingredient: one(ingredients, {
		fields: [supplierOrderDetails.ingredientId],
		references: [ingredients.ingredientId]
	}),
}));