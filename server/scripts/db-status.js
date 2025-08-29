import { showMigrationStatus } from './migrate.js';
import { showSeederStatus } from './seed.js';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASS || '',
  database: process.env.MYSQL_NAME || 'station_quality'
};

async function showDatabaseInfo() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Get database info
    const [dbInfo] = await connection.execute(`
      SELECT 
        SCHEMA_NAME as database_name,
        DEFAULT_CHARACTER_SET_NAME as charset,
        DEFAULT_COLLATION_NAME as collation
      FROM information_schema.SCHEMATA 
      WHERE SCHEMA_NAME = ?
    `, [process.env.MYSQL_NAME || 'station_quality']);

    // Get table count
    const [tableCount] = await connection.execute(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [process.env.MYSQL_NAME || 'station_quality']);

    // Get table list
    const [tables] = await connection.execute(`
      SELECT 
        table_name,
        table_rows,
        ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_name
    `, [process.env.MYSQL_NAME || 'station_quality']);

    console.log('\n🗄️  Database Information:');
    console.log('═'.repeat(60));
    
    if (dbInfo.length > 0) {
      console.log(`Database: ${dbInfo[0].database_name}`);
      console.log(`Charset: ${dbInfo[0].charset}`);
      console.log(`Collation: ${dbInfo[0].collation}`);
      console.log(`Total Tables: ${tableCount[0].table_count}`);
    }

    console.log('\n📊 Tables:');
    console.log('─'.repeat(60));
    
    if (tables.length === 0) {
      console.log('No tables found');
    } else {
      console.log('Table Name'.padEnd(25) + 'Rows'.padEnd(15) + 'Size (MB)');
      console.log('─'.repeat(60));
      tables.forEach(table => {
        const rows = table.table_rows || 0;
        const size = table.size_mb || 0;
        console.log(
          table.table_name.padEnd(25) + 
          rows.toString().padEnd(15) + 
          size.toString()
        );
      });
    }

  } catch (error) {
    console.error('❌ Error getting database info:', error.message);
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    await showDatabaseInfo();
    await showMigrationStatus();
    await showSeederStatus();
  } catch (error) {
    console.error('❌ Error showing database status:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { showDatabaseInfo };