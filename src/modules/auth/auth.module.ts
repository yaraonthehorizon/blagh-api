import { BasePlugin, PluginMetadata, PluginConfig, PluginContext, PluginHealth, PluginMetrics } from '../../plugins/base/plugin';
import { BaseAuthProvider } from './providers/base-auth-provider';
import { InternalAuthProvider } from './providers/internal-auth-provider';
import { FirebaseAuthProvider } from './providers/firebase-auth-provider';
import { OAuthProvider } from './providers/oauth-provider';
import { SMSAuthProvider } from './providers/sms-auth-provider';
import { EmailAuthProvider } from './providers/email-auth-provider';
import { AuthConfig } from '../../core/config/interfaces';
import { DatabaseAdapter } from '../../shared/types/database-adapter';

export class AuthModule extends BasePlugin {
  private providers: Map<string, BaseAuthProvider> = new Map();
  private activeProvider: string = 'internal';
  private databaseAdapter?: DatabaseAdapter;
  public database: DatabaseAdapter;

  constructor(config: PluginConfig, context: PluginContext) {
    const metadata: PluginMetadata = {
      name: 'auth',
      version: '1.0.0',
      description: 'Multi-provider authentication module',
      author: 'Diagramers Team'
    };
    
    super(metadata, config, context);
    this.databaseAdapter = context.database as DatabaseAdapter;
    this.database = context.database;
  }

  async initialize(): Promise<void> {
    const authConfig = this.context.config.auth as AuthConfig;
    
    // Initialize internal auth provider
    if (authConfig.providers.internal.enabled) {
      const internalProvider = new InternalAuthProvider(authConfig.providers.internal, this.databaseAdapter);
      this.providers.set('internal', internalProvider);
    }

    // Initialize Firebase auth provider
    if (authConfig.providers.firebase.enabled) {
      const firebaseProvider = new FirebaseAuthProvider(authConfig.providers.firebase, this.databaseAdapter);
      this.providers.set('firebase', firebaseProvider);
    }

    // Initialize OAuth providers
    if (authConfig.providers.oauth.enabled) {
      for (const [providerName, providerConfig] of Object.entries(authConfig.providers.oauth.providers)) {
        if ((providerConfig as any).enabled) {
          const oauthProvider = new OAuthProvider(providerName, providerConfig, this.databaseAdapter);
          this.providers.set(providerName, oauthProvider);
        }
      }
    }

    // Initialize SMS auth provider
    if (authConfig.providers.sms.enabled) {
      const smsProvider = new SMSAuthProvider(authConfig.providers.sms, this.databaseAdapter);
      this.providers.set('sms', smsProvider);
    }

    // Initialize Email auth provider
    if (authConfig.providers.email.enabled) {
      const emailProvider = new EmailAuthProvider(authConfig.providers.email, this.databaseAdapter);
      this.providers.set('email', emailProvider);
    }

    this.context.logger.info(`[AuthModule] Initialized ${this.providers.size} auth providers`);
  }

  async start(): Promise<void> {
    // Start all providers
    for (const [name, provider] of this.providers) {
      await provider.initialize();
      this.context.logger.info(`[AuthModule] Started auth provider: ${name}`);
    }
  }

  async stop(): Promise<void> {
    // Stop all providers
    for (const [name, provider] of this.providers) {
      await provider.cleanup();
      this.context.logger.info(`[AuthModule] Stopped auth provider: ${name}`);
    }
  }

  async getHealth(): Promise<PluginHealth> {
    const providerHealth = {};
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    for (const [name, provider] of this.providers) {
      try {
        const health = await provider.getHealth();
        providerHealth[name] = health;
        
        if (health.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (health.status === 'degraded' && overallStatus !== 'unhealthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        providerHealth[name] = { status: 'unhealthy', error: error.message };
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      details: { providers: providerHealth },
      timestamp: new Date()
    };
  }

  async getMetrics(): Promise<PluginMetrics> {
    const metrics = {
      totalProviders: this.providers.size,
      activeProviders: 0,
      totalAuthentications: 0
    };

    for (const provider of this.providers.values()) {
      const providerMetrics = await provider.getMetrics();
      metrics.activeProviders += providerMetrics.isActive ? 1 : 0;
      metrics.totalAuthentications += providerMetrics.totalAuthentications || 0;
    }

    return {
      name: this.metadata.name,
      metrics,
      timestamp: new Date()
    };
  }

  // Auth module specific methods
  getProvider(name: string): BaseAuthProvider | undefined {
    return this.providers.get(name);
  }

  getActiveProvider(): BaseAuthProvider | undefined {
    return this.providers.get(this.activeProvider);
  }

  setActiveProvider(name: string): void {
    if (this.providers.has(name)) {
      this.activeProvider = name;
      this.context.logger.info(`[AuthModule] Active provider changed to: ${name}`);
    } else {
      throw new Error(`Auth provider not found: ${name}`);
    }
  }

  async authenticate(credentials: any, provider?: string): Promise<any> {
    const authProvider = provider ? this.getProvider(provider) : this.getActiveProvider();
    
    if (!authProvider) {
      throw new Error('No authentication provider available');
    }

    return await authProvider.authenticate(credentials);
  }

  async validateToken(token: string, provider?: string): Promise<any> {
    const authProvider = provider ? this.getProvider(provider) : this.getActiveProvider();
    
    if (!authProvider) {
      throw new Error('No authentication provider available');
    }

    return await authProvider.validateToken(token);
  }

  getDatabase(): DatabaseAdapter {
    return this.database;
  }
} 