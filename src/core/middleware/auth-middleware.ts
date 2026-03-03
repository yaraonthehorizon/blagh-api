import { Request, Response, NextFunction, Router } from 'express';
import { AuthModule } from '../../modules/auth/auth.module';
import { Result } from '../../shared/types/result';
import { ResponseCode, AuditMessageType } from '../../shared/constants/enums';

export interface AuthenticatedRequest extends Request {
  user?: any;
  authProvider?: string;
  token?: string;
}

export interface AuthMiddlewareConfig {
  /**
   * Whether to require authentication for all routes
   * @default true
   */
  requireAuth?: boolean;
  
  /**
   * Specific auth provider to use for validation
   * If not specified, will auto-detect from token
   */
  provider?: string;
  
  /**
   * Whether to attach user info to request
   * @default true
   */
  attachUser?: boolean;
  
  /**
   * Custom error handler
   */
  onAuthError?: (req: Request, res: Response, error: any) => void;
}

export class AuthMiddleware {
  private static authModule?: AuthModule;

  /**
   * Initialize the auth middleware with auth module instance
   */
  static initialize(authModule: AuthModule): void {
    AuthMiddleware.authModule = authModule;
  }

  /**
   * Get the auth module instance
   */
  static getAuthModule(): AuthModule | undefined {
    return AuthMiddleware.authModule;
  }

  /**
   * Create middleware function for router.use() - protects entire module
   */
  static protectModule(config?: Partial<AuthMiddlewareConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return AuthMiddleware.authenticate(config);
  }

  /**
   * Create middleware function for specific routes - protects individual routes
   */
  static protectRoute(config?: Partial<AuthMiddlewareConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return AuthMiddleware.authenticate(config);
  }

  /**
   * Create middleware function for optional authentication
   */
  static optional(): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return AuthMiddleware.authenticate({ requireAuth: false });
  }

  /**
   * Create middleware function for role-based access
   */
  static requireRole(role: string | string[]): (req: Request, res: Response, next: NextFunction) => void {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        const result = Result.unauthorized('User must be authenticated to access this resource');
        result.addMessage(AuditMessageType.warn, 'AuthMiddleware', 'requireRole', 'Authentication required');
        res.status(401).json(result);
        return;
      }

      const requiredRoles = Array.isArray(role) ? role : [role];
      const userRole = req.user.role || 'user';

      if (!requiredRoles.includes(userRole)) {
        const result = Result.error(`Role '${userRole}' does not have access to this resource`);
        result.addMessage(AuditMessageType.warn, 'AuthMiddleware', 'requireRole', 'Insufficient permissions');
        result.additionalInfo = {
          requiredRoles,
          currentRole: userRole,
          resource: req.path,
          method: req.method
        };
        res.status(403).json(result);
        return;
      }

      next();
    };
  }

  /**
   * Create middleware function for permission-based access
   */
  static requirePermission(permission: string | string[]): (req: Request, res: Response, next: NextFunction) => void {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        const result = Result.unauthorized('User must be authenticated to access this resource');
        result.addMessage(AuditMessageType.warn, 'AuthMiddleware', 'requirePermission', 'Authentication required');
        res.status(401).json(result);
        return;
      }

      const requiredPermissions = Array.isArray(permission) ? permission : [permission];
      const userPermissions = req.user.permissions || [];

      const hasPermission = requiredPermissions.every(perm => userPermissions.includes(perm));
      
      if (!hasPermission) {
        const result = Result.error('User does not have required permissions');
        result.addMessage(AuditMessageType.warn, 'AuthMiddleware', 'requirePermission', 'Insufficient permissions');
        result.additionalInfo = {
          requiredPermissions,
          currentPermissions: userPermissions,
          resource: req.path,
          method: req.method
        };
        res.status(403).json(result);
        return;
      }

      next();
    };
  }

  /**
   * Main authentication middleware function
   */
  private static authenticate(config?: Partial<AuthMiddlewareConfig>): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Check if auth module is initialized
        if (!AuthMiddleware.authModule) {
          console.error('[AuthMiddleware] Auth module not initialized. Available plugins:', 
            AuthMiddleware.getPluginManagerInfo());
          throw new Error('Auth middleware not initialized. Call AuthMiddleware.initialize() first.');
        }

        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          if (config?.requireAuth !== false) {
            return AuthMiddleware.handleAuthError(req, res, {
              code: 'MISSING_AUTH_HEADER',
              message: 'Authorization header is required'
            }, config);
          }
          // For optional auth, continue without user
          return next();
        }

        // Parse Authorization header (Bearer <token>)
        const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
        if (!tokenMatch) {
          if (config?.requireAuth !== false) {
            return AuthMiddleware.handleAuthError(req, res, {
              code: 'INVALID_AUTH_FORMAT',
              message: 'Authorization header must be in format: Bearer <token>'
            }, config);
          }
          // For optional auth, continue without user
          return next();
        }

        const token = tokenMatch[1];
        req.token = token;

        // Determine which provider to use for validation
        const provider = config?.provider || AuthMiddleware.detectProvider(token);
        
        // Validate token with the auth module
        const validationResult = await AuthMiddleware.authModule.validateToken(token, provider);
        
        if (!validationResult || !validationResult.valid) {
          if (config?.requireAuth !== false) {
            return AuthMiddleware.handleAuthError(req, res, {
              code: 'INVALID_TOKEN',
              message: validationResult?.error || 'Token validation failed'
            }, config);
          }
          // For optional auth, continue without user
          return next();
        }

        // Attach user info to request if configured
        if (config?.attachUser !== false) {
          req.user = validationResult.user;
          req.authProvider = provider;
        }

        // Log successful authentication
        AuthMiddleware.logAuthSuccess(req, validationResult.user, provider);
        
        next();
      } catch (error: any) {
        if (config?.requireAuth !== false) {
          return AuthMiddleware.handleAuthError(req, res, {
            code: 'AUTH_ERROR',
            message: error.message || 'Authentication failed'
          }, config);
        }
        // For optional auth, just continue
        next();
      }
    };
  }

  /**
   * Detect the auth provider from token format
   */
  private static detectProvider(token: string): string {
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
        return payload.provider;
      }
      
      // Check for issuer (iss) claim for OAuth providers
      if (payload.iss) {
        if (payload.iss.includes('google')) return 'google';
        if (payload.iss.includes('facebook')) return 'facebook';
        if (payload.iss.includes('github')) return 'github';
        if (payload.iss.includes('firebase')) return 'firebase';
      }
      
      // Default to internal if no provider detected
      return 'internal';
    } catch (error) {
      // If we can't decode, assume internal
      return 'internal';
    }
  }

  /**
   * Handle authentication errors
   */
  private static handleAuthError(req: Request, res: Response, error: any, config?: Partial<AuthMiddlewareConfig>): void {
    // Use custom error handler if provided
    if (config?.onAuthError) {
      config.onAuthError(req, res, error);
      return;
    }

    // Default error handling using unified result object
    let result: Result;
    let statusCode: number;

    switch (error.code) {
      case 'MISSING_AUTH_HEADER':
        result = Result.unauthorized(error.message || 'Authorization header is required');
        statusCode = 401;
        break;
      case 'INVALID_AUTH_FORMAT':
        result = Result.unauthorized(error.message || 'Invalid authorization format');
        statusCode = 401;
        break;
      case 'INVALID_TOKEN':
        result = Result.unauthorized(error.message || 'Token validation failed');
        statusCode = 401;
        break;
      default:
        result = Result.unauthorized(error.message || 'Authentication failed');
        statusCode = 401;
        break;
    }

    // Add audit information
    result.addMessage(AuditMessageType.warn, 'AuthMiddleware', 'handleAuthError', error.code || 'AUTH_ERROR');
    result.additionalInfo = {
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      errorCode: error.code,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };

    res.status(statusCode).json(result);
  }

  /**
   * Log successful authentication
   */
  private static logAuthSuccess(req: Request, user: any, provider: string): void {
    console.log(`[AUTH] ${user?.email || user?.id || 'unknown'} (${provider}) - ${req.method} ${req.path}`);
  }

  /**
   * Create a unified success response for authenticated requests
   */
  static createSuccessResponse(data: any, message?: string, requestIdentifier?: string): Result {
    const result = Result.success(data, requestIdentifier);
    if (message) {
      result.messages = [message];
    }
    return result;
  }

  /**
   * Create a unified error response for authentication failures
   */
  static createErrorResponse(errorCode: string, message: string, requestIdentifier?: string): Result {
    const result = Result.unauthorized(message, requestIdentifier);
    result.additionalInfo = {
      errorCode,
      timestamp: new Date().toISOString()
    };
    return result;
  }



  /**
   * Check if middleware is initialized
   */
  static isInitialized(): boolean {
    return !!AuthMiddleware.authModule;
  }

  /**
   * Get plugin manager info for debugging
   */
  private static getPluginManagerInfo(): any {
    try {
      // This is a fallback method for debugging
      return {
        authModuleExists: !!AuthMiddleware.authModule,
        authModuleType: AuthMiddleware.authModule ? typeof AuthMiddleware.authModule : 'undefined',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}
