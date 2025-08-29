import { createDatabase, runMigrations } from './migrate.js';
import { runSeeders } from './seed.js';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  const reset = process.argv.includes('--reset');
  const migrateOnly = process.argv.includes('--migrate-only');
  const seedOnly = process.argv.includes('--seed-only');

  try {
    console.log('🚀 Starting database setup...\n');

    if (!seedOnly) {
      console.log('📝 Creating database and running migrations...');
      await createDatabase();
      await runMigrations(reset);
      console.log('✅ Migrations completed\n');
    }

    if (!migrateOnly) {
      console.log('🌱 Running seeders...');
      await runSeeders(reset);
      console.log('✅ Seeders completed\n');
    }

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export { setupDatabase };