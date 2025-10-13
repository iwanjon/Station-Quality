// server.js

import 'dotenv/config';
import app from './app.js';

// [DIUBAH] Impor modul yang diperlukan dengan sintaks ES Module
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// [DIUBAH] Menentukan __dirname yang tidak ada di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Endpoint untuk station detail (sekarang dengan sintaks yang benar)
app.get('/api/stations/:id/detail', (req, res) => {
  const stationId = parseInt(req.params.id);
  
  try {
    const filePath = path.join(__dirname, '../client/public/data/stationDetailData.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const stations = JSON.parse(data);
    
    const station = stations.find(s => s.id === stationId);
    
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    
    res.json(station);
  } catch (error) {
    console.error('Error reading station detail data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});