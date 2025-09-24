CREATE TABLE `stasiun_history` (
  `history_id` integer PRIMARY KEY AUTO_INCREMENT,
  `stasiun_id` integer,
  `SHE` float,
  `SHN` float,
  `SHZ` float,
  `data_logger` text,
  `total_gain` float,
  `input_unit` varchar(10),
  `sampling_rate` float,
  `sensor_type` text,
  `start_date` datetime,
  `end_date` datetime,
  `PAZ` float,
  `status` boolean DEFAULT true,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `availability` (
  `availability_id` integer PRIMARY KEY AUTO_INCREMENT,
  `stasiun_id` integer,
  `tanggal` datetime,
  `nilai_availability` integer
);