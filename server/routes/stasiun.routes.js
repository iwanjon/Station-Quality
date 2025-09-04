import { Router } from "express";
import { getAllStasiun, getStasiunById } from '../controllers/stasiun.controller.js';

const router = Router();

// GET /api/stasiun - Get all stasiun
router.get('/', getAllStasiun);

// GET /api/stasiun/:id - Get stasiun by ID
router.get('/:id', getStasiunById);

export default router;