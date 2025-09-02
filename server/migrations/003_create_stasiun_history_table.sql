CREATE TABLE `stasiun_history` (
  `history_id` integer PRIMARY KEY AUTO_INCREMENT,
  `stasiun_id` integer,
  `SHE` float,
  `SHN` float,
  `SHZ` float,
  `sensor_type` text,
  `data_logger` text,
  `unit` varchar(10),
  `start_date` datetime,
  `end_date` datetime,
  `PAZ` float,
  `total_gain` float,
  `status` boolean DEFAULT true,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `availability` (
  `availability_id` integer PRIMARY KEY AUTO_INCREMENT,
  `stasiun_id` integer,
  `tanggal` datetime,
  `nilai_availability` integer
);