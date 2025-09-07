import { Router } from 'express';
import { getStationAvailabilityByCode } from '../controllers/stasiunAvailability.controller.js';

const router = Router();

// GET /api/availability/:stationCode - Get availability data for specific station by code in date range
router.get('/:stationCode', getStationAvailabilityByCode);

export default router;
