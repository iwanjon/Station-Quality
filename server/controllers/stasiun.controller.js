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

// Get stasiun by ID
export const getStasiunById = async (req, res) => {
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
};
