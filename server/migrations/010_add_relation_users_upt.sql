ALTER TABLE `users`
ADD COLUMN `upt_id` INT NULL AFTER `role_id`,


ADD CONSTRAINT `fk_users_upt`
FOREIGN KEY (`upt_id`) REFERENCES `upt`(`upt_id`)
ON DELETE SET NULL;