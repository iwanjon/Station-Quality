// routes/qc.routes.js
import { Router } from 'express';
import { cached } from '../utils/cacheHelper.js'; 
import { fetchQCDetail, fetchQCSummary  } from '../services/externalApi.js'; 
import dayjs from "dayjs";

const router = Router();

// [ENDPOINT BARU] Ambil data summary QC untuk 7 hari terakhir per stasiun
router.get("/summary/7days/:stationCode", async (req, res) => {
  const { stationCode } = req.params;
  const cacheKey = `qc-summary-7days:${stationCode}`;

  try {
    const finalResults = await cached(cacheKey, 60 * 60, async () => {
      const today = dayjs();
      const promises = [];

      // Siapkan 7 promise untuk mengambil data 7 hari terakhir secara paralel
      for (let i = 1; i <= 7; i++) {
        const date = today.subtract(i, "day").format("YYYY-MM-DD");
        promises.push(fetchQCSummary(date));
      }

      const dailySummaries = await Promise.allSettled(promises);
      const results = [];

      dailySummaries.forEach((dayResult, index) => {
        const date = today.subtract(index + 1, "day");
        let status = "No Data"; // Status default

        if (dayResult.status === 'fulfilled' && dayResult.value) {
          const stationData = dayResult.value.find(s => s.code === stationCode);
          if (stationData) {
            // Konversi dari 'Baik' -> 'Good', dst.
            switch (stationData.result) {
              case "Baik":
                status = "Good";
                break;
              case "Cukup Baik":
                status = "Fair";
                break;
              case "Buruk":
                status = "Poor";
                break;
              default:
                status = "No Data"; // Termasuk 'Mati' atau lainnya
                break;
            }
          }
        } else {
          console.warn(`⚠️ Could not fetch summary for date index ${index + 1}, station ${stationCode}`);
        }
        
        results.push({
          date: date.format('DD-MMM'), // Format tanggal seperti '13-Sep'
          status: status,
        });
      });

      // Hasilnya sudah dari H-7 ke H-1, jadi kita urutkan kembali
      return results.reverse();
    });

    res.json(finalResults);

  } catch (err) {
    console.error(`Error in /summary/7days/${stationCode}:`, err);
    res.status(500).json({ error: "Failed to fetch 7 days QC summary" });
  }
});


// --- KODE LAMA (TIDAK BERUBAH) ---

// Ambil data QC untuk 7 hari terakhir
router.get("/data/detail/7days/:stationId", async (req, res) => {
  const { stationId } = req.params;
  const today = dayjs();
  const results = [];

  try {
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
  const { date } = req.params;
  const cacheKey = `qc-summary:${date}`;

  try {
    const data = await cached(cacheKey, 60 * 60, () =>
      fetchQCSummary(date)
    );
    res.json(data);
  } catch (err) {
    console.error("Error in /summary:", err);
    res.status(500).json({ error: "Failed to fetch QC summary" });
  }
});

export default router;