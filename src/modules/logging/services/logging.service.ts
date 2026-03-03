import { logger } from '../../../core/logging';
import { LogModel } from '../schemas/log.schema';

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  module?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  tags?: string[];
}

export interface LogData {
  message: string;
  meta?: any;
  error?: Error;
  context?: LogContext;
  level?: 'error' | 'warn' | 'info' | 'debug' | 'verbose';
}

export class LoggingService {
  
  /**
   * Set logging context for the current request
   */
  setContext(context: LogContext): void {
    logger.setContext(context);
  }

  /**
   * Log information message
   */
  info(message: string, meta?: any, context?: LogContext): void {
    if (context) this.setContext(context);
    logger.info(message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: any, context?: LogContext): void {
    if (context) this.setContext(context);
    logger.warn(message, meta);
  }

  /**
   * Log error message with optional error object
   */
  error(message: string, meta?: any, error?: Error): void {
    logger.error(message, meta, error);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: any): void {
    logger.debug(message, meta);
  }

  /**
   * Log verbose message
   */
  verbose(message: string, meta?: any): void {
    logger.verbose(message, meta);
  }

  /**
   * Log API request
   */
  logApiRequest(req: any, context?: LogContext): void {
    if (context) this.setContext(context);
    
    this.info('API Request', {
      method: req.method,
      url: req.url,
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeBody(req.body),
      query: req.query,
      params: req.params
    });
  }

  /**
   * Log API response
   */
  logApiResponse(req: any, res: any, responseTime: number, context?: LogContext): void {
    if (context) this.setContext(context);
    
    this.info('API Response', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 'unknown'
    });
  }

  /**
   * Log API error
   */
  logApiError(req: any, res: any, error: Error, responseTime: number, context?: LogContext): void {
    if (context) this.setContext(context);
    
    this.error('API Error', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode || 500,
      responseTime: `${responseTime}ms`,
      error: error.message,
      stack: error.stack
    }, error);
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(operation: string, collection: string, query: any, duration: number, context?: LogContext): void {
    if (context) this.setContext(context);
    
    this.debug('Database Operation', {
      operation,
      collection,
      query: this.sanitizeQuery(query),
      duration: `${duration}ms`
    });
  }

  /**
   * Log database error
   */
  logDatabaseError(operation: string, collection: string, query: any, error: Error, context?: LogContext): void {
    if (context) this.setContext(context);
    
    this.error('Database Error', {
      operation,
      collection,
      query: this.sanitizeQuery(query),
      error: error.message,
      code: (error as any).code
    }, error);
  }

  /**
   * Log authentication event
   */
  logAuthEvent(event: string, userId: string, success: boolean, meta?: any, context?: LogContext): void {
    if (context) this.setContext(context);
    
    if (success) {
      this.info(`Authentication ${event}`, {
        event,
        userId,
        success,
        ...meta
      });
    } else {
      this.warn(`Authentication ${event}`, {
        event,
        userId,
        success,
        ...meta
      });
    }
  }

  /**
   * Log permission check
   */
  logPermissionCheck(userId: string, module: string, action: string, granted: boolean, context?: LogContext): void {
    if (context) this.setContext(context);
    
    this.info('Permission Check', {
      userId,
      module,
      action,
      granted,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log business logic event
   */
  logBusinessEvent(event: string, module: string, action: string, meta?: any, context?: LogContext): void {
    if (context) this.setContext(context);
    
    this.info(`Business Event: ${event}`, {
      event,
      module,
      action,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(operation: string, duration: number, meta?: any, context?: LogContext): void {
    if (context) this.setContext(context);
    
    if (duration > 1000) {
      this.warn(`Performance: ${operation}`, {
        operation,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        ...meta
      });
    } else {
      this.debug(`Performance: ${operation}`, {
        operation,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        ...meta
      });
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any, context?: LogContext): void {
    if (context) this.setContext(context);
    
    if (severity === 'critical') {
      this.error(`Security Event: ${event}`, {
        event,
        severity,
        timestamp: new Date().toISOString(),
        ...meta
      });
    } else if (severity === 'high') {
      this.warn(`Security Event: ${event}`, {
        event,
        severity,
        timestamp: new Date().toISOString(),
        ...meta
      });
    } else {
      this.info(`Security Event: ${event}`, {
        event,
        severity,
        timestamp: new Date().toISOString(),
        ...meta
      });
    }
  }

  /**
   * Query logs from database
   */
  async queryLogs(filters: {
    level?: string;
    module?: string;
    action?: string;
    userId?: string;
    requestId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  }): Promise<any[]> {
    try {
      const query: any = {};

      if (filters.level) query.level = filters.level.toUpperCase();
      if (filters.module) query.module = filters.module.toUpperCase();
      if (filters.action) query.action = filters.action.toUpperCase();
      if (filters.userId) query.userId = filters.userId;
      if (filters.requestId) query.requestId = filters.requestId;

      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
      }

      const limit = filters.limit || 100;
      const skip = filters.skip || 0;

      return await LogModel.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
    } catch (error) {
      this.error('Failed to query logs', { filters }, error as Error);
      return [];
    }
  }

  /**
   * Clean old logs based on TTL
   */
  async cleanOldLogs(): Promise<void> {
    try {
      const ttlDays = parseInt(process.env.LOG_DATABASE_TTL_DAYS || '30');
      const cutoffDate = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000);

      const result = await LogModel.deleteMany({ timestamp: { $lt: cutoffDate } });
      
      this.info('Cleaned old logs', {
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate.toISOString()
      });
    } catch (error) {
      this.error('Failed to clean old logs', {}, error as Error);
    }
  }

  /**
   * Get logging statistics
   */
  async getLogStats(): Promise<any> {
    try {
      const stats = await LogModel.aggregate([
        {
          $group: {
            _id: {
              level: '$level',
              module: '$module',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            levels: {
              $push: {
                level: '$_id.level',
                module: '$_id.module',
                count: '$count'
              }
            }
          }
        },
        { $sort: { '_id': -1 } }
      ]);

      return stats;
    } catch (error) {
      this.error('Failed to get log statistics', {}, error as Error);
      return [];
    }
  }

  /**
   * Sanitize sensitive data in queries
   */
  private sanitizeQuery(query: any): any {
    if (!query) return query;
    
    const sanitized = { ...query };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize headers
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize body
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'apiKey'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }
}

export const loggingService = new LoggingService();
