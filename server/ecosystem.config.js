module.exports = {
  apps: [
    {
      // Proses untuk server utama Anda
      name: 'web-server',
      script: 'app.js', // <-- PENTING: Ganti 'index.js' dengan nama file utama server Anda (misal: app.js atau server.js)
      watch: false, // Sebaiknya 'false' untuk produksi
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      // Proses untuk skrip penjadwal
      name: 'scheduler',
      script: 'scripts/scheduler.js',
      watch: false,
      autorestart: false, // Tidak perlu restart otomatis
    },
  ],
};
