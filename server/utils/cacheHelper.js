// utils/cacheHelper.js
// 1. Impor fungsi 'getRedisClient', bukan objeknya langsung
import getRedisClient from '../config/redisClient.js'; 

export async function cached(key, ttlSeconds, fetcher) {
  // 2. Panggil fungsi untuk mendapatkan objek klien yang aktif
  const redisClient = getRedisClient();

  // 3. Cek apakah koneksi Redis tersedia sebelum melakukan apa pun
  if (redisClient) {
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        console.log(`📦 Cache hit for ${key}`);
        return JSON.parse(cachedData);
      }
    } catch (err) {
      console.warn(`⚠️ Gagal mengambil dari cache Redis untuk key ${key}: ${err.message}`);
    }
  } else {
    // Beri peringatan jika Redis tidak terhubung
    console.warn("⚠️ Koneksi Redis tidak tersedia, cache dilewati.");
  }

  // 4. Jika cache miss atau Redis tidak terhubung, ambil data baru
  console.log(`🌐 Cache miss for ${key}, fetching...`);
  const data = await fetcher();

  // 5. Coba simpan data baru ke cache HANYA JIKA Redis terhubung
  if (redisClient) {
    try {
      // Menggunakan setEx untuk 'set with expiration'
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
    } catch (err) {
      console.warn(`⚠️ Gagal menyimpan ke cache Redis untuk key ${key}: ${err.message}`);
    }
  }

  return data;
}

// Ekspor tetap sama seperti kode Anda sebelumnya
export default { cached };
// import redisClient from '../config/redisClient.js'; 
// import getRedisClient from '../config/redisClient.js'; 

// export async function cached(key, ttlSeconds, fetcher) {
//   const cachedData = await redisClient.get(key);
//   if (cachedData) {
//     console.log(`Cache hit for ${key}`);
//     return JSON.parse(cachedData);
//   }

//   console.log(`Cache miss for ${key}, fetching...`);
//   const data = await fetcher();
//   await redisClient.set(key, JSON.stringify(data), { EX: ttlSeconds });
//   return data;
// }

// export default { cached };


