CREATE TABLE `boards` (
	`id` integer PRIMARY KEY NOT NULL,
	`external_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE TABLE `columns` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`order` real DEFAULT 0 NOT NULL,
	`board_id` integer,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` integer PRIMARY KEY NOT NULL,
	`gif_url` text,
	`content` text NOT NULL,
	`author_display_name` text NOT NULL,
	`upvotes` integer DEFAULT 0 NOT NULL,
	`order` real DEFAULT 0 NOT NULL,
	`board_id` integer,
	`column_id` integer,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `boards_external_id_unique` ON `boards` (`external_id`);