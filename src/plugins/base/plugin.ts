export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: string[];
  configSchema?: Record<string, any>;
}

export interface PluginConfig {
  enabled: boolean;
  config: Record<string, any>;
}

export interface PluginContext {
  config: any;
  logger: any;
  database: any;
  services: Record<string, any>;
}

export abstract class BasePlugin {
  protected metadata: PluginMetadata;
  protected config: PluginConfig;
  protected context: PluginContext;

  constructor(metadata: PluginMetadata, config: PluginConfig, context: PluginContext) {
    this.metadata = metadata;
    this.config = config;
    this.context = context;
  }

  /**
   * Initialize the plugin
   */
  abstract initialize(): Promise<void>;

  /**
   * Start the plugin
   */
  abstract start(): Promise<void>;

  /**
   * Stop the plugin
   */
  abstract stop(): Promise<void>;

  /**
   * Get plugin metadata
   */
  getMetadata(): PluginMetadata {
    return this.metadata;
  }

  /**
   * Get plugin configuration
   */
  getConfig(): PluginConfig {
    return this.config;
  }

  /**
   * Update plugin configuration
   */
  updateConfig(config: Partial<PluginConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get plugin health status
   */
  abstract getHealth(): Promise<PluginHealth>;

  /**
   * Get plugin metrics
   */
  abstract getMetrics(): Promise<PluginMetrics>;
}

export interface PluginHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface PluginMetrics {
  name: string;
  metrics: Record<string, number>;
  timestamp: Date;
}

export interface PluginRegistration {
  plugin: BasePlugin;
  metadata: PluginMetadata;
  config: PluginConfig;
}

export type PluginFactory = (config: PluginConfig, context: PluginContext) => BasePlugin; 