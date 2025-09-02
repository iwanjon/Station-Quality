import express, { json } from 'express';
import cors from 'cors';
import dashboardRoutes from './routes/dashboard.routes.js';
<<<<<<< HEAD
import qcRoutes from './routes/qc.routes.js'; // Import QC routes
import pool from './config/db.js'; 
import signalRoutes from "./routes/signal.routes.js";
import latencyRoutes from "./routes/latency.routes.js";
=======
import qcRoutes from './routes/qc.routes.js';
import pool, {testConnection} from './config/database.js' 
>>>>>>> 2befcc9f37cde7d904f10f19a58178d1232a588f

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

// Tambahkan route stasiun
app.get('/api/stasiun', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM stasiun');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal ambil data stasiun' });
  }
});

app.use("/api/qc", signalRoutes);
app.use('/api', latencyRoutes);

export default app;
