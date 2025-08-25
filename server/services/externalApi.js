// services/externalApi.js
import axios from 'axios';
import redisClient from '../config/redisClient.js';
// import { get } from "axios";

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

// export default { fetchQCDetail };


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

// module.exports = { getData };
