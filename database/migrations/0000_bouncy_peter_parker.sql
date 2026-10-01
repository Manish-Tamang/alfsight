CREATE TABLE `feeds` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`instagram_account_id` text,
	`name` text NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`instagram_account_id`) REFERENCES `instagram_accounts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `feeds_user_id_idx` ON `feeds` (`user_id`);--> statement-breakpoint
CREATE INDEX `feeds_instagram_account_id_idx` ON `feeds` (`instagram_account_id`);--> statement-breakpoint
CREATE TABLE `instagram_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`instagram_user_id` text NOT NULL,
	`username` text NOT NULL,
	`access_token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ig_accounts_instagram_user_id_unique` ON `instagram_accounts` (`instagram_user_id`);--> statement-breakpoint
CREATE INDEX `ig_accounts_user_id_idx` ON `instagram_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`feed_id` text NOT NULL,
	`instagram_media_id` text NOT NULL,
	`media_type` text NOT NULL,
	`media_url` text NOT NULL,
	`thumbnail_url` text,
	`permalink` text NOT NULL,
	`caption` text,
	`timestamp` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_feed_id_idx` ON `posts` (`feed_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `posts_feed_media_unique` ON `posts` (`feed_id`,`instagram_media_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);