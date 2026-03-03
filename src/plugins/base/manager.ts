import { BasePlugin, PluginMetadata, PluginConfig, PluginContext, PluginRegistration, PluginFactory } from './plugin';

export interface PluginManagerConfig {
  pluginsPath: string;
  autoLoad: boolean;
  hotReload: boolean;
}

export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, PluginRegistration> = new Map();
  private factories: Map<string, PluginFactory> = new Map();
  private config: PluginManagerConfig;
  private context: PluginContext;

  constructor(config: PluginManagerConfig, context: PluginContext) {
    this.config = config;
    this.context = context;
  }

  static getInstance(config?: PluginManagerConfig, context?: PluginContext): PluginManager {
    if (!PluginManager.instance && config && context) {
      PluginManager.instance = new PluginManager(config, context);
    }
    return PluginManager.instance;
  }

  /**
   * Register a plugin factory
   */
  registerFactory(name: string, factory: PluginFactory): void {
    this.factories.set(name, factory);
  }

  /**
   * Load a plugin
   */
  async loadPlugin(name: string, config: PluginConfig): Promise<void> {
    try {
      const factory = this.factories.get(name);
      if (!factory) {
        throw new Error(`Plugin factory not found: ${name}`);
      }

      const plugin = factory(config, this.context);
      await plugin.initialize();

      const metadata = plugin.getMetadata();
      this.plugins.set(name, {
        plugin,
        metadata,
        config
      });

      console.log(`Plugin loaded: ${name} v${metadata.version}`);
    } catch (error: any) {
      throw new Error(`Failed to load plugin ${name}: ${error.message}`);
    }
  }

  /**
   * Start all enabled plugins
   */
  async startPlugins(): Promise<void> {
    const enabledPlugins = Array.from(this.plugins.values())
      .filter(registration => registration.config.enabled);

    for (const registration of enabledPlugins) {
      try {
        await registration.plugin.start();
        console.log(`Plugin started: ${registration.metadata.name}`);
      } catch (error: any) {
        console.error(`Failed to start plugin ${registration.metadata.name}:`, error.message);
      }
    }
  }

  /**
   * Stop all plugins
   */
  async stopPlugins(): Promise<void> {
    for (const registration of this.plugins.values()) {
      try {
        await registration.plugin.stop();
        console.log(`Plugin stopped: ${registration.metadata.name}`);
      } catch (error: any) {
        console.error(`Failed to stop plugin ${registration.metadata.name}:`, error.message);
      }
    }
  }

  /**
   * Get a plugin by name
   */
  getPlugin(name: string): BasePlugin | undefined {
    return this.plugins.get(name)?.plugin;
  }

  /**
   * Get all loaded plugins
   */
  getPlugins(): BasePlugin[] {
    return Array.from(this.plugins.values()).map(registration => registration.plugin);
  }

  /**
   * Get plugin registrations
   */
  getRegistrations(): PluginRegistration[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin is loaded
   */
  isPluginLoaded(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(name: string): Promise<void> {
    const registration = this.plugins.get(name);
    if (!registration) {
      throw new Error(`Plugin not found: ${name}`);
    }

    try {
      await registration.plugin.stop();
      this.plugins.delete(name);
      console.log(`Plugin unloaded: ${name}`);
    } catch (error: any) {
      throw new Error(`Failed to unload plugin ${name}: ${error.message}`);
    }
  }

  /**
   * Get plugin health status
   */
  async getPluginHealth(name: string): Promise<any> {
    const plugin = this.getPlugin(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    return await plugin.getHealth();
  }

  /**
   * Get all plugins health status
   */
  async getAllPluginsHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};

    for (const [name, registration] of this.plugins) {
      try {
        health[name] = await registration.plugin.getHealth();
      } catch (error: any) {
        health[name] = {
          status: 'unhealthy',
          message: error.message,
          timestamp: new Date()
        };
      }
    }

    return health;
  }

  /**
   * Get plugin metrics
   */
  async getPluginMetrics(name: string): Promise<any> {
    const plugin = this.getPlugin(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    return await plugin.getMetrics();
  }

  /**
   * Get all plugins metrics
   */
  async getAllPluginsMetrics(): Promise<Record<string, any>> {
    const metrics: Record<string, any> = {};

    for (const [name, registration] of this.plugins) {
      try {
        metrics[name] = await registration.plugin.getMetrics();
      } catch (error: any) {
        metrics[name] = {
          name,
          metrics: {},
          timestamp: new Date(),
          error: error.message
        };
      }
    }

    return metrics;
  }

  /**
   * Update plugin configuration
   */
  async updatePluginConfig(name: string, config: Partial<PluginConfig>): Promise<void> {
    const registration = this.plugins.get(name);
    if (!registration) {
      throw new Error(`Plugin not found: ${name}`);
    }

    registration.plugin.updateConfig(config);
    registration.config = { ...registration.config, ...config };

    console.log(`Plugin configuration updated: ${name}`);
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(name: string): Promise<void> {
    await this.updatePluginConfig(name, { enabled: true });
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(name: string): Promise<void> {
    await this.updatePluginConfig(name, { enabled: false });
  }
} 