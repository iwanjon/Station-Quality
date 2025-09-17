// // routes/qc.routes.js
import { Router } from 'express';
import { cached } from '../utils/cacheHelper.js'; 
import { fetchQCDetail, fetchQCSummary  } from '../services/externalApi.js'; 
import dayjs from "dayjs";

const router = Router();

// Ambil data QC untuk 7 hari terakhir
router.get("/data/detail/7days/:stationId", async (req, res) => {
  const { stationId } = req.params;
  const today = dayjs();
  const results = [];

  try {
    // [DIUBAH] Loop sekarang dari 1 sampai 7 untuk mengambil data dari kemarin
    for (let i = 1; i <= 7; i++) {
      const date = today.subtract(i, "day").format("YYYY-MM-DD");
      const cacheKey = `qc:${stationId}:${date}`;

      try {
        const data = await cached(cacheKey, 60 * 60, () =>
          fetchQCDetail(stationId, date)
        );

        if (data && data.length > 0) {
          data.forEach((item) => {
            results.push({ date, ...item });
          });
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.warn(`⚠️ Data not found for ${stationId} at ${date}`);
          continue;
        }
        throw err;
      }
    }

    // Mengurutkan hasil dari tanggal terlama ke terbaru
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

router.get("/summary/:date", async (req, res) => {
  const { date } = req.params; // ✅ hanya ambil date
  const cacheKey = `qc-summary:${date}`;

  try {
    const data = await cached(cacheKey, 60 * 60, () =>
      fetchQCSummary(date) // ✅ kirim cuma date
    );
    res.json(data);
  } catch (err) {
    console.error("Error in /summary:", err);
    res.status(500).json({ error: "Failed to fetch QC summary" });
  }
});


export default router;

