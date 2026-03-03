export interface ServerConfig {
  host: string;
  port: number;
  environment: 'development' | 'staging' | 'production';
  protocol?: 'http' | 'https';
}

export interface ModuleConfig {
  deploy: 'standalone' | 'shared';
  server: string;
  dependencies: string[];
  communication?: {
    type: 'http' | 'local';
    timeout?: number;
  };
}

export interface ExternalModuleConfig {
  server: string;
  host: string;
  port: number;
  protocol?: 'http' | 'https';
  health_check?: string;
  timeout?: number;
  auth?: {
    type: 'api_key' | 'bearer' | 'basic';
    header?: string;
    value?: string;
    token?: string;
    timeout?: number;
  };
}

export interface DeploymentConfig {
  servers: Record<string, ServerConfig>;
  modules: Record<string, ModuleConfig>;
  external_modules?: Record<string, ExternalModuleConfig>;
}

export interface ModuleCommunicationOptions {
  moduleName: string;
  method: string;
  data?: any;
  timeout?: number;
}

export interface ModuleCommunicationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  duration?: number;
  source: 'local' | 'http' | 'https';
} 