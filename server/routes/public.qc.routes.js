// routes/qc.routes.js
import { Router } from 'express';
import { cached } from '../utils/cacheHelper.js'; 
import { fetchQCDetail, fetchQCSummary, fetchQCSiteDetail } from '../services/externalApi.js'; 
import dayjs from "dayjs";
import { checkAuthorizationByStaCode, checkAuthorizationByStaId } from '../utils/customFunction.js';

const router = Router();

// router.get("/summary/:date", async (req, res) => {
//   const { date } = req.params;
//   // Get TTL from query (e.g., /summary/2023-10-01?ttl=7200)
//   const requestedTtl = req.query.ttl ? parseInt(req.query.ttl) : null;

//   try {
//     // We pass the requestedTtl directly to your fetch function
//     const data = await fetchQCSummary(date, requestedTtl);
//     res.json(data);
//   } catch (err) {
//     console.error("Error in /summary:", err);
//     res.status(500).json({ error: "Failed to fetch QC summary" });
//   }
// });


router.get("/summary/:date", async (req, res) => {
  let { date } = req.params;
  const requestedTtl = req.query.ttl ? parseInt(req.query.ttl) : null;

  // If TTL exists, force the date to be yesterday
  if (requestedTtl !== null) {
    date = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  } else if (!date) {
    // If no TTL is provided and no date is in the URL, return an error
    return res.status(400).json({ error: "Date parameter is required when no TTL is provided" });
  }

  try {
    console.log(date);
    const data = await fetchQCSummary(date, requestedTtl);
    res.json(data);
  } catch (err) {
    console.error("Error in /summary:", err);
    res.status(500).json({ error: "Failed to fetch QC summary" });
  }
});


export default router;