import pool from '../config/database.js';

// Get all stasiun data with JOIN
export const getAllStasiun = async (req, res) => {
    try {
        console.log('Fetching all stasiun data');
        const [rows] = await pool.query(`
            SELECT 
                s.stasiun_id,
                s.net,
                s.kode_stasiun,
                s.lintang,
                s.bujur,
                s.elevasi,
                s.lokasi,
                p.nama_provinsi AS provinsi,
                u.nama_upt AS upt_penanggung_jawab,     
                s.status,
                s.tahun_instalasi,
                j.nama_jaringan AS jaringan,
                s.prioritas,
                s.keterangan,
                s.accelerometer,
                s.digitizer_komunikasi,
                s.tipe_shelter,
                s.lokasi_shelter,
                s.penjaga_shelter,
                s.penggantian_terakhir_alat,
                s.updated_at
            FROM stasiun s
            LEFT JOIN jaringan j ON s.jaringan_id = j.jaringan_id
            LEFT JOIN upt u ON s.upt = u.upt_id        
            LEFT JOIN provinsi p ON s.provinsi_id = p.provinsi_id
        `);
        
        res.json(rows);
    } catch (error) {
        console.error("DB Error:", error);
        res.status(500).json({ 
            error: 'Gagal ambil data stasiun' 
        });
    }
};

// Get all stasiun codes only
export const getAllStasiunCodes = async (req, res) => {
    try {
        console.log('Fetching all stasiun codes');
        const [rows] = await pool.query(`
            SELECT 
                kode_stasiun
            FROM stasiun
            ORDER BY kode_stasiun
        `);
        
        res.json({
            success: true,
            data: rows,
            message: 'Data kode stasiun berhasil diambil'
        });
    } catch (error) {
        console.error("DB Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Gagal ambil data kode stasiun',
            error: error.message
        });
    }
};

// Get stasiun by code (query parameter)
export const getStasiunByCode = async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Station code is required'
            });
        }

        console.log(`Fetching stasiun data for code: ${code}`);
        
        const [rows] = await pool.query(`
            SELECT 
                s.stasiun_id,
                s.net,
                s.kode_stasiun,
                s.lintang,
                s.bujur,
                s.elevasi,
                s.lokasi,
                p.nama_provinsi AS provinsi,
                u.nama_upt AS upt_penanggung_jawab,     
                s.status,
                s.tahun_instalasi,
                j.nama_jaringan AS jaringan,
                s.prioritas,
                s.keterangan,
                s.accelerometer,
                s.digitizer_komunikasi,
                s.tipe_shelter,
                s.lokasi_shelter,
                s.penjaga_shelter,
                s.penggantian_terakhir_alat,
                s.updated_at
            FROM stasiun s
            LEFT JOIN jaringan j ON s.jaringan_id = j.jaringan_id
            LEFT JOIN upt u ON s.upt = u.upt_id        
            LEFT JOIN provinsi p ON s.provinsi_id = p.provinsi_id
            WHERE s.kode_stasiun = ?
        `, [code]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Stasiun tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: rows[0],
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
};
