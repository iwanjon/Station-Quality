// utils/cacheHelper.js
const redisClient = require("../config/redisClient");

async function cached(key, ttlSeconds, fetcher) {
  const cachedData = await redisClient.get(key);
  if (cachedData) {
    console.log(`Cache hit for ${key}`);
    return JSON.parse(cachedData);
  }

  console.log(`Cache miss for ${key}, fetching...`);
  const data = await fetcher();
  await redisClient.set(key, JSON.stringify(data), { EX: ttlSeconds });
  return data;
}

module.exports = { cached };


