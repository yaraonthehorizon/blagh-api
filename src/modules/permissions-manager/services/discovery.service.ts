import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../../core/logging';

export interface DiscoveredModule {
  name: string;
  code: string;
  path: string;
  controllers: DiscoveredController[];
  routes: DiscoveredRoute[];
  entities: string[];
  schemas: string[];
}

export interface DiscoveredController {
  name: string;
  path: string;
  methods: DiscoveredMethod[];
}

export interface DiscoveredMethod {
  name: string;
  httpMethod: string;
  route: string;
  parameters: string[];
  requiresAuth: boolean;
  permissions: string[];
}

export interface DiscoveredRoute {
  path: string;
  method: string;
  handler: string;
  middleware: string[];
  module: string;
  action: string;
}

export interface DiscoveredUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isAdmin: boolean;
  roles: string[];
  permissions: string[];
  lastLoginAt?: Date;
  createdAt: Date;
}

export class DiscoveryService {
  private modulesPath: string;
  private routesPath: string;

  constructor() {
    // Use absolute path from project root
    this.modulesPath = path.join(process.cwd(), 'src/modules');
    this.routesPath = path.join(process.cwd(), 'src/routes');
  }

  /**
   * Discover all modules in the system
   */
  async discoverModules(): Promise<DiscoveredModule[]> {
    try {
      logger.info('[DiscoveryService] Starting module discovery...');
      const modules: DiscoveredModule[] = [];

      if (!fs.existsSync(this.modulesPath)) {
        logger.warn('[DiscoveryService] Modules path does not exist:', this.modulesPath);
        return modules;
      }

      const moduleDirectories = fs.readdirSync(this.modulesPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const moduleDir of moduleDirectories) {
        const modulePath = path.join(this.modulesPath, moduleDir);
        const module = await this.discoverModule(moduleDir, modulePath);
        if (module) {
          modules.push(module);
        }
      }

      logger.info(`[DiscoveryService] Discovered ${modules.length} modules`);
      return modules;
    } catch (error) {
      logger.error('[DiscoveryService] Error discovering modules:', error);
      return [];
    }
  }

  /**
   * Discover a single module
   */
  private async discoverModule(name: string, modulePath: string): Promise<DiscoveredModule | null> {
    try {
      const module: DiscoveredModule = {
        name: this.formatModuleName(name),
        code: name.toUpperCase(),
        path: modulePath,
        controllers: [],
        routes: [],
        entities: [],
        schemas: []
      };

      // Discover controllers
      const controllersPath = path.join(modulePath, 'controllers');
      if (fs.existsSync(controllersPath)) {
        module.controllers = await this.discoverControllers(controllersPath);
      }

      // Discover routes
      const routesPath = path.join(modulePath, 'routes');
      if (fs.existsSync(routesPath)) {
        module.routes = await this.discoverRoutes(routesPath, name);
      }

      // Discover entities
      const entitiesPath = path.join(modulePath, 'entities');
      if (fs.existsSync(entitiesPath)) {
        module.entities = this.discoverFiles(entitiesPath, '.entity.ts');
      }

      // Discover schemas
      const schemasPath = path.join(modulePath, 'schemas');
      if (fs.existsSync(schemasPath)) {
        module.schemas = this.discoverFiles(schemasPath, '.schema.ts');
      }

      return module;
    } catch (error) {
      logger.error(`[DiscoveryService] Error discovering module ${name}:`, error);
      return null;
    }
  }

  /**
   * Discover controllers in a module
   */
  private async discoverControllers(controllersPath: string): Promise<DiscoveredController[]> {
    try {
      const controllers: DiscoveredController[] = [];
      const controllerFiles = this.discoverFiles(controllersPath, '.controller.ts');

      for (const controllerFile of controllerFiles) {
        const controllerPath = path.join(controllersPath, controllerFile);
        const controller = await this.analyzeController(controllerFile, controllerPath);
        if (controller) {
          controllers.push(controller);
        }
      }

      return controllers;
    } catch (error) {
      logger.error('[DiscoveryService] Error discovering controllers:', error);
      return [];
    }
  }

  /**
   * Analyze a controller file to extract methods and routes
   */
  private async analyzeController(fileName: string, filePath: string): Promise<DiscoveredController | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const controller: DiscoveredController = {
        name: fileName.replace('.controller.ts', ''),
        path: filePath,
        methods: []
      };

      // Simple regex-based analysis (could be enhanced with AST parsing)
      const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\):\s*Promise<[^>]+>|(?:async\s+)?(\w+)\s*\([^)]*\)/g;
      const routeRegex = /@(Get|Post|Put|Delete|Patch)\s*\(['"`]([^'"`]*?)['"`]\)/g;
      
      let methodMatch;
      while ((methodMatch = methodRegex.exec(content)) !== null) {
        const methodName = methodMatch[1] || methodMatch[2];
        if (methodName && !methodName.startsWith('_') && methodName !== 'constructor') {
          const method: DiscoveredMethod = {
            name: methodName,
            httpMethod: this.inferHttpMethod(methodName),
            route: this.inferRoute(methodName, controller.name),
            parameters: this.extractParameters(content, methodName),
            requiresAuth: content.includes('@RequireAuth') || content.includes('requireAuth'),
            permissions: this.extractPermissions(content, methodName)
          };
          controller.methods.push(method);
        }
      }

      return controller;
    } catch (error) {
      logger.error(`[DiscoveryService] Error analyzing controller ${fileName}:`, error);
      return null;
    }
  }

  /**
   * Discover routes in a module
   */
  private async discoverRoutes(routesPath: string, moduleName: string): Promise<DiscoveredRoute[]> {
    try {
      const routes: DiscoveredRoute[] = [];
      const routeFiles = this.discoverFiles(routesPath, '.routes.ts');

      for (const routeFile of routeFiles) {
        const routeFilePath = path.join(routesPath, routeFile);
        const fileRoutes = await this.analyzeRouteFile(routeFilePath, moduleName);
        routes.push(...fileRoutes);
      }

      return routes;
    } catch (error) {
      logger.error('[DiscoveryService] Error discovering routes:', error);
      return [];
    }
  }

  /**
   * Analyze a route file to extract route definitions
   */
  private async analyzeRouteFile(filePath: string, moduleName: string): Promise<DiscoveredRoute[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const routes: DiscoveredRoute[] = [];

      // Extract route definitions
      const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]*?)['"`]\s*,\s*([^)]+)\)/g;
      
      let match;
      while ((match = routeRegex.exec(content)) !== null) {
        const [, method, path, handler] = match;
        
        const route: DiscoveredRoute = {
          path: path,
          method: method.toUpperCase(),
          handler: handler.trim(),
          middleware: this.extractMiddleware(handler),
          module: moduleName.toUpperCase(),
          action: this.inferActionFromPath(method, path)
        };
        
        routes.push(route);
      }

      return routes;
    } catch (error) {
      logger.error(`[DiscoveryService] Error analyzing route file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Discover all users with their roles and permissions
   */
  async discoverUsers(): Promise<DiscoveredUser[]> {
    try {
      logger.info('[DiscoveryService] Discovering users...');
      
      // Import models dynamically to avoid circular dependencies
      const { UserModel } = await import('../../user/schemas/user.schema');
      const { RoleModel } = await import('../../user/schemas/role.schema');
      const { PermissionModel } = await import('../../permission/schemas/permission.schema');

      const users = await UserModel.find().populate('roleIds').lean();
      const discoveredUsers: DiscoveredUser[] = [];

      for (const user of users) {
        const userRoles = await RoleModel.find({ _id: { $in: user.roleIds } }).lean();
        const rolePermissionIds = userRoles.flatMap(role => role.permissionIds);
        const userPermissions = await PermissionModel.find({ 
          $or: [
            { _id: { $in: rolePermissionIds } },
            { allowedUserIds: user._id }
          ]
        }).lean();

        const discoveredUser: DiscoveredUser = {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          isAdmin: user.isAdmin || false,
          roles: userRoles.map(role => role.name),
          permissions: userPermissions.map(perm => `${perm.module}:${perm.action}`),
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        };

        discoveredUsers.push(discoveredUser);
      }

      logger.info(`[DiscoveryService] Discovered ${discoveredUsers.length} users`);
      return discoveredUsers;
    } catch (error) {
      logger.error('[DiscoveryService] Error discovering users:', error);
      return [];
    }
  }

  /**
   * Get system overview with all discovered data
   */
  async getSystemOverview(): Promise<{
    modules: DiscoveredModule[];
    users: DiscoveredUser[];
    totalEndpoints: number;
    totalPermissions: number;
  }> {
    try {
      const [modules, users] = await Promise.all([
        this.discoverModules(),
        this.discoverUsers()
      ]);

      const totalEndpoints = modules.reduce((total, module) => 
        total + module.routes.length + module.controllers.reduce((sum, ctrl) => sum + ctrl.methods.length, 0), 0
      );

      // Count total permissions from database
      const { PermissionModel } = await import('../../permission/schemas/permission.schema');
      const totalPermissions = await PermissionModel.countDocuments();

      return {
        modules,
        users,
        totalEndpoints,
        totalPermissions
      };
    } catch (error) {
      logger.error('[DiscoveryService] Error getting system overview:', error);
      throw error;
    }
  }

  // Helper methods
  private discoverFiles(dirPath: string, extension: string): string[] {
    try {
      return fs.readdirSync(dirPath)
        .filter(file => file.endsWith(extension))
        .map(file => file);
    } catch (error) {
      return [];
    }
  }

  private formatModuleName(name: string): string {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private inferHttpMethod(methodName: string): string {
    const name = methodName.toLowerCase();
    if (name.includes('create') || name.includes('add')) return 'POST';
    if (name.includes('update') || name.includes('edit')) return 'PUT';
    if (name.includes('delete') || name.includes('remove')) return 'DELETE';
    if (name.includes('get') || name.includes('find') || name.includes('list')) return 'GET';
    return 'GET';
  }

  private inferRoute(methodName: string, controllerName: string): string {
    const name = methodName.toLowerCase();
    const base = `/${controllerName.toLowerCase()}`;
    
    if (name.includes('getall') || name === 'list') return base;
    if (name.includes('getbyid') || name.includes('findbyid')) return `${base}/:id`;
    if (name.includes('create')) return base;
    if (name.includes('update')) return `${base}/:id`;
    if (name.includes('delete')) return `${base}/:id`;
    
    return `${base}/${name}`;
  }

  private extractParameters(content: string, methodName: string): string[] {
    // Simple extraction - could be enhanced
    const methodRegex = new RegExp(`${methodName}\\s*\\(([^)]*)\\)`, 'g');
    const match = methodRegex.exec(content);
    if (match && match[1]) {
      return match[1].split(',').map(param => param.trim().split(':')[0].trim()).filter(Boolean);
    }
    return [];
  }

  private extractPermissions(content: string, methodName: string): string[] {
    const permissions: string[] = [];
    const permissionRegex = /@Permission\s*\(['"`]([^'"`]*?)['"`]\)/g;
    let match;
    while ((match = permissionRegex.exec(content)) !== null) {
      permissions.push(match[1]);
    }
    return permissions;
  }

  private extractMiddleware(handler: string): string[] {
    const middleware: string[] = [];
    
    if (handler.includes('CentralizedRequestMiddleware')) {
      middleware.push('CentralizedRequest');
    }
    if (handler.includes('DynamicPermissionMiddleware')) {
      middleware.push('DynamicPermission');
    }
    if (handler.includes('AuthMiddleware')) {
      middleware.push('Auth');
    }
    
    return middleware;
  }

  private inferActionFromPath(method: string, path: string): string {
    const methodUpper = method.toUpperCase();
    
    if (path.includes('/:id')) {
      switch (methodUpper) {
        case 'GET': return 'GETBYID';
        case 'PUT': return 'UPDATE';
        case 'DELETE': return 'DELETE';
        default: return methodUpper;
      }
    } else {
      switch (methodUpper) {
        case 'GET': return 'GETALL';
        case 'POST': return 'CREATE';
        default: return methodUpper;
      }
    }
  }
}
