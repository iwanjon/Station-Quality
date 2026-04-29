// services/externalApi.js
import axios from 'axios';
import getRedisClient from '../config/redisClient.js';
import dummy_qc_summary from './dummy_response_data.js'

const API_BASE_URL = process.env.API_BASE_URL;
const API_KEY = process.env.API_KEY;

const DEFAULT_CACHE_TTL = 3600; 

// console.log("🌍 API_BASE_URL:", process.env.API_BASE_URL);
// console.log("🔑 API_KEY:", process.env.API_KEY);

export async function fetchQCSiteDetail(code) {
  const cacheKey = `qc:sitedetail:${code}`;
  const redisClient = getRedisClient();

  if (redisClient) {
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`📦 QC Site Detail dari cache untuk: ${code}`);
        return JSON.parse(cachedData);
      }
    } catch (err) {
      console.warn(`⚠️ Gagal mengambil dari cache Redis (QCSiteDetail): ${err.message}`);
    }
  }

  try {
    const url = `${API_BASE_URL}/qc/site/detail/${code}`;
    console.log("🔎 Fetching QC Site Detail from:", url);
    const response = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json"
      },
    });

    if (redisClient) {
      try {
        // Cache data untuk 1 hari karena data site jarang berubah
        await redisClient.setEx(cacheKey, 86400, JSON.stringify(response.data));
      } catch (err) {
        console.warn(`⚠️ Gagal menyimpan ke cache Redis (QCSiteDetail): ${err.message}`);
      }
    }
    return response.data;
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Request setup error:", err.message);
    }
    throw err;
  }
}

export async function fetchQCDetail(stationId, date) {
  const cacheKey = `qc:detail:${stationId}:${date}`;
  const redisClient = getRedisClient();

  if (redisClient) {
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`📦 QC Detail dari cache untuk: ${stationId} on ${date}`);
        return JSON.parse(cachedData);
      }
    } catch (err) {
      console.warn(`⚠️ Gagal mengambil dari cache Redis (QCDetail): ${err.message}`);
    }
  }

  try {
    const url = `${API_BASE_URL}/qc/data/detail/${stationId}/${date}`;
    console.log("🔎 Fetching QC Detail from:", url);
    const response = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json"
      },
    });

    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, DEFAULT_CACHE_TTL, JSON.stringify(response.data));
      } catch (err) {
        console.warn(`⚠️ Gagal menyimpan ke cache Redis (QCDetail): ${err.message}`);
      }
    }
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
  const cacheKey = `latency:detail:${sta_code}:${channel}`;
  const redisClient = getRedisClient();

  if (redisClient) {
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`📦 Latency Detail dari cache untuk: ${sta_code}`);
        return JSON.parse(cachedData);
      }
    } catch (err) {
      console.warn(`⚠️ Gagal mengambil dari cache Redis (LatencyDetail): ${err.message}`);
    }
  }

  try {
    const url = `${API_BASE_URL}/metadata/latency/${sta_code}/${channel}`;
    console.log("🔎 Fetching Latency Detail from:", url);
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
    });

    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, DEFAULT_CACHE_TTL, JSON.stringify(response.data));
      } catch (err) {
        console.warn(`⚠️ Gagal menyimpan ke cache Redis (LatencyDetail): ${err.message}`);
      }
    }
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


// export async function fetchQCSummary(date) {
//   const cacheKey = `qc:summary:${date}`;
//   const redisClient = getRedisClient();

//   if (redisClient) {
//     try {
//       const cachedData = await redisClient.get(cacheKey);
//       if (cachedData) {
//         console.log(`📦 QC Summary dari cache untuk: ${date}`);
//         return JSON.parse(cachedData);
//       }
//     } catch (err) {
//       console.warn(`⚠️ Gagal mengambil dari cache Redis (QCSummary): ${err.message}`);
//     }
//   }

//   try {
//     const url = `${API_BASE_URL}/qc/data/summary/${date}`;
//     console.log("🔎 Fetching QC Summary from:", url);
//     const response = await axios.get(url, {
//       headers: {
//         Authorization: `Bearer ${API_KEY}`,
//         Accept: "application/json",
//       },
//     });
    
//     // response.data = dummy_qc_summary

//     if (redisClient) {
//       try {
//         await redisClient.setEx(cacheKey, DEFAULT_CACHE_TTL, JSON.stringify(response.data));
//       } catch (err) {
//         console.warn(`⚠️ Gagal menyimpan ke cache Redis (QCSummary): ${err.message}`);
//       }
//     }
//     return response.data;
//   } catch (err) {
//     if (err.response) {
//       console.error("❌ API Error:", err.response.status, err.response.data);
//     } else if (err.request) {
//       console.error("❌ No response from API:", err.request);
//     } else {
//       console.error("❌ Request setup error:", err.message);
//     }
//     throw err;
//   }
// }

// export async function fetchQCSummary(date, customTtl) {
//   const cacheKey = `qc:summary:${date}`;
//   const redisClient = getRedisClient();

//   if (redisClient) {
//     try {
//       const cachedData = await redisClient.get(cacheKey);
      
//       if (cachedData) {
//         // SCENARIO 1: No custom TTL requested in the route.
//         // Just use the cache like normal!
//         if (!customTtl) {
//           console.log(`📦 Menggunakan cache yang ada untuk: ${date}`);
//           return JSON.parse(cachedData);
//         }

//         // SCENARIO 2: A custom TTL WAS requested. Let's evaluate it.
//         const remainingTtl = await redisClient.ttl(cacheKey);

//         if (remainingTtl > customTtl) {
//           console.log(`📦 Cache masih cukup lama (${remainingTtl}s > ${customTtl}s). Menggunakan cache.`);
//           return JSON.parse(cachedData);
//         } else {
//           console.log(`♻️ TTL sisa ${remainingTtl}s (<= ${customTtl}s). Refreshing data...`);
//           // It drops out of this 'if' block to fetch fresh data below
//         }
//       }
//     } catch (err) {
//       console.warn(`⚠️ Redis error: ${err.message}`);
//     }
//   }

//   // 3. Fetch fresh data from API
//   try {
//     const url = `${API_BASE_URL}/qc/data/summary/${date}`;
//     console.log("🔎 Fetching QC Summary from:", url);
    
//     const response = await axios.get(url, {
//       headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" }
//     });

//     // 4. Determine what TTL to save the new data with
//     const ttlToSet = customTtl ? parseInt(customTtl) : DEFAULT_CACHE_TTL;

//     if (redisClient) {
//       await redisClient.setEx(cacheKey, ttlToSet, JSON.stringify(response.data));
//       console.log(`✅ Data disimpan dengan TTL: ${ttlToSet}s`);
//     }

//     return response.data;
//   } catch (err) {
//     if (err.response) {
//       console.error("❌ API Error:", err.response.status, err.response.data);
//     } else {
//       console.error("❌ Request error:", err.message);
//     }
//     throw err;
//   }
// }


export async function fetchQCSummary(date, customTtl) {
  // ✅ MODIFIED: Use today's date for the cache key if customTtl exists.
  // (Make sure to import dayjs at the top of this file if you haven't already)
  const cacheDate = customTtl ? dayjs().format('YYYY-MM-DD') : date;
  const cacheKey = `qc:summary:${cacheDate}`;
  
  const redisClient = getRedisClient();

  if (redisClient) {
    try {
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        // SCENARIO 1: No custom TTL requested in the route.
        // Just use the cache like normal!
        if (!customTtl) {
          console.log(`📦 Menggunakan cache yang ada untuk: ${cacheDate}`);
          return JSON.parse(cachedData);
        }

        // SCENARIO 2: A custom TTL WAS requested. Let's evaluate it.
        const remainingTtl = await redisClient.ttl(cacheKey);

        if (remainingTtl > customTtl) {
          console.log(`📦 Cache masih cukup lama (${remainingTtl}s > ${customTtl}s). Menggunakan cache.`);
          return JSON.parse(cachedData);
        } else {
          console.log(`♻️ TTL sisa ${remainingTtl}s (<= ${customTtl}s). Refreshing data...`);
          // It drops out of this 'if' block to fetch fresh data below
        }
      }
    } catch (err) {
      console.warn(`⚠️ Redis error: ${err.message}`);
    }
  }

  // 3. Fetch fresh data from API
  try {
    // Notice that this STILL uses the original 'date' variable (yesterday) for the API fetch
    const url = `${API_BASE_URL}/qc/data/summary/${date}`;
    console.log("🔎 Fetching QC Summary from:", url);
    
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" }
    });

    // 4. Determine what TTL to save the new data with
    const ttlToSet = customTtl ? parseInt(customTtl) : DEFAULT_CACHE_TTL;

    if (redisClient) {
      // Saves using the new cacheKey
      await redisClient.setEx(cacheKey, ttlToSet, JSON.stringify(response.data));
      console.log(`✅ Data disimpan dengan TTL: ${ttlToSet}s`);
    }

    return response.data;
  } catch (err) {
    if (err.response) {
      console.error("❌ API Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Request error:", err.message);
    }
    throw err;
  }
}



export async function fetchSLMONLastStatus() {
  const cacheKey = 'slmon:laststatus';
  const redisClient = getRedisClient();

  if (redisClient) {
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log('📦 SLMON LastStatus dari cache');
        return JSON.parse(cachedData);
      }
    } catch (err) {
      console.warn(`⚠️ Gagal mengambil dari cache Redis (SLMON): ${err.message}`);
    }
  } else {
    console.warn("⚠️ Koneksi Redis tidak tersedia, cache dilewati (SLMON).");
  }

  const url = 'http://202.90.198.40/sismon-slmon2/data/slmon.all.laststatus.json';
  console.log('🌐 Request ke SLMON LastStatus:', url);

  try {
    const response = await axios.get(url, {
      headers: { Accept: "application/json" },
      timeout: 10000,
    });
    
    if (redisClient) {
      try {
        await redisClient.setEx(cacheKey, 60, JSON.stringify(response.data)); // TTL 60 detik
      } catch (err) {
        console.warn(`⚠️ Gagal menyimpan ke cache Redis (SLMON): ${err.message}`);
      }
    }
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
    throw err;
  }
}

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
    throw err;
  }
}

// export async function getData() {
//   const cacheKey = 'external:data';
//   const redisClient = getRedisClient();

//   if (redisClient) {
//     try {
//       const cachedData = await redisClient.get(cacheKey);
//       if (cachedData) {
//         console.log('📦 Data dari cache');
//         return JSON.parse(cachedData);
//       }
//     } catch (err) {
//       console.warn(`⚠️ Gagal mengambil dari cache Redis (getData): ${err.message}`);
//     }
//   }

//   console.log('🌐 Request ke external API');
//   const response = await axios.get('https://jsonplaceholder.typicode.com/users');

//   if (redisClient) {
//     try {
//       await redisClient.setEx(cacheKey, 60, JSON.stringify(response.data));
//     } catch (err) {
//       console.warn(`⚠️ Gagal menyimpan ke cache Redis (getData): ${err.message}`);
//     }
//   }
//   return response.data;
// }