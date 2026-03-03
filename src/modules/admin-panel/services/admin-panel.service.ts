import { ObjectId } from 'bson';
import { logger } from '../../../core/logging';
import { DiscoveryService } from '../../permissions-manager/services/discovery.service';
import { PermissionsManagerService } from '../../permissions-manager/services/permissions-manager.service';
import { UserService } from '../../user/services/user.service';
import * as fs from 'fs';
import * as path from 'path';

export class AdminPanelService {
  private discoveryService: DiscoveryService;
  private permissionsManagerService: PermissionsManagerService;
  private userService: UserService;

  constructor() {
    this.discoveryService = new DiscoveryService();
    this.permissionsManagerService = new PermissionsManagerService();
    this.userService = new UserService();
  }

  /**
   * Get comprehensive admin panel overview
   */
  async getAdminOverview(): Promise<any> {
    try {
      logger.info('[AdminPanelService] Getting admin panel overview');

      // Get system overview from discovery service
      const systemOverview = await this.discoveryService.getSystemOverview();
      
      // Get additional admin-specific data
      const adminStats = await this.getAdminStats();
      const recentActivity = await this.getRecentActivity();
      const systemHealth = await this.getSystemHealth();

      return {
        system: systemOverview,
        admin: adminStats,
        activity: recentActivity,
        health: systemHealth,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to get admin overview:', error);
      throw error;
    }
  }

  /**
   * Get admin panel statistics
   */
  async getAdminStats(): Promise<any> {
    try {
      logger.info('[AdminPanelService] Getting admin panel statistics');

      // Get real user count from database
      const userCount = await this.getRealUserCount();
      
      // Get system overview to populate other stats
      const overview = await this.discoveryService.getSystemOverview();
      
      // Return simple numbers that the frontend expects
      const stats = {
        users: userCount,
        roles: 4, // Super Admin, Identity Manager, Admin, User
        permissions: overview.totalPermissions || 0,
        modules: overview.modules ? overview.modules.length : 0,
        endpoints: overview.totalEndpoints || 0
      };

      return stats;
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to get admin stats:', error);
      // Return default stats on error
      return {
        users: 0,
        roles: 4,
        permissions: 0,
        modules: 0,
        endpoints: 0
      };
    }
  }

  /**
   * Get real user count from database
   */
  private async getRealUserCount(): Promise<number> {
    try {
      const result = await this.userService.getAll();
      if (result.statusCode === 1000 && result.data) {
        return Array.isArray(result.data) ? result.data.length : 0;
      }
      return 0;
    } catch (error) {
      logger.error('[AdminPanelService] Failed to get user count:', error);
      return 0;
    }
  }

  /**
   * Refresh dashboard stats after data changes
   */
  async refreshDashboardStats(): Promise<any> {
    try {
      logger.info('[AdminPanelService] Refreshing dashboard stats');
      return await this.getAdminStats();
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to refresh dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get recent system activity
   */
  async getRecentActivity(): Promise<any> {
    try {
      logger.info('[AdminPanelService] Getting recent activity');

      // This would typically come from audit logs
      // For now, return mock data
      return {
        recentLogins: [
          {
            user: 'admin@domain.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            action: 'Login',
            ip: '127.0.0.1',
            success: true
          }
        ],
        recentActions: [
          {
            user: 'admin@domain.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
            action: 'Viewed Users',
            module: 'USER',
            details: 'Accessed user management interface'
          }
        ],
        systemEvents: [
          {
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            event: 'Database Connection',
            status: 'Connected',
            details: 'MongoDB connection established successfully'
          }
        ]
      };
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to get recent activity:', error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<any> {
    try {
      logger.info('[AdminPanelService] Getting system health');

      const health = {
        status: 'healthy',
        checks: {
          database: {
            status: 'healthy',
            responseTime: 0,
            lastCheck: new Date().toISOString()
          },
          memory: {
            status: 'healthy',
            usage: process.memoryUsage(),
            threshold: 0.9 // 90% threshold
          },
          cpu: {
            status: 'healthy',
            usage: process.cpuUsage(),
            threshold: 0.8 // 80% threshold
          },
          disk: {
            status: 'unknown',
            usage: 0,
            threshold: 0.9
          }
        },
        overall: 'healthy',
        timestamp: new Date().toISOString()
      };

      // Check memory usage
      const memUsage = process.memoryUsage();
      const memPercent = memUsage.heapUsed / memUsage.heapTotal;
      if (memPercent > health.checks.memory.threshold) {
        health.checks.memory.status = 'warning';
        health.overall = 'warning';
      }

      // Check CPU usage (basic check)
      const cpuUsage = process.cpuUsage();
      if (cpuUsage.user > 1000000) { // 1 second threshold
        health.checks.cpu.status = 'warning';
        health.overall = 'warning';
      }

      // Determine overall status
      const warningChecks = Object.values(health.checks).filter(check => check.status === 'warning').length;
      const errorChecks = Object.values(health.checks).filter(check => check.status === 'error').length;

      if (errorChecks > 0) {
        health.overall = 'error';
      } else if (warningChecks > 0) {
        health.overall = 'warning';
      } else {
        health.overall = 'healthy';
      }

      return health;
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to get system health:', error);
      throw error;
    }
  }

  /**
   * Get admin panel configuration
   */
  async getAdminConfig(): Promise<any> {
    try {
      logger.info('[AdminPanelService] Getting admin panel configuration');

      return {
        title: 'Diagramers Framework - Admin Panel',
        version: '1.0.0',
        features: {
          userManagement: true,
          roleManagement: true,
          permissionManagement: true,
          moduleDiscovery: true,
          systemOverview: true,
          auditLogs: true,
          settings: true,
          systemHealth: true,
          activityMonitoring: true
        },
        modules: [
          {
            name: 'Identity Management',
            icon: 'people',
            description: 'Manage users, roles, and permissions',
            route: '/admin/identity',
            features: ['users', 'roles', 'permissions', 'groups']
          },
          {
            name: 'System Overview',
            icon: 'dashboard',
            description: 'View system statistics and health',
            route: '/admin/overview',
            features: ['stats', 'health', 'performance', 'monitoring']
          },
          {
            name: 'Module Discovery',
            icon: 'explore',
            description: 'Discover and manage framework modules',
            route: '/admin/modules',
            features: ['discovery', 'endpoints', 'entities', 'schemas']
          },
          {
            name: 'Audit Logs',
            icon: 'history',
            description: 'View system audit logs',
            route: '/admin/logs',
            features: ['logs', 'audit', 'security', 'compliance']
          },
          {
            name: 'Settings',
            icon: 'settings',
            description: 'Configure system settings',
            route: '/admin/settings',
            features: ['general', 'email', 'database', 'advanced']
          }
        ],
        permissions: {
          required: ['ADMIN_PANEL_ACCESS'],
          optional: ['ADMIN_PANEL_FULL_ACCESS']
        },
        customization: {
          theme: 'default',
          language: 'en',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: 'HH:mm:ss'
        }
      };
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to get admin config:', error);
      throw error;
    }
  }

  /**
   * Get admin panel navigation structure
   */
  async getAdminNavigation(): Promise<any> {
    try {
      logger.info('[AdminPanelService] Getting admin panel navigation');

      return {
        mainMenu: [
          {
            title: 'Dashboard',
            icon: 'dashboard',
            route: '/admin',
            children: [
              { title: 'Overview', route: '/admin/overview', icon: 'visibility' },
              { title: 'Analytics', route: '/admin/analytics', icon: 'analytics' },
              { title: 'Reports', route: '/admin/reports', icon: 'assessment' }
            ]
          },
          {
            title: 'Identity Management',
            icon: 'people',
            route: '/admin/identity',
            children: [
              { title: 'Users', route: '/admin/identity/users', icon: 'person' },
              { title: 'Roles', route: '/admin/identity/roles', icon: 'group' },
              { title: 'Permissions', route: '/admin/identity/permissions', icon: 'security' },
              { title: 'Groups', route: '/admin/identity/groups', icon: 'group_work' }
            ]
          },
          {
            title: 'System',
            icon: 'computer',
            route: '/admin/system',
            children: [
              { title: 'Modules', route: '/admin/system/modules', icon: 'extension' },
              { title: 'Endpoints', route: '/admin/system/endpoints', icon: 'api' },
              { title: 'Health', route: '/admin/system/health', icon: 'health_and_safety' },
              { title: 'Logs', route: '/admin/system/logs', icon: 'list_alt' }
            ]
          },
          {
            title: 'Security',
            icon: 'security',
            route: '/admin/security',
            children: [
              { title: 'Authentication', route: '/admin/security/auth', icon: 'login' },
              { title: 'Authorization', route: '/admin/security/authorization', icon: 'verified_user' },
              { title: 'Audit', route: '/admin/security/audit', icon: 'security' }
            ]
          },
          {
            title: 'Settings',
            icon: 'settings',
            route: '/admin/settings',
            children: [
              { title: 'General', route: '/admin/settings/general', icon: 'tune' },
              { title: 'Email', route: '/admin/settings/email', icon: 'email' },
              { title: 'Database', route: '/admin/settings/database', icon: 'storage' },
              { title: 'Advanced', route: '/admin/settings/advanced', icon: 'build' }
            ]
          }
        ],
        quickActions: [
          { title: 'Add User', icon: 'person_add', action: 'addUser', color: 'primary' },
          { title: 'Create Role', icon: 'group_add', action: 'createRole', color: 'secondary' },
          { title: 'View Logs', icon: 'list_alt', action: 'viewLogs', color: 'info' },
          { title: 'System Health', icon: 'health_and_safety', action: 'systemHealth', color: 'success' }
        ],
        notifications: {
          unread: 4,
          types: ['info', 'warning', 'error', 'success']
        }
      };
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to get admin navigation:', error);
      throw error;
    }
  }

  /**
   * Execute admin action
   */
  async executeAdminAction(action: string, data?: any): Promise<any> {
    try {
      logger.info(`[AdminPanelService] Executing admin action: ${action}`);

      switch (action) {
        case 'addUser':
          return await this.addUser(data);
        case 'createRole':
          return await this.createRole(data);
        case 'viewLogs':
          return await this.viewLogs(data);
        case 'systemHealth':
          return await this.getSystemHealth();
        default:
          throw new Error(`Unknown admin action: ${action}`);
      }
    } catch (error: any) {
      logger.error(`[AdminPanelService] Failed to execute admin action ${action}:`, error);
      throw error;
    }
  }

  /**
   * Add new user
   */
  private async addUser(userData: any): Promise<any> {
    // This would integrate with the user service
    logger.info('[AdminPanelService] Adding new user:', userData);
    return { message: 'User creation initiated', userData };
  }

  /**
   * Create a new role
   */
  async createRole(roleData: any): Promise<any> {
    try {
      logger.info('[AdminPanelService] Creating new role:', roleData);
      
      // Use the real PermissionsManagerService to create the role
      const role = await this.permissionsManagerService.createRole(roleData);
      
      logger.info('[AdminPanelService] Role created successfully:', role._id);
      return role;
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to create role:', error);
      throw error;
    }
  }

  /**
   * Update a role
   */
  async updateRole(id: string, roleData: any): Promise<any> {
    try {
      logger.info('[AdminPanelService] Updating role:', roleData);
      
      // Use the real PermissionsManagerService to update the role
      const role = await this.permissionsManagerService.updateRole(id, roleData);
      
      logger.info('[AdminPanelService] Role updated successfully:', id);
      return role;
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to update role:', error);
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(id: string): Promise<void> {
    try {
      logger.info('[AdminPanelService] Deleting role:', id);
      
      // Use the real PermissionsManagerService to delete the role
      await this.permissionsManagerService.deleteRole(id);
      
      logger.info('[AdminPanelService] Role deleted successfully:', id);
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to delete role:', error);
      throw error;
    }
  }

  /**
   * View system logs
   */
  private async viewLogs(options?: any): Promise<any> {
    // This would integrate with the logging service
    logger.info('[AdminPanelService] Viewing system logs:', options);
    return { message: 'Log retrieval initiated', options };
  }

  /**
   * Get modules list
   */
  async getModules(): Promise<any[]> {
    try {
      logger.info('[AdminPanelService] Getting modules list');
      
      // Check if the modules path exists
      const modulesPath = path.join(process.cwd(), 'src/modules');
      logger.info('[AdminPanelService] Modules path:', modulesPath);
      logger.info('[AdminPanelService] Modules path exists:', fs.existsSync(modulesPath));
      
      if (fs.existsSync(modulesPath)) {
        const moduleDirs = fs.readdirSync(modulesPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        logger.info('[AdminPanelService] Found module directories:', moduleDirs);
      }
      
      const modules = await this.discoveryService.discoverModules();
      logger.info('[AdminPanelService] Discovered modules:', modules);
      
      return modules.map(module => ({
        name: module.name,
        code: module.code,
        path: module.path,
        controllers: module.controllers.length,
        routes: module.routes.length,
        entities: module.entities.length,
        schemas: module.schemas.length
      }));
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to get modules:', error);
      return [];
    }
  }

  /**
   * Get users list
   */
  async getUsers(): Promise<any[]> {
    try {
      logger.info('[AdminPanelService] Getting users list');
      
      // Use the real UserService to get users from database
      const result = await this.userService.getAll();
      if (result.statusCode === 1000 && result.data) {
        return Array.isArray(result.data) ? result.data : [];
      }
      return [];
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to get users:', error);
      return [];
    }
  }

  /**
   * Get roles list
   */
  async getRoles(): Promise<any[]> {
    try {
      logger.info('[AdminPanelService] Getting roles list');
      
      // Use the real PermissionsManagerService to get roles from database
      const roles = await this.permissionsManagerService.getAllRoles();
      return roles || [];
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to get roles:', error);
      return [];
    }
  }

  /**
   * Get permissions list
   */
  async getPermissions(): Promise<any[]> {
    try {
      logger.info('[AdminPanelService] Getting permissions list');
      const overview = await this.discoveryService.getSystemOverview();
      return overview.totalPermissions ? [{ _id: new ObjectId().toString(), name: 'System Permissions', total: overview.totalPermissions }] : [];
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to get permissions:', error);
      return [];
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData: any): Promise<any> {
    try {
      logger.info('[AdminPanelService] Creating new user:', userData);
      
      // Find the role ID if a role code was specified
      let roleIds: string[] = [];
      if (userData.role) {
        const roles = await this.permissionsManagerService.getAllRoles();
        const role = roles.find(r => r.code === userData.role);
        if (role) {
          roleIds = [role._id];
        } else {
          logger.warn(`[AdminPanelService] Role with code '${userData.role}' not found`);
        }
      }
      
      // Use the real UserService to create the user
      const result = await this.userService.create({
        email: userData.email,
        password: userData.password,
        username: userData.email.split('@')[0], // Generate username from email
        mobile: userData.mobile || '',
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleIds: roleIds
      });

      if (result.statusCode === 1000) { // Success status code
        logger.info('[AdminPanelService] User created successfully:', result.data._id);
        
        // Refresh dashboard stats to reflect the new user
        await this.refreshDashboardStats();
        
        return result.data;
      } else {
        throw new Error(result.errors?.[0]?.message || 'Failed to create user');
      }
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  async updateUser(id: string, userData: any): Promise<any> {
    try {
      logger.info('[AdminPanelService] Updating user:', userData);
      
      // Find the role ID if a role code was specified
      let roleIds: string[] = [];
      if (userData.role) {
        const roles = await this.permissionsManagerService.getAllRoles();
        const role = roles.find(r => r.code === userData.role);
        if (role) {
          roleIds = [role._id];
        } else {
          logger.warn(`[AdminPanelService] Role with code '${userData.role}' not found`);
        }
      }
      
      // Use the real UserService to update the user
      const result = await this.userService.update(id, {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        isActive: userData.isActive,
        roleIds: roleIds
      });

      if (result.statusCode === 1000) { // Success status code
        logger.info('[AdminPanelService] User updated successfully:', id);
        return result.data;
      } else {
        throw new Error(result.errors?.[0]?.message || 'Failed to update user');
      }
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to update user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      logger.info('[AdminPanelService] Deleting user:', id);
      
      // Use the real UserService to delete the user
      const result = await this.userService.delete(id);
      
      if (result.statusCode === 1000) { // Success status code
        logger.info('[AdminPanelService] User deleted successfully:', id);
      } else {
        throw new Error(result.errors?.[0]?.message || 'Failed to delete user');
      }
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to delete user:', error);
      throw error;
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(permissionData: any): Promise<any> {
    try {
      logger.info('[AdminPanelService] Creating new permission:', permissionData);
      
      // Use the real PermissionsManagerService to create the permission
      const permission = await this.permissionsManagerService.createPermission(permissionData);
      
      logger.info('[AdminPanelService] Permission created successfully:', permission._id);
      return permission;
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to create permission:', error);
      throw error;
    }
  }

  /**
   * Update a permission
   */
  async updatePermission(id: string, permissionData: any): Promise<any> {
    try {
      logger.info('[AdminPanelService] Updating permission:', permissionData);
      
      // Use the real PermissionsManagerService to update the permission
      const permission = await this.permissionsManagerService.updatePermission(id, permissionData);
      
      logger.info('[AdminPanelService] Permission updated successfully:', id);
      return permission;
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to update permission:', error);
      throw error;
    }
  }

  /**
   * Delete a permission
   */
  async deletePermission(id: string): Promise<void> {
    try {
      logger.info('[AdminPanelService] Deleting permission:', id);
      
      // Use the real PermissionsManagerService to delete the permission
      await this.permissionsManagerService.deletePermission(id);
      
      logger.info('[AdminPanelService] Permission deleted successfully:', id);
    } catch (error: any) {
      logger.error('[AdminPanelService] Failed to delete permission:', error);
      throw error;
    }
  }
}
