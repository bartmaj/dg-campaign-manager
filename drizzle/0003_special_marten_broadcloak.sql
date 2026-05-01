ALTER TABLE `npcs` ADD `profession` text;--> statement-breakpoint
ALTER TABLE `npcs` ADD `str` integer;--> statement-breakpoint
ALTER TABLE `npcs` ADD `con` integer;--> statement-breakpoint
ALTER TABLE `npcs` ADD `dex` integer;--> statement-breakpoint
ALTER TABLE `npcs` ADD `intelligence` integer;--> statement-breakpoint
ALTER TABLE `npcs` ADD `pow` integer;--> statement-breakpoint
ALTER TABLE `npcs` ADD `cha` integer;--> statement-breakpoint
ALTER TABLE `npcs` ADD `hp` integer;--> statement-breakpoint
ALTER TABLE `npcs` ADD `wp` integer;--> statement-breakpoint
ALTER TABLE `npcs` ADD `mannerisms` text;--> statement-breakpoint
ALTER TABLE `npcs` ADD `voice` text;--> statement-breakpoint
ALTER TABLE `npcs` ADD `secrets` text;--> statement-breakpoint
ALTER TABLE `npcs` ADD `status` text DEFAULT 'alive' NOT NULL;--> statement-breakpoint
ALTER TABLE `npcs` ADD `location_id` text;--> statement-breakpoint
ALTER TABLE `npcs` ADD `current_goal` text;