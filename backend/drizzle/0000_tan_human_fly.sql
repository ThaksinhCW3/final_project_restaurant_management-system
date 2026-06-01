-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `categories` (
	`category_id` int AUTO_INCREMENT NOT NULL,
	`category_name` varchar(100) NOT NULL,
	CONSTRAINT `categories_category_id` PRIMARY KEY(`category_id`)
);
--> statement-breakpoint
CREATE TABLE `import_details` (
	`import_detail_id` int AUTO_INCREMENT NOT NULL,
	`import_id` int NOT NULL,
	`ingredient_id` int NOT NULL,
	`received_quantity` decimal(10,2) NOT NULL,
	`cost_price` decimal(10,2) NOT NULL,
	`expiry_date` date,
	CONSTRAINT `import_details_import_detail_id` PRIMARY KEY(`import_detail_id`)
);
--> statement-breakpoint
CREATE TABLE `imports` (
	`import_id` int AUTO_INCREMENT NOT NULL,
	`order_id` int,
	`import_date` datetime DEFAULT (CURRENT_TIMESTAMP),
	`received_by` int NOT NULL,
	`remark` text,
	CONSTRAINT `imports_import_id` PRIMARY KEY(`import_id`)
);
--> statement-breakpoint
CREATE TABLE `ingredients` (
	`ingredient_id` int AUTO_INCREMENT NOT NULL,
	`ingredient_name` varchar(150) NOT NULL,
	`stock_quantity` decimal(10,2) DEFAULT '0.00',
	`unit` enum('kg','g','pcs'),
	`cost_per_unit` decimal(10,2) NOT NULL,
	`min_thereshold` decimal(10,2) NOT NULL,
	`supplier_id` int,
	CONSTRAINT `ingredients_ingredient_id` PRIMARY KEY(`ingredient_id`)
);
--> statement-breakpoint
CREATE TABLE `menus` (
	`menu_id` int AUTO_INCREMENT NOT NULL,
	`menu_name` varchar(150) NOT NULL,
	`category_id` int,
	`price` decimal(10,2) NOT NULL,
	`availability` tinyint(1) DEFAULT 1,
	CONSTRAINT `menus_menu_id` PRIMARY KEY(`menu_id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`order_item_id` int AUTO_INCREMENT NOT NULL,
	`order_id` int,
	`menu_id` int,
	`quantity` int NOT NULL,
	`total_price` decimal(10,2) NOT NULL,
	CONSTRAINT `order_items_order_item_id` PRIMARY KEY(`order_item_id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`order_id` int AUTO_INCREMENT NOT NULL,
	`session_id` int,
	`staff_id` int,
	`ordered_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	`status` enum('Pending','Preparing','Served') DEFAULT 'Pending',
	CONSTRAINT `orders_order_id` PRIMARY KEY(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`recipe_id` int AUTO_INCREMENT NOT NULL,
	`menu_id` int,
	`ingredient_id` int,
	`quantity_used` decimal(10,2) NOT NULL,
	CONSTRAINT `recipes_recipe_id` PRIMARY KEY(`recipe_id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`billing_id` int AUTO_INCREMENT NOT NULL,
	`session_id` int,
	`total_amount` decimal(10,2) NOT NULL,
	`paid_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `sales_billing_id` PRIMARY KEY(`billing_id`)
);
--> statement-breakpoint
CREATE TABLE `service_sessions` (
	`session_id` int AUTO_INCREMENT NOT NULL,
	`session_type` enum('dine-in','takeaway'),
	`table_number` int,
	`staff_id` int,
	`started_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	`ended_at` datetime,
	`status` enum('Active','Completed') DEFAULT 'Active',
	CONSTRAINT `service_sessions_session_id` PRIMARY KEY(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`staff_id` int AUTO_INCREMENT NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`phone` varchar(10),
	`role` enum('employee','manager') NOT NULL DEFAULT 'employee',
	`username` varchar(50) NOT NULL,
	`password` varchar(255) NOT NULL,
	CONSTRAINT `staff_staff_id` PRIMARY KEY(`staff_id`),
	CONSTRAINT `username` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `supplier_order_details` (
	`supplier_order_detail_id` int AUTO_INCREMENT NOT NULL,
	`supplier_order_id` int NOT NULL,
	`ingredient_id` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit_price` decimal(10,2) NOT NULL,
	CONSTRAINT `supplier_order_details_supplier_order_detail_id` PRIMARY KEY(`supplier_order_detail_id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`supplier_id` int AUTO_INCREMENT NOT NULL,
	`supplier_name` varchar(150) NOT NULL,
	`phone` varchar(10),
	`address` text,
	CONSTRAINT `suppliers_supplier_id` PRIMARY KEY(`supplier_id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers_orders` (
	`supplier_order_id` int AUTO_INCREMENT NOT NULL,
	`supplier_id` int NOT NULL,
	`staff_id` int NOT NULL,
	`order_date` datetime DEFAULT (CURRENT_TIMESTAMP),
	`total_amount` decimal(10,2) DEFAULT '0.00',
	`status` enum('pending','completed','cancelled') DEFAULT 'pending',
	CONSTRAINT `suppliers_orders_supplier_order_id` PRIMARY KEY(`supplier_order_id`)
);
--> statement-breakpoint
ALTER TABLE `import_details` ADD CONSTRAINT `import_details_ibfk_1` FOREIGN KEY (`import_id`) REFERENCES `imports`(`import_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `import_details` ADD CONSTRAINT `import_details_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`ingredient_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `imports` ADD CONSTRAINT `imports_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `suppliers_orders`(`supplier_order_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `imports` ADD CONSTRAINT `imports_ibfk_2` FOREIGN KEY (`received_by`) REFERENCES `staff`(`staff_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingredients` ADD CONSTRAINT `ingredients_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`supplier_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menus` ADD CONSTRAINT `menus_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories`(`category_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders`(`order_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`menu_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `service_sessions`(`session_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`menu_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`ingredient_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `service_sessions`(`session_id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_sessions` ADD CONSTRAINT `service_sessions_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_order_details` ADD CONSTRAINT `supplier_order_details_ibfk_1` FOREIGN KEY (`supplier_order_id`) REFERENCES `suppliers_orders`(`supplier_order_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplier_order_details` ADD CONSTRAINT `supplier_order_details_ibfk_2` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients`(`ingredient_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suppliers_orders` ADD CONSTRAINT `suppliers_orders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`supplier_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `suppliers_orders` ADD CONSTRAINT `suppliers_orders_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`staff_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `import_id` ON `import_details` (`import_id`);--> statement-breakpoint
CREATE INDEX `ingredient_id` ON `import_details` (`ingredient_id`);--> statement-breakpoint
CREATE INDEX `order_id` ON `imports` (`order_id`);--> statement-breakpoint
CREATE INDEX `received_by` ON `imports` (`received_by`);--> statement-breakpoint
CREATE INDEX `supplier_id` ON `ingredients` (`supplier_id`);--> statement-breakpoint
CREATE INDEX `category_id` ON `menus` (`category_id`);--> statement-breakpoint
CREATE INDEX `menu_id` ON `order_items` (`menu_id`);--> statement-breakpoint
CREATE INDEX `order_id` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `session_id` ON `orders` (`session_id`);--> statement-breakpoint
CREATE INDEX `staff_id` ON `orders` (`staff_id`);--> statement-breakpoint
CREATE INDEX `ingredient_id` ON `recipes` (`ingredient_id`);--> statement-breakpoint
CREATE INDEX `menu_id` ON `recipes` (`menu_id`);--> statement-breakpoint
CREATE INDEX `session_id` ON `sales` (`session_id`);--> statement-breakpoint
CREATE INDEX `staff_id` ON `service_sessions` (`staff_id`);--> statement-breakpoint
CREATE INDEX `ingredient_id` ON `supplier_order_details` (`ingredient_id`);--> statement-breakpoint
CREATE INDEX `supplier_order_id` ON `supplier_order_details` (`supplier_order_id`);--> statement-breakpoint
CREATE INDEX `staff_id` ON `suppliers_orders` (`staff_id`);--> statement-breakpoint
CREATE INDEX `supplier_id` ON `suppliers_orders` (`supplier_id`);
*/