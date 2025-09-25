import axios from 'axios';
import pool from '../config/database.js';
import getRedisClient from '../config/redisClient.js';

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

    // Check Redis cache terlebih dahulu (jika Redis tersedia)
    const redisClient = getRedisClient();
    if (redisClient) {
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
        // Continue without cache - aplikasi tetap berjalan
      }
    } else {
      console.log('ℹ️ Redis not available, skipping cache check');
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

    // Helper function untuk menghitung rata-rata availability dari channel yang berakhiran N, E, Z
    const calculateAverageAvailability = (recordData) => {
      // Cari semua channel yang berakhiran N, E, atau Z (SHN, SHE, SHZ, HHN, HHE, HHZ, dll)
      const channelKeys = Object.keys(recordData).filter(key =>
        key.endsWith('N') || key.endsWith('E') || key.endsWith('Z')
      );

      if (channelKeys.length === 0) {
        return {
          timestamp: recordData.timestamp,
          availability: null,
          note: "No valid channels found (N, E, Z)"
        };
      }

      // Ambil nilai dari channel yang ditemukan
      const channelValues = channelKeys.map(key => parseFloat(recordData[key]) || 0);

      // Hitung rata-rata
      const average = channelValues.reduce((sum, val) => sum + val, 0) / channelValues.length;

      return {
        timestamp: recordData.timestamp,
        availability: Math.round(average * 100) / 100,
        channels: channelKeys // Optional: untuk debugging
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

    // 5. Cache data ke Redis dengan expiry 30 menit (jika Redis tersedia)
    const redisClientForCache = getRedisClient();
    if (redisClientForCache) {
      try {
        const cacheData = JSON.stringify(filteredResponse);
        await redisClientForCache.setEx(cacheKey, 1800, cacheData);
        console.log(`💾 Data cached for 30 minutes`);
      } catch (cacheError) {
        console.warn('⚠️ Caching failed:', cacheError.message);
        // Continue without caching - aplikasi tetap berjalan
      }
    } else {
      console.log('ℹ️ Redis not available, skipping cache storage');
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

// Fetch availability data untuk satu stasiun berdasarkan kode stasiun
export const getStationAvailabilityByCode = async (req, res) => {
  try {
    console.log('🚀 Starting single station availability integration...');

    // Get station code dari URL parameter
    const { stationCode } = req.params;
    if (!stationCode) {
      return res.status(400).json({
        success: false,
        message: 'Station code is required'
      });
    }

    // Get date parameters dari request query atau set default dari awal bulan hingga hari ini
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
      // Set default tanggal: dari awal bulan hingga hari ini
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Awal bulan
      
      start_date = startDate.toISOString().split('T')[0];
      end_date = today.toISOString().split('T')[0]; // Hari ini
    }

    // Generate cache key berdasarkan station code dan date range
    const cacheKey = `availability:${stationCode}:${start_date}:${end_date}`;

    // Check Redis cache terlebih dahulu (jika Redis tersedia)
    const redisClient = getRedisClient();
    if (redisClient) {
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
        // Continue without cache - aplikasi tetap berjalan
      }
    } else {
      console.log('ℹ️ Redis not available, skipping cache check');
    }

    // 1. Check apakah stasiun ada di database
    const [stationRows] = await pool.query('SELECT kode_stasiun FROM stasiun WHERE kode_stasiun = ?', [stationCode]);

    if (stationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Station ${stationCode} not found in database`
      });
    }

    console.log(`✅ Station ${stationCode} found in database`);

    // 2. Fetch data availability dari API untuk stasiun spesifik
    console.log(`🌐 Fetching data from API for station ${stationCode}...`);
    const apiUrl = `${API_BASE_URL}/qc/data/availability/${stationCode}`;

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

    console.log(`✅ API returned data for station ${stationCode}`);

    // 3. Process data untuk stasiun ini
    let processedData = [];
    let totalRecords = 0;

    // Helper function untuk menghitung rata-rata availability dari channel yang berakhiran N, E, Z
    const calculateAverageAvailability = (recordData) => {
      // Cari semua channel yang berakhiran N, E, atau Z (SHN, SHE, SHZ, HHN, HHE, HHZ, dll)
      const channelKeys = Object.keys(recordData).filter(key =>
        key.endsWith('N') || key.endsWith('E') || key.endsWith('Z')
      );

      if (channelKeys.length === 0) {
        return {
          timestamp: recordData.timestamp,
          availability: null,
          note: "No valid channels found (N, E, Z)"
        };
      }

      // Ambil nilai dari channel yang ditemukan
      const channelValues = channelKeys.map(key => parseFloat(recordData[key]) || 0);

      // Hitung rata-rata
      const average = channelValues.reduce((sum, val) => sum + val, 0) / channelValues.length;

      return {
        timestamp: recordData.timestamp,
        availability: Math.round(average * 100) / 100,
        channels: channelKeys // Optional: untuk debugging
      };
    };

    // Process data jika ada
    if (availabilityData && availabilityData.length > 0) {
      processedData = availabilityData.map(calculateAverageAvailability);
      totalRecords = processedData.length;
      console.log(`✅ Processed ${totalRecords} records for station ${stationCode}`);
    } else {
      // Jika tidak ada data dari API, buat entry null
      processedData = [{
        timestamp: start_date,
        availability: null,
        note: "Data not available in API for this date range"
      }];
      totalRecords = 1;
      console.log(`⚠️ No data available for station ${stationCode}, created null entry`);
    }

    // 4. Prepare response
    const stationResponse = {
      meta: {
        stationCode: stationCode,
        totalRecords: totalRecords,
        dateRange: {
          start_date,
          end_date
        }
      },
      data: {
        [stationCode]: processedData
      }
    };

    // 5. Cache data ke Redis dengan expiry 30 menit (jika Redis tersedia)
    const redisClientForCache = getRedisClient();
    if (redisClientForCache) {
      try {
        const cacheData = JSON.stringify(stationResponse);
        await redisClientForCache.setEx(cacheKey, 1800, cacheData);
        console.log(`💾 Data cached for 30 minutes`);
      } catch (cacheError) {
        console.warn('⚠️ Caching failed:', cacheError.message);
        // Continue without caching - aplikasi tetap berjalan
      }
    } else {
      console.log('ℹ️ Redis not available, skipping cache storage');
    }

    console.log(`✅ Single station integration completed successfully`);

    res.json({
      success: true,
      message: `Successfully retrieved availability data for station ${stationCode}`,
      cached: false,
      cache_key: cacheKey,
      ...stationResponse
    });

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Handle specific API errors
    if (error.response) {
      if (error.response.status === 404) {
        return res.status(404).json({
          success: false,
          message: `Station data not found in external API`,
          error: error.message
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan dalam mengambil data stasiun',
      error: error.message
    });
  }
};
