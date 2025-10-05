import axios from 'axios';
import db from '../config/knex.js'; // Impor koneksi database
import dayjs from 'dayjs';

/**
 * Helper untuk mengubah string latensi (misal: "10s", "3m", "1d") menjadi detik (integer).
 * Mengembalikan null jika format tidak valid atau "NA".
 */
const parseLatencyToSeconds = (latencyString) => {
  if (!latencyString || typeof latencyString !== 'string' || latencyString.toUpperCase() === 'NA') {
    return null;
  }

  const value = parseFloat(latencyString);
  if (isNaN(value)) {
    return null;
  }

  if (latencyString.endsWith('d')) {
    return value * 24 * 60 * 60; // hari -> detik
  }
  if (latencyString.endsWith('m')) {
    return value * 60; // menit -> detik
  }
  // Asumsikan detik jika hanya angka atau diakhiri 's'
  return value;
};

/**
 * Fungsi utama untuk menjalankan tugas: mengambil data dan menyimpannya ke database.
 */
export async function runLatencyTask() {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🚀 Memulai tugas pengambilan data latensi...`);

  try {
    // 1. Ambil data dari API SLMON
    const response = await axios.get('http://localhost:5000/api/dashboard/slmon/laststatus');
    const features = response.data?.features;

    if (!features || features.length === 0) {
      console.log('🟡 Tidak ada data latensi yang ditemukan dari API.');
      return;
    }

    // 2. Siapkan data untuk dimasukkan ke database
    const dataToInsert = features.map(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      return {
        sta: props.sta,
        ipaddr: props.ipaddr,
        net: props.net,
        time_from_api: props.time ? dayjs(props.time).format('YYYY-MM-DD HH:mm:ss') : null,
        latency1: parseLatencyToSeconds(props.latency1),
        latency2: parseLatencyToSeconds(props.latency2),
        latency3: parseLatencyToSeconds(props.latency3),
        latency4: parseLatencyToSeconds(props.latency4),
        latency5: parseLatencyToSeconds(props.latency5),
        latency6: parseLatencyToSeconds(props.latency6),
        ch1: props.ch1,
        ch2: props.ch2,
        ch3: props.ch3,
        ch4: props.ch4,
        ch5: props.ch5,
        ch6: props.ch6,
        location: props.location,
        provin: props.provin,
        uptbmkg: props.uptbmkg,
        longitude: coords && coords[0] ? parseFloat(coords[0]) : null,
        latitude: coords && coords[1] ? parseFloat(coords[1]) : null,
        // recorded_at akan diisi otomatis oleh database
      };
    });

    // 3. Masukkan data ke tabel menggunakan Knex
    // Menggunakan batchInsert untuk efisiensi jika data sangat banyak
    await db.batchInsert('latency_history', dataToInsert, 100);

    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ✅ Berhasil menyimpan ${dataToInsert.length} data latensi ke database.`);

  } catch (error) {
    console.error(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ❌ Gagal menjalankan tugas:`, error.message);
  }
}