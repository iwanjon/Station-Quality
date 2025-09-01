// routes/qc.routes.js
import { Router } from "express";
import axios from "axios";
import { cached } from "../utils/cacheHelper.js";
import { fetchQCDetail } from "../services/externalApi.js";
import dayjs from "dayjs";

const router = Router();

// 🔹 GET signal image proxy
router.get("/data/signal/:date/:stationId/:channel", async (req, res) => {
  const { date, stationId, channel } = req.params;

  try {
    const url = `http://103.169.3.72:2107/api/qc/data/signal/${date}/${stationId}/${channel}`;
    const response = await axios.get(url, {
      responseType: "arraybuffer", // karena file image (bukan JSON)
      headers: {
        Authorization: `Bearer DEBUG-BYPASS-TOKEN-2107`,
        Accept: "*/*",
      },
    });

    // Set headers biar client ngerti ini image
    res.set("Content-Type", response.headers["content-type"] || "image/png");
    res.send(response.data);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: "Image file not found" });
    }
    console.error("Error fetching signal image:", err.message);
    res.status(500).json({ error: "Failed to fetch signal image" });
  }
});

// 🔹 GET QC detail 7 hari
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

// 🔹 GET QC detail by station & date
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
