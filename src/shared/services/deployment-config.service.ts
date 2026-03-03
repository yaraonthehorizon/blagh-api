import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { DeploymentConfig, ServerConfig, ModuleConfig, ExternalModuleConfig } from '../types/deployment-config';

export class DeploymentConfigService {
  private configPath: string;
  private config: DeploymentConfig | null = null;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'diagramers.yml');
  }

  /**
   * Load deployment configuration from YAML file
   */
  async loadConfig(): Promise<DeploymentConfig> {
    try {
      if (!fs.existsSync(this.configPath)) {
        // Create default configuration if file doesn't exist
        return this.createDefaultConfig();
      }

      const fileContent = fs.readFileSync(this.configPath, 'utf8');
      this.config = yaml.load(fileContent) as DeploymentConfig;
      
      // Validate configuration
      this.validateConfig(this.config);
      
      return this.config;
    } catch (error) {
      console.error('Error loading deployment config:', error);
      throw new Error(`Failed to load deployment configuration: ${error.message}`);
    }
  }

  /**
   * Save configuration to YAML file
   */
  async saveConfig(config: DeploymentConfig): Promise<void> {
    try {
      const yamlContent = yaml.dump(config, { 
        indent: 2,
        lineWidth: 120,
        noRefs: true
      });
      
      fs.writeFileSync(this.configPath, yamlContent, 'utf8');
      this.config = config;
      
      console.log(`✅ Configuration saved to ${this.configPath}`);
    } catch (error) {
      console.error('Error saving deployment config:', error);
      throw new Error(`Failed to save deployment configuration: ${error.message}`);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): DeploymentConfig | null {
    return this.config;
  }

  /**
   * Add a new server configuration
   */
  async addServer(serverName: string, config: ServerConfig): Promise<void> {
    const currentConfig = await this.loadConfig();
    
    if (currentConfig.servers[serverName]) {
      throw new Error(`Server '${serverName}' already exists`);
    }

    currentConfig.servers[serverName] = config;
    await this.saveConfig(currentConfig);
  }

  /**
   * Add a new module configuration
   */
  async addModule(moduleName: string, config: ModuleConfig): Promise<void> {
    const currentConfig = await this.loadConfig();
    
    if (currentConfig.modules[moduleName]) {
      throw new Error(`Module '${moduleName}' already exists`);
    }

    currentConfig.modules[moduleName] = config;
    await this.saveConfig(currentConfig);
  }

  /**
   * Add external module configuration
   */
  async addExternalModule(moduleName: string, config: ExternalModuleConfig): Promise<void> {
    const currentConfig = await this.loadConfig();
    
    if (!currentConfig.external_modules) {
      currentConfig.external_modules = {};
    }

    if (currentConfig.external_modules[moduleName]) {
      throw new Error(`External module '${moduleName}' already exists`);
    }

    currentConfig.external_modules[moduleName] = config;
    await this.saveConfig(currentConfig);
  }

  /**
   * Remove module from configuration
   */
  async removeModule(moduleName: string): Promise<void> {
    const currentConfig = await this.loadConfig();
    
    if (currentConfig.modules[moduleName]) {
      delete currentConfig.modules[moduleName];
      await this.saveConfig(currentConfig);
    }

    if (currentConfig.external_modules?.[moduleName]) {
      delete currentConfig.external_modules[moduleName];
      await this.saveConfig(currentConfig);
    }
  }

  /**
   * Move module from local to external or vice versa
   */
  async moveModule(
    moduleName: string, 
    targetServer: string, 
    targetHost: string, 
    targetPort: number,
    targetProtocol: 'http' | 'https' = 'http'
  ): Promise<void> {
    const currentConfig = await this.loadConfig();
    
    // Check if module exists locally
    if (currentConfig.modules[moduleName]) {
      // Move from local to external
      const moduleConfig = currentConfig.modules[moduleName];
      
      // Add to external modules
      if (!currentConfig.external_modules) {
        currentConfig.external_modules = {};
      }
      
      currentConfig.external_modules[moduleName] = {
        server: targetServer,
        host: targetHost,
        port: targetPort,
        protocol: targetProtocol,
        health_check: `${targetProtocol}://${targetHost}:${targetPort}/health`
      };
      
      // Remove from local modules
      delete currentConfig.modules[moduleName];
      
      await this.saveConfig(currentConfig);
      console.log(`✅ Module '${moduleName}' moved to external server '${targetServer}'`);
    } else if (currentConfig.external_modules?.[moduleName]) {
      // Move from external to local
      const externalConfig = currentConfig.external_modules[moduleName];
      
      // Add to local modules
      currentConfig.modules[moduleName] = {
        deploy: 'shared',
        server: targetServer,
        dependencies: []
      };
      
      // Remove from external modules
      delete currentConfig.external_modules[moduleName];
      
      await this.saveConfig(currentConfig);
      console.log(`✅ Module '${moduleName}' moved to local server '${targetServer}'`);
    } else {
      throw new Error(`Module '${moduleName}' not found`);
    }
  }

  /**
   * Check if module is local
   */
  isLocalModule(moduleName: string): boolean {
    return this.config?.modules[moduleName] !== undefined;
  }

  /**
   * Get module configuration
   */
  getModuleConfig(moduleName: string): ModuleConfig | ExternalModuleConfig | null {
    return this.config?.modules[moduleName] || this.config?.external_modules?.[moduleName] || null;
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(config: DeploymentConfig): void {
    if (!config.servers || Object.keys(config.servers).length === 0) {
      throw new Error('Configuration must have at least one server defined');
    }

    if (!config.modules) {
      config.modules = {};
    }

    // Validate module configurations
    for (const [moduleName, moduleConfig] of Object.entries(config.modules)) {
      if (!config.servers[moduleConfig.server]) {
        throw new Error(`Module '${moduleName}' references undefined server '${moduleConfig.server}'`);
      }
    }

    // Validate external module configurations
    if (config.external_modules) {
      for (const [moduleName, externalConfig] of Object.entries(config.external_modules)) {
        if (!externalConfig.host || !externalConfig.port) {
          throw new Error(`External module '${moduleName}' must have host and port defined`);
        }
      }
    }
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): DeploymentConfig {
    const defaultConfig: DeploymentConfig = {
      servers: {
        'main-server': {
          host: 'localhost',
          port: 3000,
          environment: 'development'
        }
      },
      modules: {},
      external_modules: {}
    };

    return defaultConfig;
  }
} 