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
                s.provinsi_id,
                u.nama_upt AS upt_penanggung_jawab,
                s.upt_id,
                s.status,
                s.tahun_instalasi,
                j.nama_jaringan AS jaringan,
                s.jaringan_id,
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
            LEFT JOIN upt u ON s.upt_id = u.upt_id        
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
                s.provinsi_id,
                u.nama_upt AS upt_penanggung_jawab,
                s.upt_id,
                s.status,
                s.tahun_instalasi,
                j.nama_jaringan AS jaringan,
                s.jaringan_id,
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
            LEFT JOIN upt u ON s.upt_id = u.upt_id        
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

// Update stasiun by code
export const updateStasiunByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const updateData = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Station code is required'
            });
        }

        // Log raw data yang diterima dari frontend
        console.log('📨 Received update request for station:', code);
        console.log('📦 Raw request body:', JSON.stringify(updateData, null, 2));
        console.log('🔍 Request body type:', typeof updateData);
        console.log('📊 Request body keys:', updateData ? Object.keys(updateData) : 'null/undefined');

        console.log(`Updating stasiun data for code: ${code}`);
        console.log('Update data:', updateData);

        // Remove fields that should not be updated
        // Convert names to IDs where needed
        const processedData = { ...updateData };

        // Convert provinsi name to provinsi_id
        if (processedData.provinsi && typeof processedData.provinsi === 'string') {
            const [provinsiRows] = await pool.query('SELECT provinsi_id FROM provinsi WHERE nama_provinsi = ?', [processedData.provinsi]);
            if (provinsiRows.length > 0) {
                processedData.provinsi_id = provinsiRows[0].provinsi_id;
                delete processedData.provinsi;
            }
        }

        // Convert jaringan name to jaringan_id
        if (processedData.jaringan && typeof processedData.jaringan === 'string') {
            const [jaringanRows] = await pool.query('SELECT jaringan_id FROM jaringan WHERE nama_jaringan = ?', [processedData.jaringan]);
            if (jaringanRows.length > 0) {
                processedData.jaringan_id = jaringanRows[0].jaringan_id;
                delete processedData.jaringan;
            }
        }

        // Convert upt_penanggung_jawab name to upt
        if (processedData.upt_penanggung_jawab && typeof processedData.upt_penanggung_jawab === 'string') {
            const [uptRows] = await pool.query('SELECT upt_id FROM upt WHERE nama_upt = ?', [processedData.upt_penanggung_jawab]);
            if (uptRows.length > 0) {
                processedData.upt = uptRows[0].upt_id;
                delete processedData.upt_penanggung_jawab;
            }
        }

        console.log('🔄 Processed data (names converted to IDs):', JSON.stringify(processedData, null, 2));

        const forbiddenFields = ['stasiun_id', 'kode_stasiun', 'updated_at'];
        const filteredData = Object.keys(processedData).reduce((acc, key) => {
            if (!forbiddenFields.includes(key)) {
                acc[key] = processedData[key];
            }
            return acc;
        }, {});

        // Log data yang akan diupdate setelah filtering
        console.log('🔧 Filtered data to update:', JSON.stringify(filteredData, null, 2));
        console.log('🚫 Forbidden fields removed:', forbiddenFields);
        console.log('✅ Fields that will be updated:', Object.keys(filteredData));

        // Check if there are any fields to update
        if (Object.keys(filteredData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        // Build dynamic UPDATE query
        const setClause = Object.keys(filteredData)
            .map(key => `${key} = ?`)
            .join(', ');

        const values = Object.values(filteredData);
        values.push(code); // Add code for WHERE clause

        const updateQuery = `
            UPDATE stasiun
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP
            WHERE kode_stasiun = ?
        `;

        console.log('Update query:', updateQuery);
        console.log('Values:', values);

        const [result] = await pool.query(updateQuery, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Stasiun tidak ditemukan'
            });
        }

        // Fetch updated data
        const [updatedRows] = await pool.query(`
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
                s.kondisi_shelter,
                s.penggantian_terakhir_alat,
                s.updated_at
            FROM stasiun s
            LEFT JOIN jaringan j ON s.jaringan_id = j.jaringan_id
            LEFT JOIN upt u ON s.upt = u.upt_id
            LEFT JOIN provinsi p ON s.provinsi_id = p.provinsi_id
            WHERE s.kode_stasiun = ?
        `, [code]);

        res.json({
            success: true,
            data: updatedRows[0],
            message: 'Data stasiun berhasil diperbarui'
        });
    } catch (error) {
        console.error('Error updating stasiun:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui data stasiun',
            error: error.message
        });
    }
};
