import * as dotenv from 'dotenv';
dotenv.config();
import { Application } from './core/app';
import { logger } from './core/logging';

async function main() {
  const app = new Application();

  try {
    // Initialize the application
    await app.initialize();
    
    // Start the application
    await app.start();
    
    logger.info('[Main] Application is running');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('[Main] Received SIGINT, shutting down gracefully...');
      await app.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('[Main] Received SIGTERM, shutting down gracefully...');
      await app.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('[Main] Failed to start application:', error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  logger.error('[Main] Unhandled error:', error);
  process.exit(1);
}); 