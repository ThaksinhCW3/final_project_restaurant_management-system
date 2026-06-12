CREATE TABLE `supply_order_details` (
	`supply_order_detail_id` int AUTO_INCREMENT NOT NULL,
	`supply_order_id` int NOT NULL,
	`ingredient_id` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	CONSTRAINT `supply_order_details_supply_order_detail_id` PRIMARY KEY(`supply_order_detail_id`)
);
--> statement-breakpoint
CREATE TABLE `supply_orders` (
	`supply_order_id` int AUTO_INCREMENT NOT NULL,
	`supplier_id` int NOT NULL,
	`staff_id` int NOT NULL,
	`order_date` datetime DEFAULT (CURRENT_TIMESTAMP),
	`total_amount` decimal(10,2) DEFAULT '0.00',
	`status` enum('pending','completed','cancelled') DEFAULT 'pending',
	CONSTRAINT `supply_orders_supply_order_id` PRIMARY KEY(`supply_order_id`)
);
--> statement-breakpoint
DROP TABLE `supplier_order_details`;--> statement-breakpoint
DROP TABLE `suppliers_orders`;--> statement-breakpoint
ALTER TABLE `import_details` DROP FOREIGN KEY `import_details_ibfk_1`;
--> statement-breakpoint
ALTER TABLE `import_details` DROP FOREIGN KEY `import_details_ibfk_2`;
--> statement-breakpoint
ALTER TABLE `imports` DROP FOREIGN KEY `imports_ibfk_1`;
--> statement-breakpoint
ALTER TABLE `imports` DROP FOREIGN KEY `imports_ibfk_2`;
--> statement-breakpoint
ALTER TABLE `ingredients` DROP FOREIGN KEY `ingredients_ibfk_1`;
--> statement-breakpoint
ALTER TABLE `menus` DROP FOREIGN KEY `menus_ibfk_1`;
--> statement-breakpoint
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_ibfk_1`;
--> statement-breakpoint
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_ibfk_2`;
--> statement-breakpoint
ALTER TABLE `orders` DROP FOREIGN KEY `orders_ibfk_1`;
--> statement-breakpoint
ALTER TABLE `orders` DROP FOREIGN KEY `orders_ibfk_2`;
--> statement-breakpoint
ALTER TABLE `recipes` DROP FOREIGN KEY `recipes_ibfk_1`;
--> statement-breakpoint
ALTER TABLE `recipes` DROP FOREIGN KEY `recipes_ibfk_2`;
--> statement-breakpoint
ALTER TABLE `sales` DROP FOREIGN KEY `sales_ibfk_1`;
--> statement-breakpoint
ALTER TABLE `service_sessions` DROP FOREIGN KEY `service_sessions_ibfk_1`;
--> statement-breakpoint
DROP INDEX `order_id` ON `imports`;--> statement-breakpoint
ALTER TABLE `sales` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ingredients` MODIFY COLUMN `cost_per_unit` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `ingredients` MODIFY COLUMN `min_thereshold` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `menus` MODIFY COLUMN `availability` tinyint DEFAULT 1;--> statement-breakpoint
ALTER TABLE `sales` ADD PRIMARY KEY(`sales_id`);--> statement-breakpoint
ALTER TABLE `imports` ADD `supplier_order_id` int;--> statement-breakpoint
ALTER TABLE `ingredients` ADD `ingredient_image` varchar(255);--> statement-breakpoint
ALTER TABLE `menus` ADD `menu_image` varchar(255);--> statement-breakpoint
ALTER TABLE `recipes` ADD `unit` enum('kg','g','pcs') DEFAULT 'pcs' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `sales_id` int AUTO_INCREMENT NOT NULL;--> statement-breakpoint
ALTER TABLE `supply_order_details` ADD CONSTRAINT `supply_order_details_supply_order_id_supply_orders_supply_order_id_fk` FOREIGN KEY (`supply_order_id`) REFERENCES `supply_orders`(`supply_order_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supply_order_details` ADD CONSTRAINT `supply_order_details_ingredient_id_ingredients_ingredient_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`ingredient_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supply_orders` ADD CONSTRAINT `supply_orders_supplier_id_suppliers_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`supplier_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supply_orders` ADD CONSTRAINT `supply_orders_staff_id_staff_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ingredient_id` ON `supply_order_details` (`ingredient_id`);--> statement-breakpoint
CREATE INDEX `supplier_order_id` ON `supply_order_details` (`supply_order_id`);--> statement-breakpoint
CREATE INDEX `staff_id` ON `supply_orders` (`staff_id`);--> statement-breakpoint
CREATE INDEX `supplier_id` ON `supply_orders` (`supplier_id`);--> statement-breakpoint
ALTER TABLE `import_details` ADD CONSTRAINT `import_details_import_id_imports_import_id_fk` FOREIGN KEY (`import_id`) REFERENCES `imports`(`import_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `import_details` ADD CONSTRAINT `import_details_ingredient_id_ingredients_ingredient_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`ingredient_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `imports` ADD CONSTRAINT `imports_supplier_order_id_supply_orders_supply_order_id_fk` FOREIGN KEY (`supplier_order_id`) REFERENCES `supply_orders`(`supply_order_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `imports` ADD CONSTRAINT `imports_received_by_staff_staff_id_fk` FOREIGN KEY (`received_by`) REFERENCES `staff`(`staff_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingredients` ADD CONSTRAINT `ingredients_supplier_id_suppliers_supplier_id_fk` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`supplier_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menus` ADD CONSTRAINT `menus_category_id_categories_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_menu_id_menus_menu_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`menu_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_session_id_service_sessions_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `service_sessions`(`session_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_staff_id_staff_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_menu_id_menus_menu_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`menu_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_ingredient_id_ingredients_ingredient_id_fk` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`ingredient_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_session_id_service_sessions_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `service_sessions`(`session_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_sessions` ADD CONSTRAINT `service_sessions_staff_id_staff_staff_id_fk` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `supplier_order_id` ON `imports` (`supplier_order_id`);--> statement-breakpoint
ALTER TABLE `import_details` DROP COLUMN `expiry_date`;--> statement-breakpoint
ALTER TABLE `imports` DROP COLUMN `order_id`;--> statement-breakpoint
ALTER TABLE `order_items` DROP COLUMN `total_price`;--> statement-breakpoint
ALTER TABLE `sales` DROP COLUMN `billing_id`;--> statement-breakpoint
ALTER TABLE `suppliers` DROP COLUMN `address`;