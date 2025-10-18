import { config, validateConfig } from './config/env';
import { createSlackApp, startSlackApp } from './slack/app';

async function main() {
  try {
    // Validate configuration
    console.log('Validating configuration...');
    validateConfig();

    // Create and start Slack app
    console.log('Starting Story Builders...');
    const app = createSlackApp();
    await startSlackApp(app);
  } catch (error) {
    console.error('Failed to start Story Builders:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

main();
