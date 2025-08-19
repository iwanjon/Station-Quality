// routes/qc.routes.js
const express = require('express');
const router = express.Router();
const { cached } = require('../utils/cacheHelper');
const { fetchQCDetail } = require('../services/externalApi');

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

module.exports = router;
