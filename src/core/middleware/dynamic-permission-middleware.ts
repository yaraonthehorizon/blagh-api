import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../../modules/permission/services/permission.service';
import { Result } from '../../shared/types/result';
import { ResponseCode, AuditMessageType } from '../../shared/constants/enums';
import { CentralizedRequestMiddleware } from './centralized-request';

export interface DynamicPermissionRequest extends Request {
  user?: any;
  resource?: any;
  context?: Record<string, any>;
}

/**
 * Dynamic permission middleware that checks permissions from database
 */
export class DynamicPermissionMiddleware {
  private static permissionService = new PermissionService();

  /**
   * Check permission for a specific module and action
   * @param module The module name (e.g., 'USERS', 'AUTH')
   * @param action The action name (e.g., 'CREATE', 'READ', 'UPDATE', 'DELETE')
   * @param resourceExtractor Optional function to extract resource data from request
   * @param contextExtractor Optional function to extract additional context
   */
  static checkPermission(
    module: string,
    action: string,
    resourceExtractor?: (req: Request) => any,
    contextExtractor?: (req: Request) => Record<string, any>
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get user from centralized request middleware
        const user = CentralizedRequestMiddleware.getUser(req);
        if (!user) {
          const result = Result.unauthorized('Authentication required');
          result.addMessage(AuditMessageType.warn, 'DynamicPermission', 'checkPermission', 'No user found');
          return res.status(401).json(result);
        }

        // Extract resource and context
        const resource = resourceExtractor ? resourceExtractor(req) : undefined;
        const context = contextExtractor ? contextExtractor(req) : undefined;

        // Check permission
        const permissionResult = await DynamicPermissionMiddleware.permissionService.checkPermission({
          module,
          action,
          user,
          resource,
          context
        });

        if (!permissionResult.allowed) {
          const result = Result.error(permissionResult.reason || 'Access denied');
          result.statusCode = 1003; // Forbidden
          result.addMessage(AuditMessageType.warn, 'DynamicPermission', 'checkPermission', 
            `Permission denied: ${permissionResult.reason}`);
          result.additionalInfo = {
            module,
            action,
            userId: user.id,
            userRole: user.role,
            reason: permissionResult.reason,
            permission: permissionResult.permission
          };
          return res.status(403).json(result);
        }

        // Permission granted - add audit info
        const auditResult = CentralizedRequestMiddleware.getResult(req);
        auditResult.addMessage(AuditMessageType.info, 'DynamicPermission', 'checkPermission', 
          `Permission granted for ${module}:${action}`);
        auditResult.additionalInfo = {
          ...auditResult.additionalInfo,
          permission: {
            module,
            action,
            permissionId: permissionResult.permission?._id,
            conditions: permissionResult.conditions
          }
        };

        next();
      } catch (error: any) {
        const result = Result.error('Permission check failed');
        result.addException('DynamicPermission', 'checkPermission', error);
        result.additionalInfo = {
          module,
          action,
          error: error.message
        };
        return res.status(500).json(result);
      }
    };
  }

  /**
   * Check multiple permissions (all must pass)
   * @param permissions Array of {module, action} pairs
   */
  static checkMultiplePermissions(
    permissions: Array<{ module: string; action: string }>,
    resourceExtractor?: (req: Request) => any,
    contextExtractor?: (req: Request) => Record<string, any>
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = CentralizedRequestMiddleware.getUser(req);
        if (!user) {
          const result = Result.unauthorized('Authentication required');
          result.addMessage(AuditMessageType.warn, 'DynamicPermission', 'checkMultiplePermissions', 'No user found');
          return res.status(401).json(result);
        }

        const resource = resourceExtractor ? resourceExtractor(req) : undefined;
        const context = contextExtractor ? contextExtractor(req) : undefined;

        // Check all permissions
        for (const { module, action } of permissions) {
          const permissionResult = await DynamicPermissionMiddleware.permissionService.checkPermission({
            module,
            action,
            user,
            resource,
            context
          });

          if (!permissionResult.allowed) {
            const result = Result.error(`Access denied: ${permissionResult.reason}`);
            result.statusCode = 1003; // Forbidden
            result.addMessage(AuditMessageType.warn, 'DynamicPermission', 'checkMultiplePermissions', 
              `Permission denied for ${module}:${action}`);
            result.additionalInfo = {
              module,
              action,
              userId: user.id,
              userRole: user.role,
              reason: permissionResult.reason,
              failedPermission: { module, action }
            };
            return res.status(403).json(result);
          }
        }

        // All permissions granted
        const auditResult = CentralizedRequestMiddleware.getResult(req);
        auditResult.addMessage(AuditMessageType.info, 'DynamicPermission', 'checkMultiplePermissions', 
          `All permissions granted: ${permissions.map(p => `${p.module}:${p.action}`).join(', ')}`);

        next();
      } catch (error: any) {
        const result = Result.error('Multiple permission check failed');
        result.addException('DynamicPermission', 'checkMultiplePermissions', error);
        return res.status(500).json(result);
      }
    };
  }

  /**
   * Check any of multiple permissions (at least one must pass)
   * @param permissions Array of {module, action} pairs
   */
  static checkAnyPermission(
    permissions: Array<{ module: string; action: string }>,
    resourceExtractor?: (req: Request) => any,
    contextExtractor?: (req: Request) => Record<string, any>
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = CentralizedRequestMiddleware.getUser(req);
        if (!user) {
          const result = Result.unauthorized('Authentication required');
          result.addMessage(AuditMessageType.warn, 'DynamicPermission', 'checkAnyPermission', 'No user found');
          return res.status(401).json(result);
        }

        const resource = resourceExtractor ? resourceExtractor(req) : undefined;
        const context = contextExtractor ? contextExtractor(req) : undefined;

        // Check if any permission passes
        let grantedPermission = null;
        for (const { module, action } of permissions) {
          const permissionResult = await DynamicPermissionMiddleware.permissionService.checkPermission({
            module,
            action,
            user,
            resource,
            context
          });

          if (permissionResult.allowed) {
            grantedPermission = { module, action, permission: permissionResult.permission };
            break;
          }
        }

        if (!grantedPermission) {
          const result = Result.error('Access denied: No permissions granted');
          result.statusCode = 1003; // Forbidden
          result.addMessage(AuditMessageType.warn, 'DynamicPermission', 'checkAnyPermission', 
            'No permissions granted from any of the required permissions');
          result.additionalInfo = {
            permissions,
            userId: user.id,
            userRole: user.role
          };
          return res.status(403).json(result);
        }

        // Permission granted
        const auditResult = CentralizedRequestMiddleware.getResult(req);
        auditResult.addMessage(AuditMessageType.info, 'DynamicPermission', 'checkAnyPermission', 
          `Permission granted for ${grantedPermission.module}:${grantedPermission.action}`);
        auditResult.additionalInfo = {
          ...auditResult.additionalInfo,
          grantedPermission
        };

        next();
      } catch (error: any) {
        const result = Result.error('Any permission check failed');
        result.addException('DynamicPermission', 'checkAnyPermission', error);
        return res.status(500).json(result);
      }
    };
  }

  /**
   * Resource-based permission check (e.g., user can only edit their own profile)
   * @param module The module name
   * @param action The action name
   * @param resourceIdExtractor Function to extract resource ID from request
   * @param ownerExtractor Function to extract owner ID from resource
   */
  static checkResourcePermission(
    module: string,
    action: string,
    resourceIdExtractor: (req: Request) => string,
    ownerExtractor: (resource: any) => string
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = CentralizedRequestMiddleware.getUser(req);
        if (!user) {
          const result = Result.unauthorized('Authentication required');
          result.addMessage(AuditMessageType.warn, 'DynamicPermission', 'checkResourcePermission', 'No user found');
          return res.status(401).json(result);
        }

        const resourceId = resourceIdExtractor(req);
        if (!resourceId) {
          const result = Result.error('Resource ID required');
          result.statusCode = 1001; // Bad Request
          result.addMessage(AuditMessageType.warn, 'DynamicPermission', 'checkResourcePermission', 'No resource ID found');
          return res.status(400).json(result);
        }

        // Check basic permission first
        const basicPermissionResult = await DynamicPermissionMiddleware.permissionService.checkPermission({
          module,
          action,
          user,
          context: { resourceId }
        });

        if (!basicPermissionResult.allowed) {
          const result = Result.error(basicPermissionResult.reason || 'Access denied');
          result.statusCode = 1003; // Forbidden
          result.addMessage(AuditMessageType.warn, 'DynamicPermission', 'checkResourcePermission', 
            `Basic permission denied for ${module}:${action}`);
          return res.status(403).json(result);
        }

        // Check resource ownership
        // Note: You would typically fetch the resource from database here
        // For now, we'll assume the resource is available in req.resource
        const resource = (req as any).resource;
        if (resource) {
          const ownerId = ownerExtractor(resource);
                      if (ownerId !== user.id && user.role !== 'admin') {
              const result = Result.error('Access denied: Resource ownership required');
              result.statusCode = 1003; // Forbidden
              result.addMessage(AuditMessageType.warn, 'DynamicPermission', 'checkResourcePermission', 
                'Resource ownership check failed');
              result.additionalInfo = {
                resourceId,
                ownerId,
                userId: user.id
              };
              return res.status(403).json(result);
            }
        }

        // All checks passed
        const auditResult = CentralizedRequestMiddleware.getResult(req);
        auditResult.addMessage(AuditMessageType.info, 'DynamicPermission', 'checkResourcePermission', 
          `Resource permission granted for ${module}:${action} on resource ${resourceId}`);

        next();
      } catch (error: any) {
        const result = Result.error('Resource permission check failed');
        result.addException('DynamicPermission', 'checkResourcePermission', error);
        return res.status(500).json(result);
      }
    };
  }
}
