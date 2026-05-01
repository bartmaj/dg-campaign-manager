ALTER TABLE `pcs` ADD `profession` text;--> statement-breakpoint
ALTER TABLE `pcs` ADD `str` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `pcs` ADD `con` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `pcs` ADD `dex` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `pcs` ADD `intelligence` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `pcs` ADD `pow` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `pcs` ADD `cha` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `pcs` ADD `hp` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `pcs` ADD `wp` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `pcs` ADD `bp` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `pcs` ADD `san_max` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `pcs` ADD `skills` text;--> statement-breakpoint
ALTER TABLE `pcs` ADD `motivations` text;--> statement-breakpoint
ALTER TABLE `pcs` ADD `backstory_hooks` text;--> statement-breakpoint
ALTER TABLE `pcs` ADD `sanity_current` integer;--> statement-breakpoint
ALTER TABLE `pcs` ADD `sanity_disorders` text;--> statement-breakpoint
ALTER TABLE `pcs` ADD `breaking_points` text;