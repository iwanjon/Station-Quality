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
  multipleStatements: true
};

const migrationsPath = path.join(__dirname, '../migrations');

async function createDatabase() {
  const connection = await mysql.createConnection(dbConfig);
  const dbName = process.env.MYSQL_NAME || 'station_quality_control';
  
  try {
    // Drop database if exists to ensure clean setup
    await connection.execute(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`🗑️ Dropped existing database '${dbName}' if it existed`);
    
    // Create fresh database
    await connection.execute(`CREATE DATABASE \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created successfully`);
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function runMigrations(reset = false) {

  console.log(reset);
  console.log("et");

  const connection = await mysql.createConnection({
    ...dbConfig,
    database: process.env.MYSQL_NAME || 'station_quality_control'
  });

  try {
    // Create migrations table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    if (reset) {
      console.log('🔄 Resetting database...');
      
      const [tables] = await connection.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name NOT IN ('migrations', 'seeders')
      `, [process.env.MYSQL_NAME || 'station_quality_control']);

      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      console.log(tables);
      
      for (const table of tables) {
        console.log(table.TABLE_NAME);
        await connection.execute(`DROP TABLE IF EXISTS \`${table.TABLE_NAME}\``);
        // await connection.execute(`DROP TABLE IF EXISTS \`${table.table_name}\``);
      }
      
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      await connection.execute('DELETE FROM migrations');
    }

    // Read and execute migration files
    const files = await fs.readdir(migrationsPath);
    const migrationFiles = files.filter(file => file.endsWith('.sql')).sort();

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found');
      return;
    }

    for (const filename of migrationFiles) {
      const [existing] = await connection.execute(
        'SELECT id FROM migrations WHERE filename = ?',
        [filename]
      );

      if (!reset){

                
        console.log(`📝 Running migration without reset: ${filename}`);
        
        const filePath = path.join(migrationsPath, filename);
        const sql = await fs.readFile(filePath, 'utf8');
        
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          try {
              await connection.execute(statement);
          } catch (error){
            console.error('❌ Migration error without reset:', error.message);
          }
        }

        try {
          await connection.execute(
            'INSERT INTO migrations (filename) VALUES (?)',
            [filename]
          );
           
        }
        catch (error){
            console.error('❌ error insert to migration table without reset:', error.message);
        }

        console.log(`✅ Migration completed: ${filename}`);

      }
      else if (existing.length === 0 || reset) {
        console.log(`📝 Running migration: ${filename}`);
        
        const filePath = path.join(migrationsPath, filename);
        const sql = await fs.readFile(filePath, 'utf8');
        
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          await connection.execute(statement);
        }

        await connection.execute(
          'INSERT INTO migrations (filename) VALUES (?)',
          [filename]
        );

        console.log(`✅ Migration completed: ${filename}`);
      } 
    }

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function showMigrationStatus() {
  const connection = await mysql.createConnection({
    ...dbConfig,
    database: process.env.MYSQL_NAME || 'station_quality_control'
  });

  try {
    const [migrations] = await connection.execute(`
      SELECT filename, executed_at 
      FROM migrations 
      ORDER BY executed_at ASC
    `);

    console.log('\n📊 Migration Status:');
    console.log('─'.repeat(50));
    
    if (migrations.length === 0) {
      console.log('No migrations executed yet');
    } else {
      migrations.forEach((migration, index) => {
        console.log(`${index + 1}. ${migration.filename} - ${migration.executed_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    const shouldMigrate = process.env.DB_MIGRATE === 'true';
    const reset = process.argv.includes('--reset');
    const status = process.argv.includes('--status');
    const recreate_db = process.argv.includes('--recreate-db');

    if (status) {
      await showMigrationStatus();
      return;
    }

    if (!shouldMigrate && !reset) {
      console.log('⏭️  Migration skipped (set DB_MIGRATE=true in .env)');
      return;
    }

    console.log('🚀 Starting database migration...');
    if (recreate_db){
      await createDatabase();
    }
    await runMigrations(reset);
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
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

export { runMigrations, createDatabase, showMigrationStatus };