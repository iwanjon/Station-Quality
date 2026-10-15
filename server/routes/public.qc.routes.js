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
  const { date } = req.params;
  const requestedTtl = req.query.ttl
    ? Number.parseInt(String(req.query.ttl), 10)
    : null;

  if (!date) {
    return res.status(400).json({
      error: "Date parameter is required",
    });
  }

  if (
    requestedTtl !== null &&
    (!Number.isInteger(requestedTtl) || requestedTtl <= 0)
  ) {
    return res.status(400).json({
      error: "ttl must be a positive integer",
    });
  }

  try {
    const data = await fetchQCSummary(date, requestedTtl);
    return res.json(data);
  } catch (err) {
    console.error("Error in /summary:", err);
    return res.status(500).json({
      error: "Failed to fetch QC summary",
    });
  }
});


export default router;