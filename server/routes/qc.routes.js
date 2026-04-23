// routes/qc.routes.js
import { Router } from 'express';
import { cached } from '../utils/cacheHelper.js'; 
import { fetchQCDetail, fetchQCSummary, fetchQCSiteDetail } from '../services/externalApi.js'; 
import dayjs from "dayjs";
import { checkAuthorizationByStaCode, checkAuthorizationByStaId } from '../utils/customFunction.js';

const router = Router();

// Endpoint: Returns detailed site quality control data for a specific station code; returns an array with site_quality "-" if no data is found.
router.get("/site/detail/:code", async (req, res) => {
  const { code } = req.params;
  const cacheKey = `qc-sitedetail:${code}`;

  try {

    // add authorization
    // const originalList = ['AAFM', 'AAI', 'AAII', 'ABJI', 'ABSM', 'ACBM', 'ACJM', 'ALKI', 'ALTI', 'AMPM']; 

    // console.log(req.user.kode_stasiun);
    // const originalList = req.user.kode_stasiun; 
    
    // checkAuthorizationByStaCode(originalList, code);
    // if (!isAuthorized) {
    //   console.log(`"${code}" is not in the list.`);
    //   throw new Error(`"${code}" is not in the list.`);
    // }

    const data = await cached(cacheKey, 86400, () => // Cache untuk 1 hari
      fetchQCSiteDetail(code)
    );
    // Selalu kembalikan status 200 dan array dengan site_quality "-" jika data tidak ada
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(200).json([{ code, site_quality: "-" }]);
    }
    res.json(data);
  } catch (err) {
    console.error(`Error in /site/detail/${code}:`, err);
    // Jika error, kembalikan status 500 dan array dengan site_quality "-"
    res.status(500).json([{ code, site_quality: "-" }]);
  }
});


// Ambil data summary QC untuk 7 hari terakhir per stasiun
router.get("/summary/7days/:stationCode", async (req, res) => {
  const { stationCode } = req.params;
  const cacheKey = `qc-summary-7days:${stationCode}`;

  try {
    // add authorization
    // const originalList = ['AAFM', 'AAI', 'AAII', 'ABJI', 'ABSM', 'ACBM', 'ACJM', 'ALKI', 'ALTI', 'AMPM']; 
    
    // console.log(req.user.kode_stasiun);
    // const originalList = req.user.kode_stasiun; 

  //  checkAuthorizationByStaCode(originalList, stationCode);
    // if (!isAuthorized) {
    //   console.log(`"${stationCode}" is not in the list.`);
    //   throw new Error(`"${stationCode}" is not in the list.`);
    // }

    const finalResults = await cached(cacheKey, 60 * 60, async () => {
      const today = dayjs();
      const promises = [];

      for (let i = 1; i <= 7; i++) {
        const date = today.subtract(i, "day").format("YYYY-MM-DD");
        promises.push(fetchQCSummary(date));
      }

      const dailySummaries = await Promise.allSettled(promises);
      const results = [];

      dailySummaries.forEach((dayResult, index) => {
        const date = today.subtract(index + 1, "day");
        let status = "No Data";

        if (dayResult.status === 'fulfilled' && dayResult.value) {
          const stationData = dayResult.value.find(s => s.code === stationCode);
          if (stationData) {
            switch (stationData.result) {
              case "Baik":
                status = "Good";
                break;
              case "Cukup Baik":
                status = "Fair";
                break;
              case "Buruk":
                status = "Poor";
                break;
              default:
                status = "No Data";
                break;
            }
          }
        } else {
          console.warn(`⚠️ Could not fetch summary for date index ${index + 1}, station ${stationCode}`);
        }
        
        results.push({
          date: date.format('DD-MMM'),
          status: status,
        });
      });

      return results.reverse();
    });

    res.json(finalResults);

  } catch (err) {
    console.error(`Error in /summary/7days/${stationCode}:`, err);
    res.status(500).json({ error: "Failed to fetch 7 days QC summary" });
  }
});


// Ambil data QC untuk 7 hari terakhir
router.get("/data/detail/7days/:stationId", async (req, res) => {
  const { stationId } = req.params;
  const today = dayjs();
  const results = [];

  try {


    // add authorization
    // const originalList = ['AAFM', 'AAI', 'AAII', 'ABJI', 'ABSM', 'ACBM', 'ACJM', 'ALKI', 'ALTI', 'AMPM']; 
    
    // console.log(req.user.kode_stasiun);
    // const originalList = req.user.kode_stasiun; 

  //  checkAuthorizationByStaCode(originalList, stationId);


    for (let i = 1; i <= 7; i++) {
      const date = today.subtract(i, "day").format("YYYY-MM-DD");
      const cacheKey = `qc:${stationId}:${date}`;

      try {
        const data = await cached(cacheKey, 60 * 60, () =>
          fetchQCDetail(stationId, date)
        );

        if (data && data.length > 0) {
          data.forEach((item) => {
            results.push({ date, ...item });
          });
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.warn(`⚠️ Data not found for ${stationId} at ${date}`);
          continue;
        }
        throw err;
      }
    }

    results.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json(results);
    
  } catch (err) {
    console.error("Error in /data/detail/7days:", err);
    res.status(500).json({ error: "Failed to fetch 7 days QC detail" });
  }
});


router.get("/data/detail/:stationId/:date", async (req, res) => {
  const { stationId, date } = req.params;
  const cacheKey = `qc:${stationId}:${date}`;

  try {


    // add authorization
    // const originalList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; 

    // 1. Make sure it's not an empty string
    // 2. Check if the string version of the array items matches your stationId
    // const isAuthorized = stationId.trim() !== "" && originalList.some(id => String(id) === String(stationId.trim()));

    // // Check if the lowercase word is NOT in the set
    // if (!isAuthorized) {
    //   console.log(`"${stationId}" is not in the list.`);
    //   throw new Error(`"${stationId}" is not in the list.`);
    // } else {
    //   console.log(`"${stationId}" is in the list.`);
    // }

    // console.log(req.user.stasiun_id);
    // const originalList = req.user.stasiun_id; 

    // checkAuthorizationByStaId(originalList, stationId);
    // if (!isAuthorized) {
    //   console.log(`"${stationId}" is not in the list.`);
    //   throw new Error(`"${stationId}" is not in the list.`);
    // } else {
    //   console.log(`"${stationId}" is in the list.`);
    // }

    const data = await cached(cacheKey, 60 * 60, () =>
      fetchQCDetail(stationId, date)
    );
    res.json(data);
  } catch (err) {
    console.error("Error in /data/detail:", err);
    res.status(500).json({ error: "Failed to fetch QC detail" });
  }
});

// router.get("/summary/:date", async (req, res) => {
//   const { date } = req.params;
//   const cacheKey = `qc-summary:${date}`;
//   // console.log(cacheKey)

//   try {
//     const data = await cached(cacheKey, 60 * 60, () =>
//       fetchQCSummary(date)
//     );
//     res.json(data);
//   } catch (err) {
//     console.error("Error in /summary:", err);
//     res.status(500).json({ error: "Failed to fetch QC summary" });
//   }
// });

router.get("/summary/:date", async (req, res) => {
  const { date } = req.params;
  // Get TTL from query (e.g., /summary/2023-10-01?ttl=7200)
  const requestedTtl = req.query.ttl ? parseInt(req.query.ttl) : null;

  try {
    // We pass the requestedTtl directly to your fetch function
    const data = await fetchQCSummary(date, requestedTtl);
    res.json(data);
  } catch (err) {
    console.error("Error in /summary:", err);
    res.status(500).json({ error: "Failed to fetch QC summary" });
  }
});



router.get("/summary/:date/:code", async (req, res) => {
  const { date, code } = req.params;
  const cacheKey = `qc-summary:${date}`;
  // console.log(cacheKey)

  try {


    // add authorization
    // const originalList = ['AAFM', 'AAI', 'AAII', 'ABJI', 'ABSM', 'ACBM', 'ACJM', 'ALKI', 'ALTI', 'AMPM']; 

    // const originalList  = req.user.kode_stasiun;    
    
    // checkAuthorizationByStaCode(originalList, code);
    // if (!isAuthorized) {
    //   console.log(`"${code}" is not in the list.`);
    //   throw new Error(`"${code}" is not in the list.`);
    // }


    const data = await cached(cacheKey, 60 * 60, () =>
      fetchQCSummary(date)
    );
    res.json(data);
  } catch (err) {
    console.error("Error in /summary:", err);
    res.status(500).json({ error: "Failed to fetch QC summary" });
  }
});

export default router;