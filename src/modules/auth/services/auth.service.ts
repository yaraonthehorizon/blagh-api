import { AuthModule } from '../auth.module'
import {
    BaseAuthProvider,
    AuthCredentials,
    AuthResult,
} from '../providers/base-auth-provider'
import { MongoDBAdapter } from '../../../shared/utils/mongodb-adapter'
import { DatabaseConfig } from '../../../shared/types/database-adapter'
import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'
import { VerificationCodeModel } from '../schemas/verification-code.schema'
import { TokenModel } from '../schemas/token.schema'

export interface RegisterData {
    email: string
    password: string
    name: string
    phone?: string
}

export interface LoginData {
    email: string
    password: string
}

export class AuthService {
    private authModule: AuthModule
    private initializationPromise: Promise<void>
    // Remove the static tokenBlacklist - we'll use database tokens instead

    constructor(config?: any) {
        // Load environment variables if not already loaded
        if (!process.env.AUTH_INTERNAL_ENABLED) {
            require('dotenv').config()
        }

        // Initialize the auth module
        this.initializationPromise = this.initializeAuthModule(config)
    }

    private async initializeAuthModule(config?: any): Promise<void> {
        // Use provided config or create default config
        const authConfig = config?.auth || {
            jwtSecret: process.env.JWT_SECRET || 'default-secret',
            jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
            refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
            defaultProvider: process.env.AUTH_DEFAULT_PROVIDER || 'internal',
            allowMultipleProviders:
                process.env.AUTH_ALLOW_MULTIPLE_PROVIDERS === 'true',
            sessionTimeout: parseInt(
                process.env.AUTH_SESSION_TIMEOUT || '3600'
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
                    process.env.AUTH_PASSWORD_REQUIRE_UPPERCASE === 'true',
                requireLowercase:
                    process.env.AUTH_PASSWORD_REQUIRE_LOWERCASE === 'true',
                requireNumbers:
                    process.env.AUTH_PASSWORD_REQUIRE_NUMBERS === 'true',
                requireSpecialChars:
                    process.env.AUTH_PASSWORD_REQUIRE_SPECIAL_CHARS === 'true',
            },
            providers: {
                internal: {
                    enabled: process.env.AUTH_INTERNAL_ENABLED !== 'false', // Default to true unless explicitly set to false
                    allowRegistration:
                        process.env.AUTH_INTERNAL_ALLOW_REGISTRATION !==
                        'false',
                    requireEmailVerification:
                        process.env.AUTH_INTERNAL_REQUIRE_EMAIL_VERIFICATION ===
                        'true',
                    allowPasswordReset:
                        process.env.AUTH_INTERNAL_ALLOW_PASSWORD_RESET !==
                        'false',
                    bcryptRounds: parseInt(
                        process.env.AUTH_INTERNAL_BCRYPT_ROUNDS || '12'
                    ),
                    database: {
                        userTable:
                            process.env.AUTH_INTERNAL_USER_TABLE || 'users',
                        tokenTable:
                            process.env.AUTH_INTERNAL_TOKEN_TABLE ||
                            'auth_tokens',
                        sessionTable:
                            process.env.AUTH_INTERNAL_SESSION_TABLE ||
                            'auth_sessions',
                    },
                },
                firebase: {
                    enabled: process.env.AUTH_FIREBASE_ENABLED === 'true',
                    projectId: process.env.AUTH_FIREBASE_PROJECT_ID || '',
                    privateKeyId:
                        process.env.AUTH_FIREBASE_PRIVATE_KEY_ID || '',
                    privateKey: process.env.AUTH_FIREBASE_PRIVATE_KEY || '',
                    clientEmail: process.env.AUTH_FIREBASE_CLIENT_EMAIL || '',
                    clientId: process.env.AUTH_FIREBASE_CLIENT_ID || '',
                    authUri: process.env.AUTH_FIREBASE_AUTH_URI || '',
                    tokenUri: process.env.AUTH_FIREBASE_TOKEN_URI || '',
                    authProviderX509CertUrl:
                        process.env.AUTH_FIREBASE_AUTH_PROVIDER_X509_CERT_URL ||
                        '',
                    clientX509CertUrl:
                        process.env.AUTH_FIREBASE_CLIENT_X509_CERT_URL || '',
                    adminSDK: {
                        type:
                            process.env.AUTH_FIREBASE_ADMIN_TYPE ||
                            'service_account',
                        project_id:
                            process.env.AUTH_FIREBASE_ADMIN_PROJECT_ID || '',
                        private_key_id:
                            process.env.AUTH_FIREBASE_ADMIN_PRIVATE_KEY_ID ||
                            '',
                        private_key:
                            process.env.AUTH_FIREBASE_ADMIN_PRIVATE_KEY || '',
                        client_email:
                            process.env.AUTH_FIREBASE_ADMIN_CLIENT_EMAIL || '',
                        client_id:
                            process.env.AUTH_FIREBASE_ADMIN_CLIENT_ID || '',
                        auth_uri:
                            process.env.AUTH_FIREBASE_ADMIN_AUTH_URI || '',
                        token_uri:
                            process.env.AUTH_FIREBASE_ADMIN_TOKEN_URI || '',
                        auth_provider_x509_cert_url:
                            process.env
                                .AUTH_FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL ||
                            '',
                        client_x509_cert_url:
                            process.env
                                .AUTH_FIREBASE_ADMIN_CLIENT_X509_CERT_URL || '',
                    },
                },
                oauth: {
                    enabled: process.env.AUTH_OAUTH_ENABLED === 'true',
                    providers: {
                        google: {
                            enabled:
                                process.env.AUTH_OAUTH_GOOGLE_ENABLED ===
                                'true',
                            clientId:
                                process.env.AUTH_OAUTH_GOOGLE_CLIENT_ID || '',
                            clientSecret:
                                process.env.AUTH_OAUTH_GOOGLE_CLIENT_SECRET ||
                                '',
                            callbackUrl:
                                process.env.AUTH_OAUTH_GOOGLE_CALLBACK_URL ||
                                '',
                            scope: (
                                process.env.AUTH_OAUTH_GOOGLE_SCOPE ||
                                'profile,email'
                            ).split(','),
                        },
                        github: {
                            enabled:
                                process.env.AUTH_OAUTH_GITHUB_ENABLED ===
                                'true',
                            clientId:
                                process.env.AUTH_OAUTH_GITHUB_CLIENT_ID || '',
                            clientSecret:
                                process.env.AUTH_OAUTH_GITHUB_CLIENT_SECRET ||
                                '',
                            callbackUrl:
                                process.env.AUTH_OAUTH_GITHUB_CALLBACK_URL ||
                                '',
                            scope: (
                                process.env.AUTH_OAUTH_GITHUB_SCOPE ||
                                'user:email'
                            ).split(','),
                        },
                        facebook: {
                            enabled:
                                process.env.AUTH_OAUTH_FACEBOOK_ENABLED ===
                                'true',
                            clientId:
                                process.env.AUTH_OAUTH_FACEBOOK_CLIENT_ID || '',
                            clientSecret:
                                process.env.AUTH_OAUTH_FACEBOOK_CLIENT_SECRET ||
                                '',
                            callbackUrl:
                                process.env.AUTH_OAUTH_FACEBOOK_CALLBACK_URL ||
                                '',
                            scope: (
                                process.env.AUTH_OAUTH_FACEBOOK_SCOPE || 'email'
                            ).split(','),
                        },
                        twitter: {
                            enabled:
                                process.env.AUTH_OAUTH_TWITTER_ENABLED ===
                                'true',
                            clientId:
                                process.env.AUTH_OAUTH_TWITTER_CLIENT_ID || '',
                            clientSecret:
                                process.env.AUTH_OAUTH_TWITTER_CLIENT_SECRET ||
                                '',
                            callbackUrl:
                                process.env.AUTH_OAUTH_TWITTER_CALLBACK_URL ||
                                '',
                            scope: (
                                process.env.AUTH_OAUTH_TWITTER_SCOPE ||
                                'tweet.read,users.read'
                            ).split(','),
                        },
                        linkedin: {
                            enabled:
                                process.env.AUTH_OAUTH_LINKEDIN_ENABLED ===
                                'true',
                            clientId:
                                process.env.AUTH_OAUTH_LINKEDIN_CLIENT_ID || '',
                            clientSecret:
                                process.env.AUTH_OAUTH_LINKEDIN_CLIENT_SECRET ||
                                '',
                            callbackUrl:
                                process.env.AUTH_OAUTH_LINKEDIN_CALLBACK_URL ||
                                '',
                            scope: (
                                process.env.AUTH_OAUTH_LINKEDIN_SCOPE ||
                                'r_liteprofile,r_emailaddress'
                            ).split(','),
                        },
                        microsoft: {
                            enabled:
                                process.env.AUTH_OAUTH_MICROSOFT_ENABLED ===
                                'true',
                            clientId:
                                process.env.AUTH_OAUTH_MICROSOFT_CLIENT_ID ||
                                '',
                            clientSecret:
                                process.env
                                    .AUTH_OAUTH_MICROSOFT_CLIENT_SECRET || '',
                            callbackUrl:
                                process.env.AUTH_OAUTH_MICROSOFT_CALLBACK_URL ||
                                '',
                            scope: (
                                process.env.AUTH_OAUTH_MICROSOFT_SCOPE ||
                                'user.read'
                            ).split(','),
                        },
                        apple: {
                            enabled:
                                process.env.AUTH_OAUTH_APPLE_ENABLED === 'true',
                            clientId:
                                process.env.AUTH_OAUTH_APPLE_CLIENT_ID || '',
                            clientSecret:
                                process.env.AUTH_OAUTH_APPLE_CLIENT_SECRET ||
                                '',
                            callbackUrl:
                                process.env.AUTH_OAUTH_APPLE_CALLBACK_URL || '',
                            scope: (
                                process.env.AUTH_OAUTH_APPLE_SCOPE ||
                                'name,email'
                            ).split(','),
                        },
                        discord: {
                            enabled:
                                process.env.AUTH_OAUTH_DISCORD_ENABLED ===
                                'true',
                            clientId:
                                process.env.AUTH_OAUTH_DISCORD_CLIENT_ID || '',
                            clientSecret:
                                process.env.AUTH_OAUTH_DISCORD_CLIENT_SECRET ||
                                '',
                            callbackUrl:
                                process.env.AUTH_OAUTH_DISCORD_CALLBACK_URL ||
                                '',
                            scope: (
                                process.env.AUTH_OAUTH_DISCORD_SCOPE ||
                                'identify,email'
                            ).split(','),
                        },
                    },
                },
                sms: {
                    enabled: process.env.AUTH_SMS_ENABLED === 'true',
                    provider: process.env.AUTH_SMS_PROVIDER || 'twilio',
                    twilio: {
                        accountSid:
                            process.env.AUTH_SMS_TWILIO_ACCOUNT_SID || '',
                        authToken: process.env.AUTH_SMS_TWILIO_AUTH_TOKEN || '',
                        fromNumber:
                            process.env.AUTH_SMS_TWILIO_FROM_NUMBER || '',
                    },
                    aws: {
                        accessKeyId:
                            process.env.AUTH_SMS_AWS_ACCESS_KEY_ID || '',
                        secretAccessKey:
                            process.env.AUTH_SMS_AWS_SECRET_ACCESS_KEY || '',
                        region: process.env.AUTH_SMS_AWS_REGION || 'us-east-1',
                        fromNumber: process.env.AUTH_SMS_AWS_FROM_NUMBER || '',
                    },
                },
                email: {
                    enabled: process.env.AUTH_EMAIL_ENABLED === 'true',
                    provider: process.env.AUTH_EMAIL_PROVIDER || 'nodemailer',
                    nodemailer: {
                        host: process.env.AUTH_EMAIL_NODEMAILER_HOST || '',
                        port: parseInt(
                            process.env.AUTH_EMAIL_NODEMAILER_PORT || '587'
                        ),
                        secure:
                            process.env.AUTH_EMAIL_NODEMAILER_SECURE === 'true',
                        auth: {
                            user: process.env.AUTH_EMAIL_NODEMAILER_USER || '',
                            pass: process.env.AUTH_EMAIL_NODEMAILER_PASS || '',
                        },
                    },
                    aws: {
                        accessKeyId:
                            process.env.AUTH_EMAIL_AWS_ACCESS_KEY_ID || '',
                        secretAccessKey:
                            process.env.AUTH_EMAIL_AWS_SECRET_ACCESS_KEY || '',
                        region:
                            process.env.AUTH_EMAIL_AWS_REGION || 'us-east-1',
                        fromEmail: process.env.AUTH_EMAIL_AWS_FROM_EMAIL || '',
                    },
                },
            },
        }

        // Create database adapter
        const dbConfig: DatabaseConfig = {
            type: 'mongodb',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '27017'),
            database: process.env.DATABASE_NAME || 'diagramers',
            connectionString: process.env.DATABASE_URL,
            options: {},
        }
        const databaseAdapter = new MongoDBAdapter(dbConfig)

        // Create plugin context with proper database adapter
        const pluginContext = {
            config: {
                auth: authConfig,
            },
            logger: {
                info: (message: string) => console.log(message),
                error: (message: string) => console.error(message),
                warn: (message: string) => console.warn(message),
                debug: (message: string) => console.debug(message),
            },
            database: databaseAdapter,
            services: {} as any,
        }

        // Create and initialize the auth module
        this.authModule = new AuthModule(
            { enabled: true, config: {} },
            pluginContext
        )
        await this.authModule.initialize()
        await this.authModule.start()

        // Connect to database
        // await databaseAdapter.connect();
    }

    async login(
        credentials: LoginData,
        provider: string = 'internal'
    ): Promise<AuthResult> {
        // Wait for auth module to be initialized
        await this.initializationPromise

        const authProvider = this.authModule.getProvider(provider)
        if (!authProvider) {
            throw new Error(
                `Authentication provider '${provider}' not found or not enabled`
            )
        }

        const result = await authProvider.authenticate(credentials)

        // If login successful, store tokens in database
        if (result.success && result.token && result.refreshToken) {
            const jwtSecret = process.env.JWT_SECRET || 'default-secret'
            const decoded = jwt.verify(result.token, jwtSecret) as any
            const refreshDecoded = jwt.verify(
                result.refreshToken,
                jwtSecret
            ) as any

            // Store access token
            await TokenModel.create({
                userId: decoded.userId,
                token: result.token,
                type: 'access',
                expiresAt: new Date(decoded.exp * 1000),
                isActive: true,
            })

            // Store refresh token
            await TokenModel.create({
                userId: refreshDecoded.userId,
                token: result.refreshToken,
                type: 'refresh',
                expiresAt: new Date(refreshDecoded.exp * 1000),
                isActive: true,
            })
        }

        return result
    }

    async register(
        userData: RegisterData,
        provider: string = 'internal'
    ): Promise<AuthResult> {
        // Wait for auth module to be initialized
        await this.initializationPromise

        const authProvider = this.authModule.getProvider(provider)
        if (!authProvider) {
            throw new Error(
                `Authentication provider '${provider}' not found or not enabled`
            )
        }

        // For internal provider, hash password before storing (if not handled by provider)
        // (Optional: Remove this if provider handles hashing)
        // if (provider === 'internal') {
        //   const hashedPassword = await bcrypt.hash(userData.password, 12);
        //   userData.password = hashedPassword;
        // }

        // FIX: Call register, not authenticate
        if (typeof authProvider.register === 'function') {
            return await authProvider.register(userData)
        } else {
            throw new Error(`Register not supported for provider '${provider}'`)
        }
    }

    async refreshToken(refreshToken: string): Promise<AuthResult> {
        try {
            // Check if refresh token exists and is active in database
            const tokenDoc = await TokenModel.findOne({
                token: refreshToken,
                type: 'refresh',
                isActive: true,
                expiresAt: { $gt: new Date() },
            })
            if (!tokenDoc) {
                return {
                    success: false,
                    error: 'Invalid or expired refresh token',
                    provider: 'internal',
                }
            }
            const activeProvider = this.authModule.getActiveProvider()
            if (!activeProvider) {
                throw new Error('No active authentication provider')
            }
            const result = await activeProvider.refreshToken(refreshToken)
            // If refresh successful, update tokens in database
            if (result.success && result.token && result.refreshToken) {
                const jwtSecret = process.env.JWT_SECRET || 'default-secret'
                const decoded = jwt.verify(result.token, jwtSecret) as any
                const refreshDecoded = jwt.verify(
                    result.refreshToken,
                    jwtSecret
                ) as any
                // Invalidate old tokens
                await TokenModel.updateMany(
                    { userId: tokenDoc.userId, isActive: true },
                    { isActive: false }
                )
                // Store new access token
                await TokenModel.create({
                    userId: decoded.userId,
                    token: result.token,
                    type: 'access',
                    expiresAt: new Date(decoded.exp * 1000),
                    isActive: true,
                })
                // Store new refresh token
                await TokenModel.create({
                    userId: refreshDecoded.userId,
                    token: result.refreshToken,
                    type: 'refresh',
                    expiresAt: new Date(refreshDecoded.exp * 1000),
                    isActive: true,
                })
            }
            return result
        } catch (error: any) {
            console.error('[refreshToken] Error:', error)
            return {
                success: false,
                error: error.message || 'Internal error',
                provider: 'internal',
            }
        }
    }

    async logout(token: string): Promise<void> {
        // Invalidate all tokens for this user
        if (token) {
            const jwtSecret = process.env.JWT_SECRET || 'default-secret'
            try {
                const decoded = jwt.verify(token, jwtSecret) as any
                await TokenModel.updateMany(
                    { userId: decoded.userId, isActive: true },
                    { isActive: false }
                )
            } catch (error) {
                // If token is invalid, still try to invalidate it by token value
                await TokenModel.updateOne(
                    { token, isActive: true },
                    { isActive: false }
                )
            }
        }
    }

    async validateToken(token: string): Promise<any> {
        try {
            // Check if token exists and is active in database
            const tokenDoc = await TokenModel.findOne({
                token,
                type: 'access',
                isActive: true,
                expiresAt: { $gt: new Date() },
            })
            if (!tokenDoc) {
                return { valid: false, error: 'Token not found or expired' }
            }
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'default-secret'
            )
            // Update last used timestamp
            await TokenModel.updateOne({ token }, { lastUsedAt: new Date() })
            return { valid: true, user: decoded }
        } catch (error: any) {
            console.error('[validateToken] Error:', error)
            // If JWT is invalid, mark token as inactive
            await TokenModel.updateOne({ token }, { isActive: false })
            return { valid: false, error: error.message || 'Internal error' }
        }
    }

    async verifyEmail(email: string, code: string): Promise<any> {
        await this.initializationPromise

        // Get the active auth provider
        const activeProvider = this.authModule.getActiveProvider()
        if (!activeProvider) {
            throw new Error('No active auth provider available')
        }

        // Check if the provider supports email verification
        if (typeof activeProvider.verifyEmail !== 'function') {
            throw new Error(
                'Current auth provider does not support email verification'
            )
        }

        // Delegate to the provider's verifyEmail method
        return await activeProvider.verifyEmail(email, code)
    }

    async sendVerificationCode(email: string): Promise<void> {
        await this.initializationPromise

        // Get the active auth provider
        const activeProvider = this.authModule.getActiveProvider()
        if (!activeProvider) {
            throw new Error('No active auth provider available')
        }

        // Check if the provider supports sending verification codes
        if (typeof activeProvider.sendVerificationCode !== 'function') {
            throw new Error(
                'Current auth provider does not support sending verification codes'
            )
        }

        // Delegate to the provider's sendVerificationCode method
        return await activeProvider.sendVerificationCode(email)
    }

    async sendPasswordResetCode(email: string): Promise<void> {
        await this.initializationPromise
        const activeProvider = this.authModule.getActiveProvider()
        if (!activeProvider) {
            throw new Error('No active auth provider available')
        }
        if (typeof activeProvider.sendPasswordResetCode !== 'function') {
            throw new Error(
                'Current auth provider does not support password reset'
            )
        }
        return await activeProvider.sendPasswordResetCode(email)
    }

    async resetPassword(
        email: string,
        code: string,
        newPassword: string
    ): Promise<any> {
        await this.initializationPromise
        const activeProvider = this.authModule.getActiveProvider()
        if (!activeProvider) {
            throw new Error('No active auth provider available')
        }
        if (typeof activeProvider.resetPassword !== 'function') {
            throw new Error(
                'Current auth provider does not support password reset'
            )
        }
        return await activeProvider.resetPassword(email, code, newPassword)
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<void> {
        await this.initializationPromise
        const db = this.authModule.getDatabase()
        if (!db) throw new Error('Database adapter not available')

        // Get user
        const user = await db.findUserById(userId)
        if (!user) throw new Error('User not found')

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password
        )
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect')
        }

        // Validate new password policy (basic validation)
        if (newPassword.length < 8) {
            throw new Error('New password must be at least 8 characters long')
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update password in database
        await db.updateUser(userId, { password: hashedPassword })

        // Invalidate all existing tokens for security
        await TokenModel.updateMany(
            { userId, isActive: true },
            { isActive: false }
        )
    }

    async sendSMSCode(phone: string): Promise<void> {
        await this.initializationPromise
        const db = this.authModule.getDatabase()
        if (!db) throw new Error('Database adapter not available')
        const user = await db.findUserByMobile(phone)
        if (!user) throw new Error('User not found')
        // Generate and store code
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 min expiry
        await VerificationCodeModel.create({
            userId: user._id,
            code,
            type: 'sms_verification',
            expiresAt,
            used: false,
        })
        // Mock: Log the code (replace with real SMS provider in production)
        console.log(`[MOCK SMS] Verification code for ${phone}: ${code}`)
    }

    async verifySMSCode(phone: string, code: string): Promise<any> {
        await this.initializationPromise
        const db = this.authModule.getDatabase()
        if (!db) throw new Error('Database adapter not available')
        const user = await db.findUserByMobile(phone)
        if (!user) throw new Error('User not found')
        const record = await VerificationCodeModel.findOne({
            userId: user._id,
            code,
            type: 'sms_verification',
            used: false,
            expiresAt: { $gt: new Date() },
        })
        if (!record) throw new Error('Invalid or expired code')
        await VerificationCodeModel.updateOne(
            { _id: record._id },
            { used: true }
        )
        // Optionally mark user as mobile verified
        await db.updateUser(user._id, { isMobileVerified: true })
        return { verified: true }
    }

    async getOAuthURL(provider: string): Promise<string> {
        // Mock: Return a fake OAuth URL (replace with real logic in production)
        return `https://mock-oauth.com/auth?provider=${provider}&client_id=demo&redirect_uri=http://localhost:3000/callback`
    }

    async handleOAuthCallback(
        provider: string,
        code: string,
        state?: string
    ): Promise<any> {
        // Mock: Simulate successful OAuth callback (replace with real logic in production)
        return {
            success: true,
            user: {
                id: 'oauth-user-id',
                email: 'oauthuser@example.com',
                name: 'OAuth User',
                provider,
            },
            token: 'mock-oauth-jwt',
            refreshToken: 'mock-oauth-refresh-token',
            expiresIn: 3600,
            provider,
        }
    }

    async beginWebAuthnRegistration(userId: string): Promise<any> {
        // Mock: Return a fake WebAuthn registration challenge
        return {
            challenge: 'mock-webauthn-registration-challenge',
            userId,
        }
    }

    async finishWebAuthnRegistration(
        userId: string,
        credential: any
    ): Promise<any> {
        // Mock: Simulate successful registration
        return {
            registered: true,
            userId,
        }
    }

    async beginWebAuthnAuthentication(email: string): Promise<any> {
        // Mock: Return a fake WebAuthn authentication challenge
        return {
            challenge: 'mock-webauthn-authentication-challenge',
            email,
        }
    }

    async finishWebAuthnAuthentication(
        email: string,
        credential: any
    ): Promise<any> {
        // Mock: Simulate successful authentication
        return {
            success: true,
            token: 'mock-webauthn-jwt',
            user: { email },
            provider: 'webauthn',
        }
    }

    async getProfile(userId: string): Promise<any> {
        await this.initializationPromise
        const db = this.authModule.getDatabase()
        if (!db) throw new Error('Database adapter not available')
        const user = await db.findUserById(userId)
        if (!user) throw new Error('User not found')
        // Return user info (omit password)
        const { password, ...userInfo } = user
        return userInfo
    }

    // Add method to get user's active sessions
    async getUserSessions(userId: string): Promise<any[]> {
        const sessions = await TokenModel.find({
            userId,
            type: 'access',
            isActive: true,
            expiresAt: { $gt: new Date() },
        })
            .select('deviceInfo ipAddress createdAt lastUsedAt')
            .lean()

        return sessions
    }

    // Add method to revoke specific session
    async revokeSession(userId: string, sessionId: string): Promise<void> {
        await TokenModel.updateOne(
            { _id: sessionId, userId, isActive: true },
            { isActive: false }
        )
    }

    // Add method to revoke all sessions except current
    async revokeAllSessions(
        userId: string,
        exceptToken?: string
    ): Promise<void> {
        const query: any = { userId, isActive: true }
        if (exceptToken) {
            query.token = { $ne: exceptToken }
        }

        await TokenModel.updateMany(query, { isActive: false })
    }
}
