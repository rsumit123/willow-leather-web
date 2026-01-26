import { FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests.
 * This runs once before all tests to ensure a clean database state.
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🧹 Setting up test environment...');

  const apiBaseUrl = process.env.VITE_API_URL || 'http://localhost:8000/api';

  try {
    // Option 1: Call a test reset endpoint if available
    // This would be a backend endpoint that resets the database
    const response = await fetch(`${apiBaseUrl}/test/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      console.log('✅ Database reset via API endpoint');
      return;
    }
  } catch (error) {
    // Endpoint might not exist, that's okay
    console.log('ℹ️  No test reset endpoint found, continuing with existing database');
  }

  // Option 2: Delete existing careers via the API
  try {
    // First, get all careers
    const careersResponse = await fetch(`${apiBaseUrl}/career/list`);
    if (careersResponse.ok) {
      const careers = await careersResponse.json();

      // Delete each career
      for (const career of careers) {
        try {
          await fetch(`${apiBaseUrl}/career/${career.id}`, {
            method: 'DELETE',
          });
          console.log(`  🗑️  Deleted career: ${career.name}`);
        } catch (e) {
          // Ignore delete errors
        }
      }

      if (careers.length > 0) {
        console.log(`✅ Cleaned up ${careers.length} existing career(s)`);
      } else {
        console.log('✅ Database already clean');
      }
    }
  } catch (error) {
    console.log('⚠️  Could not clean up existing careers (backend may not be running yet)');
  }

  console.log('✅ Test environment ready\n');
}

export default globalSetup;
