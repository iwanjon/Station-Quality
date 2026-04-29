import { Router } from 'express';
import { getAllStationAvailability, getStationAvailabilityByCode } from '../controllers/stasiunAvailability.controller.js';

const router = Router();

// GET /api/availability - Get availability data for all stations from database
router.get('/', getAllStationAvailability);

// GET /api/availability/:stationCode - Get availability data for specific station
router.get('/:stationCode', getStationAvailabilityByCode);

export default router;
