// server/index.js
import express from "express";
import cors from "cors";
import pool from "./db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint untuk ambil semua data stasiun
app.get("/api/stasiun", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM stasiun");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil data" });
  }
});

app.get("/", (req, res) => {
  res.send("Server API Stasiun jalan");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
