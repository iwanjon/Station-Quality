import { Router } from "express";
import { getAllStasiun, getAllStasiunCodes, getStasiunByCode } from '../controllers/stasiun.controller.js';

const router = Router();

// GET /api/stasiun - Get all stasiun
router.get('/', getAllStasiun);

// GET /api/stasiun/codes - Get all stasiun codes only
router.get('/codes', getAllStasiunCodes);

// GET /api/stasiunbycode?code=XXX - Get stasiun by code
router.get('/bycode', getStasiunByCode);

export default router;