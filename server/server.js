import 'dotenv/config';
import app from './app.js';   // ambil default export, bukan { listen }

const PORT = process.env.PORT || 5000;

console.log("🌍 API_BASE_URL:", process.env.API_BASE_URL);
console.log("🔑 API_KEY:", process.env.API_KEY);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
