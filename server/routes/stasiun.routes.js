import { Router } from "express";
import pool from '../config/database.js' 

const router = Router();

// GET /api/stasiun - Get all stasiun
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all stasiun data');
        const [rows] = await pool.query('SELECT * FROM stasiun');
        const stasiun = rows;

        res.json({
            success: true,
            data: stasiun,
            message: 'Data stasiun berhasil diambil'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data stasiun',
            error: error.message
        });
    }
});

// GET /api/stasiun/:id - Get stasiun by ID
router.get('/:id', async (req, res) => {
    try {
        console.log(`Fetching stasiun data for ID: ${req.params.id}`);
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM stasiun WHERE stasiun_id = ?', [id]);

        const stasiun = rows[0];

        if (!stasiun) {
            return res.status(404).json({
                success: false,
                message: 'Stasiun tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: stasiun,
            message: 'Data stasiun berhasil diambil'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data stasiun',
            error: error.message
        });
    }
});

export default router;