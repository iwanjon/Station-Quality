import express, { json } from 'express';
import cors from 'cors';
import dashboardRoutes from './routes/dashboard.routes.js';
import signalRoutes from "./routes/signal.routes.js";
import latencyRoutes from "./routes/latency.routes.js";
import qcRoutes from './routes/qc.routes.js';
import availabilityRoutes from './routes/availability.routes.js'; 
import stasiunRoutes from './routes/stasiun.routes.js';


const app = express();
app.use(json());

app.use(
  cors({
    origin: "http://localhost:5173", // alamat client-app
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use('/api', dashboardRoutes);
app.use('/api/qc', qcRoutes);

app.get('/api/stasiun', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.stasiun_id,
        s.net,
        s.kode_stasiun,
        s.lintang,
        s.bujur,
        s.elevasi,
        s.lokasi,
        p.nama_provinsi AS provinsi,             -- join provinsi
        u.nama_upt AS upt_penanggung_jawab,     -- join UPT
        s.status,
        s.tahun_instalasi,
        j.nama_jaringan AS jaringan,            -- join jaringan
        s.prioritas,
        s.keterangan,
        s.accelerometer,
        s.digitizer_komunikasi,
        s.tipe_shelter,
        s.lokasi_shelter,
        s.penjaga_shelter,
        s.penggantian_terakhir_alat,
        s.updated_at
      FROM stasiun s
      LEFT JOIN jaringan j ON s.jaringan_id = j.jaringan_id
      LEFT JOIN upt u ON s.upt = u.upt_id        
      LEFT JOIN provinsi p ON s.provinsi_id = p.provinsi_id
    `);
    res.json(rows);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: 'Gagal ambil data stasiun' });
  }
});
// Tambahkan route stasiun
// app.use('/api/stasiun', stasiunRoutes);
// app.get('/api/stasiun', async (req, res) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM stasiun');
//     res.json(rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Gagal ambil data stasiun' });
//   }
// });


app.use('/api/availability', availabilityRoutes);
// app.use('/api/stasiun', stasiunRoutes);

app.use("/api/qc", signalRoutes);
app.use('/api', latencyRoutes);

export default app;
