CREATE TABLE `san_change_events` (
	`id` text PRIMARY KEY NOT NULL,
	`pc_id` text NOT NULL,
	`delta` integer NOT NULL,
	`source` text NOT NULL,
	`session_id` text,
	`crossed_thresholds` text,
	`applied_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`pc_id`) REFERENCES `pcs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `pcs` ADD `adapted_to` text;