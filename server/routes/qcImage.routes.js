// File baru: routes/qcImage.routes.js

import { Router } from 'express';
import { fetchPsdImage, fetchSignalImage } from '../services/externalApi.js';

const router = Router();

// Route untuk mendapatkan gambar PSD
router.get("/data/psd/:date_str/:code/:channel", async (req, res) => {
  try {
    const { date_str, code, channel } = req.params;
    
    // Panggil service untuk mengambil stream gambar dari API eksternal
    const imageStream = await fetchPsdImage(date_str, code, channel);

    // Set content-type header agar browser tahu ini adalah gambar PNG
    res.setHeader('Content-Type', 'image/png');

    // Teruskan (pipe) stream gambar langsung ke response client
    imageStream.data.pipe(res);

  } catch (err) {
    console.error("Error in PSD image route:", err.message);
    const statusCode = err.response ? err.response.status : 500;
    res.status(statusCode).json({ error: "Failed to fetch PSD image" });
  }
});


// Route untuk mendapatkan gambar Signal
router.get("/data/signal/:date_str/:code/:channel", async (req, res) => {
  try {
    const { date_str, code, channel } = req.params;
    
    // Panggil service untuk mengambil stream gambar
    const imageStream = await fetchSignalImage(date_str, code, channel);
    
    // Set content-type header
    res.setHeader('Content-Type', 'image/png');

    // Teruskan (pipe) stream gambar ke response client
    imageStream.data.pipe(res);

  } catch (err) {
    console.error("Error in Signal image route:", err.message);
    const statusCode = err.response ? err.response.status : 500;
    res.status(statusCode).json({ error: "Failed to fetch Signal image" });
  }
});


export default router;