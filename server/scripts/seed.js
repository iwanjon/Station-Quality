import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASS || '',
  database: process.env.MYSQL_NAME || 'station_quality_control',
  multipleStatements: true
};

const seedersPath = path.join(__dirname, '../seeders');

async function runSeeders(force = false) {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Create seeders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS seeders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (force) {
      await connection.execute('DELETE FROM seeders');
    }

    // Read and execute seeder files
    const files = await fs.readdir(seedersPath);
    const seederFiles = files.filter(file => file.endsWith('.sql')).sort();

    if (seederFiles.length === 0) {
      console.log('⚠️  No seeder files found');
      return;
    }

    for (const filename of seederFiles) {
      const [existing] = await connection.execute(
        'SELECT id FROM seeders WHERE filename = ?',
        [filename]
      );

      if (existing.length === 0 || force) {
        console.log(`🌱 Running seeder: ${filename}`);
        
        const filePath = path.join(seedersPath, filename);
        const sql = await fs.readFile(filePath, 'utf8');
        
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          await connection.execute(statement);
        }

        await connection.execute('INSERT INTO seeders (filename) VALUES (?)', [filename]);
        console.log(`✅ Seeder completed: ${filename}`);
      }
    }

  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function showSeederStatus() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const [seeders] = await connection.execute(`
      SELECT filename, executed_at FROM seeders ORDER BY executed_at ASC
    `);

    console.log('\n🌱 Seeder Status:');
    console.log('─'.repeat(50));
    
    if (seeders.length === 0) {
      console.log('No seeders executed yet');
    } else {
      seeders.forEach((seeder, index) => {
        console.log(`${index + 1}. ${seeder.filename} - ${seeder.executed_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking seeder status:', error.message);
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    const shouldSeed = process.env.DB_SEED === 'true';
    const force = process.argv.includes('--force');
    const status = process.argv.includes('--status');

    if (status) {
      await showSeederStatus();
      return;
    }

    if (!shouldSeed && !force) {
      console.log('⏭️  Seeding skipped (set DB_SEED=true in .env)');
      return;
    }

    await runSeeders(force);
    console.log('✅ Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Check if script is run directly
const scriptPath = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === scriptPath || 
                    process.argv[1].replace(/\\/g, '/') === scriptPath.replace(/\\/g, '/');

if (isMainModule) {
  main();
}

export { runSeeders, showSeederStatus };