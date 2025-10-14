import { dailyFetchAvailability } from '../controllers/stasiunAvailability.controller.js';

const runAvailabilityTask = async () => {
  try {
    console.log('🔄 Starting availability history fetch task...');

    await dailyFetchAvailability();

    console.log('✅ Availability history fetch task completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Availability history fetch task failed:', error.message);
    process.exit(1);
  }
};

// Jalankan task jika file ini dijalankan langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  runAvailabilityTask();
}

export { runAvailabilityTask };