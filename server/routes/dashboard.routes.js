import { Router } from 'express';
// import { getData } from '../services/externalApi';
import { getData } from '../services/externalApi.js'; // Uncomment if using ES Modules

const router = Router();
router.get('/data', async (req, res) => {
  try {
    const data = await getData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

export default router;