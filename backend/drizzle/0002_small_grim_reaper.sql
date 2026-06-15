CREATE TABLE `attribute_types` (
	`attribute_type_id` int AUTO_INCREMENT NOT NULL,
	`type_name` varchar(100) NOT NULL,
	`selection_type` enum('single','multiple') NOT NULL DEFAULT 'single',
	`required` tinyint DEFAULT 0,
	CONSTRAINT `attribute_types_attribute_type_id` PRIMARY KEY(`attribute_type_id`)
);
--> statement-breakpoint
CREATE TABLE `attributes` (
	`attribute_id` int AUTO_INCREMENT NOT NULL,
	`attribute_type_id` int NOT NULL,
	`attribute_name` varchar(100) NOT NULL,
	`price_delta` decimal(10,2) DEFAULT '0.00',
	CONSTRAINT `attributes_attribute_id` PRIMARY KEY(`attribute_id`)
);
--> statement-breakpoint
CREATE TABLE `menu_attributes` (
	`menu_attribute_id` int AUTO_INCREMENT NOT NULL,
	`menu_id` int NOT NULL,
	`attribute_id` int NOT NULL,
	CONSTRAINT `menu_attributes_menu_attribute_id` PRIMARY KEY(`menu_attribute_id`),
	CONSTRAINT `menu_attributes_menu_id_attribute_id_unique` UNIQUE(`menu_id`,`attribute_id`)
);
--> statement-breakpoint
ALTER TABLE `ingredients` MODIFY COLUMN `ingredient_image` text;--> statement-breakpoint
ALTER TABLE `menus` MODIFY COLUMN `menu_image` text;--> statement-breakpoint
ALTER TABLE `attributes` ADD CONSTRAINT `attributes_attribute_type_id_attribute_types_attribute_type_id_fk` FOREIGN KEY (`attribute_type_id`) REFERENCES `attribute_types`(`attribute_type_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_attributes` ADD CONSTRAINT `menu_attributes_menu_id_menus_menu_id_fk` FOREIGN KEY (`menu_id`) REFERENCES `menus`(`menu_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `menu_attributes` ADD CONSTRAINT `menu_attributes_attribute_id_attributes_attribute_id_fk` FOREIGN KEY (`attribute_id`) REFERENCES `attributes`(`attribute_id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `attribute_type_id` ON `attributes` (`attribute_type_id`);--> statement-breakpoint
CREATE INDEX `menu_id` ON `menu_attributes` (`menu_id`);--> statement-breakpoint
CREATE INDEX `attribute_id` ON `menu_attributes` (`attribute_id`);