CREATE TABLE `provinsi` (
  `provinsi_id` integer PRIMARY KEY AUTO_INCREMENT,
  `nama_provinsi` varchar(32) NOT NULL
);

CREATE TABLE `upt` (
  `upt_id` integer PRIMARY KEY AUTO_INCREMENT,
  `nama_upt` text NOT NULL
);

CREATE TABLE `jaringan` (
  `jaringan_id` integer PRIMARY KEY AUTO_INCREMENT,
  `nama_jaringan` text NOT NULL
);