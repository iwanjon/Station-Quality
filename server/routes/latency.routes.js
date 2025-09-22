import { Router } from "express";
import { fetchLatencyDetail } from "../services/externalApi.js";

const router = Router();

router.get("/metadata/latency/:sta_code/:channel", async (req, res) => {
  const { sta_code, channel } = req.params;

  try {
    const data = await fetchLatencyDetail(sta_code, channel);
    res.json(data);
  } catch (err) {
    console.error(`Error fetching latency data for ${sta_code}:`, err.message);

    if (err.response) {
      // Teruskan status dan pesan error dari API eksternal
      return res
        .status(err.response.status)
        .json(err.response.data || { error: "Failed to fetch latency data" });
    }

    // Error internal server
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;