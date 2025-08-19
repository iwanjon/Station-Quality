const express = require('express');
const dashboardRoutes = require('./routes/dashboard.routes');
const qcRoutes = require('./routes/qc.routes');

const app = express();
app.use(express.json());

app.use('/api', dashboardRoutes);
app.use('/api/qc', qcRoutes); // <--- pasang prefix untuk QC routes

module.exports = app;
