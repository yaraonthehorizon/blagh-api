#!/usr/bin/env node

import { ConfigManager } from '../core/config';
import { DatabaseManager } from '../core/database/connection';
import { logger } from '../core/logging';

async function main() {
  try {
    logger.info('[Seed Script] Starting database seeding...');

    // Load configuration
    const configManager = ConfigManager.getInstance();
    const config = await configManager.load();

    // Initialize database manager
    const dbManager = new DatabaseManager(config.database);
    await dbManager.initialize();

    // Get command line arguments
    const args = process.argv.slice(2);
    const options: any = {};

    if (args.includes('--force')) options.force = true;
    if (args.includes('--truncate')) options.truncate = true;
    if (args.includes('--reset')) {
      await dbManager.reset();
      logger.info('[Seed Script] Database reset completed');
      return;
    }

    // Run seeding
    await dbManager.seed(options);

    logger.info('[Seed Script] Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('[Seed Script] Failed to seed database:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  logger.error('[Seed Script] Unhandled error:', error);
  process.exit(1);
}); 