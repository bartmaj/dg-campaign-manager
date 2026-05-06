CREATE TABLE `npc_encounter_events` (
	`id` text PRIMARY KEY NOT NULL,
	`npc_id` text NOT NULL,
	`session_id` text NOT NULL,
	`note` text,
	`applied_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`npc_id`) REFERENCES `npcs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
