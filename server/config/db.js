import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export default pool;

// // server/db.js
// import { createPool } from 'mysql2';
// import { config } from 'dotenv';
// import mysql from 'mysql2/promise';
// config();
// // config();

// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME,
// });

// // const pool = createPool({
// //   host: process.env.DB_HOST || "localhost",
// //   user: process.env.DB_USER || "root",
// //   password: process.env.DB_PASS || "root",
// //   database: process.env.DB_NAME || "station_quality_control",
// //   waitForConnections: true,
// //   connectionLimit: 10,
// //   queueLimit: 0
// // });

// // Gunakan module.exports untuk mengekspor variabel
// export default pool;