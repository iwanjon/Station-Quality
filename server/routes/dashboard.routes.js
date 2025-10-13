import { Router } from 'express';
import { fetchSLMONLastStatus } from '../services/externalApi.js';

const router = Router();

router.get('/slmon/laststatus', async (_req, res) => {
  try {
    const data = await fetchSLMONLastStatus();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data SLMON Last Status' });
  }
});

export default router;