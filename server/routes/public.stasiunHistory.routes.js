import { Router } from "express";
import {
    getStationHistoryByCode,
    getAllStationHistory,
    getStationHistoryById,
    updateStationHistoryById,
    getResponseImageHistoryById
} from '../controllers/stasiunHistory.controller.js';

import { requirePermissions} from '../middlewares/auth.js';


const router = Router();

// GET /api/station-history - Get all station history
router.get('/', getAllStationHistory);

export default router;
