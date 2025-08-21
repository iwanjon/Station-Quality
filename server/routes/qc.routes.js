// // routes/qc.routes.js
import { Router } from 'express';
import { cached } from '../utils/cacheHelper.js'; 
import { fetchQCDetail } from '../services/externalApi.js'; 

const router = Router();

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

// module.exports = router;
export default router;

// router.get('/data/detail/:stationId/:date', async (req, res, next) => {
//   try {
//     const { stationId, date } = req.params;
//     const cacheKey = `qc:detail:${stationId}:${date}`;

//     const data = await cached(cacheKey, 300, () => fetchQCDetail(stationId, date));
//     res.json(data);
//   } catch (err) {
//     next(err);
//   }
// });