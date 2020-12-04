# users

- id
- name - string
- username - string
- schedules - meet_ids[]
- liked_projects - project_ids[]
- personal projects - project_ids[]
- token - string
- created_at


CREATE TABLE `user` (
	`id` VARCHAR(36) NOT NULL,
	`name` VARCHAR NOT NULL DEFAULT '',
	`username` VARCHAR NOT NULL,
	`schedules` ENUM,
	`liked_projects` ENUM,
	`personal_projects` ENUM,
	`token` VARCHAR,
	`created_at` DATETIME NOT NULL,
	PRIMARY KEY (`id`,`username`)
);