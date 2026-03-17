import { createClient, RedisClientType } from 'redis'
import { logger } from '../logging'
import e = require('express')

export interface CacheConnection {
    connect(): Promise<void>
    disconnect(): Promise<void>
    isConnected(): boolean
    getClient(): any
    get(key: string): Promise<string | null>
    set(key: string, value: string, ttlSeconds?: number): Promise<void>
    getOrSet<T>(
        key: string,
        fetchFunction: () => Promise<T>,
        ttlSeconds?: number
    ): Promise<T>
}

export class RedisConnection implements CacheConnection {
    private connected = false
    private client: RedisClientType

    constructor() {
        this.client = createClient({
            username: process.env.REDIS_USERNAME,
            password: process.env.REDIS_PASSWORD,
            socket: {
                host: process.env.REDIS_HOST,
                port: Number(process.env.REDIS_PORT),
            },
        })

        this.client.on('error', (err) => {
            logger.error('[RedisConnection] Redis Client Error:', err)
            this.connected = false
        })

        this.client.on('connect', () => {
            logger.info('[RedisConnection] Connected to Redis successfully')
            this.connected = true
        })

        this.client.on('end', () => {
            logger.info('[RedisConnection] Disconnected from Redis')
            this.connected = false
        })
    }

    async connect(): Promise<void> {
        try {
            logger.info('[RedisConnection] Connecting to Redis...')
            if (!this.client.isOpen) {
                await this.client.connect()
                this.connected = true
            }
        } catch (error) {
            logger.error('[RedisConnection] Failed to connect to Redis:', error)
            throw error
        }
    }

    async disconnect(): Promise<void> {
        try {
            logger.info('[RedisConnection] Disconnecting from Redis...')
            if (this.client.isOpen) {
                await this.client.quit()
                this.connected = false
            }
        } catch (error) {
            logger.error(
                '[RedisConnection] Error disconnecting from Redis:',
                error
            )
            throw error
        }
    }

    isConnected(): boolean {
        return this.connected
    }

    getClient(): any {
        return this.client
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        try {
            if (ttlSeconds) {
                await this.client.set(key, value, { EX: ttlSeconds })
            } else {
                await this.client.set(key, value)
            }
        } catch (error) {
            logger.error(`[RedisConnection] Error setting key ${key}:`, error)
            throw error
        }
    }

    async get(key: string): Promise<string | null> {
        try {
            const result = await this.client.get(key)
            if (
                !result ||
                (typeof result === 'object' && Object.keys(result).length === 0)
            ) {
                return null
            }

            return result as string
        } catch (error) {
            logger.error(`[RedisConnection] Error getting key ${key}:`, error)
            throw error
        }
    }

    async getOrSet<T>(
        key: string,
        fetchFunction: () => Promise<T>,
        ttlSeconds: number = 3600
    ): Promise<T> {
        try {
            const cachedValue = await this.get(key)
            if (cachedValue) {
                logger.info(`[Cache Hit] ${key}`)
                return JSON.parse(cachedValue) as T
            }
            logger.info(`[Cache Miss] Fetching and caching ${key}...`)
            const value = await fetchFunction()
            await this.set(key, JSON.stringify(value), ttlSeconds)
            return value
        } catch (error) {
            logger.verbose(
                `[RedisConnection] Error in getOrSet for key ${key}:`,
                error
            )
            throw error
        }
    }
}

export class MockCacheConnection implements CacheConnection {
    private connected = false
    private store = new Map<string, string>()

    async connect(): Promise<void> {
        logger.info('[MockCache] Pretending to connect to cache...')
        this.connected = true
    }

    async disconnect(): Promise<void> {
        logger.info('[MockCache] Pretending to disconnect from cache...')
        this.connected = false
    }

    isConnected(): boolean {
        return this.connected
    }

    getClient(): any {
        return null
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        this.store.set(key, value)
    }

    async get(key: string): Promise<string | null> {
        return this.store.get(key) || null
    }

    async getOrSet<T>(
        key: string,
        fetchFunction: () => Promise<T>,
        ttlSeconds: number = 3600
    ): Promise<T> {
        const cachedValue = await this.get(key)
        if (cachedValue) {
            logger.info(`[Cache Hit] ${key}`)
            return JSON.parse(cachedValue) as T
        }

        logger.info(`[Cache Miss] Fetching and caching ${key}...`)
        const value = await fetchFunction()
        await this.set(key, JSON.stringify(value), ttlSeconds)
        return value
    }
}

export class CacheManager {
    private static instance: CacheManager
    private connections: Map<string, CacheConnection> = new Map()

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager()
        }
        return CacheManager.instance
    }

    async initialize(): Promise<void> {
        try {
            logger.info('[CacheManager] Initializing cache connections...')
            await this.createConnection('main')
            logger.info(
                '[CacheManager] Cache connections initialized successfully'
            )
        } catch (error) {
            logger.error(
                '[CacheManager] Failed to initialize cache connections:',
                error
            )
            throw error
        }
    }

    async createConnection(name: string): Promise<CacheConnection> {
        // Use Redis connection if host is configured, otherwise fallback to mock
        if (name === 'main' && process.env.REDIS_HOST) {
            const connection = new RedisConnection()
            await connection.connect()
            this.connections.set(name, connection)
            return connection
        }

        const connection = new MockCacheConnection()
        await connection.connect()
        this.connections.set(name, connection)
        return connection
    }

    getConnection(name: string = 'main'): CacheConnection | undefined {
        return this.connections.get(name)
    }

    async closeAll(): Promise<void> {
        logger.info('[CacheManager] Closing all cache connections...')
        for (const [name, connection] of this.connections) {
            try {
                await connection.disconnect()
                logger.info(`[CacheManager] Closed connection: ${name}`)
            } catch (error) {
                logger.error(
                    `[CacheManager] Error closing connection ${name}:`,
                    error
                )
            }
        }
        this.connections.clear()
    }
}
