import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.service';
import { CentralizedRequestMiddleware } from '../../../core/middleware/centralized-request';
import { DynamicPermissionMiddleware } from '../../../core/middleware/dynamic-permission-middleware';
import { handleResponse } from '../../../shared/utils/handle-response';
import { AuditMessageType } from '../../../shared/constants/enums';

export class PermissionController {
  private permissionService = new PermissionService();

  /**
   * Get all permissions
   */
  async getAll(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'PermissionController', 'getAll', 'Endpoint started');
      
      const serviceResult = await this.permissionService.getAllPermissions();
      
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'PermissionController', 'getAll', 'Endpoint finished successfully');
      handleResponse(res, result);
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'PermissionController', 'getAll', 'Endpoint failed');
      result.addException('PermissionController', 'getAll', error);
      result.statusCode = 1002;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * Get permissions by module
   */
  async getByModule(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'PermissionController', 'getByModule', 'Endpoint started');
      
      const { module } = req.params;
      const serviceResult = await this.permissionService.getPermissionsByModule(module);
      
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'PermissionController', 'getByModule', 'Endpoint finished successfully');
      handleResponse(res, result);
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'PermissionController', 'getByModule', 'Endpoint failed');
      result.addException('PermissionController', 'getByModule', error);
      result.statusCode = 1002;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * Create a new permission
   */
  async create(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'PermissionController', 'create', 'Endpoint started');
      
      const permissionData = {
        ...req.body,
        createdBy: CentralizedRequestMiddleware.getUser(req)?.id,
        updatedBy: CentralizedRequestMiddleware.getUser(req)?.id
      };
      
      const serviceResult = await this.permissionService.createPermission(permissionData);
      
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'PermissionController', 'create', 'Permission created successfully');
      handleResponse(res, result);
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'PermissionController', 'create', 'Endpoint failed');
      result.addException('PermissionController', 'create', error);
      result.statusCode = 1002;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * Update an existing permission
   */
  async update(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'PermissionController', 'update', 'Endpoint started');
      
      const { id } = req.params;
      const updates = {
        ...req.body,
        updatedBy: CentralizedRequestMiddleware.getUser(req)?.id
      };
      
      const serviceResult = await this.permissionService.updatePermission(id, updates);
      
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'PermissionController', 'update', 'Permission updated successfully');
      handleResponse(res, result);
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'PermissionController', 'update', 'Endpoint failed');
      result.addException('PermissionController', 'update', error);
      result.statusCode = 1002;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * Delete a permission
   */
  async delete(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'PermissionController', 'delete', 'Endpoint started');
      
      const { id } = req.params;
      const serviceResult = await this.permissionService.deletePermission(id);
      
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'PermissionController', 'delete', 'Permission deleted successfully');
      handleResponse(res, result);
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'PermissionController', 'delete', 'Endpoint failed');
      result.addException('PermissionController', 'delete', error);
      result.statusCode = 1002;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * Bulk create permissions for a module
   */
  async bulkCreateModulePermissions(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'PermissionController', 'bulkCreateModulePermissions', 'Endpoint started');
      
      const { module, actions, defaultRoles } = req.body;
      const createdBy = CentralizedRequestMiddleware.getUser(req)?.id;
      
      if (!module || !actions || !Array.isArray(actions)) {
        result.addMessage(AuditMessageType.error, 'PermissionController', 'bulkCreateModulePermissions', 'Invalid input data');
        result.statusCode = 1001;
        result.data = null;
        handleResponse(res, result);
        return;
      }
      
      const serviceResult = await this.permissionService.bulkCreateModulePermissions(
        module,
        actions,
        defaultRoles || ['admin'],
        createdBy
      );
      
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'PermissionController', 'bulkCreateModulePermissions', 'Bulk permissions created successfully');
      handleResponse(res, result);
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'PermissionController', 'bulkCreateModulePermissions', 'Endpoint failed');
      result.addException('PermissionController', 'bulkCreateModulePermissions', error);
      result.statusCode = 1002;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * Test permission check for debugging
   */
  async testPermission(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'PermissionController', 'testPermission', 'Endpoint started');
      
      const { module, action, resource, context } = req.body;
      const user = CentralizedRequestMiddleware.getUser(req);
      
      if (!module || !action) {
        result.addMessage(AuditMessageType.error, 'PermissionController', 'testPermission', 'Module and action required');
        result.statusCode = 1001;
        result.data = null;
        handleResponse(res, result);
        return;
      }
      
      const permissionResult = await this.permissionService.checkPermission({
        module,
        action,
        user,
        resource,
        context
      });
      
      result.data = {
        allowed: permissionResult.allowed,
        reason: permissionResult.reason,
        permission: permissionResult.permission,
        conditions: permissionResult.conditions,
        testData: {
          module,
          action,
          userId: user?.id,
          userRole: user?.role,
          resource,
          context
        }
      };
      
      result.addMessage(AuditMessageType.info, 'PermissionController', 'testPermission', 'Permission test completed');
      handleResponse(res, result);
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'PermissionController', 'testPermission', 'Endpoint failed');
      result.addException('PermissionController', 'testPermission', error);
      result.statusCode = 1002;
      result.data = null;
      handleResponse(res, result);
    }
  }
}
