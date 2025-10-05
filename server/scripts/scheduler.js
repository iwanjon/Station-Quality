import cron from 'node-cron';
import { runLatencyTask } from './fetchLatencyHistory.js';
import dayjs from 'dayjs';

console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🕒 Penjadwal (Scheduler) diaktifkan.`);
console.log('Menunggu jadwal tugas berikutnya...');

// Jadwalkan tugas untuk berjalan setiap hari pada jam 7:00 pagi Waktu Indonesia Barat (WIB)
cron.schedule('0 7 * * *', () => {
  console.log(`\n[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🔔 Waktu tugas tercapai! Menjalankan pengambilan data latensi...`);
  runLatencyTask();
}, {
  scheduled: true,
  timezone: "Asia/Jakarta" // Penting untuk memastikan waktu sesuai WIB
});

// (Opsional) Jalankan tugas sekali saat scheduler pertama kali dijalankan untuk testing
console.log(`\n[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] 🚀 Menjalankan tugas untuk pertama kali (testing)...`);
runLatencyTask();