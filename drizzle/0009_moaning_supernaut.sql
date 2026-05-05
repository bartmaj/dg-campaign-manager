CREATE TABLE `faction_status_events` (
	`id` text PRIMARY KEY NOT NULL,
	`faction_id` text NOT NULL,
	`note` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`session_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`faction_id`) REFERENCES `factions`(`id`) ON UPDATE no action ON DELETE cascade
);
