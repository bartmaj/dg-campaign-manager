CREATE TABLE `clue_delivery_events` (
	`id` text PRIMARY KEY NOT NULL,
	`clue_id` text NOT NULL,
	`session_id` text NOT NULL,
	`kind` text NOT NULL,
	`pc_ids` text NOT NULL,
	`note` text,
	`applied_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`clue_id`) REFERENCES `clues`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
