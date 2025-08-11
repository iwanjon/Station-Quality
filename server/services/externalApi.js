const axios = require('axios');
const redisClient = require('../config/redisClient');

async function getData() {
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

module.exports = { getData };
