import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASS || process.env.DB_PASS || 'admin',
  database: process.env.MYSQL_NAME || process.env.DB_NAME || 'station_quality_control',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    
    // Test query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log(`✅ Database query test successful: ${rows[0].test}`);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

testConnection();

export { pool, testConnection };
export default pool;
