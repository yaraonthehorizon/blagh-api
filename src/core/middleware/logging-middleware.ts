import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging';

export interface LoggedRequest extends Request {
  startTime?: number;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  session?: any; // Add session property
}

export interface LoggedResponse extends Response {
  responseTime?: number;
}

/**
 * Logging middleware that automatically captures request context
 * and logs to all configured transports (console, file, database, external)
 */
export class LoggingMiddleware {
  
  /**
   * Main logging middleware
   */
  static logRequest() {
    return (req: LoggedRequest, res: LoggedResponse, next: NextFunction) => {
      // Capture start time
      req.startTime = Date.now();
      
      // Check if context is already set by centralized request middleware
      const centralizedContext = (req as any).requestIdentifier || (req as any).moduleCode || (req as any).actionCode;
      
      // Extract request information
      const requestInfo = {
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        requestId: centralizedContext ? (req as any).requestIdentifier : 
                  (req.headers['x-request-id'] && Array.isArray(req.headers['x-request-id'])) ? req.headers['x-request-id'][0] : (req.headers['x-request-id'] as string) || 
                  (req.headers['x-correlation-id'] && Array.isArray(req.headers['x-correlation-id'])) ? req.headers['x-correlation-id'][0] : (req.headers['x-correlation-id'] as string),
        userId: (req as any).user?.id || (req as any).user?._id,
        sessionId: req.session?.id,
        module: centralizedContext ? (req as any).moduleCode : this.extractModuleFromUrl(req.url),
        action: centralizedContext ? (req as any).actionCode : this.extractActionFromMethod(req.method, req.url)
      };

      // Set logger context
      logger.setContext(requestInfo);

      // Log request start
      logger.info('Request started', {
        method: requestInfo.method,
        url: requestInfo.url,
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body),
        query: req.query,
        params: req.params
      });

      // Override res.end to capture response information
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any): LoggedResponse {
        // Calculate response time
        const responseTime = Date.now() - (req.startTime || 0);
        res.responseTime = responseTime;

        // Log response completion
        logger.info('Request completed', {
          method: requestInfo.method,
          url: requestInfo.url,
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          contentLength: res.get('Content-Length') || 'unknown'
        });

        // Call original end method
        return originalEnd.call(this, chunk, encoding);
      };

      // Override res.json to capture response data
      const originalJson = res.json;
      res.json = function(body: any): LoggedResponse {
        // Log response data (sanitized)
        logger.debug('Response data', {
          method: requestInfo.method,
          url: requestInfo.url,
          statusCode: res.statusCode,
          responseData: LoggingMiddleware.sanitizeResponse(body)
        });

        // Call original json method
        return originalJson.call(this, body);
      };

      next();
    };
  }

  /**
   * Error logging middleware
   */
  static logError() {
    return (error: Error, req: LoggedRequest, res: Response, next: NextFunction) => {
      const responseTime = req.startTime ? Date.now() - req.startTime : 0;
      
      // Log error with full context
      logger.error('Request error', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode || 500,
        responseTime: `${responseTime}ms`,
        error: error.message,
        stack: error.stack
      }, error);

      next(error);
    };
  }

  /**
   * Performance logging middleware
   */
  static logPerformance() {
    return (req: LoggedRequest, res: LoggedResponse, next: NextFunction) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        // Log performance metrics
        if (responseTime > 1000) { // Log slow requests (>1s)
          logger.warn('Slow request detected', {
            method: req.method,
            url: req.url,
            responseTime: `${responseTime}ms`,
            statusCode: res.statusCode
          });
        }
        
        // Log performance metrics for database logging
        if (process.env.LOG_DATABASE_ENABLED === 'true') {
          logger.info('Request performance', {
            method: req.method,
            url: req.url,
            responseTime: responseTime,
            statusCode: res.statusCode,
            contentLength: res.get('Content-Length') || 0
          });
        }
      });

      next();
    };
  }

  /**
   * Database query logging middleware
   */
  static logDatabaseQueries() {
    return (req: LoggedRequest, res: Response, next: NextFunction) => {
      // This would be integrated with your database layer
      // to log all database queries with timing
      next();
    };
  }

  /**
   * Extract module name from URL
   */
  private static extractModuleFromUrl(url: string): string {
    const pathParts = url.split('/').filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === 'api') {
      return pathParts[1].toUpperCase();
    } else if (pathParts.length >= 1 && pathParts[0] === 'health') {
      return 'HEALTH';
    } else if (pathParts.length >= 1 && pathParts[0] === 'seed') {
      return 'SEED';
    }
    return 'UNKNOWN';
  }

  /**
   * Extract action from HTTP method and URL
   */
  private static extractActionFromMethod(method: string, url: string): string {
    const actionMap: { [key: string]: string } = {
      'GET': 'READ',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE',
      'OPTIONS': 'OPTIONS',
      'HEAD': 'READ'
    };
    
    const baseAction = actionMap[method] || 'UNKNOWN';
    
    // Make action more specific based on URL patterns
    if (method === 'GET') {
      if (url === '/' || url.endsWith('/')) {
        return 'GETALL';
      } else if (url.includes('/:')) {
        return 'GETBYID';
      } else if (url.includes('/search') || url.includes('/filter')) {
        return 'SEARCH';
      }
    } else if (method === 'POST') {
      if (url.includes('/bulk')) {
        return 'BULK_CREATE';
      } else if (url.includes('/import')) {
        return 'IMPORT';
      }
    } else if (method === 'PUT' || method === 'PATCH') {
      if (url.includes('/bulk')) {
        return 'BULK_UPDATE';
      }
    } else if (method === 'DELETE') {
      if (url.includes('/bulk')) {
        return 'BULK_DELETE';
      }
    }
    
    return baseAction;
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private static sanitizeHeaders(headers: any): any {
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
   * Sanitize request body to remove sensitive information
   */
  private static sanitizeBody(body: any): any {
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

  /**
   * Sanitize response data
   */
  static sanitizeResponse(body: any): any {
    if (!body) return body;
    
    // For large responses, just log the structure
    if (JSON.stringify(body).length > 1000) {
      return {
        type: typeof body,
        length: Array.isArray(body) ? body.length : 'object',
        preview: Array.isArray(body) ? body.slice(0, 3) : Object.keys(body).slice(0, 5)
      };
    }
    
    return body;
  }
}

// Export convenience functions
export const logRequest = LoggingMiddleware.logRequest;
export const logError = LoggingMiddleware.logError;
export const logPerformance = LoggingMiddleware.logPerformance;
export const logDatabaseQueries = LoggingMiddleware.logDatabaseQueries;
