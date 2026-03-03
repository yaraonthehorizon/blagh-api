import { Router } from 'express';
import { PermissionsManagerController } from '../controllers/permissions-manager.controller';
import { CentralizedRequestMiddleware } from '../../../core/middleware/centralized-request';
import { DynamicPermissionMiddleware } from '../../../core/middleware/dynamic-permission-middleware';

const router = Router();
const controller = new PermissionsManagerController();

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemOverview:
 *       type: object
 *       properties:
 *         modules:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DiscoveredModule'
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DiscoveredUser'
 *         totalEndpoints:
 *           type: number
 *         totalPermissions:
 *           type: number
 *     
 *     DiscoveredModule:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         path:
 *           type: string
 *         controllers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DiscoveredController'
 *         routes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DiscoveredRoute'
 *         entities:
 *           type: array
 *           items:
 *             type: string
 *         schemas:
 *           type: array
 *           items:
 *             type: string
 *     
 *     DiscoveredController:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         path:
 *           type: string
 *         methods:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DiscoveredMethod'
 *     
 *     DiscoveredMethod:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         httpMethod:
 *           type: string
 *         route:
 *           type: string
 *         parameters:
 *           type: array
 *           items:
 *             type: string
 *         requiresAuth:
 *           type: boolean
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *     
 *     DiscoveredRoute:
 *       type: object
 *       properties:
 *         path:
 *           type: string
 *         method:
 *           type: string
 *         handler:
 *           type: string
 *         middleware:
 *           type: array
 *           items:
 *             type: string
 *         module:
 *           type: string
 *         action:
 *           type: string
 *     
 *     DiscoveredUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         username:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         isActive:
 *           type: boolean
 *         isAdmin:
 *           type: boolean
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateRoleRequest:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - description
 *       properties:
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         description:
 *           type: string
 *         isActive:
 *           type: boolean
 *           default: true
 *         isSystem:
 *           type: boolean
 *           default: false
 *         permissionIds:
 *           type: array
 *           items:
 *             type: string
 *         parentRoleId:
 *           type: string
 *         metadata:
 *           type: object
 *     
 *     CreatePermissionRequest:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - description
 *         - module
 *         - action
 *       properties:
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         description:
 *           type: string
 *         module:
 *           type: string
 *         action:
 *           type: string
 *         isActive:
 *           type: boolean
 *           default: true
 *         requiresAuth:
 *           type: boolean
 *           default: true
 *         allowedRoleIds:
 *           type: array
 *           items:
 *             type: string
 *         allowedUserIds:
 *           type: array
 *           items:
 *             type: string
 *         deniedUserIds:
 *           type: array
 *           items:
 *             type: string
 *         conditions:
 *           type: array
 *           items:
 *             type: object
 *         metadata:
 *           type: object
 *     
 *     AssignRoleRequest:
 *       type: object
 *       required:
 *         - userId
 *         - roleId
 *       properties:
 *         userId:
 *           type: string
 *         roleId:
 *           type: string
 *     
 *     AssignPermissionRequest:
 *       type: object
 *       required:
 *         - roleId
 *         - permissionId
 *       properties:
 *         roleId:
 *           type: string
 *         permissionId:
 *           type: string
 */

/**
 * @swagger
 * /api/permissions-manager/overview:
 *   get:
 *     summary: Get system overview
 *     description: Get comprehensive system overview including modules, users, and statistics
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/SystemOverview'
 *                 statusCode:
 *                   type: number
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/overview',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'OVERVIEW', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'OVERVIEW'),
  controller.getSystemOverview.bind(controller)
);

/**
 * @swagger
 * /api/permissions-manager/modules:
 *   get:
 *     summary: Get all discovered modules
 *     description: Get all modules discovered in the system with their controllers, routes, entities, and schemas
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Modules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DiscoveredModule'
 */
router.get('/modules',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'MODULES', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'MODULES'),
  controller.getModules.bind(controller)
);

/**
 * @swagger
 * /api/permissions-manager/users:
 *   get:
 *     summary: Get all users with roles and permissions
 *     description: Get all users in the system with their assigned roles and permissions
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DiscoveredUser'
 */
router.get('/users',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'USERS', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'USERS'),
  controller.getUsers.bind(controller)
);

// Role management routes
/**
 * @swagger
 * /api/permissions-manager/roles:
 *   get:
 *     summary: Get all roles
 *     description: Get all roles in the system
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
 *   post:
 *     summary: Create a new role
 *     description: Create a new role in the system
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *     responses:
 *       200:
 *         description: Role created successfully
 */
router.get('/roles',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'ROLES_GETALL', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'ROLES_GETALL'),
  controller.getRoles.bind(controller)
);

router.post('/roles',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'ROLES_CREATE', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'ROLES_CREATE'),
  controller.createRole.bind(controller)
);

/**
 * @swagger
 * /api/permissions-manager/roles/{id}:
 *   put:
 *     summary: Update a role
 *     description: Update an existing role
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleRequest'
 *     responses:
 *       200:
 *         description: Role updated successfully
 *   delete:
 *     summary: Delete a role
 *     description: Delete a role from the system
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role deleted successfully
 */
router.put('/roles/:id',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'ROLES_UPDATE', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'ROLES_UPDATE'),
  controller.updateRole.bind(controller)
);

router.delete('/roles/:id',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'ROLES_DELETE', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'ROLES_DELETE'),
  controller.deleteRole.bind(controller)
);

// Permission management routes
/**
 * @swagger
 * /api/permissions-manager/permissions:
 *   get:
 *     summary: Get all permissions
 *     description: Get all permissions in the system
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *   post:
 *     summary: Create a new permission
 *     description: Create a new permission in the system
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePermissionRequest'
 *     responses:
 *       200:
 *         description: Permission created successfully
 */
router.get('/permissions',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'PERMISSIONS_GETALL', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'PERMISSIONS_GETALL'),
  controller.getPermissions.bind(controller)
);

router.post('/permissions',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'PERMISSIONS_CREATE', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'PERMISSIONS_CREATE'),
  controller.createPermission.bind(controller)
);

/**
 * @swagger
 * /api/permissions-manager/permissions/{id}:
 *   put:
 *     summary: Update a permission
 *     description: Update an existing permission
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePermissionRequest'
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *   delete:
 *     summary: Delete a permission
 *     description: Delete a permission from the system
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 */
router.put('/permissions/:id',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'PERMISSIONS_UPDATE', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'PERMISSIONS_UPDATE'),
  controller.updatePermission.bind(controller)
);

router.delete('/permissions/:id',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'PERMISSIONS_DELETE', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'PERMISSIONS_DELETE'),
  controller.deletePermission.bind(controller)
);

// User-Role assignment routes
/**
 * @swagger
 * /api/permissions-manager/users/assign-role:
 *   post:
 *     summary: Assign role to user
 *     description: Assign a role to a user
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRoleRequest'
 *     responses:
 *       200:
 *         description: Role assigned successfully
 */
router.post('/users/assign-role',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'ASSIGN_ROLE', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'ASSIGN_ROLE'),
  controller.assignRoleToUser.bind(controller)
);

/**
 * @swagger
 * /api/permissions-manager/users/remove-role:
 *   post:
 *     summary: Remove role from user
 *     description: Remove a role from a user
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRoleRequest'
 *     responses:
 *       200:
 *         description: Role removed successfully
 */
router.post('/users/remove-role',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'REMOVE_ROLE', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'REMOVE_ROLE'),
  controller.removeRoleFromUser.bind(controller)
);

// Role-Permission assignment routes
/**
 * @swagger
 * /api/permissions-manager/roles/assign-permission:
 *   post:
 *     summary: Assign permission to role
 *     description: Assign a permission to a role
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignPermissionRequest'
 *     responses:
 *       200:
 *         description: Permission assigned successfully
 */
router.post('/roles/assign-permission',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'ASSIGN_PERMISSION', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'ASSIGN_PERMISSION'),
  controller.assignPermissionToRole.bind(controller)
);

/**
 * @swagger
 * /api/permissions-manager/roles/remove-permission:
 *   post:
 *     summary: Remove permission from role
 *     description: Remove a permission from a role
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignPermissionRequest'
 *     responses:
 *       200:
 *         description: Permission removed successfully
 */
router.post('/roles/remove-permission',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'REMOVE_PERMISSION', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'REMOVE_PERMISSION'),
  controller.removePermissionFromRole.bind(controller)
);

// Auto-generation routes
/**
 * @swagger
 * /api/permissions-manager/generate-permissions:
 *   post:
 *     summary: Generate permissions from endpoints
 *     description: Automatically generate permissions based on discovered endpoints
 *     tags: [Permissions Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions generated successfully
 */
router.post('/generate-permissions',
  CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'GENERATE_PERMISSIONS', true),
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS_MANAGER', 'GENERATE_PERMISSIONS'),
  controller.generatePermissionsFromEndpoints.bind(controller)
);

export default router;
