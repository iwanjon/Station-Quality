// scripts/fetchAvailabilityHistory.js

import axios from 'axios';
import pool from '../config/database.js';
import dayjs from 'dayjs';

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;

/**
 * Fungsi utama untuk mengambil data availability dari API eksternal dan menyimpannya ke database.
 */
export async function runAvailabilityTask() {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🚀 Memulai tugas pengambilan data availability...`);

  try {
    // Set tanggal kemarin sebagai target
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const targetDate = yesterday.toISOString().split('T')[0]; // Format YYYY-MM-DD

    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 📅 Mengambil data availability untuk tanggal: ${targetDate}`);

    // 1. Fetch data availability dari API untuk tanggal kemarin
    const apiUrl = `${API_BASE_URL}/qc/data/availability/`;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json"
      },
      params: {
        start_date: targetDate,
        end_date: targetDate
      },
      timeout: 90000
    });

    const apiResponse = response.data;
    const availabilityData = apiResponse.data;

    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ✅ API mengembalikan ${Object.keys(availabilityData).length} stasiun untuk ${targetDate}`);

    // 2. Fetch semua stasiun dari database (hanya yang aktif dan nonaktif)
    const [stationRows] = await pool.query(`
      SELECT stasiun_id, kode_stasiun
      FROM stasiun
      WHERE status != "dismantled"
      ORDER BY kode_stasiun
    `);

    if (stationRows.length === 0) {
      console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🟡 Tidak ada stasiun yang ditemukan di database`);
      return;
    }

    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ✅ Ditemukan ${stationRows.length} stasiun di database`);

    // 3. Process dan hitung rata-rata availability per stasiun
    let processedCount = 0;
    let insertedCount = 0;
    let skippedCount = 0;

    for (const station of stationRows) {
      const { stasiun_id, kode_stasiun } = station;

      try {
        // Check apakah data untuk tanggal ini sudah ada
        const [existingRows] = await pool.query(`
          SELECT availability_id
          FROM availability
          WHERE stasiun_id = ? AND DATE(tanggal) = ?
        `, [stasiun_id, targetDate]);

        if (existingRows.length > 0) {
          console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ⏭️ Data sudah ada untuk stasiun ${kode_stasiun} pada ${targetDate}, dilewati`);
          skippedCount++;
          continue;
        }

        // Hitung rata-rata availability dari API data
        let averageAvailability = null;

        if (availabilityData[kode_stasiun] && availabilityData[kode_stasiun].length > 0) {
          const stationData = availabilityData[kode_stasiun][0]; // Data untuk tanggal target

          // Cari semua channel yang berakhiran N, E, atau Z
          const channelKeys = Object.keys(stationData).filter(key =>
            key.endsWith('N') || key.endsWith('E') || key.endsWith('Z')
          );

          if (channelKeys.length > 0) {
            // Ambil nilai dari channel yang ditemukan
            const channelValues = channelKeys
              .map(key => parseFloat(stationData[key]) || 0)
              .filter(val => !isNaN(val) && val > 0); // Filter nilai valid saja

            if (channelValues.length > 0) {
              // Hitung rata-rata
              const sum = channelValues.reduce((acc, val) => acc + val, 0);
              averageAvailability = Math.round((sum / channelValues.length) * 100) / 100;
            }
          }
        }

        // Insert ke tabel availability
        await pool.query(`
          INSERT INTO availability (stasiun_id, tanggal, nilai_availability)
          VALUES (?, ?, ?)
        `, [stasiun_id, targetDate, averageAvailability]);

        processedCount++;
        insertedCount++;

        console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ✅ Diproses stasiun ${kode_stasiun}: ${averageAvailability !== null ? averageAvailability + '%' : 'null'}`);

      } catch (stationError) {
        console.error(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ❌ Error memproses stasiun ${kode_stasiun}:`, stationError.message);
        // Continue processing other stations
      }
    }

    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ✅ Pengambilan data availability harian selesai:`);
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]    📊 Diproses: ${processedCount} stasiun`);
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]    💾 Dimasukkan: ${insertedCount} record`);
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]    ⏭️ Dilewati: ${skippedCount} record yang sudah ada`);
    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]    📅 Tanggal: ${targetDate}`);

  } catch (error) {
    // Melemparkan error kembali agar fungsi runTaskWithRetry bisa menangkapnya.
    console.error(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ❌ Gagal menjalankan tugas:`, error.message);
    throw error;
  }
}