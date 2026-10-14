CREATE TABLE `documents` (
  `document_id` INT PRIMARY KEY AUTO_INCREMENT,
  `stasiun_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY `uq_documents_stasiun_file_name` (`stasiun_id`, `file_name`),
  KEY `idx_documents_stasiun_id` (`stasiun_id`),

  CONSTRAINT `fk_documents_stasiun`
    FOREIGN KEY (`stasiun_id`)
    REFERENCES `stasiun` (`stasiun_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);