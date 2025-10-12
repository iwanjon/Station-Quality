import express, { json } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dashboardRoutes from './routes/dashboard.routes.js';
import signalRoutes from "./routes/signal.routes.js";
import latencyRoutes from "./routes/latency.routes.js";
import qcRoutes from './routes/qc.routes.js';
import qcImageRoutes from './routes/qcImage.routes.js'; 
import availabilityRoutes from './routes/availability.routes.js';
import stasiunRoutes from './routes/stasiun.routes.js';
import stasiunHistoryRoutes from './routes/stasiunHistory.routes.js';
import pool, { testConnection } from './config/database.js';
import latencyHistoryRoutes from './routes/latencyHistory.routes.js'; 
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(json());

// Serve static files from public/uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use(
  cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use('/api/dashboard', dashboardRoutes); 
app.use('/api/qc', qcRoutes);
app.use('/api/qc', qcImageRoutes); 
app.use('/api/stasiun', stasiunRoutes);
app.use('/api/station-history', stasiunHistoryRoutes);
app.use('/api/availability', availabilityRoutes);
app.use("/api/signal", signalRoutes);
app.use('/api', latencyRoutes);
app.use('/api/latency/history', latencyHistoryRoutes);

export default app;