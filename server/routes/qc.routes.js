// // routes/qc.routes.js
import { Router } from 'express';
import { cached } from '../utils/cacheHelper.js'; 
import { fetchQCDetail } from '../services/externalApi.js'; 
import dayjs from "dayjs";

const router = Router();

// Ambil data QC untuk 7 hari terakhir
router.get("/data/detail/7days/:stationId", async (req, res) => {
  const { stationId } = req.params;
  const today = dayjs();
  const results = [];

  try {
    for (let i = 0; i < 7; i++) {
      const date = today.subtract(i, "day").format("YYYY-MM-DD");
      const cacheKey = `qc:${stationId}:${date}`;

      try {
        const data = await cached(cacheKey, 60 * 60, () =>
          fetchQCDetail(stationId, date)
        );

        if (data && data.length > 0) {
          results.push({ date, ...data[0] });
        }
      } catch (err) {
        // kalau external API balikin 404, lewati aja hari itu
        if (err.response && err.response.status === 404) {
          console.warn(`⚠️ Data not found for ${stationId} at ${date}`);
          continue;
        }
        throw err; // selain 404, lempar error beneran
      }
    }

    results.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(results);
  } catch (err) {
    console.error("Error in /data/detail/7days:", err);
    res.status(500).json({ error: "Failed to fetch 7 days QC detail" });
  }
});


router.get("/data/detail/:stationId/:date", async (req, res) => {
  const { stationId, date } = req.params;
  const cacheKey = `qc:${stationId}:${date}`;

  try {
    const data = await cached(cacheKey, 60 * 60, () =>
      fetchQCDetail(stationId, date)
    );
    res.json(data);
  } catch (err) {
    console.error("Error in /data/detail:", err);
    res.status(500).json({ error: "Failed to fetch QC detail" });
  }
});

export default router;

