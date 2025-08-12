const express = require('express');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
app.use(express.json());

app.use('/api', dashboardRoutes);

module.exports = app;
