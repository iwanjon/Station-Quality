import express, { json } from 'express';
import cors from 'cors';
import dashboardRoutes from './routes/dashboard.routes.js';
import signalRoutes from "./routes/signal.routes.js";
import latencyRoutes from "./routes/latency.routes.js";
import qcRoutes from './routes/qc.routes.js';
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
app.use('/api/stasiun', stasiunRoutes);
app.use('/api/stasiun', stasiunRoutes);

app.use("/api/qc", signalRoutes);
app.use('/api', latencyRoutes);

export default app;
