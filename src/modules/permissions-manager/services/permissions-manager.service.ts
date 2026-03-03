import { logger } from '../../../core/logging';
import { DiscoveryService } from './discovery.service';

export class PermissionsManagerService {
  private discoveryService: DiscoveryService;

  constructor() {
    this.discoveryService = new DiscoveryService();
  }

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<any[]> {
    try {
      const { RoleModel } = await import('../../user/schemas/role.schema');
      const roles = await RoleModel.find().sort({ name: 1 }).lean();
      return roles;
    } catch (error) {
      logger.error('[PermissionsManagerService] Error getting roles:', error);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(roleData: any): Promise<any> {
    try {
      const { RoleModel } = await import('../../user/schemas/role.schema');
      
      // Check if role with same code exists
      const existingRole = await RoleModel.findOne({ code: roleData.code });
      if (existingRole) {
        throw new Error(`Role with code ${roleData.code} already exists`);
      }

      const role = new RoleModel(roleData);
      await role.save();
      
      logger.info(`[PermissionsManagerService] Created role: ${role.name}`);
      return role.toObject();
    } catch (error) {
      logger.error('[PermissionsManagerService] Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update a role
   */
  async updateRole(id: string, roleData: any): Promise<any> {
    try {
      const { RoleModel } = await import('../../user/schemas/role.schema');
      
      const role = await RoleModel.findByIdAndUpdate(id, roleData, { new: true });
      if (!role) {
        throw new Error('Role not found');
      }
      
      logger.info(`[PermissionsManagerService] Updated role: ${role.name}`);
      return role.toObject();
    } catch (error) {
      logger.error('[PermissionsManagerService] Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<void> {
    try {
      const { RoleModel } = await import('../../user/schemas/role.schema');
      
      const role = await RoleModel.findById(id);
      if (!role) {
        throw new Error('Role not found');
      }

      if (role.isSystem) {
        throw new Error('Cannot delete system role');
      }

      await RoleModel.findByIdAndDelete(id);
      
      logger.info(`[PermissionsManagerService] Deleted role: ${role.name}`);
    } catch (error) {
      logger.error('[PermissionsManagerService] Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<any[]> {
    try {
      const { PermissionModel } = await import('../../permission/schemas/permission.schema');
      const permissions = await PermissionModel.find().sort({ module: 1, action: 1 }).lean();
      return permissions;
    } catch (error) {
      logger.error('[PermissionsManagerService] Error getting permissions:', error);
      throw error;
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(permissionData: any): Promise<any> {
    try {
      const { PermissionModel } = await import('../../permission/schemas/permission.schema');
      
      // Check if permission with same code exists
      const existingPermission = await PermissionModel.findOne({ code: permissionData.code });
      if (existingPermission) {
        throw new Error(`Permission with code ${permissionData.code} already exists`);
      }

      const permission = new PermissionModel(permissionData);
      await permission.save();
      
      logger.info(`[PermissionsManagerService] Created permission: ${permission.name}`);
      return permission.toObject();
    } catch (error) {
      logger.error('[PermissionsManagerService] Error creating permission:', error);
      throw error;
    }
  }

  /**
   * Update a permission
   */
  async updatePermission(id: string, permissionData: any): Promise<any> {
    try {
      const { PermissionModel } = await import('../../permission/schemas/permission.schema');
      
      const permission = await PermissionModel.findByIdAndUpdate(id, permissionData, { new: true });
      if (!permission) {
        throw new Error('Permission not found');
      }
      
      logger.info(`[PermissionsManagerService] Updated permission: ${permission.name}`);
      return permission.toObject();
    } catch (error) {
      logger.error('[PermissionsManagerService] Error updating permission:', error);
      throw error;
    }
  }

  /**
   * Delete a permission
   */
  async deletePermission(id: string): Promise<void> {
    try {
      const { PermissionModel } = await import('../../permission/schemas/permission.schema');
      
      const permission = await PermissionModel.findById(id);
      if (!permission) {
        throw new Error('Permission not found');
      }

      await PermissionModel.findByIdAndDelete(id);
      
      logger.info(`[PermissionsManagerService] Deleted permission: ${permission.name}`);
    } catch (error) {
      logger.error('[PermissionsManagerService] Error deleting permission:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    try {
      const { UserModel } = await import('../../user/schemas/user.schema');
      const { RoleModel } = await import('../../user/schemas/role.schema');
      
      const [user, role] = await Promise.all([
        UserModel.findById(userId),
        RoleModel.findById(roleId)
      ]);

      if (!user) {
        throw new Error('User not found');
      }
      if (!role) {
        throw new Error('Role not found');
      }

      await UserModel.findByIdAndUpdate(userId, {
        $addToSet: { roleIds: roleId },
        lastRoleUpdate: new Date()
      });
      
      logger.info(`[PermissionsManagerService] Assigned role ${role.name} to user ${user.email}`);
    } catch (error) {
      logger.error('[PermissionsManagerService] Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      const { UserModel } = await import('../../user/schemas/user.schema');
      const { RoleModel } = await import('../../user/schemas/role.schema');
      
      const [user, role] = await Promise.all([
        UserModel.findById(userId),
        RoleModel.findById(roleId)
      ]);

      if (!user) {
        throw new Error('User not found');
      }
      if (!role) {
        throw new Error('Role not found');
      }

      await UserModel.findByIdAndUpdate(userId, {
        $pull: { roleIds: roleId },
        lastRoleUpdate: new Date()
      });
      
      logger.info(`[PermissionsManagerService] Removed role ${role.name} from user ${user.email}`);
    } catch (error) {
      logger.error('[PermissionsManagerService] Error removing role from user:', error);
      throw error;
    }
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    try {
      const { RoleModel } = await import('../../user/schemas/role.schema');
      const { PermissionModel } = await import('../../permission/schemas/permission.schema');
      
      const [role, permission] = await Promise.all([
        RoleModel.findById(roleId),
        PermissionModel.findById(permissionId)
      ]);

      if (!role) {
        throw new Error('Role not found');
      }
      if (!permission) {
        throw new Error('Permission not found');
      }

      // Add permission to role
      await RoleModel.findByIdAndUpdate(roleId, {
        $addToSet: { permissionIds: permissionId }
      });

      // Add role to permission's allowed roles
      await PermissionModel.findByIdAndUpdate(permissionId, {
        $addToSet: { allowedRoleIds: roleId }
      });
      
      logger.info(`[PermissionsManagerService] Assigned permission ${permission.name} to role ${role.name}`);
    } catch (error) {
      logger.error('[PermissionsManagerService] Error assigning permission to role:', error);
      throw error;
    }
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    try {
      const { RoleModel } = await import('../../user/schemas/role.schema');
      const { PermissionModel } = await import('../../permission/schemas/permission.schema');
      
      const [role, permission] = await Promise.all([
        RoleModel.findById(roleId),
        PermissionModel.findById(permissionId)
      ]);

      if (!role) {
        throw new Error('Role not found');
      }
      if (!permission) {
        throw new Error('Permission not found');
      }

      // Remove permission from role
      await RoleModel.findByIdAndUpdate(roleId, {
        $pull: { permissionIds: permissionId }
      });

      // Remove role from permission's allowed roles
      await PermissionModel.findByIdAndUpdate(permissionId, {
        $pull: { allowedRoleIds: roleId }
      });
      
      logger.info(`[PermissionsManagerService] Removed permission ${permission.name} from role ${role.name}`);
    } catch (error) {
      logger.error('[PermissionsManagerService] Error removing permission from role:', error);
      throw error;
    }
  }

  /**
   * Generate permissions from discovered endpoints
   */
  async generatePermissionsFromEndpoints(createdBy: string): Promise<any[]> {
    try {
      logger.info('[PermissionsManagerService] Generating permissions from endpoints...');
      
      const { PermissionModel } = await import('../../permission/schemas/permission.schema');
      const modules = await this.discoveryService.discoverModules();
      const generatedPermissions: any[] = [];

      for (const module of modules) {
        // Generate permissions for each route
        for (const route of module.routes) {
          const permissionCode = `${module.code}_${route.action}`;
          const permissionName = `${module.name} - ${this.formatAction(route.action)}`;
          
          // Check if permission already exists
          const existingPermission = await PermissionModel.findOne({ code: permissionCode });
          if (existingPermission) {
            continue;
          }

          const permissionData = {
            name: permissionName,
            code: permissionCode,
            description: `Auto-generated permission for ${route.method} ${route.path}`,
            module: module.code,
            action: route.action,
            isActive: true,
            requiresAuth: true,
            allowedRoleIds: [],
            allowedUserIds: [],
            deniedUserIds: [],
            conditions: [],
            metadata: {
              type: 'auto_generated',
              scope: 'endpoint',
              httpMethod: route.method,
              path: route.path,
              generatedAt: new Date()
            },
            createdBy,
            updatedBy: createdBy
          };

          const permission = new PermissionModel(permissionData);
          await permission.save();
          generatedPermissions.push(permission.toObject());
        }

        // Generate permissions for controller methods
        for (const controller of module.controllers) {
          for (const method of controller.methods) {
            const permissionCode = `${module.code}_${method.name.toUpperCase()}`;
            const permissionName = `${module.name} - ${this.formatMethodName(method.name)}`;
            
            // Check if permission already exists
            const existingPermission = await PermissionModel.findOne({ code: permissionCode });
            if (existingPermission) {
              continue;
            }

            const permissionData = {
              name: permissionName,
              code: permissionCode,
              description: `Auto-generated permission for ${controller.name}.${method.name}`,
              module: module.code,
              action: method.name.toUpperCase(),
              isActive: true,
              requiresAuth: method.requiresAuth,
              allowedRoleIds: [],
              allowedUserIds: [],
              deniedUserIds: [],
              conditions: [],
              metadata: {
                type: 'auto_generated',
                scope: 'controller_method',
                controller: controller.name,
                method: method.name,
                httpMethod: method.httpMethod,
                route: method.route,
                generatedAt: new Date()
              },
              createdBy,
              updatedBy: createdBy
            };

            const permission = new PermissionModel(permissionData);
            await permission.save();
            generatedPermissions.push(permission.toObject());
          }
        }
      }

      logger.info(`[PermissionsManagerService] Generated ${generatedPermissions.length} permissions from endpoints`);
      return generatedPermissions;
    } catch (error) {
      logger.error('[PermissionsManagerService] Error generating permissions from endpoints:', error);
      throw error;
    }
  }

  // Helper methods
  private formatAction(action: string): string {
    switch (action.toUpperCase()) {
      case 'GETALL': return 'List All';
      case 'GETBYID': return 'Get By ID';
      case 'CREATE': return 'Create';
      case 'UPDATE': return 'Update';
      case 'DELETE': return 'Delete';
      default: return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase();
    }
  }

  private formatMethodName(methodName: string): string {
    // Convert camelCase to Title Case
    return methodName.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
