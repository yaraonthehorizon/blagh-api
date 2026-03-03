import { DatabaseConfig } from '../config/interfaces';
import { logger } from '../logging';
import { DatabaseSeeder } from './seeder';
import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Import logging models to ensure they're registered
import '../../modules/logging/schemas/log.schema';

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnection(): any;
  createCollections(): Promise<void>;
}

export class MongoDBConnection implements DatabaseConnection {
  private connected = false;
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    try {
      logger.info('[MongoDB] Connecting to database...');
      logger.info(`[MongoDB] Connection string: ${this.connectionString.replace(/\/\/.*@/, '//***:***@')}`);
      
      // Set mongoose options
      mongoose.set('strictQuery', false);
      
      // Connect to MongoDB
      await mongoose.connect(this.connectionString, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      // Handle connection events
      mongoose.connection.on('connected', () => {
        logger.info('[MongoDB] ✅ Connected to database successfully');
        logger.info(`[MongoDB] Database: ${mongoose.connection.db.databaseName}`);
        logger.info(`[MongoDB] Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
        this.connected = true;
      });

      mongoose.connection.on('error', (err) => {
        logger.error('[MongoDB] ❌ Database connection error:', err);
        this.connected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.info('[MongoDB] 🔌 Database disconnected');
        this.connected = false;
      });

      // Handle process termination
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      logger.error('[MongoDB] ❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      logger.info('[MongoDB] Disconnecting from database...');
      await mongoose.disconnect();
      this.connected = false;
      logger.info('[MongoDB] Disconnected from database successfully');
    } catch (error) {
      logger.error('[MongoDB] Error disconnecting from database:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  getConnection(): any {
    return mongoose.connection;
  }

  private setupLoggingConnection(): void {
    // Set database connection for logging system
    try {
      console.log('[DEBUG] Setting up logging connection...');
      console.log('[DEBUG] Available transports:', logger.getTransports().map(t => `${t.name}:${t.isEnabled()}`));
      
      logger.setDatabaseConnection(mongoose.connection);
      logger.info('[MongoDB] Logging system database connection configured');
      
      // Test if database logging is working
      logger.info('[MongoDB] Test log message to verify database logging');
      
    } catch (error) {
      console.error('[ERROR] Failed to configure logging database connection:', error);
      logger.warn('[MongoDB] Failed to configure logging database connection:', error);
    }
  }

  async createCollections(): Promise<void> {
    try {
      logger.info('[MongoDB] Creating collections and indexes...');
      
      // Get all registered models
      const models = mongoose.modelNames();
      
      for (const modelName of models) {
        try {
          const model = mongoose.model(modelName);
          const collectionName = model.collection.name;
          
          // Create collection if it doesn't exist
          const collections = await mongoose.connection.db.listCollections({ name: collectionName }).toArray();
          if (collections.length === 0) {
            await mongoose.connection.createCollection(collectionName);
            logger.info(`[MongoDB] Created collection: ${collectionName}`);
          } else {
            logger.debug(`[MongoDB] Collection already exists: ${collectionName}`);
          }
          
          // Create indexes
          if (model.schema.indexes) {
            for (const index of model.schema.indexes()) {
              try {
                await model.collection.createIndex(index[0] as any, index[1] as any || {});
                logger.debug(`[MongoDB] Created index for ${collectionName}: ${JSON.stringify(index[0])}`);
              } catch (indexError: any) {
                // Index might already exist, which is fine
                if (indexError.code !== 85) { // 85 is "Index already exists" error
                  logger.warn(`[MongoDB] Failed to create index for ${collectionName}:`, indexError.message);
                }
              }
            }
          }
        } catch (modelError) {
          logger.warn(`[MongoDB] Error processing model ${modelName}:`, modelError);
        }
      }
      
      logger.info('[MongoDB] Collections and indexes created successfully');
      
      // Set database connection for logging system after collections are created
      this.setupLoggingConnection();
    } catch (error) {
      logger.error('[MongoDB] Error creating collections:', error);
      throw error;
    }
  }
}

export class MockDatabaseConnection implements DatabaseConnection {
  private connected = false;

  async connect(): Promise<void> {
    logger.info('[MockDatabase] Pretending to connect to database...');
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    logger.info('[MockDatabase] Pretending to disconnect from database...');
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnection(): any {
    return null;
  }

  async createCollections(): Promise<void> {
    logger.info('[MockDatabase] Pretending to create collections...');
  }
}

export class DatabaseManager {
  private connections: Map<string, DatabaseConnection> = new Map();
  private config: DatabaseConfig;
  private seeder: DatabaseSeeder;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.seeder = new DatabaseSeeder(this, config);
  }

  async initialize(): Promise<void> {
    try {
      logger.info('[DatabaseManager] Initializing database connections...');
      await this.createConnection('main');
      
      // Create collections and indexes
      const mainConnection = this.getConnection('main');
      if (mainConnection) {
        await mainConnection.createCollections();
      }
      
      // Run seeding if enabled
      if (process.env.DB_SEED === 'true') {
        await this.seeder.seed({
          force: process.env.DB_SEED_FORCE === 'true',
          truncate: process.env.DB_SEED_TRUNCATE === 'true',
          environment: process.env.NODE_ENV
        });
      }
      
      logger.info('[DatabaseManager] Database connections initialized successfully');
    } catch (error) {
      logger.error('[DatabaseManager] Failed to initialize database connections:', error);
      throw error;
    }
  }

  async createConnection(name: string): Promise<DatabaseConnection> {
    // Use MongoDB connection for main database
    if (name === 'main') {
      let connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        // Build connection string from config
        if (this.config.dialect === 'mongodb') {
          const { host, port, username, password, database } = this.config;
          if (username && password) {
            connectionString = `mongodb://${username}:${password}@${host}:${port}/${database}`;
          } else {
            connectionString = `mongodb://${host}:${port}/${database}`;
          }
        } else {
          connectionString = 'mongodb://localhost:27017/diagramers';
        }
      }
      
      const connection = new MongoDBConnection(connectionString);
      await connection.connect();
      this.connections.set(name, connection);
      return connection;
    }
    
    // Use mock connection for other databases (if needed)
    const connection = new MockDatabaseConnection();
    await connection.connect();
    this.connections.set(name, connection);
    return connection;
  }

  getConnection(name: string = 'main'): DatabaseConnection | undefined {
    return this.connections.get(name);
  }

  /**
   * Get the database seeder
   */
  getSeeder(): DatabaseSeeder {
    return this.seeder;
  }

  /**
   * Run database seeding
   */
  async seed(options?: any): Promise<void> {
    return this.seeder.seed(options);
  }

  /**
   * Reset database (truncate and reseed)
   */
  async reset(): Promise<void> {
    return this.seeder.reset();
  }

  /**
   * Create collections for all registered models
   */
  async createAllCollections(): Promise<void> {
    for (const [name, connection] of this.connections) {
      try {
        await connection.createCollections();
        logger.info(`[DatabaseManager] Created collections for connection: ${name}`);
      } catch (error) {
        logger.error(`[DatabaseManager] Error creating collections for ${name}:`, error);
      }
    }
  }

  async closeAll(): Promise<void> {
    logger.info('[DatabaseManager] Closing all database connections...');
    for (const [name, connection] of this.connections) {
      try {
        await connection.disconnect();
        logger.info(`[DatabaseManager] Closed connection: ${name}`);
      } catch (error) {
        logger.error(`[DatabaseManager] Error closing connection ${name}:`, error);
      }
    }
    this.connections.clear();
  }
} 