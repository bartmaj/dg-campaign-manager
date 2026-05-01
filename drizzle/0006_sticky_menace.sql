CREATE TABLE `bond_damage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`bond_id` text NOT NULL,
	`delta` integer NOT NULL,
	`reason` text,
	`session_id` text,
	`applied_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`bond_id`) REFERENCES `bonds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `bonds` ADD `max_score` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `bonds` ADD `target_type` text DEFAULT 'npc' NOT NULL;--> statement-breakpoint
ALTER TABLE `bonds` ADD `target_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `bonds` ADD `description` text;