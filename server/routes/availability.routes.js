import { Router } from 'express';
import { getAllStationAvailability } from '../controllers/stasiunAvailability.controller.js';

const router = Router();

// GET /api/availability - Get availability data for all stations from database
router.get('/', getAllStationAvailability);

export default router;
