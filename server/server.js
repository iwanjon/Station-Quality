import 'dotenv/config';
import app from './app.js';   // ambil default export, bukan { listen }

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Add new endpoint for station detail
app.get('/api/stations/:id/detail', (req, res) => {
  const stationId = parseInt(req.params.id);
  
  // Read the detailed station data
  const fs = require('fs');
  const path = require('path');
  
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
