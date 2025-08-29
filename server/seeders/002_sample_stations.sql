INSERT INTO `stasiun` (
  `net`, `kode_stasiun`, `lintang`, `bujur`, `elevasi`, 
  `lokasi`, `provinsi_id`, `upt`, `status`, `tahun_instalasi`, 
  `jaringan_id`, `prioritas`, `accelerometer`, `tipe_shelter`,
  `lokasi_shelter`, `penjaga_shelter`
) VALUES 
('II', 'KMSI', -6.1944, 106.8229, 8, 'Jakarta', 11, 1, 'aktif', 2015, 1, 'P1', 'installed', 'bunker', 'inside_office', 'ada'),
('IA', 'BDNG', -6.9175, 107.6191, 768, 'Bandung', 12, 1, 'aktif', 2010, 2, 'P1', 'installed', 'surface', 'outside_office', 'ada'),
('II', 'YGY', -7.7956, 110.3695, 113, 'Yogyakarta', 14, 3, 'aktif', 2008, 1, 'P1', 'not_installed', 'bunker', 'inside_office', 'ada'),
('IA', 'DPS', -8.6500, 115.2167, 4, 'Denpasar', 17, 4, 'aktif', 2012, 2, 'P2', 'installed', 'surface', 'outside_office', 'tidak_ada');