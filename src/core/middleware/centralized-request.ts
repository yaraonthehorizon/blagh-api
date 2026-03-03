import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Result } from '../../shared/types/result';
import { ResponseCode, AuditMessageType } from '../../shared/constants/enums';
import { AuthMiddleware } from './auth-middleware';

export interface CentralizedRequest extends Request {
  requestIdentifier: string;
  moduleCode: string;
  actionCode: string;
  result: Result;
  user: any;
  authProvider: string;
}

/**
 * Centralized middleware that handles:
 * 1. Request identifier generation/modification
 * 2. Authentication checking
 * 3. Result object preparation
 * 4. Passing prepared Result to controller
 */
export class CentralizedRequestMiddleware {
  
  /**
   * Main middleware that processes all requests
   * @param moduleCode The module code (e.g., 'USERS', 'AUTH')
   * @param actionCode The action code (e.g., 'ACCESS', 'READ', 'WRITE')
   * @param requireAuth Whether authentication is required
   */
  static process(
    moduleCode: string, 
    actionCode: string, 
    requireAuth: boolean = true
  ) {
    return async (req: Request, res: Response, next: Function) => {
      let specificActionCode: string;
      let requestIdentifier: string;
      
      try {
        // 1. Generate/modify request identifier with more specific action code
        specificActionCode = this.generateSpecificActionCode(req, moduleCode, actionCode);
        requestIdentifier = this.generateRequestIdentifier(req, moduleCode, specificActionCode);
        
        // 2. Check authentication if required
        let user = null;
        let authProvider = null;
        
        if (requireAuth) {
          try {
            // Check if auth module is initialized
            const authModule = AuthMiddleware.getAuthModule();
            if (!authModule) {
              throw new Error('Auth middleware not initialized');
            }

            // Extract token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader) {
              throw new Error('Authorization header is required');
            }

            // Parse Authorization header (Bearer <token>)
            const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
            if (!tokenMatch) {
              throw new Error('Authorization header must be in format: Bearer <token>');
            }

            const token = tokenMatch[1];
            
            // Auto-detect provider from token (default to internal)
            let provider = 'internal';
            try {
              // Try to decode JWT to check for provider claim
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const payload = JSON.parse(jsonPayload);
              
              // Check for provider claim
              if (payload.provider) {
                provider = payload.provider;
              } else if (payload.iss) {
                // Check for issuer (iss) claim for OAuth providers
                if (payload.iss.includes('google')) provider = 'google';
                else if (payload.iss.includes('facebook')) provider = 'facebook';
                else if (payload.iss.includes('github')) provider = 'github';
                else if (payload.iss.includes('firebase')) provider = 'firebase';
              }
            } catch (error) {
              // If we can't decode, use internal provider
              provider = 'internal';
            }
            
            // Validate token with the auth module
            const validationResult = await authModule.validateToken(token, provider);
            
            if (!validationResult || !validationResult.valid) {
              throw new Error(validationResult?.error || 'Token validation failed');
            }

            user = validationResult.user;
            authProvider = provider;
            
          } catch (authError: any) {
            const errorResult = new Result(
              null,
              ResponseCode.Unauthorized,
              [{ message: authError.message || 'Authentication required' }],
              null,
              requestIdentifier
            );
            errorResult.addMessage(AuditMessageType.warn, 'CentralizedRequest', 'process', 'Authentication failed');
            return res.status(401).json(errorResult);
          }
        }
        
        // 3. Prepare Result object with user info and request identifier
        const result = new Result(
          null,
          ResponseCode.Ok,
          [],
          null,
          requestIdentifier
        );
        result.user = user;
        
        // 4. Attach everything to request object
        (req as CentralizedRequest).requestIdentifier = requestIdentifier;
        (req as CentralizedRequest).moduleCode = moduleCode;
        (req as CentralizedRequest).actionCode = specificActionCode;
        (req as CentralizedRequest).result = result;
        (req as CentralizedRequest).user = user;
        (req as CentralizedRequest).authProvider = authProvider;
        
        // 5. Set logger context for this request
        const { logger } = require('../logging');
        logger.setContext({
          requestId: requestIdentifier,
          userId: user?._id || user?.id,
          module: moduleCode,
          action: specificActionCode,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: req.url
        });
        
        // 6. Log request start
        logger.info('Request started', {
          method: req.method,
          url: req.url,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          requestId: requestIdentifier,
          module: moduleCode,
          action: specificActionCode
        });
        
        // 7. Set up response logging
        const startTime = Date.now();
        
        // Override res.end to capture response completion
        const originalEnd = res.end;
        res.end = function(chunk?: any, encoding?: any) {
          const responseTime = Date.now() - startTime;
          
          // Log request completion
          logger.info('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            requestId: requestIdentifier,
            module: moduleCode,
            action: specificActionCode
          });
          
          // Call original end method
          return originalEnd.call(this, chunk, encoding);
        };
        
        // 8. Continue to controller
        next();
        
      } catch (error: any) {
        const errorResult = new Result(
          null,
          ResponseCode.Error,
          [{ message: 'Request processing failed' }],
          null,
          `${moduleCode}_${specificActionCode}_ERROR_${uuidv4().replace(/-/g, '')}`
        );
        errorResult.addException('CentralizedRequest', 'process', error);
        return res.status(500).json(errorResult);
      }
    };
  }
  
  /**
   * Generate specific action code based on HTTP method and route
   * @param req The request object
   * @param moduleCode The module code
   * @param baseActionCode The base action code
   * @returns Specific action code
   */
  private static generateSpecificActionCode(
    req: Request, 
    moduleCode: string, 
    baseActionCode: string
  ): string {
    const method = req.method.toUpperCase();
    const path = req.path;
    
    // Map HTTP methods to action codes
    const methodActionMap: { [key: string]: string } = {
      'GET': 'READ',
      'POST': 'CREATE',
      'PUT': 'UPDATE',
      'PATCH': 'UPDATE',
      'DELETE': 'DELETE'
    };
    
    // Get the specific action based on HTTP method
    const methodAction = methodActionMap[method] || 'ACCESS';
    
    // If it's a GET request to the root path, it's likely a list operation
    if (method === 'GET' && path === '/') {
      return 'GETALL';
    }
    
    // If it's a GET request with an ID parameter, it's a get by ID operation
    if (method === 'GET' && path.includes('/:')) {
      return 'GETBYID';
    }
    
    return methodAction;
  }

  /**
   * Generate request identifier based on FE provided ID or generate new one
   * @param req The request object
   * @param moduleCode The module code
   * @param actionCode The action code
   * @returns Formatted request identifier
   */
  private static generateRequestIdentifier(
    req: Request, 
    moduleCode: string, 
    actionCode: string
  ): string {
    // Check if FE provided request ID in headers
    const feRequestId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
    
    if (feRequestId) {
      // Use FE provided ID and modify with route info
      return `${moduleCode.toUpperCase()}_${actionCode.toUpperCase()}_${feRequestId}`;
    } else {
      // Generate new ID with route info
      const generatedId = uuidv4().replace(/-/g, '');
      return `${moduleCode.toUpperCase()}_${actionCode.toUpperCase()}_${generatedId}`;
    }
  }
  
  /**
   * Get the prepared Result object from request
   * @param req The request object
   * @returns The prepared Result object
   */
  static getResult(req: Request): Result {
    return (req as CentralizedRequest).result;
  }
  
  /**
   * Get the request identifier from request
   * @param req The request object
   * @returns The request identifier
   */
  static getRequestIdentifier(req: Request): string {
    return (req as CentralizedRequest).requestIdentifier;
  }
  
  /**
   * Get the user from request
   * @param req The request object
   * @returns The authenticated user
   */
  static getUser(req: Request): any {
    return (req as CentralizedRequest).user;
  }
  
  /**
   * Get the auth provider from request
   * @param req The request object
   * @returns The authentication provider
   */
  static getAuthProvider(req: Request): string {
    return (req as CentralizedRequest).authProvider;
  }
}
