// scripts/fetchLatencyHistory.js

import axios from 'axios';
import pool from '../config/database.js';
import dayjs from 'dayjs';

/**
 * Helper untuk mengubah string latensi (misal: "5h", "10m", "3d") menjadi detik.
 */
const parseLatencyToSeconds = (latencyString) => {
  if (!latencyString || typeof latencyString !== 'string' || latencyString.toUpperCase() === 'NA') {
    return null;
  }
  const value = parseFloat(latencyString);
  if (isNaN(value)) return null;
  
  if (latencyString.endsWith('h')) return value * 3600;
  if (latencyString.endsWith('d')) return value * 24 * 60 * 60;
  if (latencyString.endsWith('m')) return value * 60;

  return value; // Dianggap detik jika tidak ada satuan
};

/**
 * Fungsi utama untuk mengambil data dari API, memformatnya, dan menyimpannya ke database.
 */
export async function runLatencyTask() {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🚀 Memulai tugas pengambilan data latensi...`);

  try {
    // Panggil API internal di server-app. Docker akan mengarahkan 'server-app' ke kontainer yang benar.
    const response = await axios.get('http://server-app:5000/api/dashboard/slmon/laststatus');
    const features = response.data?.features;

    if (!features || features.length === 0) {
      console.log('🟡 Tidak ada data latensi yang ditemukan dari API.');
      return;
    }
    
    const columns = [
      'sta', 'ipaddr', 'net', 'time_from_api', 
      'latency1', 'latency2', 'latency3', 'latency4', 'latency5', 'latency6',
      'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6',
      'location', 'provin', 'uptbmkg', 'longitude', 'latitude'
    ];

    const dataToInsert = features.map(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      return [
        props.sta, props.ipaddr, props.net,
        props.time ? dayjs(props.time).format('YYYY-MM-DD HH:mm:ss') : null,
        parseLatencyToSeconds(props.latency1), parseLatencyToSeconds(props.latency2),
        parseLatencyToSeconds(props.latency3), parseLatencyToSeconds(props.latency4),
        parseLatencyToSeconds(props.latency5), parseLatencyToSeconds(props.latency6),
        props.ch1, props.ch2, props.ch3, props.ch4, props.ch5, props.ch6,
        props.location, props.provin, props.uptbmkg,
        coords && coords[0] ? parseFloat(coords[0]) : null,
        coords && coords[1] ? parseFloat(coords[1]) : null,
      ];
    });
    
    const sql = `INSERT INTO latency_history (${columns.join(', ')}) VALUES ?`;
    await pool.query(sql, [dataToInsert]);

    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ✅ Berhasil menyimpan ${dataToInsert.length} data latensi ke database.`);

  } catch (error) {
    // Melemparkan error kembali agar fungsi runTaskWithRetry bisa menangkapnya.
    console.error(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ❌ Gagal menjalankan tugas:`, error.message);
    throw error;
  }
}
