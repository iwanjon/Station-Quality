// scripts/scheduler.js

import 'dotenv/config';
import cron from 'node-cron';
import { runLatencyTask } from './fetchLatencyHistory.js';
import dayjs from 'dayjs';

/**
 * [BARU] Fungsi helper untuk menjalankan tugas dengan mekanisme coba-lagi.
 * @param {Function} task - Fungsi async yang akan dijalankan.
 * @param {number} retries - Jumlah maksimum percobaan.
 * @param {number} delay - Jeda waktu antar percobaan (dalam milidetik).
 */
async function runTaskWithRetry(task, retries = 5, delay = 10000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`\n[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🚀 Percobaan ke-${i} menjalankan tugas...`);
      await task();
      return; // Jika berhasil, keluar dari fungsi
    } catch (error) {
      console.warn(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ⚠️ Percobaan ke-${i} gagal. Mencoba lagi dalam ${delay / 1000} detik...`);
      if (i === retries) {
        console.error('❌ Semua percobaan gagal. Tugas dibatalkan.', error);
        // Hentikan proses agar PM2 bisa melaporkan error
        process.exit(1); 
      }
      // Tunggu sebelum mencoba lagi
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🕒 Penjadwal (Scheduler) diaktifkan.`);
console.log('Menunggu jadwal tugas berikutnya...');

// Jadwal cron jam 7 pagi
cron.schedule('0 7 * * *', () => {
  console.log(`\n[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🔔 Waktu tugas terjadwal tercapai!`);
  // Jalankan tugas terjadwal juga dengan mekanisme coba-lagi
  runTaskWithRetry(runLatencyTask, 3, 5000); 
}, {
  scheduled: true,
  timezone: "Asia/Jakarta"
});

// Jalankan tugas pertama kali saat startup menggunakan mekanisme coba-lagi
runTaskWithRetry(runLatencyTask);