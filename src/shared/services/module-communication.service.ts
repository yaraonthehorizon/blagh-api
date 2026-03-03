import { DeploymentConfigService } from './deployment-config.service';
import { ModuleCommunicationOptions, ModuleCommunicationResult, ExternalModuleConfig } from '../types/deployment-config';

export class ModuleCommunicationService {
  private configService: DeploymentConfigService;
  private config: any = null;

  constructor() {
    this.configService = new DeploymentConfigService();
  }

  /**
   * Initialize the communication service
   */
  async initialize(): Promise<void> {
    this.config = await this.configService.loadConfig();
  }

  /**
   * Call a module method (local or remote)
   */
  async callModule<T = any>(
    moduleName: string, 
    method: string, 
    data?: any, 
    options?: { timeout?: number }
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Check if module is local
      if (this.configService.isLocalModule(moduleName)) {
        console.log(`🏠 [LOCAL] Calling ${moduleName}.${method}`);
        const result = await this.callLocalModule<T>(moduleName, method, data);
        
        const duration = Date.now() - startTime;
        console.log(`✅ [LOCAL] ${moduleName}.${method} completed in ${duration}ms`);
        
        return result;
      } else {
        // External module call
        const result = await this.callExternalModule<T>(moduleName, method, data, options);
        
        const duration = Date.now() - startTime;
        console.log(`✅ [${result.source.toUpperCase()}] ${moduleName}.${method} completed in ${duration}ms`);
        
        if (!result.success) {
          throw new Error(result.error);
        }
        
        return result.data;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [ERROR] ${moduleName}.${method} failed after ${duration}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Call local module method
   */
  private async callLocalModule<T>(moduleName: string, method: string, data?: any): Promise<T> {
    try {
      // Dynamic import of local module service
      const moduleService = await this.importLocalModuleService(moduleName);
      const serviceInstance = new moduleService();
      
      if (typeof serviceInstance[method] !== 'function') {
        throw new Error(`Method '${method}' not found in ${moduleName} service`);
      }
      
      return await serviceInstance[method](data);
    } catch (error) {
      throw new Error(`Local module call failed: ${error.message}`);
    }
  }

  /**
   * Call external module via HTTP/HTTPS
   */
  private async callExternalModule<T>(
    moduleName: string, 
    method: string, 
    data?: any, 
    options?: { timeout?: number }
  ): Promise<ModuleCommunicationResult<T>> {
    const moduleConfig = this.config?.external_modules?.[moduleName] as ExternalModuleConfig;
    
    if (!moduleConfig) {
      return {
        success: false,
        error: `Module '${moduleName}' not configured as external module`,
        source: 'http'
      };
    }

    const protocol = moduleConfig.protocol || 'http';
    const url = `${protocol}://${moduleConfig.host}:${moduleConfig.port}/api/${moduleName}/${method}`;
    
    console.log(`🌐 [${protocol.toUpperCase()}] Calling ${moduleName}.${method} at ${url}`);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add authentication headers
      if (moduleConfig.auth) {
        this.addAuthHeaders(headers, moduleConfig.auth);
      }

      const timeout = options?.timeout || moduleConfig.auth?.timeout || 10000;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        data: result,
        source: protocol as 'http' | 'https'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        source: protocol as 'http' | 'https'
      };
    }
  }

  /**
   * Import local module service dynamically
   */
  private async importLocalModuleService(moduleName: string): Promise<any> {
    try {
      // Try different possible service file paths
      const possiblePaths = [
        `../../modules/${moduleName}/services/${moduleName}.service`,
        `../modules/${moduleName}/services/${moduleName}.service`,
        `./modules/${moduleName}/services/${moduleName}.service`
      ];

      for (const servicePath of possiblePaths) {
        try {
          const module = await import(servicePath);
          const serviceClassName = `${this.capitalize(moduleName)}Service`;
          
          if (module[serviceClassName]) {
            return module[serviceClassName];
          }
        } catch (importError) {
          // Continue to next path
          continue;
        }
      }

      throw new Error(`Service class for module '${moduleName}' not found`);
    } catch (error) {
      throw new Error(`Failed to import local module service: ${error.message}`);
    }
  }

  /**
   * Add authentication headers
   */
  private addAuthHeaders(headers: Record<string, string>, auth: any): void {
    switch (auth.type) {
      case 'api_key':
        if (auth.header && auth.value) {
          headers[auth.header] = auth.value;
        }
        break;
      case 'bearer':
        if (auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`;
        }
        break;
      case 'basic':
        if (auth.username && auth.password) {
          const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
    }
  }

  /**
   * Check health of external modules
   */
  async checkExternalHealth(moduleName?: string): Promise<Record<string, boolean>> {
    const healthStatus: Record<string, boolean> = {};
    
    if (!this.config?.external_modules) {
      return healthStatus;
    }

    const modulesToCheck = moduleName 
      ? { [moduleName]: this.config.external_modules[moduleName] as ExternalModuleConfig }
      : this.config.external_modules as Record<string, ExternalModuleConfig>;

    for (const [name, config] of Object.entries(modulesToCheck)) {
      try {
        if (config.health_check) {
          const response = await fetch(config.health_check, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          healthStatus[name] = response.ok;
        } else {
          // Try basic health check
          const url = `${config.protocol || 'http'}://${config.host}:${config.port}/health`;
          const response = await fetch(url, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
          healthStatus[name] = response.ok;
        }
      } catch (error) {
        healthStatus[name] = false;
      }
    }

    return healthStatus;
  }

  /**
   * Get module status information
   */
  async getModuleStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};
    
    // Local modules
    if (this.config?.modules) {
      for (const [name, config] of Object.entries(this.config.modules)) {
        const moduleConfig = config as any;
        status[name] = {
          type: 'local',
          server: moduleConfig.server,
          deploy: moduleConfig.deploy,
          status: 'running' // Assume running if configured
        };
      }
    }

    // External modules
    if (this.config?.external_modules) {
      const healthStatus = await this.checkExternalHealth();
      
      for (const [name, config] of Object.entries(this.config.external_modules)) {
        const externalConfig = config as ExternalModuleConfig;
        status[name] = {
          type: 'external',
          server: externalConfig.server,
          host: externalConfig.host,
          port: externalConfig.port,
          protocol: externalConfig.protocol || 'http',
          status: healthStatus[name] ? 'healthy' : 'unhealthy'
        };
      }
    }

    return status;
  }

  /**
   * Utility function to capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
} 