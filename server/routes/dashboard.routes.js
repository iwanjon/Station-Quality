const express = require('express');
const router = express.Router();
const { getData } = require('../services/externalApi');

router.get('/data', async (req, res) => {
  try {
    const data = await getData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Terjadi kesalahan' });
  }
});

module.exports = router;