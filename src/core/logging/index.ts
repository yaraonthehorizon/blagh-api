import { LogModel } from '../../modules/logging/schemas/log.schema';

export interface LoggerConfig {
  level: string;
  format: 'json' | 'simple' | 'colored';
  transports: string[];
  file?: {
    enabled: boolean;
    path: string;
    maxSize: string;
    maxFiles: number;
  };
  console?: {
    enabled: boolean;
    colors: boolean;
  };
  database?: {
    enabled: boolean;
    collection: string;
    connection?: any;
    ttlDays?: number;
  };
  external?: {
    enabled: boolean;
    type: 'serilog' | 'sentry' | 'loggly' | 'papertrail';
    url?: string;
    apiKey?: string;
    appName?: string;
  };
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  trace?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  module?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  tags?: string[];
}

export interface LogTransport {
  name: string;
  log(entry: LogEntry): Promise<void>;
  isEnabled(): boolean;
}

class ConsoleTransport implements LogTransport {
  name = 'console';
  private colors: boolean;
  private format: string;

  constructor(config: LoggerConfig) {
    this.colors = config.console?.colors ?? true;
    this.format = config.format;
  }

  isEnabled(): boolean {
    return true; // Console is always enabled
  }

  async log(entry: LogEntry): Promise<void> {
    const formattedMessage = this.formatMessage(entry);
    
    switch (entry.level) {
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'INFO':
        console.log(formattedMessage);
        break;
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
      case 'VERBOSE':
        console.log(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  private formatMessage(entry: LogEntry): string {
    if (this.format === 'json') {
      return JSON.stringify(entry, null, 2);
    }

    if (this.format === 'colored' && this.colors) {
      const colors = {
        ERROR: '\x1b[31m',   // Red
        WARN: '\x1b[33m',    // Yellow
        INFO: '\x1b[36m',    // Cyan
        DEBUG: '\x1b[35m',   // Magenta
        VERBOSE: '\x1b[90m'  // Gray
      };
      const reset = '\x1b[0m';
      const color = colors[entry.level as keyof typeof colors] || '';
      
      let formatted = `${color}[${entry.level}]${reset} ${entry.timestamp}`;
      
      if (entry.requestId) {
        formatted += ` [${entry.requestId}]`;
      }
      
      if (entry.module && entry.action) {
        formatted += ` [${entry.module}:${entry.action}]`;
      }
      
      formatted += ` - ${entry.message}`;
      
      if (entry.error) {
        formatted += `\n${color}Error:${reset} ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          formatted += `\n${entry.error.stack}`;
        }
      }
      
      return formatted;
    }

    let formatted = `[${entry.level}] ${entry.timestamp}`;
    
    if (entry.requestId) {
      formatted += ` [${entry.requestId}]`;
    }
    
    if (entry.module && entry.action) {
      formatted += ` [${entry.module}:${entry.action}]`;
    }
    
    formatted += ` - ${entry.message}`;
    
    if (entry.error) {
      formatted += `\nError: ${entry.error.name}: ${entry.error.message}`;
    }
    
    return formatted;
  }
}

class FileTransport implements LogTransport {
  name = 'file';
  private enabled: boolean;
  private path: string;
  private fs: any;

  constructor(config: LoggerConfig) {
    this.enabled = config.file?.enabled ?? false;
    this.path = config.file?.path ?? './logs/app.log';
    
    if (this.enabled) {
      // Dynamically import fs-extra to avoid issues
      this.fs = require('fs-extra');
      this.ensureLogDirectory();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.enabled || !this.fs) return;

    try {
      const logLine = JSON.stringify(entry) + '\n';
      await this.fs.appendFile(this.path, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async ensureLogDirectory(): Promise<void> {
    if (!this.fs) return;
    
    try {
      const lastSlashIndex = this.path.lastIndexOf('/');
      if (lastSlashIndex > 0) {
        const dir = this.path.substring(0, lastSlashIndex);
        await this.fs.ensureDir(dir);
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }
}

class DatabaseTransport implements LogTransport {
  name = 'database';
  private enabled: boolean;
  private collection: string;
  private connection: any;

  constructor(config: LoggerConfig) {
    this.enabled = config.database?.enabled ?? false;
    this.collection = config.database?.collection ?? 'logs';
    this.connection = config.database?.connection;
  }

  setConnection(connection: any): void {
    this.connection = connection;
  }

  isEnabled(): boolean {
    return this.enabled && this.connection;
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.enabled || !this.connection) return;

    try {
      const logDocument = {
        ...entry,
        timestamp: new Date(entry.timestamp),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Use Mongoose model if available, otherwise use native MongoDB driver
      if (LogModel) {
        await LogModel.create(logDocument);
      } else if (this.connection.collection) {
        await this.connection.collection(this.collection).insertOne(logDocument);
      }
    } catch (error) {
      console.error('Failed to write to database:', error);
    }
  }
}

class ExternalTransport implements LogTransport {
  name = 'external';
  private enabled: boolean;
  private type: string;
  private url?: string;
  private apiKey?: string;
  private appName?: string;

  constructor(config: LoggerConfig) {
    this.enabled = config.external?.enabled ?? false;
    this.type = config.external?.type ?? 'serilog';
    this.url = config.external?.url;
    this.apiKey = config.external?.apiKey;
    this.appName = config.external?.appName;
  }

  isEnabled(): boolean {
    return this.enabled === true && this.url !== undefined;
  }

  async log(entry: LogEntry): Promise<void> {
    if (!this.enabled || !this.url) return;

    try {
      const payload = this.formatPayload(entry);
      
      await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send to external logging service:', error);
    }
  }

  private formatPayload(entry: LogEntry): any {
    switch (this.type) {
      case 'serilog':
        return {
          timestamp: entry.timestamp,
          level: entry.level,
          message: entry.message,
          properties: entry.meta,
          ...(this.appName && { application: this.appName })
        };
      
      case 'sentry':
        return {
          level: entry.level,
          message: entry.message,
          timestamp: entry.timestamp,
          extra: entry.meta,
          tags: {
            ...(this.appName && { application: this.appName })
          }
        };
      
      case 'loggly':
        return {
          level: entry.level,
          message: entry.message,
          timestamp: entry.timestamp,
          meta: entry.meta,
          ...(this.appName && { application: this.appName })
        };
      
      default:
        return entry;
    }
  }
}

class Logger {
  private level: string;
  private transports: LogTransport[] = [];
  private requestId?: string;
  private userId?: string;
  private sessionId?: string;
  private module?: string;
  private action?: string;
  private ip?: string;
  private userAgent?: string;
  private method?: string;
  private url?: string;

  constructor(config: LoggerConfig) {
    this.level = config.level || 'info';
    
    // Initialize transports
    this.transports.push(new ConsoleTransport(config));
    
    if (config.file?.enabled) {
      this.transports.push(new FileTransport(config));
    }
    
    if (config.database?.enabled) {
      this.transports.push(new DatabaseTransport(config));
    }
    
    if (config.external?.enabled) {
      this.transports.push(new ExternalTransport(config));
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
    const currentLevel = level.toLowerCase();
    return levels.indexOf(currentLevel) <= levels.indexOf(this.level.toLowerCase());
  }

  private createLogEntry(level: string, message: string, meta?: any, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      meta,
      ...(this.requestId && { requestId: this.requestId }),
      ...(this.userId && { userId: this.userId }),
      ...(this.sessionId && { sessionId: this.sessionId }),
      ...(this.module && { module: this.module }),
      ...(this.action && { action: this.action }),
      ...(this.ip && { ip: this.ip }),
      ...(this.userAgent && { userAgent: this.userAgent }),
      ...(this.method && { method: this.method }),
      ...(this.url && { url: this.url }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        }
      })
    };
  }

  private async writeToTransports(entry: LogEntry): Promise<void> {
    const enabledTransports = this.transports.filter(t => t.isEnabled());
    
    await Promise.allSettled(
      enabledTransports.map(transport => transport.log(entry))
    );
  }

  info(message: string, meta?: any): void {
    if (this.shouldLog('info')) {
      const entry = this.createLogEntry('info', message, meta);
      this.writeToTransports(entry);
    }
  }

  warn(message: string, meta?: any): void {
    if (this.shouldLog('warn')) {
      const entry = this.createLogEntry('warn', message, meta);
      this.writeToTransports(entry);
    }
  }

  error(message: string, meta?: any, error?: Error): void {
    if (this.shouldLog('error')) {
      const entry = this.createLogEntry('error', message, meta, error);
      this.writeToTransports(entry);
    }
  }

  debug(message: string, meta?: any): void {
    if (this.shouldLog('debug')) {
      const entry = this.createLogEntry('debug', message, meta);
      this.writeToTransports(entry);
    }
  }

  verbose(message: string, meta?: any): void {
    if (this.shouldLog('verbose')) {
      const entry = this.createLogEntry('verbose', message, meta);
      this.writeToTransports(entry);
    }
  }

  // Method to change log level at runtime
  setLevel(level: string): void {
    this.level = level;
  }

  // Method to get current log level
  getLevel(): string {
    return this.level;
  }

  // Method to set context for request tracking
  setContext(context: {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    module?: string;
    action?: string;
    ip?: string;
    userAgent?: string;
    method?: string;
    url?: string;
  }): void {
    this.requestId = context.requestId;
    this.userId = context.userId;
    this.sessionId = context.sessionId;
    this.module = context.module;
    this.action = context.action;
    this.ip = context.ip;
    this.userAgent = context.userAgent;
    this.method = context.method;
    this.url = context.url;
  }

  // Method to add custom transport
  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  // Method to get all transports
  getTransports(): LogTransport[] {
    return this.transports;
  }

  // Method to set database connection for database transport
  setDatabaseConnection(connection: any): void {
    const dbTransport = this.transports.find(t => t.name === 'database') as DatabaseTransport;
    if (dbTransport) {
      dbTransport.setConnection(connection);
    }
  }
}

export const logger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  format: (process.env.LOG_FORMAT as 'json' | 'simple' | 'colored') || 'colored',
  transports: [
    'console',
    ...(process.env.LOG_DATABASE_ENABLED === 'true' ? ['database'] : []),
    ...(process.env.LOG_FILE_ENABLED === 'true' ? ['file'] : []),
    ...(process.env.LOG_EXTERNAL_ENABLED === 'true' ? ['external'] : [])
  ],
  console: {
    enabled: true,
    colors: process.env.LOG_COLORS !== 'false'
  },
  file: {
    enabled: process.env.LOG_FILE_ENABLED === 'true',
    path: process.env.LOG_FILE_PATH || './logs/app.log',
    maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES || '5')
  },
  database: {
    enabled: process.env.LOG_DATABASE_ENABLED === 'true',
    collection: process.env.LOG_DATABASE_COLLECTION || 'logs',
    ttlDays: parseInt(process.env.LOG_DATABASE_TTL_DAYS || '30')
  },
  external: {
    enabled: process.env.LOG_EXTERNAL_ENABLED === 'true',
    type: (process.env.LOG_EXTERNAL_TYPE as 'serilog' | 'sentry' | 'loggly' | 'papertrail') || 'serilog',
    url: process.env.LOG_EXTERNAL_URL,
    apiKey: process.env.LOG_EXTERNAL_API_KEY,
    appName: process.env.LOG_EXTERNAL_APP_NAME
  }
}); 