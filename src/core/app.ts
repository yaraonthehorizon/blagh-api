import { ConfigManager } from './config'
import { DatabaseManager } from './database/connection'
import { ServerManager } from './server/manager'
import { PluginManager } from '../plugins/base/manager'
import { logger } from './logging'
import { CacheManager } from './cache/cache-manager'

export class Application {
    private configManager: ConfigManager
    private databaseManager: DatabaseManager
    private pluginManager: PluginManager
    private serverManager: ServerManager
    private cacheManager: CacheManager

    constructor() {
        this.configManager = new ConfigManager()
        this.cacheManager = CacheManager.getInstance()
    }

    async initialize(): Promise<void> {
        try {
            logger.info('[Application] Starting application initialization...')

            // Load configuration
            const config = await this.configManager.load()
            logger.info('[Application] Configuration loaded')

            // Initialize database manager
            this.databaseManager = new DatabaseManager(config.database)
            await this.databaseManager.initialize()
            logger.info('[Application] Database initialized')
            // Initialize cache manager
            await this.cacheManager.initialize()

            // Initialize plugin manager
            const pluginContext = {
                config,
                logger,
                database: this.databaseManager,
                services: {},
            }

            this.pluginManager = PluginManager.getInstance(
                { pluginsPath: './plugins', autoLoad: true, hotReload: false },
                pluginContext
            )

            // Register auth plugin
            const {
                authPluginFactory,
            } = require('../plugins/registry/auth.plugin')
            this.pluginManager.registerFactory('auth', authPluginFactory)

            // Load auth plugin
            await this.pluginManager.loadPlugin('auth', {
                enabled: true,
                config: {},
            })

            logger.info('[Application] Plugin manager initialized')

            // Initialize server manager
            const serverConfig = {
                environment: process.env.NODE_ENV || 'development',
                port: parseInt(process.env.PORT || '4000', 10),
                host: process.env.HOST || '0.0.0.0',
                cors: config.cors,
                compression: config.security.compression,
                security: config.security.helmet,
            }

            this.serverManager = new ServerManager(
                serverConfig,
                this.pluginManager
            )

            // Pass database manager to server manager
            this.serverManager.setDatabaseManager(this.databaseManager)

            await this.serverManager.initialize()
            logger.info('[Application] Server initialized')

            logger.info('[Application] Application initialization completed')
        } catch (error) {
            logger.error(
                '[Application] Failed to initialize application:',
                error
            )
            throw error
        }
    }

    async start(): Promise<void> {
        try {
            logger.info('[Application] Starting application...')
            await this.serverManager.start()
            logger.info('[Application] Application started successfully')
        } catch (error) {
            logger.error('[Application] Failed to start application:', error)
            throw error
        }
    }

    async stop(): Promise<void> {
        try {
            logger.info('[Application] Stopping application...')

            if (this.serverManager) {
                await this.serverManager.stop()
            }

            if (this.pluginManager) {
                await this.pluginManager.stopPlugins()
            }

            if (this.databaseManager) {
                await this.databaseManager.closeAll()
            }

            if (this.cacheManager) {
                await this.cacheManager.closeAll()
            }

            logger.info('[Application] Application stopped successfully')
        } catch (error) {
            logger.error('[Application] Error stopping application:', error)
            throw error
        }
    }

    getConfigManager(): ConfigManager {
        return this.configManager
    }

    getDatabaseManager(): DatabaseManager {
        return this.databaseManager
    }

    getPluginManager(): PluginManager {
        return this.pluginManager
    }

    getServerManager(): ServerManager {
        return this.serverManager
    }

    getCacheManager(): CacheManager {
        return this.cacheManager
    }
}
