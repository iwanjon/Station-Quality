import pool from '../config/database.js';
import axios from 'axios';
import { ensureTrailingSlash } from '../utils/pathHelper.js';

import { ensureCleanStartingSlash } from '../utils/pathHelper.js';
import logger from '../utils/logger.js';
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
    logger.info('Fetching all station history data');
    logger.error('Fetching all station history data');


    try {
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
        logger.error("DB Error:", error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve station history data',
            error: error.message
        });
    }
};

// Get station history by station ID
export const getStationHistoryById = async (req, res) => {
    logger.info("abc")
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


// UPdate station history by station ID
export const updateStationHistoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Station ID is required'
            });
        }

        console.log(`update station history data for station ID: ${id}`);

        const [rows] = await pool.query(`
            SELECT
                h.stasiun_id,
                h.kode_stasiun
            FROM stasiun h
            WHERE h.stasiun_id = ?
            ORDER BY h.stasiun_id DESC
        `, [id]);

        console.log(rows);
        if (rows.length == 0){
            throw new Error("data doesnt exist");
        }

        // let externalServiceUrl = process.env.HISTORY_APP 
        let externalServiceUrl = ensureTrailingSlash(process.env.HISTORY_APP) + ensureTrailingSlash(process.env.HISTORY_APP_STATION_HISTORY_PATH) 
        let response = await axios.put(externalServiceUrl+rows[0]["kode_stasiun"]);
        if (response.status != 204){
            throw new Error("invalid response")
        }
        res.json({
            success: true,
            data: rows,
            message: 'Station history data has been updated'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update station history data',
            error: error.message
        });
    }
};


// get response image by history ID
export const getResponseImageHistoryById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Station ID is required'
            });
        }

        console.log(`get response link for history ID: ${id}`);

        const [rows] = await pool.query(`
            SELECT
                h.history_id,
                h.response_path
            FROM stasiun_history h
            WHERE h.history_id = ?
            ORDER BY h.history_id DESC
        `, [id]);

        console.log(rows);
        if (rows.length == 0){
            throw new Error("data doesnt exist");
        }
        if (rows[0]["response_path"]==null || rows[0]["response_path"].trim()==""){
            return res.json({
                success: false,
                data: null,
                message: 'response not found'
            });
        }
        // let externalServiceUrl = process.env.HISTORY_APP 
        let externalServiceUrl = ensureTrailingSlash(process.env.HISTORY_APP_FORWARD) + ensureCleanStartingSlash(rows[0]["response_path"])
        console.log(externalServiceUrl);
        return res.json({
            success: true,
            data: externalServiceUrl,
            message: 'response found'
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            success: false,
            message: 'response not found',
            error: error.message
        });
    }
};