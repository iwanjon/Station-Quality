import { Router } from 'express';
import { getAllStationAvailability, getStationAvailabilityByCode } from '../controllers/stasiunAvailability.controller.js';
import { register, login } from '../controllers/auth.controller.js';

const router = Router();

// GET /api/availability - Get availability data for all stations from database
router.post('/register', register);

// GET /api/availability/:stationCode - Get availability data for specific station
router.post('/login', login);

export default router;
