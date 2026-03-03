import { IPermission } from '../entities/permission.entity';
import { PermissionModel } from '../schemas/permission.schema';
import { Result } from '../../../shared/types/result';
import { ResponseCode } from '../../../shared/constants/enums';

export interface PermissionCheckRequest {
  module: string;
  action: string;
  user: any;
  resource?: any;
  context?: Record<string, any>;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  permission?: any;
  conditions?: any[];
}

export class PermissionService {
  
  /**
   * Check if a user has permission for a specific module and action
   */
  async checkPermission(request: PermissionCheckRequest): Promise<PermissionCheckResult> {
    try {
      // Check if authentication is required
      if (!request.user) {
        return {
          allowed: false,
          reason: 'Authentication required'
        };
      }

      // Check if user is admin (bypass all checks)
      if (request.user?.isAdmin) {
        return {
          allowed: true,
          reason: 'User is admin - has access to everything'
        };
      }

      // For now, allow basic read operations for authenticated users
      // This will be properly implemented after the database structure is set up
      const allowedActions = ['READ', 'GETALL', 'GETBYID'];
      const allowedModules = ['USERS', 'AUTH'];
      
      if (allowedModules.includes(request.module.toUpperCase()) && 
          allowedActions.includes(request.action.toUpperCase())) {
        return {
          allowed: true,
          reason: 'Basic read access granted for authenticated user'
        };
      }

      // Check if user has role-based access
      const userRoles = request.user?.roleIds || [];
      if (userRoles.length > 0) {
        // For now, allow users with any role to access basic operations
        if (allowedActions.includes(request.action.toUpperCase())) {
          return {
            allowed: true,
            reason: 'Role-based access granted'
          };
        }
      }

      // Default: deny access for write operations until permission system is fully configured
      return {
        allowed: false,
        reason: 'Write operations require full permission system configuration'
      };

    } catch (error: any) {
      console.error('Error checking permission:', error);
      return {
        allowed: false,
        reason: `Error checking permission: ${error.message}`
      };
    }
  }

  /**
   * Evaluate conditions for a permission
   */
  private async evaluateConditions(permission: any, request: PermissionCheckRequest): Promise<{ allowed: boolean; reason?: string; conditions?: any[] }> {
    try {
      // For now, return basic condition evaluation
      // This will be properly implemented after the database structure is set up
      return { allowed: true, conditions: [] };
    } catch (error: any) {
      console.error('Error evaluating conditions:', error);
      return { allowed: false, reason: 'Error evaluating conditions' };
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(permissionData: Partial<IPermission>): Promise<Result> {
    try {
      const permission = new PermissionModel(permissionData);
      await permission.save();
      
      return Result.success(permission, 'Permission created successfully');
    } catch (error: any) {
      return Result.error(`Failed to create permission: ${error.message}`);
    }
  }

  /**
   * Update an existing permission
   */
  async updatePermission(id: string, updates: Partial<IPermission>): Promise<Result> {
    try {
      const permission = await PermissionModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!permission) {
        return Result.error('Permission not found');
      }
      
      return Result.success(permission, 'Permission updated successfully');
    } catch (error: any) {
      return Result.error(`Failed to update permission: ${error.message}`);
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Result> {
    try {
      const permissions = await PermissionModel.find().sort({ module: 1, action: 1 });
      return Result.success(permissions);
    } catch (error: any) {
      return Result.error(`Failed to fetch permissions: ${error.message}`);
    }
  }

  /**
   * Get permissions by module
   */
  async getPermissionsByModule(module: string): Promise<Result> {
    try {
      const permissions = await PermissionModel.find({ 
        module: module.toUpperCase() 
      }).sort({ action: 1 });
      
      return Result.success(permissions);
    } catch (error: any) {
      return Result.error(`Failed to fetch permissions for module ${module}: ${error.message}`);
    }
  }

  /**
   * Delete a permission
   */
  async deletePermission(id: string): Promise<Result> {
    try {
      const permission = await PermissionModel.findByIdAndDelete(id);
      
      if (!permission) {
        return Result.error('Permission not found');
      }
      
      return Result.success(null, 'Permission deleted successfully');
    } catch (error: any) {
      return Result.error(`Failed to delete permission: ${error.message}`);
    }
  }

  /**
   * Bulk create permissions for a module
   */
  async bulkCreateModulePermissions(
    module: string, 
    actions: string[], 
    defaultRoles: string[] = ['admin'],
    createdBy: string
  ): Promise<Result> {
    try {
      const permissions = [];
      
      for (const action of actions) {
        const permissionData = {
          name: `${module} ${action}`,
          code: `${module.toUpperCase()}_${action.toUpperCase()}`,
          description: `Permission to ${action.toLowerCase()} ${module.toLowerCase()}`,
          module: module.toUpperCase(),
          action: action.toUpperCase(),
          isActive: true,
          requiresAuth: true,
          allowedRoleIds: defaultRoles,
          allowedUserIds: [],
          deniedUserIds: [],
          conditions: [],
          metadata: {},
          createdBy,
          updatedBy: createdBy
        };
        
        permissions.push(permissionData);
      }
      
      const createdPermissions = await PermissionModel.insertMany(permissions);
      
      return Result.success(createdPermissions, `Created ${permissions.length} permissions for module ${module}`);
    } catch (error: any) {
      return Result.error(`Failed to bulk create permissions: ${error.message}`);
    }
  }
}
