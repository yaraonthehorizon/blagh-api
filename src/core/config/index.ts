import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { AppConfig, ConfigValidationResult } from './interfaces'

export class ConfigManager {
    private static instance: ConfigManager
    private config: AppConfig | null = null
    private readonly configPath: string

    constructor() {
        this.configPath = path.join(process.cwd(), 'config')
        this.loadEnvironmentVariables()
    }

    private loadEnvironmentVariables(): void {
        const environment = process.env.NODE_ENV || 'development'
        const cwd = process.cwd()

        // Define environment file loading order (later files override earlier ones)
        const envFiles = [
            // Base template (lowest priority)
            '.env', // Base environment (medium priority)
            `.env.${environment}`, // Environment-specific (high priority)
            '.env.local', // Local overrides (highest priority)
        ]

        // Load environment files in order
        for (const envFile of envFiles) {
            const envPath = path.join(cwd, envFile)
            if (fs.existsSync(envPath)) {
                console.log(
                    `[ConfigManager] Loading environment file: ${envFile}`
                )
                const result = dotenv.config({ path: envPath })

                if (result.error) {
                    console.warn(
                        `[ConfigManager] Warning: Failed to load ${envFile}:`,
                        result.error.message
                    )
                } else {
                    console.log(
                        `[ConfigManager] Successfully loaded ${envFile}`
                    )
                }
            } else {
                console.log(
                    `[ConfigManager] Environment file not found: ${envFile}`
                )
            }
        }

        // Log the final environment being used
        console.log(`[ConfigManager] Environment: ${environment}`)
        console.log(
            `[ConfigManager] Node environment: ${process.env.NODE_ENV || 'not set'}`
        )

        // Log key environment variables for debugging
        const keyVars = ['DATABASE_URL', 'JWT_SECRET', 'PORT', 'NODE_ENV']
        console.log('[ConfigManager] Key environment variables:')
        keyVars.forEach((varName) => {
            const value = process.env[varName]
            if (value) {
                const displayValue =
                    varName.includes('SECRET') ||
                    varName.includes('PASSWORD') ||
                    varName.includes('KEY')
                        ? '***SET***'
                        : value
                console.log(`  ${varName}: ${displayValue}`)
            } else {
                console.log(`  ${varName}: NOT SET`)
            }
        })
    }

    static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager()
        }
        return ConfigManager.instance
    }

    /**
     * Load configuration for the current environment
     */
    async load(
        environment: string = process.env.NODE_ENV || 'development'
    ): Promise<AppConfig> {
        if (this.config) {
            return this.config
        }

        try {
            // Load environment-specific config
            const envConfigPath = path.join(
                this.configPath,
                `${environment}.ts`
            )
            let envConfig: Partial<AppConfig> = {}

            if (fs.existsSync(envConfigPath)) {
                // In a real implementation, you'd import the config file
                // For now, we'll use a basic structure
                envConfig = await this.loadEnvironmentConfig(environment)
            }

            // Load base config
            const baseConfig = await this.loadBaseConfig()

            // Merge configurations
            this.config = this.mergeConfigs(baseConfig, envConfig)

            // Validate configuration
            const validation = this.validate(this.config)
            if (!validation.isValid) {
                throw new Error(
                    `Configuration validation failed: ${validation.errors.join(', ')}`
                )
            }

            return this.config
        } catch (error: any) {
            throw new Error(`Failed to load configuration: ${error.message}`)
        }
    }

    /**
     * Get current configuration
     */
    get(): AppConfig {
        if (!this.config) {
            throw new Error('Configuration not loaded. Call load() first.')
        }
        return this.config
    }

    /**
     * Reload configuration
     */
    async reload(environment?: string): Promise<AppConfig> {
        this.config = null
        return await this.load(environment)
    }

    /**
     * Validate configuration
     */
    validate(config: AppConfig): ConfigValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        // Validate required fields
        if (!config.port || config.port <= 0) {
            errors.push('Port must be a positive number')
        }

        if (!config.host) {
            errors.push('Host is required')
        }

        if (!config.auth?.jwtSecret) {
            errors.push('JWT secret is required')
        }

        if (!config.database?.host) {
            errors.push('Database host is required')
        }

        // Validate auth providers
        if (
            config.auth?.providers?.firebase?.enabled &&
            !config.auth.providers.firebase.projectId
        ) {
            errors.push(
                'Firebase project ID is required when Firebase auth is enabled'
            )
        }

        // Validate notification providers
        if (
            config.notifications?.email?.enabled &&
            !config.notifications.email.defaults?.from
        ) {
            warnings.push(
                'Email from address is recommended when email notifications are enabled'
            )
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        }
    }

    /**
     * Get configuration for a specific module
     */
    getModuleConfig(moduleName: string): any {
        const config = this.get()
        return config.plugins?.find((p) => p.name === moduleName)?.config || {}
    }

    /**
     * Update configuration dynamically
     */
    async updateConfig(updates: Partial<AppConfig>): Promise<void> {
        if (!this.config) {
            throw new Error('Configuration not loaded')
        }

        this.config = { ...this.config, ...updates }

        // Validate updated config
        const validation = this.validate(this.config)
        if (!validation.isValid) {
            throw new Error(
                `Configuration validation failed: ${validation.errors.join(', ')}`
            )
        }
    }

    /**
     * Get information about loaded environment files
     */
    getEnvironmentInfo(): {
        environment: string
        loadedFiles: string[]
        availableFiles: string[]
    } {
        const environment = process.env.NODE_ENV || 'development'
        const cwd = process.cwd()

        const envFiles = [
            '.env.example',
            '.env',
            `.env.${environment}`,
            '.env.local',
        ]

        const loadedFiles: string[] = []
        const availableFiles: string[] = []

        for (const envFile of envFiles) {
            const envPath = path.join(cwd, envFile)
            if (fs.existsSync(envPath)) {
                availableFiles.push(envFile)
                loadedFiles.push(envFile)
            }
        }

        return {
            environment,
            loadedFiles,
            availableFiles,
        }
    }

    /**
     * Validate environment configuration
     */
    validateEnvironment(): {
        isValid: boolean
        issues: string[]
        recommendations: string[]
    } {
        const issues: string[] = []
        const recommendations: string[] = []
        const envInfo = this.getEnvironmentInfo()

        // Check if any environment files exist
        if (envInfo.availableFiles.length === 0) {
            issues.push('No environment files found')
            recommendations.push('Create a .env.example file as a template')
            recommendations.push(
                'Create a .env file for your local configuration'
            )
        }

        // Check if environment-specific file exists
        const envSpecificFile = `.env.${envInfo.environment}`
        if (!envInfo.availableFiles.includes(envSpecificFile)) {
            recommendations.push(
                `Consider creating ${envSpecificFile} for ${envInfo.environment}-specific settings`
            )
        }

        // Check for required environment variables
        const requiredVars = ['JWT_SECRET', 'DATABASE_URL', 'PORT']
        for (const requiredVar of requiredVars) {
            if (!process.env[requiredVar]) {
                issues.push(
                    `Missing required environment variable: ${requiredVar}`
                )
            }
        }

        return {
            isValid: issues.length === 0,
            issues,
            recommendations,
        }
    }

    private async loadEnvironmentConfig(
        environment: string
    ): Promise<Partial<AppConfig>> {
        return {
            environment: environment as any,
            port: parseInt(process.env.PORT || '3000'),
            host: process.env.HOST || 'localhost',
            logging: {
                level: (process.env.LOG_LEVEL ||
                    (environment === 'production' ? 'warn' : 'debug')) as
                    | 'warn'
                    | 'debug'
                    | 'error'
                    | 'info',
                file: process.env.LOG_FILE || 'logs/app.log',
            },
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                credentials: process.env.CORS_CREDENTIALS === 'true',
            },
            security: {
                rateLimit: {
                    windowMs: parseInt(
                        process.env.RATE_LIMIT_WINDOW_MS || '900000'
                    ),
                    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
                },
                helmet: process.env.HELMET_ENABLED !== 'false',
                compression: process.env.COMPRESSION_ENABLED !== 'false',
            },
            database: {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '3306'),
                username: process.env.DB_USERNAME || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_DATABASE || 'diagramers',
                dialect: (process.env.DB_DIALECT || 'mysql') as
                    | 'mysql'
                    | 'postgres'
                    | 'sqlite'
                    | 'mariadb'
                    | 'mongodb',
                logging: process.env.DB_LOGGING === 'true',
            },
            auth: {
                jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
                jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
                refreshTokenExpiresIn:
                    process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
                defaultProvider:
                    process.env.AUTH_DEFAULT_PROVIDER || 'internal',
                allowMultipleProviders:
                    process.env.AUTH_ALLOW_MULTIPLE_PROVIDERS === 'true',
                sessionTimeout: parseInt(
                    process.env.AUTH_SESSION_TIMEOUT || '86400'
                ),
                maxLoginAttempts: parseInt(
                    process.env.AUTH_MAX_LOGIN_ATTEMPTS || '5'
                ),
                lockoutDuration: parseInt(
                    process.env.AUTH_LOCKOUT_DURATION || '900'
                ),
                passwordPolicy: {
                    minLength: parseInt(
                        process.env.AUTH_PASSWORD_MIN_LENGTH || '8'
                    ),
                    requireUppercase:
                        process.env.AUTH_PASSWORD_REQUIRE_UPPERCASE !== 'false',
                    requireLowercase:
                        process.env.AUTH_PASSWORD_REQUIRE_LOWERCASE !== 'false',
                    requireNumbers:
                        process.env.AUTH_PASSWORD_REQUIRE_NUMBERS !== 'false',
                    requireSpecialChars:
                        process.env.AUTH_PASSWORD_REQUIRE_SPECIAL_CHARS !==
                        'false',
                },
                providers: {
                    internal: {
                        enabled: process.env.INTERNAL_AUTH_ENABLED !== 'false',
                        allowRegistration:
                            process.env.INTERNAL_AUTH_ALLOW_REGISTRATION !==
                            'false',
                        requireEmailVerification:
                            process.env
                                .INTERNAL_AUTH_REQUIRE_EMAIL_VERIFICATION ===
                            'true',
                        allowPasswordReset:
                            process.env.INTERNAL_AUTH_ALLOW_PASSWORD_RESET !==
                            'false',
                        bcryptRounds: parseInt(
                            process.env.INTERNAL_AUTH_BCRYPT_ROUNDS || '12'
                        ),
                        database: {
                            userTable:
                                process.env.INTERNAL_AUTH_USER_TABLE || 'users',
                            tokenTable:
                                process.env.INTERNAL_AUTH_TOKEN_TABLE ||
                                'auth_tokens',
                            sessionTable:
                                process.env.INTERNAL_AUTH_SESSION_TABLE ||
                                'user_sessions',
                        },
                    },
                    firebase: {
                        enabled: process.env.FIREBASE_ENABLED === 'true',
                        projectId: process.env.FIREBASE_PROJECT_ID || '',
                        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID || '',
                        privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
                        clientId: process.env.FIREBASE_CLIENT_ID || '',
                        authUri: process.env.FIREBASE_AUTH_URI || '',
                        tokenUri: process.env.FIREBASE_TOKEN_URI || '',
                        authProviderX509CertUrl:
                            process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
                            '',
                        clientX509CertUrl:
                            process.env.FIREBASE_CLIENT_X509_CERT_URL || '',
                        adminSDK: {
                            type:
                                process.env.FIREBASE_ADMIN_SDK_TYPE ||
                                'service_account',
                            project_id: process.env.FIREBASE_PROJECT_ID || '',
                            private_key_id:
                                process.env.FIREBASE_PRIVATE_KEY_ID || '',
                            private_key: process.env.FIREBASE_PRIVATE_KEY || '',
                            client_email:
                                process.env.FIREBASE_CLIENT_EMAIL || '',
                            client_id: process.env.FIREBASE_CLIENT_ID || '',
                            auth_uri: process.env.FIREBASE_AUTH_URI || '',
                            token_uri: process.env.FIREBASE_TOKEN_URI || '',
                            auth_provider_x509_cert_url:
                                process.env
                                    .FIREBASE_AUTH_PROVIDER_X509_CERT_URL || '',
                            client_x509_cert_url:
                                process.env.FIREBASE_CLIENT_X509_CERT_URL || '',
                        },
                    },
                    oauth: {
                        enabled: process.env.OAUTH_ENABLED === 'true',
                        providers: {
                            google: {
                                enabled: process.env.GOOGLE_CLIENT_ID
                                    ? true
                                    : false,
                                clientId: process.env.GOOGLE_CLIENT_ID || '',
                                clientSecret:
                                    process.env.GOOGLE_CLIENT_SECRET || '',
                                callbackUrl:
                                    process.env.GOOGLE_CALLBACK_URL || '',
                                scope: ['email', 'profile'],
                            },
                            github: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                            facebook: {
                                enabled:
                                    process.env.FACEBOOK_OAUTH_ENABLED ===
                                    'true',
                                clientId: process.env.FACEBOOK_CLIENT_ID || '',
                                clientSecret:
                                    process.env.FACEBOOK_CLIENT_SECRET || '',
                                callbackUrl:
                                    process.env.FACEBOOK_CALLBACK_URL ||
                                    '/auth/facebook/callback',
                                scope: process.env.FACEBOOK_SCOPE
                                    ? process.env.FACEBOOK_SCOPE.split(',')
                                    : ['email'],
                            },
                            twitter: {
                                enabled:
                                    process.env.TWITTER_OAUTH_ENABLED ===
                                    'true',
                                clientId: process.env.TWITTER_CLIENT_ID || '',
                                clientSecret:
                                    process.env.TWITTER_CLIENT_SECRET || '',
                                callbackUrl:
                                    process.env.TWITTER_CALLBACK_URL ||
                                    '/auth/twitter/callback',
                                scope: process.env.TWITTER_SCOPE
                                    ? process.env.TWITTER_SCOPE.split(',')
                                    : ['tweet.read', 'users.read'],
                            },
                            linkedin: {
                                enabled:
                                    process.env.LINKEDIN_OAUTH_ENABLED ===
                                    'true',
                                clientId: process.env.LINKEDIN_CLIENT_ID || '',
                                clientSecret:
                                    process.env.LINKEDIN_CLIENT_SECRET || '',
                                callbackUrl:
                                    process.env.LINKEDIN_CALLBACK_URL ||
                                    '/auth/linkedin/callback',
                                scope: process.env.LINKEDIN_SCOPE
                                    ? process.env.LINKEDIN_SCOPE.split(',')
                                    : ['r_liteprofile', 'r_emailaddress'],
                            },
                            microsoft: {
                                enabled:
                                    process.env.MICROSOFT_OAUTH_ENABLED ===
                                    'true',
                                clientId: process.env.MICROSOFT_CLIENT_ID || '',
                                clientSecret:
                                    process.env.MICROSOFT_CLIENT_SECRET || '',
                                callbackUrl:
                                    process.env.MICROSOFT_CALLBACK_URL ||
                                    '/auth/microsoft/callback',
                                scope: process.env.MICROSOFT_SCOPE
                                    ? process.env.MICROSOFT_SCOPE.split(',')
                                    : ['openid', 'profile', 'email'],
                            },
                            apple: {
                                enabled:
                                    process.env.APPLE_OAUTH_ENABLED === 'true',
                                clientId: process.env.APPLE_CLIENT_ID || '',
                                clientSecret:
                                    process.env.APPLE_CLIENT_SECRET || '',
                                callbackUrl:
                                    process.env.APPLE_CALLBACK_URL ||
                                    '/auth/apple/callback',
                                scope: process.env.APPLE_SCOPE
                                    ? process.env.APPLE_SCOPE.split(',')
                                    : ['name', 'email'],
                            },
                            discord: {
                                enabled:
                                    process.env.DISCORD_OAUTH_ENABLED ===
                                    'true',
                                clientId: process.env.DISCORD_CLIENT_ID || '',
                                clientSecret:
                                    process.env.DISCORD_CLIENT_SECRET || '',
                                callbackUrl:
                                    process.env.DISCORD_CALLBACK_URL ||
                                    '/auth/discord/callback',
                                scope: process.env.DISCORD_SCOPE
                                    ? process.env.DISCORD_SCOPE.split(',')
                                    : ['identify', 'email'],
                            },
                            spotify: {
                                enabled:
                                    process.env.SPOTIFY_OAUTH_ENABLED ===
                                    'true',
                                clientId: process.env.SPOTIFY_CLIENT_ID || '',
                                clientSecret:
                                    process.env.SPOTIFY_CLIENT_SECRET || '',
                                callbackUrl:
                                    process.env.SPOTIFY_CALLBACK_URL ||
                                    '/auth/spotify/callback',
                                scope: process.env.SPOTIFY_SCOPE
                                    ? process.env.SPOTIFY_SCOPE.split(',')
                                    : ['user-read-email'],
                            },
                            twitch: {
                                enabled:
                                    process.env.TWITCH_OAUTH_ENABLED === 'true',
                                clientId: process.env.TWITCH_CLIENT_ID || '',
                                clientSecret:
                                    process.env.TWITCH_CLIENT_SECRET || '',
                                callbackUrl:
                                    process.env.TWITCH_CALLBACK_URL ||
                                    '/auth/twitch/callback',
                                scope: process.env.TWITCH_SCOPE
                                    ? process.env.TWITCH_SCOPE.split(',')
                                    : ['user:read:email'],
                            },
                        },
                    },
                    sms: {
                        enabled: process.env.SMS_ENABLED === 'true',
                        provider: (process.env.SMS_PROVIDER || 'twilio') as
                            | 'twilio'
                            | 'aws-sns'
                            | 'vonage'
                            | 'messagebird'
                            | 'custom',
                        codeLength: parseInt(
                            process.env.SMS_CODE_LENGTH || '6'
                        ),
                        codeExpiration: parseInt(
                            process.env.SMS_CODE_EXPIRATION || '300'
                        ),
                        maxAttempts: parseInt(
                            process.env.SMS_MAX_ATTEMPTS || '3'
                        ),
                        twilio: {
                            accountSid: process.env.TWILIO_ACCOUNT_SID || '',
                            authToken: process.env.TWILIO_AUTH_TOKEN || '',
                            fromNumber: process.env.TWILIO_PHONE_NUMBER || '',
                        },
                    },
                    email: {
                        enabled: process.env.EMAIL_ENABLED === 'true',
                        provider: 'nodemailer' as
                            | 'nodemailer'
                            | 'sendgrid'
                            | 'aws-ses'
                            | 'mailgun'
                            | 'postmark'
                            | 'custom',
                        codeLength: parseInt(
                            process.env.EMAIL_CODE_LENGTH || '6'
                        ),
                        codeExpiration: parseInt(
                            process.env.EMAIL_CODE_EXPIRATION || '300'
                        ),
                        maxAttempts: parseInt(
                            process.env.EMAIL_MAX_ATTEMPTS || '3'
                        ),
                        templates: {
                            verification:
                                process.env.EMAIL_VERIFICATION_TEMPLATE ||
                                'verification',
                            passwordReset:
                                process.env.EMAIL_PASSWORD_RESET_TEMPLATE ||
                                'password-reset',
                            loginCode:
                                process.env.EMAIL_LOGIN_CODE_TEMPLATE ||
                                'login-code',
                        },
                    },
                },
            },
            notifications: {
                email: {
                    enabled: process.env.EMAIL_ENABLED === 'true',
                    provider: 'nodemailer',
                    templates: {
                        path: './templates/email',
                        engine: 'handlebars',
                    },
                    defaults: {
                        from: process.env.EMAIL_FROM || '',
                        replyTo: process.env.EMAIL_FROM || '',
                    },
                },
                sms: {
                    enabled: process.env.SMS_ENABLED === 'true',
                    provider: 'twilio',
                    defaults: {
                        from: process.env.TWILIO_PHONE_NUMBER || '',
                    },
                },
                push: {
                    enabled: false,
                    provider: 'firebase',
                },
            },
            odoo: {
                enabled: process.env.ODOO_ENABLED === 'true',
                server: {
                    url: process.env.ODOO_URL || 'localhost',
                    port: parseInt(process.env.ODOO_PORT || '8069'),
                    protocol:
                        (process.env.ODOO_PROTOCOL as 'http' | 'https') ||
                        'http',
                },
                authentication: {
                    username: process.env.ODOO_USERNAME || 'admin',
                    password: process.env.ODOO_PASSWORD || 'admin',
                    database: process.env.ODOO_DATABASE || 'odoo',
                    company: parseInt(process.env.ODOO_COMPANY || '1'),
                },
                models: {
                    users: {
                        enabled:
                            process.env.ODOO_MODEL_USERS_ENABLED !== 'false',
                        model: 'res.users',
                        fields: [
                            'id',
                            'name',
                            'email',
                            'login',
                            'active',
                            'company_id',
                            'partner_id',
                        ],
                        mapping: {},
                        syncDirection: 'inbound',
                        createOnSync: false,
                        updateOnSync: true,
                    },
                    customers: {
                        enabled:
                            process.env.ODOO_MODEL_CUSTOMERS_ENABLED !==
                            'false',
                        model: 'res.partner',
                        fields: [
                            'id',
                            'name',
                            'email',
                            'phone',
                            'mobile',
                            'street',
                            'city',
                            'country_id',
                            'is_company',
                        ],
                        mapping: {},
                        syncDirection: 'bidirectional',
                        createOnSync: true,
                        updateOnSync: true,
                    },
                    leads: {
                        enabled:
                            process.env.ODOO_MODEL_LEADS_ENABLED !== 'false',
                        model: 'crm.lead',
                        fields: [
                            'id',
                            'name',
                            'partner_name',
                            'contact_name',
                            'email_from',
                            'phone',
                            'type',
                            'stage_id',
                        ],
                        mapping: {},
                        syncDirection: 'bidirectional',
                        createOnSync: true,
                        updateOnSync: true,
                    },
                    opportunities: {
                        enabled:
                            process.env.ODOO_MODEL_OPPORTUNITIES_ENABLED !==
                            'false',
                        model: 'crm.lead',
                        fields: [
                            'id',
                            'name',
                            'partner_id',
                            'contact_name',
                            'email_from',
                            'phone',
                            'type',
                            'stage_id',
                            'probability',
                        ],
                        mapping: {},
                        syncDirection: 'bidirectional',
                        createOnSync: true,
                        updateOnSync: true,
                    },
                    contacts: {
                        enabled:
                            process.env.ODOO_MODEL_CONTACTS_ENABLED !== 'false',
                        model: 'res.partner',
                        fields: [
                            'id',
                            'name',
                            'email',
                            'phone',
                            'mobile',
                            'street',
                            'city',
                            'country_id',
                        ],
                        mapping: {},
                        syncDirection: 'bidirectional',
                        createOnSync: true,
                        updateOnSync: true,
                    },
                    companies: {
                        enabled:
                            process.env.ODOO_MODEL_COMPANIES_ENABLED !==
                            'false',
                        model: 'res.company',
                        fields: [
                            'id',
                            'name',
                            'email',
                            'phone',
                            'street',
                            'city',
                            'country_id',
                        ],
                        mapping: {},
                        syncDirection: 'inbound',
                        createOnSync: false,
                        updateOnSync: true,
                    },
                    products: {
                        enabled:
                            process.env.ODOO_MODEL_PRODUCTS_ENABLED !== 'false',
                        model: 'product.template',
                        fields: [
                            'id',
                            'name',
                            'description',
                            'list_price',
                            'standard_price',
                            'type',
                        ],
                        mapping: {},
                        syncDirection: 'inbound',
                        createOnSync: false,
                        updateOnSync: true,
                    },
                    orders: {
                        enabled:
                            process.env.ODOO_MODEL_ORDERS_ENABLED !== 'false',
                        model: 'sale.order',
                        fields: [
                            'id',
                            'name',
                            'partner_id',
                            'date_order',
                            'amount_total',
                            'state',
                        ],
                        mapping: {},
                        syncDirection: 'inbound',
                        createOnSync: false,
                        updateOnSync: true,
                    },
                    invoices: {
                        enabled:
                            process.env.ODOO_MODEL_INVOICES_ENABLED !== 'false',
                        model: 'account.move',
                        fields: [
                            'id',
                            'name',
                            'partner_id',
                            'invoice_date',
                            'amount_total',
                            'state',
                        ],
                        mapping: {},
                        syncDirection: 'inbound',
                        createOnSync: false,
                        updateOnSync: true,
                    },
                },
                sync: {
                    enabled: process.env.ODOO_SYNC_ENABLED === 'true',
                    interval: parseInt(process.env.ODOO_SYNC_INTERVAL || '30'),
                    batchSize: parseInt(
                        process.env.ODOO_SYNC_BATCH_SIZE || '100'
                    ),
                    retryAttempts: parseInt(
                        process.env.ODOO_SYNC_RETRY_ATTEMPTS || '3'
                    ),
                    retryDelay: parseInt(
                        process.env.ODOO_SYNC_RETRY_DELAY || '1000'
                    ),
                },
                webhooks: {
                    enabled: process.env.ODOO_WEBHOOKS_ENABLED === 'true',
                    secret: process.env.ODOO_WEBHOOKS_SECRET || '',
                    events: process.env.ODOO_WEBHOOKS_EVENTS
                        ? process.env.ODOO_WEBHOOKS_EVENTS.split(',')
                        : [],
                },
            },
        }
    }

    private async loadBaseConfig(): Promise<Partial<AppConfig>> {
        // Load base configuration
        return {
            environment: 'development',
            port: parseInt(process.env.PORT || '3000'),
            host: 'localhost',
            cors: {
                origin: '*',
                credentials: false,
            },
            database: {
                host: 'localhost',
                port: 3306,
                username: 'root',
                password: '',
                database: 'diagramers',
                dialect: 'mysql',
                logging: false,
            },
            auth: {
                jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
                jwtExpiresIn: '1h',
                refreshTokenExpiresIn: '7d',
                defaultProvider: 'internal',
                allowMultipleProviders: false,
                sessionTimeout: 86400,
                maxLoginAttempts: 5,
                lockoutDuration: 900,
                passwordPolicy: {
                    minLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSpecialChars: true,
                },
                providers: {
                    internal: {
                        enabled: true,
                        allowRegistration: true,
                        requireEmailVerification: false,
                        allowPasswordReset: true,
                        bcryptRounds: 12,
                        database: {
                            userTable: 'users',
                            tokenTable: 'auth_tokens',
                            sessionTable: 'user_sessions',
                        },
                    },
                    firebase: {
                        enabled: false,
                        projectId: '',
                        privateKeyId: '',
                        privateKey: '',
                        clientEmail: '',
                        clientId: '',
                        authUri: '',
                        tokenUri: '',
                        authProviderX509CertUrl: '',
                        clientX509CertUrl: '',
                        adminSDK: {
                            type: 'service_account',
                            project_id: '',
                            private_key_id: '',
                            private_key: '',
                            client_email: '',
                            client_id: '',
                            auth_uri: '',
                            token_uri: '',
                            auth_provider_x509_cert_url: '',
                            client_x509_cert_url: '',
                        },
                    },
                    oauth: {
                        enabled: false,
                        providers: {
                            google: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                            github: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                            facebook: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                            twitter: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                            linkedin: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                            microsoft: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                            apple: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                            discord: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                            spotify: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                            twitch: {
                                enabled: false,
                                clientId: '',
                                clientSecret: '',
                                callbackUrl: '',
                                scope: [],
                            },
                        },
                    },
                    sms: {
                        enabled: false,
                        provider: 'twilio' as
                            | 'twilio'
                            | 'aws-sns'
                            | 'vonage'
                            | 'messagebird'
                            | 'custom',
                        codeLength: 6,
                        codeExpiration: 300,
                        maxAttempts: 3,
                    },
                    email: {
                        enabled: false,
                        provider: 'nodemailer' as
                            | 'nodemailer'
                            | 'sendgrid'
                            | 'aws-ses'
                            | 'mailgun'
                            | 'postmark'
                            | 'custom',
                        codeLength: 6,
                        codeExpiration: 300,
                        maxAttempts: 3,
                        templates: {
                            verification: 'verification',
                            passwordReset: 'password-reset',
                            loginCode: 'login-code',
                        },
                    },
                },
            },
            notifications: {
                email: {
                    enabled: false,
                    provider: 'nodemailer',
                    templates: {
                        path: './templates/email',
                        engine: 'handlebars',
                    },
                    defaults: {
                        from: '',
                        replyTo: '',
                    },
                },
                sms: {
                    enabled: false,
                    provider: 'twilio',
                    defaults: {
                        from: '',
                    },
                },
                push: {
                    enabled: false,
                    provider: 'firebase',
                },
            },
            plugins: [],
            logging: {
                level: 'info',
            },
            security: {
                rateLimit: {
                    windowMs: 15 * 60 * 1000, // 15 minutes
                    max: 100,
                },
                helmet: true,
                compression: true,
            },
            odoo: {
                enabled: false,
                server: {
                    url: 'localhost',
                    port: 8069,
                    protocol: 'http',
                },
                authentication: {
                    username: 'admin',
                    password: 'admin',
                    database: 'odoo',
                    company: 1,
                },
                models: {
                    users: {
                        enabled: true,
                        model: 'res.users',
                        fields: [
                            'id',
                            'name',
                            'email',
                            'login',
                            'active',
                            'company_id',
                            'partner_id',
                        ],
                        mapping: {},
                        syncDirection: 'inbound',
                        createOnSync: false,
                        updateOnSync: true,
                    },
                    customers: {
                        enabled: true,
                        model: 'res.partner',
                        fields: [
                            'id',
                            'name',
                            'email',
                            'phone',
                            'mobile',
                            'street',
                            'city',
                            'country_id',
                            'is_company',
                        ],
                        mapping: {},
                        syncDirection: 'bidirectional',
                        createOnSync: true,
                        updateOnSync: true,
                    },
                    leads: {
                        enabled: true,
                        model: 'crm.lead',
                        fields: [
                            'id',
                            'name',
                            'partner_name',
                            'contact_name',
                            'email_from',
                            'phone',
                            'type',
                            'stage_id',
                        ],
                        mapping: {},
                        syncDirection: 'bidirectional',
                        createOnSync: true,
                        updateOnSync: true,
                    },
                    opportunities: {
                        enabled: true,
                        model: 'crm.lead',
                        fields: [
                            'id',
                            'name',
                            'partner_id',
                            'contact_name',
                            'email_from',
                            'phone',
                            'type',
                            'stage_id',
                            'probability',
                        ],
                        mapping: {},
                        syncDirection: 'bidirectional',
                        createOnSync: true,
                        updateOnSync: true,
                    },
                    contacts: {
                        enabled: true,
                        model: 'res.partner',
                        fields: [
                            'id',
                            'name',
                            'email',
                            'phone',
                            'mobile',
                            'street',
                            'city',
                            'country_id',
                        ],
                        mapping: {},
                        syncDirection: 'bidirectional',
                        createOnSync: true,
                        updateOnSync: true,
                    },
                    companies: {
                        enabled: true,
                        model: 'res.company',
                        fields: [
                            'id',
                            'name',
                            'email',
                            'phone',
                            'street',
                            'city',
                            'country_id',
                        ],
                        mapping: {},
                        syncDirection: 'inbound',
                        createOnSync: false,
                        updateOnSync: true,
                    },
                    products: {
                        enabled: true,
                        model: 'product.template',
                        fields: [
                            'id',
                            'name',
                            'description',
                            'list_price',
                            'standard_price',
                            'type',
                        ],
                        mapping: {},
                        syncDirection: 'inbound',
                        createOnSync: false,
                        updateOnSync: true,
                    },
                    orders: {
                        enabled: true,
                        model: 'sale.order',
                        fields: [
                            'id',
                            'name',
                            'partner_id',
                            'date_order',
                            'amount_total',
                            'state',
                        ],
                        mapping: {},
                        syncDirection: 'inbound',
                        createOnSync: false,
                        updateOnSync: true,
                    },
                    invoices: {
                        enabled: true,
                        model: 'account.move',
                        fields: [
                            'id',
                            'name',
                            'partner_id',
                            'invoice_date',
                            'amount_total',
                            'state',
                        ],
                        mapping: {},
                        syncDirection: 'inbound',
                        createOnSync: false,
                        updateOnSync: true,
                    },
                },
                sync: {
                    enabled: false,
                    interval: 30,
                    batchSize: 100,
                    retryAttempts: 3,
                    retryDelay: 1000,
                },
                webhooks: {
                    enabled: false,
                    secret: '',
                    events: [],
                },
            },
        }
    }

    private mergeConfigs(
        base: Partial<AppConfig>,
        env: Partial<AppConfig>
    ): AppConfig {
        // Deep merge configurations
        return {
            ...base,
            ...env,
            auth: {
                ...base.auth,
                ...env.auth,
                providers: {
                    ...base.auth?.providers,
                    ...env.auth?.providers,
                },
            },
            notifications: {
                ...base.notifications,
                ...env.notifications,
            },
            database: {
                ...base.database,
                ...env.database,
            },
        } as AppConfig
    }
}
