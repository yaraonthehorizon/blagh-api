import { Request, Response } from 'express';
import { Result } from '../../../shared/types/result';
import { ResponseCode, AuditMessageType } from '../../../shared/constants/enums';
import { handleResponse } from '../../../shared/utils/handle-response';
import { logger } from '../../../core/logging';
import { AdminPanelService } from '../services/admin-panel.service';
import * as path from 'path';
import * as fs from 'fs';

export class AdminPanelController {
  private adminPanelService: AdminPanelService;

  constructor() {
    this.adminPanelService = new AdminPanelService();
  }

  /**
   * Serve the admin panel login page
   */
  async serveLoginPage(req: Request, res: Response): Promise<void> {
    try {
      const loginPath = path.join(__dirname, '../../../public/admin/login.html');
      
      if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
      } else {
        res.status(404).send('Login page not found');
      }
    } catch (error) {
      res.status(500).send('Internal server error');
    }
  }

  /**
   * Serve the main admin panel interface
   */
  async serveAdminPanel(req: Request, res: Response): Promise<void> {
    try {
      // Serve the admin panel HTML directly
      const adminPanelPath = path.join(process.cwd(), 'public/permissions-manager/index.html');
      
      if (fs.existsSync(adminPanelPath)) {
        res.sendFile(adminPanelPath);
      } else {
        res.status(404).send('Admin panel not found');
      }
    } catch (error) {
      res.status(500).send('Internal server error');
    }
  }

  /**
   * Serve admin panel assets (CSS, JS, etc.)
   */
  async serveAdminAssets(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'serveAdminAssets', 'Serving admin panel assets');

      const assetPath = req.params['*'];
      const fullPath = path.join(process.cwd(), 'public/permissions-manager', assetPath);
      
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath);
        const contentType = this.getContentType(ext);
        
        res.setHeader('Content-Type', contentType);
        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);
      } else {
        res.status(404).send('Asset not found');
      }
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'serveAdminAssets', error);
      handleResponse(res, result);
    }
  }

  /**
   * Get admin panel configuration
   */
  async getAdminConfig(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getAdminConfig', 'Getting admin panel configuration');

      const config = await this.adminPanelService.getAdminConfig();
      result.data = config;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getAdminConfig', 'Admin panel configuration retrieved');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'getAdminConfig', error);
      handleResponse(res, result);
    }
  }

  /**
   * Get admin panel navigation structure
   */
  async getAdminNavigation(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getAdminNavigation', 'Getting admin panel navigation');

      const navigation = await this.adminPanelService.getAdminNavigation();
      result.data = navigation;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getAdminNavigation', 'Admin panel navigation retrieved');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'getAdminNavigation', error);
      handleResponse(res, result);
    }
  }

  /**
   * Get admin panel statistics
   */
  async getAdminStats(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getAdminStats', 'Getting admin panel statistics');

      const stats = await this.adminPanelService.getAdminStats();
      result.data = stats;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getAdminStats', 'Admin panel statistics retrieved');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'getAdminStats', error);
      handleResponse(res, result);
    }
  }

  /**
   * Get admin panel overview
   */
  async getAdminOverview(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getAdminOverview', 'Getting admin panel overview');

      const overview = await this.adminPanelService.getAdminOverview();
      result.data = overview;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getAdminOverview', 'Admin panel overview retrieved');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'getAdminOverview', error);
      handleResponse(res, result);
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getSystemHealth', 'Getting system health');

      const health = await this.adminPanelService.getSystemHealth();
      result.data = health;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getSystemHealth', 'System health retrieved');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'getSystemHealth', error);
      handleResponse(res, result);
    }
  }

  /**
   * Execute admin actions
   */
  async executeAdminAction(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'executeAdminAction', 'Executing admin action');

      const { action, data } = req.body;
      const response = await this.adminPanelService.executeAdminAction(action, data);
      result.data = response;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'executeAdminAction', 'Admin action executed successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'executeAdminAction', error);
      handleResponse(res, result);
    }
  }

  // User management methods
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getUsers', 'Getting users list');

      const users = await this.adminPanelService.getUsers();
      result.data = users;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getUsers', 'Users retrieved successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'getUsers', error);
      handleResponse(res, result);
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'createUser', 'Creating new user');

      const userData = req.body;
      const user = await this.adminPanelService.createUser(userData);
      result.data = user;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'createUser', 'User created successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'createUser', error);
      handleResponse(res, result);
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'updateUser', 'Updating user');

      const { id } = req.params;
      const userData = req.body;
      const user = await this.adminPanelService.updateUser(id, userData);
      result.data = user;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'updateUser', 'User updated successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'updateUser', error);
      handleResponse(res, result);
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'deleteUser', 'Deleting user');

      const { id } = req.params;
      await this.adminPanelService.deleteUser(id);
      result.data = { message: 'User deleted successfully' };
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'deleteUser', 'User deleted successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'deleteUser', error);
      handleResponse(res, result);
    }
  }

  // Role management methods
  async getRoles(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getRoles', 'Getting roles list');

      const roles = await this.adminPanelService.getRoles();
      result.data = roles;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getRoles', 'Roles retrieved successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'getRoles', error);
      handleResponse(res, result);
    }
  }

  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'createRole', 'Creating new role');

      const roleData = req.body;
      const user = (req as any).user;
      
      // Set required audit fields
      roleData.createdBy = user.id || user._id;
      roleData.updatedBy = user.id || user._id;
      
      const role = await this.adminPanelService.createRole(roleData);
      result.data = role;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'createRole', 'Role created successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'createRole', error);
      handleResponse(res, result);
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'updateRole', 'Updating role');

      const { id } = req.params;
      const roleData = req.body;
      const user = (req as any).user;
      
      // Set required audit field
      roleData.updatedBy = user.id || user._id;
      
      const role = await this.adminPanelService.updateRole(id, roleData);
      result.data = role;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'updateRole', 'Role updated successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'updateRole', error);
      handleResponse(res, result);
    }
  }

  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'deleteRole', 'Deleting role');

      const { id } = req.params;
      await this.adminPanelService.deleteRole(id);
      result.data = { message: 'Role deleted successfully' };
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'deleteRole', 'Role deleted successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'deleteRole', error);
      handleResponse(res, result);
    }
  }

  // Permission management methods
  async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getPermissions', 'Getting permissions list');

      const permissions = await this.adminPanelService.getPermissions();
      result.data = permissions;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getPermissions', 'Permissions retrieved successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'getPermissions', error);
      handleResponse(res, result);
    }
  }

  async createPermission(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'createPermission', 'Creating new permission');

      const permissionData = req.body;
      const user = (req as any).user;
      
      // Set required audit fields
      permissionData.createdBy = user.id || user._id;
      permissionData.updatedBy = user.id || user._id;
      
      const permission = await this.adminPanelService.createPermission(permissionData);
      result.data = permission;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'createPermission', 'Permission created successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'createPermission', error);
      handleResponse(res, result);
    }
  }

  async updatePermission(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'updatePermission', 'Updating permission');

      const { id } = req.params;
      const permissionData = req.body;
      const user = (req as any).user;
      
      // Set required audit field
      permissionData.updatedBy = user.id || user._id;
      
      const permission = await this.adminPanelService.updatePermission(id, permissionData);
      result.data = permission;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'updatePermission', 'Permission updated successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'updatePermission', error);
      handleResponse(res, result);
    }
  }

  async deletePermission(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'deletePermission', 'Deleting permission');

      const { id } = req.params;
      await this.adminPanelService.deletePermission(id);
      result.data = { message: 'Permission deleted successfully' };
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'deletePermission', 'Permission deleted successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'deletePermission', error);
      handleResponse(res, result);
    }
  }

  // Module discovery methods
  async getModules(req: Request, res: Response): Promise<void> {
    try {
      const result = (req as any).result as Result;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getModules', 'Getting modules list');

      const modules = await this.adminPanelService.getModules();
      result.data = modules;
      result.statusCode = ResponseCode.Ok;
      result.addMessage(AuditMessageType.info, 'AdminPanelController', 'getModules', 'Modules retrieved successfully');

      handleResponse(res, result);
    } catch (error: any) {
      const result = (req as any).result as Result;
      result.addException('AdminPanelController', 'getModules', error);
      handleResponse(res, result);
    }
  }

  // Helper methods
  private generateFallbackAdminPanel(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - Diagramers Framework</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h3 { margin-top: 0; color: #333; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #0056b3; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px; }
        .stat { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 4px; }
        .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
        .stat-label { color: #666; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Diagramers Framework - Admin Panel</h1>
            <p>Complete identity and system management interface</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🔐 Identity Management</h3>
                <p>Manage users, roles, permissions, and access control</p>
                <a href="/api/permissions-manager/overview" class="btn">View Identity Overview</a>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number" id="userCount">-</div>
                        <div class="stat-label">Users</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="roleCount">-</div>
                        <div class="stat-label">Roles</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>📊 System Overview</h3>
                <p>Monitor system health, performance, and statistics</p>
                <a href="/api/permissions-manager/modules" class="btn">View Modules</a>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number" id="moduleCount">-</div>
                        <div class="stat-label">Modules</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="endpointCount">-</div>
                        <div class="stat-label">Endpoints</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>🔍 Module Discovery</h3>
                <p>Auto-discover framework modules and endpoints</p>
                <a href="/api/permissions-manager/generate-permissions" class="btn">Generate Permissions</a>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number" id="permissionCount">-</div>
                        <div class="stat-label">Permissions</div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3>⚙️ Quick Actions</h3>
                <p>Common administrative tasks</p>
                <a href="/api/permissions-manager/users" class="btn">Manage Users</a>
                <a href="/api/permissions-manager/roles" class="btn">Manage Roles</a>
                <a href="/api/permissions-manager/permissions" class="btn">Manage Permissions</a>
            </div>
        </div>
    </div>
    
    <script>
        // Load statistics
        async function loadStats() {
            try {
                const response = await fetch('/api/permissions-manager/overview');
                const data = await response.json();
                
                if (data.data) {
                    document.getElementById('userCount').textContent = data.data.users?.length || 0;
                    document.getElementById('roleCount').textContent = data.data.modules?.length || 0;
                    document.getElementById('moduleCount').textContent = data.data.modules?.length || 0;
                    document.getElementById('endpointCount').textContent = data.data.totalEndpoints || 0;
                    document.getElementById('permissionCount').textContent = data.data.totalPermissions || 0;
                }
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }
        
        loadStats();
    </script>
</body>
</html>
    `;
  }

  private getContentType(ext: string): string {
    const contentTypes: { [key: string]: string } = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }
}
