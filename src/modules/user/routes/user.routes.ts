import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { DynamicPermissionMiddleware } from '../../../core/middleware/dynamic-permission-middleware';

const router = Router();
const userController = new UserController();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve all users from the system
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
  DynamicPermissionMiddleware.checkPermission('USERS', 'READ'),
  userController.getAll.bind(userController)
);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'READ'),
  userController.getById.bind(userController)
);

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user in the system
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin, manager]
 *     responses:
 *       201:
 *         description: User created successfully
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
  DynamicPermissionMiddleware.checkPermission('USERS', 'CREATE'),
  userController.create.bind(userController)
);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Update an existing user's information
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [user, admin, manager]
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', 
  DynamicPermissionMiddleware.checkResourcePermission(
    'USERS',
    'UPDATE',
    (req) => req.params.id,
    (resource) => resource.id
  ),
  userController.update.bind(userController)
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user from the system
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'DELETE'),
  userController.delete.bind(userController)
);

/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Get the current authenticated user's profile
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
 */
router.get('/profile', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'READ_PROFILE'),
  userController.getProfile.bind(userController)
);

/**
 * @openapi
 * /api/users/search:
 *   get:
 *     summary: Search users
 *     description: Search users by various criteria
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         schema:
 *           type: string
 *         description: Search query
 *       - name: role
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by role
 *       - name: department
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Result'
 */
router.get('/search', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'SEARCH'),
  userController.search.bind(userController)
);

// Cross-module communication routes
router.get('/:id/orders', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'READ_ORDERS'),
  userController.getUserWithOrders.bind(userController)
);

router.get('/:id/favorites', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'READ_FAVORITES'),
  userController.getUserWithFavorites.bind(userController)
);

router.post('/with-notification', 
  DynamicPermissionMiddleware.checkMultiplePermissions([
    { module: 'USERS', action: 'CREATE' },
    { module: 'NOTIFICATION', action: 'CREATE' }
  ]),
  userController.createUserWithNotification.bind(userController)
);

// ==================== PERMISSION MANAGEMENT ROUTES ====================

/**
 * @openapi
 * /api/users/{id}/roles:
 *   put:
 *     summary: Assign roles to user
 *     description: Assign specific roles to a user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roles
 *             properties:
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of role names
 *     responses:
 *       200:
 *         description: Roles assigned successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */
router.put('/:id/roles', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'UPDATE'),
  userController.assignRoles.bind(userController)
);

/**
 * @openapi
 * /api/users/{id}/permissions:
 *   put:
 *     summary: Assign permissions to user
 *     description: Assign specific permissions to a user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission codes
 *     responses:
 *       200:
 *         description: Permissions assigned successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */
router.put('/:id/permissions', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'UPDATE'),
  userController.assignPermissions.bind(userController)
);

/**
 * @openapi
 * /api/users/{id}/permissions/add:
 *   post:
 *     summary: Add permissions to user
 *     description: Add permissions to existing user permissions (append)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission codes to add
 *     responses:
 *       200:
 *         description: Permissions added successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */
router.post('/:id/permissions/add', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'UPDATE'),
  userController.addPermissions.bind(userController)
);

/**
 * @openapi
 * /api/users/{id}/permissions/remove:
 *   delete:
 *     summary: Remove permissions from user
 *     description: Remove specific permissions from a user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of permission codes to remove
 *     responses:
 *       200:
 *         description: Permissions removed successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */
router.delete('/:id/permissions/remove', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'UPDATE'),
  userController.removePermissions.bind(userController)
);

/**
 * @openapi
 * /api/users/{id}/admin:
 *   put:
 *     summary: Set user admin status
 *     description: Set or unset a user as admin
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAdmin
 *             properties:
 *               isAdmin:
 *                 type: boolean
 *                 description: Whether to set user as admin
 *     responses:
 *       200:
 *         description: Admin status updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */
router.put('/:id/admin', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'UPDATE'),
  userController.setAdmin.bind(userController)
);

/**
 * @openapi
 * /api/users/role/{role}:
 *   get:
 *     summary: Get users by role
 *     description: Retrieve all users with a specific role
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: role
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Role name
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get('/role/:role', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'READ'),
  userController.getUsersByRole.bind(userController)
);

/**
 * @openapi
 * /api/users/permission/{permission}:
 *   get:
 *     summary: Get users by permission
 *     description: Retrieve all users with a specific permission
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: permission
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Permission code
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       400:
 *         description: Bad request
 */
router.get('/permission/:permission', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'READ'),
  userController.getUsersByPermission.bind(userController)
);

/**
 * @openapi
 * /api/users/{id}/check-permission:
 *   post:
 *     summary: Check user permission
 *     description: Check if a user has a specific permission
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission
 *             properties:
 *               permission:
 *                 type: string
 *                 description: Permission code to check
 *     responses:
 *       200:
 *         description: Permission check completed
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */
router.post('/:id/check-permission', 
  DynamicPermissionMiddleware.checkPermission('USERS', 'READ'),
  userController.checkPermission.bind(userController)
);

export default router; 