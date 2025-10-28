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
import logger from './utils/logger.js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------
// Initialize global error handlers
// handleUncaughtExceptions();
// handleUnhandledRejections();
// -------------------------

const app = express();
app.use(json());



// ------------------------
// Middleware to log every incoming request
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});
// -------------------------------

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


app.use((err, req, res, next) => {
  // log the full error with stack
  // logger.error(err.stack || err);                    // or: logger.error('DB Error', { err });
  logger.error("Error", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });
  res.status(500).json({ error: "Internal Server Error" });
});

// // Uncaught exception (sync)
// setTimeout(() => {
//   // should be logged by exceptionHandlers (console + file)
//   // and may exit if exitOnError=true (you set false)
//   notDefined();
// }, 500);

// // Unhandled rejection (async)
// setTimeout(() => {
//   // should be logged by rejectionHandlers (console + file)
//   Promise.reject(new Error('boom from unhandled rejection'));
// }, 1000);

export default app;