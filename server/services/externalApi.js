// services/externalApi.js
import axios from 'axios';
import redisClient from '../config/redisClient.js';

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;

console.log("🌍 API_BASE_URL:", process.env.API_BASE_URL);
console.log("🔑 API_KEY:", process.env.API_KEY);

export async function fetchQCDetail(stationId, date) {
  try {
    const url = `${API_BASE_URL}/qc/data/detail/${stationId}/${date}`;
    console.log("🔎 Fetching QC Detail from:", url);

    const response = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json"
      },
    });

    return response.data;
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, err.response.data);
    } else if (err.request) {
      console.error("❌ No response from API:", err.request);
    } else {
      console.error("❌ Request setup error:", err.message);
    }
    throw err;
  }
}

export const fetchLatencyDetail = async (sta_code, channel) => {
  try {
    const url = `${API_BASE_URL}/metadata/latency/${sta_code}/${channel}`;
    console.log("🔎 Fetching Latency Detail from:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Request setup error:", err.message);
    }
    throw err;
  }
};

export async function getData() {
  const cacheKey = 'external:data';

  // Cek cache Redis
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    console.log('📦 Data dari cache');
    return JSON.parse(cachedData);
  }

  // Request ke external API
  console.log('🌐 Request ke external API');
  const response = await axios.get('https://jsonplaceholder.typicode.com/users');

  // Simpan ke Redis (TTL 60 detik)
  await redisClient.setEx(cacheKey, 60, JSON.stringify(response.data));
  return response.data;
}

export async function fetchQCSummary(date) {
  try {
    const url = `${API_BASE_URL}/qc/data/summary/${date}`;
    console.log("🔎 Fetching QC Summary from:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
    });

    return response.data;
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, err.response.data);
    } else if (err.request) {
      console.error("❌ No response from API:", err.request);
    } else {
      console.error("❌ Request setup error:", err.message);
    }
    throw err;
  }
}

export async function fetchSLMONLastStatus() {
  const cacheKey = 'slmon:laststatus';
  // Cek cache Redis
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    console.log('📦 SLMON LastStatus dari cache');
    return JSON.parse(cachedData);
  }

  // Request ke API eksternal
  const url = 'http://202.90.198.40/sismon-slmon2/data/slmon.all.laststatus.json';
  console.log('🌐 Request ke SLMON LastStatus:', url);

  try {
    const response = await axios.get(url, {
      headers: { Accept: "application/json" },
      timeout: 10000,
    });
    // Simpan ke Redis (TTL 60 detik)
    await redisClient.setEx(cacheKey, 60, JSON.stringify(response.data));
    return response.data;
  } catch (err) {
    if (err.response) {
      console.error("❌ SLMON API Error:", err.response.status, err.response.data);
    } else if (err.request) {
      console.error("❌ No response from SLMON API:", err.request);
    } else {
      console.error("❌ SLMON Request setup error:", err.message);
    }
    throw err;
  }
}

// --- [FUNGSI BARU UNTUK GAMBAR] ---

/**
 * Mengambil gambar Power Spectral Density (PSD) dari API eksternal.
 * @param {string} date_str - Tanggal format YYYY-MM-DD
 * @param {string} code - Kode stasiun
 * @param {string} channel - Channel (E, N, atau Z)
 * @returns {Promise<import('axios').AxiosResponse>} - Axios response sebagai stream
 */
export async function fetchPsdImage(date_str, code, channel) {
  try {
    const url = `${API_BASE_URL}/qc/data/psd/${date_str}/${code}/${channel}`;
    console.log("🖼️  Fetching PSD Image from:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      responseType: 'stream',
    });

    return response;
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error fetching PSD image:", err.response.status, err.response.data);
    } else if (err.request) {
      console.error("❌ No response for PSD image from API:", err.request);
    } else {
      console.error("❌ PSD image request setup error:", err.message);
    }
    throw err;
  }
}

/**
 * Mengambil gambar Signal dari API eksternal.
 * @param {string} date_str - Tanggal format YYYY-MM-DD
 * @param {string} code - Kode stasiun
 * @param {string} channel - Channel (E, N, atau Z)
 * @returns {Promise<import('axios').AxiosResponse>} - Axios response sebagai stream
 */
export async function fetchSignalImage(date_str, code, channel) {
  try {
    const url = `${API_BASE_URL}/qc/data/signal/${date_str}/${code}/${channel}`;
    console.log("📶 Fetching Signal Image from:", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      responseType: 'stream',
    });

    return response;
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error fetching Signal image:", err.response.status, err.response.data);
    } else if (err.request) {
      console.error("❌ No response for Signal image from API:", err.request);
    } else {
      console.error("❌ Signal image request setup error:", err.message);
    }
    throw err;
  }
}