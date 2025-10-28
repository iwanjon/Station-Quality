// server.js

import 'dotenv/config';
import app from './app.js';
import logger  from './utils/logger.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  // console.log(`🚀 Server running on port ${PORT}`);
  logger.info(`🚀 Server running on port http://localhost:${PORT}`);
});