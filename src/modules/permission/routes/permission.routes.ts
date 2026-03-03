import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { DynamicPermissionMiddleware } from '../../../core/middleware/dynamic-permission-middleware';

const router = Router();
const permissionController = new PermissionController();

/**
 * @openapi
 * /api/permissions:
 *   get:
 *     summary: Get all permissions
 *     description: Retrieve all permissions from the system
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', 
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS', 'READ'),
  permissionController.getAll.bind(permissionController)
);

/**
 * @openapi
 * /api/permissions/module/{module}:
 *   get:
 *     summary: Get permissions by module
 *     description: Retrieve all permissions for a specific module
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: module
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Module name (e.g., USERS, AUTH)
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/module/:module',
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS', 'READ'),
  permissionController.getByModule.bind(permissionController)
);

/**
 * @openapi
 * /api/permissions:
 *   post:
 *     summary: Create a new permission
 *     description: Create a new permission rule
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - description
 *               - module
 *               - action
 *             properties:
 *               name:
 *                 type: string
 *                 description: Permission name
 *               code:
 *                 type: string
 *                 description: Permission code (e.g., USERS_CREATE)
 *               description:
 *                 type: string
 *                 description: Permission description
 *               module:
 *                 type: string
 *                 description: Module name
 *               action:
 *                 type: string
 *                 description: Action name
 *               isActive:
 *                 type: boolean
 *                 description: Whether permission is active
 *               requiresAuth:
 *                 type: boolean
 *                 description: Whether authentication is required
 *               allowedRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Allowed roles
 *               allowedUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Explicitly allowed user IDs
 *               deniedUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Explicitly denied user IDs
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     field:
 *                       type: string
 *                     operator:
 *                       type: string
 *                       enum: [eq, ne, gt, lt, gte, lte, in, nin, exists, regex]
 *                     value:
 *                       type: string
 *     responses:
 *       201:
 *         description: Permission created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/',
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS', 'CREATE'),
  permissionController.create.bind(permissionController)
);

/**
 * @openapi
 * /api/permissions/{id}:
 *   put:
 *     summary: Update a permission
 *     description: Update an existing permission rule
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               requiresAuth:
 *                 type: boolean
 *               allowedRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *               allowedUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *               deniedUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Permission updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id',
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS', 'UPDATE'),
  permissionController.update.bind(permissionController)
);

/**
 * @openapi
 * /api/permissions/{id}:
 *   delete:
 *     summary: Delete a permission
 *     description: Delete a permission rule
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       404:
 *         description: Permission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id',
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS', 'DELETE'),
  permissionController.delete.bind(permissionController)
);

/**
 * @openapi
 * /api/permissions/bulk-create:
 *   post:
 *     summary: Bulk create permissions for a module
 *     description: Create multiple permissions for a module at once
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - module
 *               - actions
 *             properties:
 *               module:
 *                 type: string
 *                 description: Module name
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of action names
 *               defaultRoles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Default roles for permissions
 *     responses:
 *       201:
 *         description: Permissions created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/bulk-create',
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS', 'CREATE'),
  permissionController.bulkCreateModulePermissions.bind(permissionController)
);

/**
 * @openapi
 * /api/permissions/test:
 *   post:
 *     summary: Test permission check
 *     description: Test a permission check for debugging purposes
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - module
 *               - action
 *             properties:
 *               module:
 *                 type: string
 *                 description: Module name
 *               action:
 *                 type: string
 *                 description: Action name
 *               resource:
 *                 type: object
 *                 description: Resource data for context
 *               context:
 *                 type: object
 *                 description: Additional context data
 *     responses:
 *       200:
 *         description: Permission test result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 */
router.post('/test',
  DynamicPermissionMiddleware.checkPermission('PERMISSIONS', 'READ'),
  permissionController.testPermission.bind(permissionController)
);

export default router;
