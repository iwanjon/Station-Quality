import pool from '../config/database.js';

// Get station history by station code
export const getStationHistoryByCode = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Station code is required'
            });
        }

        console.log(`Fetching station history data for code: ${code}`);

        const [rows] = await pool.query(`
            SELECT
                h.history_id,
                h.stasiun_id,
                s.kode_stasiun,
                s.net,
                h.channel,
                h.sensor_name,
                h.digitizer_name,
                h.total_gain,
                h.input_unit,
                h.sampling_rate,
                h.start_date,
                h.end_date,
                h.paz,
                h.status,
                h.created_at,
                h.response_path
            FROM stasiun_history h
            INNER JOIN stasiun s ON h.stasiun_id = s.stasiun_id
            WHERE s.kode_stasiun = ?
            ORDER BY h.created_at DESC
        `, [code]);

        res.json({
            success: true,
            data: rows,
            message: 'Station history data retrieved successfully'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve station history data',
            error: error.message
        });
    }
};

// Get all station history data
export const getAllStationHistory = async (req, res) => {
    try {
        console.log('Fetching all station history data');
        const [rows] = await pool.query(`
            SELECT
                h.history_id,
                h.stasiun_id,
                s.kode_stasiun,
                s.net,
                h.SHE,
                h.SHN,
                h.SHZ,
                h.data_logger,
                h.total_gain,
                h.input_unit,
                h.sampling_rate,
                h.sensor_type,
                h.start_date,
                h.end_date,
                h.PAZ,
                h.status,
                h.created_at
            FROM stasiun_history h
            INNER JOIN stasiun s ON h.stasiun_id = s.stasiun_id
            ORDER BY h.created_at DESC
        `);

        res.json({
            success: true,
            data: rows,
            message: 'All station history data retrieved successfully'
        });
    } catch (error) {
        console.error("DB Error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve station history data',
            error: error.message
        });
    }
};

// Get station history by station ID
export const getStationHistoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Station ID is required'
            });
        }

        console.log(`Fetching station history data for station ID: ${id}`);

        const [rows] = await pool.query(`
            SELECT
                h.history_id,
                h.stasiun_id,
                s.kode_stasiun,
                s.net,
                h.SHE,
                h.SHN,
                h.SHZ,
                h.data_logger,
                h.total_gain,
                h.input_unit,
                h.sampling_rate,
                h.sensor_type,
                h.start_date,
                h.end_date,
                h.PAZ,
                h.status,
                h.created_at,
                h.response_path
            FROM stasiun_history h
            INNER JOIN stasiun s ON h.stasiun_id = s.stasiun_id
            WHERE h.stasiun_id = ?
            ORDER BY h.created_at DESC
        `, [id]);

        res.json({
            success: true,
            data: rows,
            message: 'Station history data retrieved successfully'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve station history data',
            error: error.message
        });
    }
};