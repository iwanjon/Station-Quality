import axios from 'axios';
import pool from '../config/database.js';
import redisClient from '../config/redisClient.js';

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;  

// Fetch availability data dari API, filter berdasarkan kode stasiun yang ada di database
export const getAllStationAvailability = async (req, res) => {
  try {
    console.log('🚀 Starting station availability integration...');

    // Get date parameters dari request query atau set default 7 hari terakhir
    let start_date, end_date;
    
    if (req.query.start_date && req.query.end_date) {
      start_date = req.query.start_date;
      end_date = req.query.end_date;
      
      // Validasi format tanggal (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD format for start_date and end_date'
        });
      }
      
      // Validasi apakah start_date <= end_date
      if (new Date(start_date) > new Date(end_date)) {
        return res.status(400).json({
          success: false,
          message: 'start_date must be less than or equal to end_date'
        });
      }
    } else {
      // Set default tanggal: 7 hari terakhir
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      start_date = startDate.toISOString().split('T')[0];
      end_date = endDate.toISOString().split('T')[0];
    }

    // Generate cache key berdasarkan date range
    const cacheKey = `availability:${start_date}:${end_date}`;

    // Check Redis cache terlebih dahulu
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('✅ Data retrieved from cache');
        const parsedData = JSON.parse(cachedData);
        return res.json({
          success: true,
          message: 'Data retrieved from cache',
          cached: true,
          cache_key: cacheKey,
          ...parsedData
        });
      }
    } catch (cacheError) {
      console.warn('⚠️ Redis cache error:', cacheError.message);
    }

    // 1. Fetch data availability dari API
    console.log('🌐 Fetching data from API...');
    const apiUrl = `${API_BASE_URL}/qc/data/availability/`;
    
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json"
      },
      params: {
        start_date,
        end_date
      },
      timeout: 30000
    });

    const apiResponse = response.data;
    const availabilityData = apiResponse.data;
    const apiMeta = apiResponse.meta;
    
    const apiStationCodes = Object.keys(availabilityData);
    console.log(`✅ API returned ${apiStationCodes.length} stations`);

    // 2. Fetch kode stasiun dari database MySQL
    const [stationRows] = await pool.query('SELECT DISTINCT kode_stasiun FROM stasiun');
    
    if (stationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada stasiun ditemukan di database'
      });
    }

    const dbStationCodes = stationRows.map(row => row.kode_stasiun);
    console.log(`✅ Database has ${dbStationCodes.length} stations`);

    // 3. Process dan filter data dengan optimasi
    const filteredData = {};
    let matchedCount = 0;
    let removedCount = 0;
    let missingInApiCount = 0;
    let totalRecords = 0;

    // Konversi dbStationCodes ke Set untuk O(1) lookup performance
    const dbStationSet = new Set(dbStationCodes);
    const apiStationSet = new Set(apiStationCodes);

    // Helper function untuk menghitung rata-rata availability dari 3 channel
    const calculateAverageAvailability = (recordData) => {
      const { SHN, SHE, SHZ, timestamp } = recordData;
      
      const shn = parseFloat(SHN) || 0;
      const she = parseFloat(SHE) || 0;
      const shz = parseFloat(SHZ) || 0;
      
      const average = (shn + she + shz) / 3;
      
      return {
        timestamp: timestamp,
        availability: Math.round(average * 100) / 100
      };
    };

    // Process API data yang ada di database
    apiStationCodes.forEach(apiStationCode => {
      if (dbStationSet.has(apiStationCode)) {
        const stationData = availabilityData[apiStationCode];
        const processedData = stationData.map(calculateAverageAvailability);
        
        filteredData[apiStationCode] = processedData;
        totalRecords += processedData.length;
        matchedCount++;
      } else {
        removedCount++;
      }
    });

    // Tambahkan stasiun database yang tidak ada di API
    dbStationCodes.forEach(dbStationCode => {
      if (!apiStationSet.has(dbStationCode)) {
        filteredData[dbStationCode] = [{
          timestamp: start_date,
          availability: null,
          note: "Data not available in API for this date range"
        }];
        missingInApiCount++;
        totalRecords += 1;
      }
    });

    console.log(`✅ Processed ${matchedCount + missingInApiCount} stations (${matchedCount} with data, ${missingInApiCount} missing, ${removedCount} removed)`);

    // 4. Prepare response
    const filteredResponse = {
      meta: {
        stationCount: matchedCount + missingInApiCount,
        totalRecords: totalRecords,
        originalStationCount: apiMeta.stationCount,
        originalTotalRecords: apiMeta.totalRecords,
        matchedStations: matchedCount,
        missingInApiStations: missingInApiCount,
        removedStations: removedCount,
        dateRange: {
          start_date,
          end_date
        }
      },
      data: filteredData
    };

    // 5. Cache data ke Redis dengan expiry 30 menit
    try {
      const cacheData = JSON.stringify(filteredResponse);
      await redisClient.setEx(cacheKey, 1800, cacheData);
      console.log(`💾 Data cached for 30 minutes`);
    } catch (cacheError) {
      console.warn('⚠️ Caching failed:', cacheError.message);
    }

    console.log(`✅ Integration completed successfully`);

    res.json({
      success: true,
      message: `Successfully integrated availability data. Total: ${matchedCount + missingInApiCount} stations (${matchedCount} with data, ${missingInApiCount} with null availability).`,
      cached: false,
      cache_key: cacheKey,
      ...filteredResponse
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan dalam integrasi data',
      error: error.message
    });
  }
};
