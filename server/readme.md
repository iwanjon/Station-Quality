Penjelasan dari fungsi masing masing folder

backend/
│── src/
│   ├── config/           # Konfigurasi aplikasi (Redis, DB, environment)
│   │   ├── redisClient.js
│   │   └── db.js
│   │
│   ├── models/           # Representasi tabel/collection di DB
│   │   └── User.js
│   │
│   ├── services/         # Logika bisnis (query DB, panggil API, cache ke Redis)
│   │   └── user.service.js
│   │
│   ├── controllers/      # Terima request, panggil service, return response
│   │   └── user.controller.js
│   │
│   ├── routes/           # Definisi endpoint HTTP
│   │   └── user.routes.js
│   │
│   ├── utils/            # Helper functions (format tanggal, generate cache key, dsb)
│   │   └── cacheHelper.js
│   │
│   ├── app.js            # Setup Express & middleware
│   └── server.js         # Entry point (start server)
│
│── package.json
│── Dockerfile
│── docker-compose.yml