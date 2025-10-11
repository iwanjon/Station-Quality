CREATE TABLE `stasiun_history` (
  `history_id` integer PRIMARY KEY AUTO_INCREMENT,
  `stasiun_id` integer,
  `status` boolean DEFAULT false,
  `channel` varchar(10),
  `sensor_name` text,
  `digitizer_name` text,
  `total_gain` integer,
  `input_unit` varchar(10),
  `start_date` datetime,
  `end_date` datetime,
  `latitude` float,
  `longitude` float,
  `elevation` float,
  `sampling_rate` float,
  `paz` json,
  `response_path` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`stasiun_id`) REFERENCES `stasiun`(`stasiun_id`) ON DELETE SET NULL
);

CREATE TABLE `availability` (
  `availability_id` integer PRIMARY KEY AUTO_INCREMENT,
  `stasiun_id` integer,
  `tanggal` datetime,
  `nilai_availability` float
);