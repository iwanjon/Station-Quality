import axios from 'axios';
import redisClient from '../config/redisClient.js';

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;

// Fetch availability data untuk stasiun tertentu berdasarkan kode stasiun dalam rentang tanggal
export const getStationAvailabilityByCode = async (req, res) => {
  try {
    const { stationCode } = req.params;
    const { start_date, end_date } = req.query;
    
    // Validasi parameter
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Parameter start_date dan end_date harus diisi (format: YYYY-MM-DD)'
      });
    }

    const cacheKey = `availability:${stationCode}:${start_date}:${end_date}`;
    
    // Cek cache Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log('📦 Station availability data dari cache');
      return res.json({
        success: true,
        data: JSON.parse(cachedData),
        message: 'Data availability stasiun berhasil diambil dari cache'
      });
    }

    // Fetch dari external API menggunakan format URL yang benar
    const url = `${API_BASE_URL}/qc/data/availability/${stationCode}`;
    console.log('🌐 Fetching station availability from:', url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json"
      },
      params: {
        start_date,
        end_date
      }
    });

    const stationData = response.data;

    // Simpan ke Redis cache (TTL 15 menit)
    await redisClient.setEx(cacheKey, 900, JSON.stringify(stationData));

    res.json({
      success: true,
      data: stationData,
      message: 'Data availability stasiun berhasil diambil'
    });

  } catch (error) {
    console.error('❌ Error fetching station availability:', error);
    
    if (error.response) {
      console.error("❌ API Error:", error.response.status, error.response.data);
      
      if (error.response.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Stasiun tidak ditemukan'
        });
      }
      
      return res.status(error.response.status).json({
        success: false,
        message: 'Gagal mengambil data dari external API',
        error: error.response.data
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data availability stasiun',
      error: error.message
    });
  }
};
