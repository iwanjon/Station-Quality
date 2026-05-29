import { Router } from "express";
import { 
    getAllStasiun,
    getRecentUpdates,
    getAllStasiunWithSensor
} from '../controllers/stasiun.controller.js';

const router = Router();

// GET /api/stasiun - Get all stasiun
router.get('/', getAllStasiun);
router.get('/sensor', getAllStasiunWithSensor);
router.get('/recent-updates', getRecentUpdates);

export default router;