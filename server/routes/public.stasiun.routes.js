import { Router } from "express";
import { 
    getAllStasiun, 
} from '../controllers/stasiun.controller.js';

const router = Router();

// GET /api/stasiun - Get all stasiun
router.get('/', getAllStasiun);

export default router;