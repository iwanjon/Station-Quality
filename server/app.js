import express, { json } from 'express';
import dashboardRoutes from './routes/dashboard.routes.js';
// import qcRoutes from './routes/qc.routes.js';
import qcRoutes from './routes/qc.routes.js'; // Import QC routes
import pool from './config/db.js'; 

const app = express();
app.use(json());

app.use('/api', dashboardRoutes);
app.use('/api/qc', qcRoutes); // <--- pasang prefix untuk QC routes

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

export default app;
