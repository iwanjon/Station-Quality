// scripts/scheduler.js

import 'dotenv/config';
import cron from 'node-cron';
import { runLatencyTask } from './fetchLatencyHistory.js';
import { runAvailabilityTask } from './fetchAvailabilityHistory.js';
import dayjs from 'dayjs';

/**
 * Fungsi helper untuk menjalankan tugas dengan mekanisme coba-lagi (retry).
 * Ini berguna untuk menangani kondisi di mana server belum siap saat scheduler dimulai.
 * @param {Function} task - Fungsi async yang akan dijalankan.
 * @param {number} retries - Jumlah maksimum percobaan.
 * @param {number} delay - Jeda waktu antar percobaan (dalam milidetik).
 */
async function runTaskWithRetry(task, retries = 5, delay = 10000) {
  for (let i = 1; i <= retries; i++) {
    try {
      // Coba jalankan tugas
      console.log(`\n[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🚀 Percobaan ke-${i} menjalankan tugas...`);
      await task();
      return; // Jika berhasil, hentikan percobaan lebih lanjut.
    } catch (error) {
      // Jika gagal, tampilkan peringatan dan tunggu sebelum mencoba lagi.
      console.warn(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ⚠️  Percobaan ke-${i} gagal. Mencoba lagi dalam ${delay / 1000} detik...`);
      if (i === retries) {
        console.error('❌ Semua percobaan gagal. Tugas dibatalkan.', error);
        process.exit(1); // Keluar dengan error agar PM2 bisa menanganinya.
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🕒 Penjadwal (Scheduler) diaktifkan.`);
console.log('Menunggu jadwal tugas berikutnya...');

// Jadwalkan tugas untuk berjalan SETIAP HARI PUKUL 7:00 PAGI.
cron.schedule('0 7 * * *', () => {
  console.log(`\n[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🔔 Waktu tugas terjadwal tercapai!`);
  // Jalankan tugas terjadwal juga dengan mekanisme coba-lagi
  runTaskWithRetry(runLatencyTask, 3, 5000);
  runTaskWithRetry(runAvailabilityTask, 3, 5000);
}, {
  scheduled: true,
  timezone: "Asia/Jakarta"
});

// Jalankan tugas ini SATU KALI SAJA saat aplikasi pertama kali dimulai.
// Ini berguna untuk mengisi data hari ini tanpa harus menunggu jadwal.
runTaskWithRetry(runLatencyTask);
runTaskWithRetry(runAvailabilityTask);