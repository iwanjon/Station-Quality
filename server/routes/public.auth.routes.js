import { Router } from 'express';
import { getAllStationAvailability, getStationAvailabilityByCode } from '../controllers/stasiunAvailability.controller.js';
import { register, login, registerBulk, logout } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);

router.post('/registerBulk', registerBulk);

export default router;
