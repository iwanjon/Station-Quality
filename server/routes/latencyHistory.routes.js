// latencyHistory.route.js

import { Router } from 'express';
import pool from '../config/database.js';
import dayjs from 'dayjs';

const router = Router();

router.get('/7days', async (req, res) => {
  try {
    const sevenDaysAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');

    // OFF jika latency1 adalah NULL ATAU nilai terkecil dari (lat1, lat2, lat3) >= 1 hari.
    const sql = `
      SELECT
        DATE(recorded_at) as date,
        SUM(CASE
          WHEN NOT (latency1 IS NULL OR LEAST(latency1, latency2, latency3) >= 86400) THEN 1
          ELSE 0
        END) as 'ON',
        SUM(CASE
          WHEN (latency1 IS NULL OR LEAST(latency1, latency2, latency3) >= 86400) THEN 1
          ELSE 0
        END) as 'OFF'
      FROM
        latency_history
      WHERE
        DATE(recorded_at) >= ?
      GROUP BY
        DATE(recorded_at)
      ORDER BY
        date ASC;
    `;

    const [results] = await pool.query(sql, [sevenDaysAgo]);

    const formattedResults = results.map(row => ({
      date: dayjs(row.date).format('YYYY-MM-DD'),
      ON: Number(row.ON) || 0,
      OFF: Number(row.OFF) || 0,
    }));
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Error fetching latency history:', error);
    res.status(500).json({ error: 'Failed to fetch latency history' });
  }
});

export default router;