import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware, type AuthenticatedRequest } from './auth-middleware';
import { Result } from '../../shared/types/result';
import { AuditMessageType } from '../../shared/constants/enums';

export interface PermissionConfig {
  /**
   * Required permissions in format: ['admin:users:read', 'admin:users:write']
   * Or simple format: ['admin:users:*'] for all actions
   */
  permissions: string | string[];
  
  /**
   * Whether to require ALL permissions (AND) or ANY permission (OR)
   * @default 'all' (AND)
   */
  requireAll?: 'all' | 'any';
  
  /**
   * Custom error message
   */
  errorMessage?: string;
  
  /**
   * Custom error handler
   */
  onPermissionError?: (req: Request, res: Response, missingPermissions: string[]) => void;
}

export interface UserPermissions {
  role: string;
  permissions: string[];
  modules?: string[];
  actions?: string[];
}

export class PermissionMiddleware {
  /**
   * Create middleware that requires specific permissions
   * Usage: router.use('/users', PermissionMiddleware.requirePermissions(['admin:users:*']), userRoutes)
   */
  static requirePermissions(config: PermissionConfig | string | string[]) {
    const permissionConfig = this.normalizeConfig(config);
    
    return [
      // First: Require authentication
      AuthMiddleware.protectRoute(),
      
      // Second: Check permissions
      (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
          const user = req.user;
          if (!user) {
            const result = Result.unauthorized('Authentication required');
            result.addMessage(AuditMessageType.warn, 'PermissionMiddleware', 'requirePermissions', 'No user found');
            res.status(401).json(result);
            return;
          }

          const userPermissions = this.extractUserPermissions(user);
          const requiredPermissions = Array.isArray(permissionConfig.permissions) 
            ? permissionConfig.permissions 
            : [permissionConfig.permissions];

          const missingPermissions = this.checkPermissions(
            userPermissions, 
            requiredPermissions, 
            permissionConfig.requireAll || 'all'
          );

          if (missingPermissions.length > 0) {
            return this.handlePermissionError(req, res, missingPermissions, permissionConfig);
          }

          // Log successful permission access
          this.logPermissionAccess(req, user, requiredPermissions);
          next();
        } catch (error: any) {
          const result = Result.error('Permission check failed');
          result.addException('PermissionMiddleware', 'requirePermissions', error);
          res.status(500).json(result);
        }
      }
    ];
  }

  /**
   * Create middleware for module-level access control
   * Usage: router.use('/users', PermissionMiddleware.requireModuleAccess('users', ['read', 'write']), userRoutes)
   */
  static requireModuleAccess(module: string, actions: string[] = ['*'], roles: string[] = ['*']) {
    const permissions = this.buildModulePermissions(module, actions, roles);
    return this.requirePermissions(permissions);
  }

  /**
   * Create middleware for role-based access control
   * Usage: router.use('/admin', PermissionMiddleware.requireRole(['admin', 'super_admin']), adminRoutes)
   */
  static requireRole(roles: string | string[]) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const permissions = roleArray.map(role => `${role}:*:*`);
    return this.requirePermissions(permissions);
  }

  /**
   * Create middleware for action-based access control
   * Usage: router.use('/users', PermissionMiddleware.requireAction('users', 'delete'), userRoutes)
   */
  static requireAction(module: string, action: string, roles: string[] = ['*']) {
    const permissions = this.buildActionPermissions(module, action, roles);
    return this.requirePermissions(permissions);
  }

  /**
   * Create middleware for hierarchical access control
   * Usage: router.use('/users', PermissionMiddleware.requireHierarchy('admin', 'users', ['read', 'write']), userRoutes)
   */
  static requireHierarchy(role: string, module: string, actions: string[] = ['*']) {
    const permissions = this.buildHierarchyPermissions(role, module, actions);
    return this.requirePermissions(permissions);
  }

  /**
   * Normalize permission config
   */
  private static normalizeConfig(config: PermissionConfig | string | string[]): PermissionConfig {
    if (typeof config === 'string') {
      return { permissions: config };
    }
    
    if (Array.isArray(config)) {
      return { permissions: config };
    }
    
    return config;
  }

  /**
   * Extract user permissions from user object
   * Supports multiple permission formats
   */
  private static extractUserPermissions(user: any): UserPermissions {
    const permissions: string[] = [];
    
    // Format 1: Direct permissions array
    if (user.permissions && Array.isArray(user.permissions)) {
      permissions.push(...user.permissions);
    }
    
    // Format 2: Role-based permissions
    if (user.role) {
      // Add role:*:* permission
      permissions.push(`${user.role}:*:*`);
      
      // Add role-specific permissions if they exist
      if (user.rolePermissions && Array.isArray(user.rolePermissions)) {
        permissions.push(...user.rolePermissions);
      }
    }
    
    // Format 3: Module-based permissions
    if (user.modulePermissions && typeof user.modulePermissions === 'object') {
      Object.entries(user.modulePermissions).forEach(([module, actions]: [string, any]) => {
        if (Array.isArray(actions)) {
          actions.forEach((action: string) => {
            permissions.push(`${user.role || 'user'}:${module}:${action}`);
          });
        }
      });
    }
    
    // Format 4: Action-based permissions
    if (user.actionPermissions && Array.isArray(user.actionPermissions)) {
      permissions.push(...user.actionPermissions);
    }

    return {
      role: user.role || 'user',
      permissions: [...new Set(permissions)], // Remove duplicates
      modules: user.modules || [],
      actions: user.actions || []
    };
  }

  /**
   * Check if user has required permissions
   */
  private static checkPermissions(
    userPermissions: UserPermissions, 
    requiredPermissions: string[], 
    requireAll: 'all' | 'any'
  ): string[] {
    const missingPermissions: string[] = [];

    for (const required of requiredPermissions) {
      const hasPermission = this.checkSinglePermission(userPermissions, required);
      
      if (!hasPermission) {
        missingPermissions.push(required);
        
        // If we only need ANY permission and found one missing, we can stop
        if (requireAll === 'any') {
          continue;
        }
      } else if (requireAll === 'any') {
        // If we only need ANY permission and found one that works, we're good
        return [];
      }
    }

    return missingPermissions;
  }

  /**
   * Check if user has a single permission
   */
  private static checkSinglePermission(userPermissions: UserPermissions, requiredPermission: string): boolean {
    const [requiredRole, requiredModule, requiredAction] = requiredPermission.split(':');
    
    // Check role
    if (requiredRole !== '*' && requiredRole !== userPermissions.role) {
      return false;
    }
    
    // Check exact permission match
    if (userPermissions.permissions.includes(requiredPermission)) {
      return true;
    }
    
    // Check wildcard permissions
    if (userPermissions.permissions.includes(`${requiredRole}:*:*`)) {
      return true;
    }
    
    if (userPermissions.permissions.includes(`${requiredRole}:${requiredModule}:*`)) {
      return true;
    }
    
    // Check module and action separately
    if (requiredModule !== '*' && requiredAction !== '*') {
      const modulePermission = `${userPermissions.role}:${requiredModule}:${requiredAction}`;
      if (userPermissions.permissions.includes(modulePermission)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Build module permissions
   */
  private static buildModulePermissions(module: string, actions: string[], roles: string[]): string[] {
    const permissions: string[] = [];
    
    for (const role of roles) {
      for (const action of actions) {
        permissions.push(`${role}:${module}:${action}`);
      }
    }
    
    return permissions;
  }

  /**
   * Build action permissions
   */
  private static buildActionPermissions(module: string, action: string, roles: string[]): string[] {
    return roles.map(role => `${role}:${module}:${action}`);
  }

  /**
   * Build hierarchy permissions
   */
  private static buildHierarchyPermissions(role: string, module: string, actions: string[]): string[] {
    return actions.map(action => `${role}:${module}:${action}`);
  }

  /**
   * Handle permission errors
   */
  private static handlePermissionError(
    req: Request, 
    res: Response, 
    missingPermissions: string[], 
    config: PermissionConfig
  ): void {
    // Use custom error handler if provided
    if (config.onPermissionError) {
      config.onPermissionError(req, res, missingPermissions);
      return;
    }

    // Default error handling
    const errorMessage = config.errorMessage || 'Insufficient permissions';
    const result = Result.error(errorMessage);
    result.addMessage(AuditMessageType.warn, 'PermissionMiddleware', 'handlePermissionError', 'Permission denied');
    result.additionalInfo = {
      missingPermissions,
      requiredPermissions: config.permissions,
      resource: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      contactAdmin: 'admin@example.com'
    };

    res.status(403).json(result);
  }

  /**
   * Log successful permission access
   */
  private static logPermissionAccess(req: Request, user: any, permissions: string[]): void {
    console.log(`[PERMISSION_GRANTED] ${user.email} (${user.role}) - ${req.method} ${req.path} - Permissions: ${permissions.join(', ')}`);
  }
}
