INSERT INTO `stasiun_history` (
  `stasiun_id`, `SHE`, `SHN`, `SHZ`, `sensor_type`, `data_logger`,
  `input_unit`, `sampling_rate`, `start_date`, `end_date`, `PAZ`, `total_gain`, `status`
) VALUES
(1, 0.0012, 0.0011, 0.0013, 'Trillium-120', 'Q330S+', 'IA-001', 100, '2020-01-01 00:00:00', '2021-12-31 23:59:59', 0.85, 40.5, true),
(1, 0.0011, 0.0010, 0.0012, 'Trillium-120', 'Q330S+', 'IA-001', 100, '2022-01-01 00:00:00', NULL, 0.87, 41.0, true),
(2, 0.0020, 0.0021, 0.0022, 'STS-2', 'Centaur', 'IA-002', 80, '2019-05-15 10:00:00', '2021-08-20 16:30:00', 0.76, 38.7, false),
(2, 0.0018, 0.0019, 0.0020, 'STS-2', 'Centaur', 'IA-002', 80, '2021-08-21 00:00:00', NULL, 0.78, 39.1, true),
(3, 0.0015, 0.0016, 0.0017, 'Guralp-3ESPC', 'Reftek', 'IA-003', 100, '2021-03-10 08:00:00', NULL, 0.90, 42.0, true);
