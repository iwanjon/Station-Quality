const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

(async () => {
  await redisClient.connect();
  console.log("✅ Connected to Redis");
})();

module.exports = redisClient;

// const { createClient } = require('redis');

// const client = createClient({
//   url: process.env.REDIS_URL || 'redis://localhost:6379'
// });

// client.on('error', (err) => console.error('Redis Error:', err));
// client.connect();

// module.exports = client;
