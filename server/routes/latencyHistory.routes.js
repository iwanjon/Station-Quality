import { Router } from 'express';
import db from '../config/knex.js'; // Pastikan path ke knex.js benar
import dayjs from 'dayjs';

const router = Router();

// Endpoint untuk mengambil agregat ON/OFF 7 hari terakhir
router.get('/7days', async (req, res) => {
  try {
    const sevenDaysAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

    // Query ke database untuk menghitung stasiun ON dan OFF per hari
    const results = await db('latency_history')
      .select(
        // Ambil tanggal saja dari timestamp 'recorded_at'
        db.raw('DATE(recorded_at) as date'),
        // Hitung sebagai 'ON' jika SEMUA latency (1-3) di bawah 1 hari (86400 detik)
        db.raw('SUM(CASE WHEN latency1 < 86400 AND latency2 < 86400 AND latency3 < 86400 THEN 1 ELSE 0 END) as count_on'),
        // Hitung sebagai 'OFF' jika SALAH SATU latency (1-3) >= 1 hari atau null
        db.raw('SUM(CASE WHEN latency1 >= 86400 OR latency2 >= 86400 OR latency3 >= 86400 OR latency1 IS NULL OR latency2 IS NULL OR latency3 IS NULL THEN 1 ELSE 0 END) as count_off')
      )
      .where('recorded_at', '>=', sevenDaysAgo)
      .groupBy('date')
      .orderBy('date', 'asc');

    // Format data agar sesuai dengan kebutuhan chart
    const formattedResults = results.map(row => ({
      date: dayjs(row.date).format('YYYY-MM-DD'),
      ON: Number(row.count_on) || 0,
      OFF: Number(row.count_off) || 0,
    }));
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Error fetching latency history:', error);
    res.status(500).json({ error: 'Failed to fetch latency history' });
  }
});

export default router;