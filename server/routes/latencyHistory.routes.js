import { Router } from 'express';
import pool from '../config/database.js'; // [DIUBAH] Menggunakan koneksi pool yang benar
import dayjs from 'dayjs';

const router = Router();

// Endpoint untuk mengambil agregat ON/OFF 7 hari terakhir
router.get('/7days', async (req, res) => {
  try {
    const sevenDaysAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

    // [DIUBAH] Query sekarang menggunakan SQL mentah dengan mysql2/promise
    const sql = `
      SELECT
        DATE(recorded_at) as date,
        SUM(CASE WHEN latency1 < 86400 AND latency2 < 86400 AND latency3 < 86400 THEN 1 ELSE 0 END) as count_on,
        SUM(CASE WHEN latency1 >= 86400 OR latency2 >= 86400 OR latency3 >= 86400 OR latency1 IS NULL OR latency2 IS NULL OR latency3 IS NULL THEN 1 ELSE 0 END) as count_off
      FROM
        latency_history
      WHERE
        recorded_at >= ?
      GROUP BY
        date
      ORDER BY
        date ASC;
    `;

    const [results] = await pool.query(sql, [sevenDaysAgo]);

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

