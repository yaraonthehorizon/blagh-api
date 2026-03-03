import { Request, Response } from 'express';
import { DiscoveryService } from '../services/discovery.service';
import { Result } from '../../../shared/types/result';
import { ResponseCode, AuditMessageType } from '../../../shared/constants/enums';
import { handleResponse } from '../../../shared/utils/handle-response';
import { logger } from '../../../core/logging';
import { PermissionsManagerService } from '../services/permissions-manager.service';

export class PermissionsManagerController {
  private permissionsManagerService: PermissionsManagerService;
  private discoveryService: DiscoveryService;

  constructor() {
    this.permissionsManagerService = new PermissionsManagerService();
    this.discoveryService = new DiscoveryService();
  }

  /**
   * Get system overview with modules, users, and statistics
   */
  async getSystemOverview(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'getSystemOverview', 'Fetching system overview');

      const overview = await this.discoveryService.getSystemOverview();
      
      result.data = overview;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'getSystemOverview', 'System overview retrieved successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'getSystemOverview', error);
      handleResponse(res, result);
    }
  }

  /**
   * Get all discovered modules
   */
  async getModules(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'getModules', 'Fetching modules');

      const modules = await this.discoveryService.discoverModules();
      
      result.data = modules;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'getModules', `Retrieved ${modules.length} modules`);

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'getModules', error);
      handleResponse(res, result);
    }
  }

  /**
   * Get all users with their roles and permissions
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'getUsers', 'Fetching users');

      const users = await this.discoveryService.discoverUsers();
      
      result.data = users;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', `Retrieved ${users.length} users`);

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'getUsers', error);
      handleResponse(res, result);
    }
  }

  /**
   * Get all roles
   */
  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'getRoles', 'Fetching roles');

      const roles = await this.permissionsManagerService.getAllRoles();
      
      result.data = roles;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', `Retrieved ${roles.length} roles`);

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'getRoles', error);
      handleResponse(res, result);
    }
  }

  /**
   * Create a new role
   */
  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'createRole', 'Creating role');

      const roleData = req.body;
      const user = (req as any).user;
      
      roleData.createdBy = user._id || user.id;
      roleData.updatedBy = user._id || user.id;

      const role = await this.permissionsManagerService.createRole(roleData);
      
      result.data = role;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', 'Role created successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'createRole', error);
      handleResponse(res, result);
    }
  }

  /**
   * Update a role
   */
  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'updateRole', 'Updating role');

      const { id } = req.params;
      const roleData = req.body;
      const user = (req as any).user;
      
      roleData.updatedBy = user._id || user.id;

      const role = await this.permissionsManagerService.updateRole(id, roleData);
      
      result.data = role;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', 'Role updated successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'updateRole', error);
      handleResponse(res, result);
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'deleteRole', 'Deleting role');

      const { id } = req.params;
      await this.permissionsManagerService.deleteRole(id);
      
      result.data = { deleted: true };
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', 'Role deleted successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'deleteRole', error);
      handleResponse(res, result);
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'getPermissions', 'Fetching permissions');

      const permissions = await this.permissionsManagerService.getAllPermissions();
      
      result.data = permissions;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', `Retrieved ${permissions.length} permissions`);

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'getPermissions', error);
      handleResponse(res, result);
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'createPermission', 'Creating permission');

      const permissionData = req.body;
      const user = (req as any).user;
      
      permissionData.createdBy = user._id || user.id;
      permissionData.updatedBy = user._id || user.id;

      const permission = await this.permissionsManagerService.createPermission(permissionData);
      
      result.data = permission;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', 'Permission created successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'createPermission', error);
      handleResponse(res, result);
    }
  }

  /**
   * Update a permission
   */
  async updatePermission(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'updatePermission', 'Updating permission');

      const { id } = req.params;
      const permissionData = req.body;
      const user = (req as any).user;
      
      permissionData.updatedBy = user._id || user.id;

      const permission = await this.permissionsManagerService.updatePermission(id, permissionData);
      
      result.data = permission;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', 'Permission updated successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'updatePermission', error);
      handleResponse(res, result);
    }
  }

  /**
   * Delete a permission
   */
  async deletePermission(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'deletePermission', 'Deleting permission');

      const { id } = req.params;
      await this.permissionsManagerService.deletePermission(id);
      
      result.data = { deleted: true };
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', 'Permission deleted successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'deletePermission', error);
      handleResponse(res, result);
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'assignRoleToUser', 'Assigning role to user');

      const { userId, roleId } = req.body;
      await this.permissionsManagerService.assignRoleToUser(userId, roleId);
      
      result.data = { assigned: true };
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', 'Role assigned to user successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'assignRoleToUser', error);
      handleResponse(res, result);
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'removeRoleFromUser', 'Removing role from user');

      const { userId, roleId } = req.body;
      await this.permissionsManagerService.removeRoleFromUser(userId, roleId);
      
      result.data = { removed: true };
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', 'Role removed from user successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'removeRoleFromUser', error);
      handleResponse(res, result);
    }
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'assignPermissionToRole', 'Assigning permission to role');

      const { roleId, permissionId } = req.body;
      await this.permissionsManagerService.assignPermissionToRole(roleId, permissionId);
      
      result.data = { assigned: true };
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', 'Permission assigned to role successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'assignPermissionToRole', error);
      handleResponse(res, result);
    }
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'removePermissionFromRole', 'Removing permission from role');

      const { roleId, permissionId } = req.body;
      await this.permissionsManagerService.removePermissionFromRole(roleId, permissionId);
      
      result.data = { removed: true };
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', 'Permission removed from role successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'removePermissionFromRole', error);
      handleResponse(res, result);
    }
  }

  /**
   * Generate permissions from discovered endpoints
   */
  async generatePermissionsFromEndpoints(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'generatePermissionsFromEndpoints', 'Generating permissions from endpoints');

      const user = (req as any).user;
      const generatedPermissions = await this.permissionsManagerService.generatePermissionsFromEndpoints(user._id || user.id);
      
      result.data = generatedPermissions;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'PermissionsManagerController', 'methodName', `Generated ${generatedPermissions.length} permissions from endpoints`);

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('PermissionsManagerController', 'generatePermissionsFromEndpoints', error);
      handleResponse(res, result);
    }
  }
}
