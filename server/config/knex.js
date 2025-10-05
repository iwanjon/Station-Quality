import knex from 'knex';

// Sesuaikan dengan konfigurasi database Anda
const dbConfig = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'admin', 
    database: process.env.DB_NAME || 'station_quality_control',
  },
  pool: { min: 2, max: 10 }
};

const db = knex(dbConfig);

export default db;