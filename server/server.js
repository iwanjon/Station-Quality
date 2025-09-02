import 'dotenv/config';
import app from './app.js';   // ambil default export, bukan { listen }

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
