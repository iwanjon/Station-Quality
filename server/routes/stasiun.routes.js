import { Router } from "express";
import multer from 'multer';
import { getAllStasiun, getAllStasiunCodes, getStasiunByCode, updateStasiunByCode, importStationsFromCSV, getForeignKeyOptions } from '../controllers/stasiun.controller.js';

const router = Router();

// Configure multer for CSV upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// GET /api/stasiun - Get all stasiun
router.get('/', getAllStasiun);

// GET /api/stasiun/codes - Get all stasiun codes only
router.get('/codes', getAllStasiunCodes);

// GET /api/stasiun/foreign-key-options - Get valid foreign key options
router.get('/foreign-key-options', getForeignKeyOptions);

// GET /api/stasiunbycode?code=XXX - Get stasiun by code
router.get('/bycode', getStasiunByCode);

// PUT /api/stasiun/:code - Update stasiun by code
router.put('/:code', updateStasiunByCode);

// POST /api/stasiun/import-csv - Import stations from CSV
router.post('/import-csv', upload.single('csvFile'), importStationsFromCSV);

export default router;