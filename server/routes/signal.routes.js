// routes/signal.routes.js
import { Router } from "express";
import axios from "axios";

const router = Router();

router.get("/data/signal/:date/:code/:channel", async (req, res) => {
  const { date, code, channel } = req.params;

  try {
    // Panggil API eksternal
    const response = await axios.get(
      `http://103.169.3.72:2107/api/qc/data/signal/${date}/${code}/${channel}`,
      {
        responseType: "arraybuffer", 
        headers: {
          Authorization: "Bearer DEBUG-BYPASS-TOKEN-2107",
          Accept: "*/*",
        },
      }
    );

    // Cek content-type (image/png atau image/jpeg)
    const contentType = response.headers["content-type"] || "image/png";

    res.set("Content-Type", contentType);
    res.send(response.data); 
  } catch (err) {
    console.error("Error fetching signal image:", err.message);

    if (err.response) {
      try {
        // 1. Konversi ArrayBuffer error ke string
        const errorString = Buffer.from(err.response.data).toString('utf8');
        // 2. Parse string menjadi objek JSON
        const errorJson = JSON.parse(errorString);

        // 3. Kirim status dan data JSON yang sudah diparsing
        return res.status(err.response.status).json(errorJson);

      } catch (parseError) {
        // Fallback jika respons error bukan JSON
        return res.status(err.response.status).send(err.response.data);
      }
    }

    // Error lain (misal: network error)
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
