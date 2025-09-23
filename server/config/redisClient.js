import { createClient } from "redis";

let redisClient = null;
let isConnected = false;
let reconnectInterval = null;

// Create Redis client
const createRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
      connectTimeout: 5000, // 5 seconds timeout
      lazyConnect: true, // Don't auto-connect
    },
  });

  redisClient.on("connect", () => {
    console.log("✅ Connected to Redis");
    isConnected = true;
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  });

  redisClient.on("error", (err) => {
    console.warn("⚠️ Redis Client Error:", err.message);
    isConnected = false;
    // Start periodic reconnection if not already running
    if (!reconnectInterval) {
      startReconnection();
    }
  });

  redisClient.on("end", () => {
    console.log("ℹ️ Redis connection ended");
    isConnected = false;
    if (!reconnectInterval) {
      startReconnection();
    }
  });

  return redisClient;
};

// Start periodic reconnection attempts
const startReconnection = () => {
  console.log("🔄 Starting Redis reconnection attempts...");
  reconnectInterval = setInterval(async () => {
    if (!isConnected) {
      try {
        await redisClient.connect();
      } catch (err) {
        // Silent retry, will log on success via event handler
      }
    } else {
      // Stop reconnection if already connected
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
  }, 30000); // Try to reconnect every 30 seconds
};

// Initialize Redis client and start connection
const initializeRedis = async () => {
  createRedisClient();

  // Initial connection attempt
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn("⚠️ Initial Redis connection failed, will retry in background:", err.message);
    startReconnection();
  }
};

// Start Redis initialization (non-blocking)
initializeRedis();

// Export function that returns client if connected, null if not
const getRedisClient = () => {
  return isConnected ? redisClient : null;
};

export default getRedisClient;