import { Router } from 'express';
import { fetchSLMONLastStatus } from '../services/externalApi.js';

const router = Router();

router.get('/slmon/laststatus', async (req, res) => {
  try {
    // Add authorization filter data.features[9].properties.sta use stasion code to filter
    const data = await fetchSLMONLastStatus();

    console.log(req.user)
    // console.log(data.features[9].properties.sta);
    // const targetStations = ["AAFM",
    //                         "AAI",
    //                         "AAII",
    //                         "ABJI",
    //                         "ABSM",
    //                         "ACBM",
    //                         "ACJM",
    //                         "ALKI",
    //                         "ALTI",
    //                         "AMPM"];

    // const targetStations = req.user.kode_stasiun ;
    // const filteredFeatures = data.features.filter((feature) => {
    //   return targetStations.includes(feature.properties.sta);
    // });
    // const filteredData = {
    //   type: data.type,
    //   features: filteredFeatures
    // };

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data SLMON Last Status' });
  }
});

export default router;