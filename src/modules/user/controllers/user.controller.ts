import { Request, Response } from 'express';
import { CentralizedRequestMiddleware } from '../../../core/middleware';
import { UserService } from '../services/user.service';
import { CreateUserData, UpdateUserData } from '../entities/user.entity';
import { handleResponse } from '../../../shared/utils/handle-response';
import { AuditMessageType, ResponseCode } from '../../../shared/constants/enums';
import { Result } from '../../../shared/types/result';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
    // Initialize the service to set up module communication
    this.userService.initialize().catch(console.error);
  }

  /**
   * @openapi
   * /api/users:
   *   get:
   *     summary: Get all users
   *     description: Retrieve a list of all active users
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: List of users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/User'
   *                 StatusCode:
   *                   type: integer
   *                   example: 1000
   *       400:
   *         description: Bad request
   */
  async getAll(req: Request, res: Response): Promise<void> {
    // Get the prepared Result object from centralized middleware
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      // Log that endpoint started
      result.addMessage(AuditMessageType.info, 'UserController', 'getAll', 'Endpoint started');
      
      // Get data from service
      const serviceResult = await this.userService.getAll();
      
      // Merge service data into our Result object
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      // Log that endpoint finished
      result.addMessage(AuditMessageType.info, 'UserController', 'getAll', 'Endpoint finished successfully');
      
      // Send response
      handleResponse(res, result);
      
    } catch (error: any) {
      // Log error and send error response
      result.addMessage(AuditMessageType.error, 'UserController', 'getAll', 'Endpoint failed');
      result.addException('UserController', 'getAll', error);
      result.statusCode = 1002; // Error code
      result.data = null;
      
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/{id}:
   *   get:
   *     summary: Get user by ID
   *     description: Retrieve a specific user by their ID
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Data:
   *                   $ref: '#/components/schemas/User'
   *                 StatusCode:
   *                   type: integer
   *                   example: 1000
   *       404:
   *         description: User not found
   */
  async getById(req: Request, res: Response): Promise<void> {
    // Get the prepared Result object from centralized middleware
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      // Log that endpoint started
      result.addMessage(AuditMessageType.info, 'UserController', 'getById', 'Endpoint started');
      
      // Get data from service
      const { id } = req.params;
      const serviceResult = await this.userService.getById(id);
      
      // Merge service data into our Result object
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      // Log that endpoint finished
      result.addMessage(AuditMessageType.info, 'UserController', 'getById', 'Endpoint finished successfully');
      
      // Send response
      handleResponse(res, result);
      
    } catch (error: any) {
      // Log error and send error response
      result.addMessage(AuditMessageType.error, 'UserController', 'getById', 'Endpoint failed');
      result.addException('UserController', 'getById', error);
      result.statusCode = 1002; // Error code
      result.data = null;
      
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users:
   *   post:
   *     summary: Create new user
   *     description: Create a new user account
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - username
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               username:
   *                 type: string
   *                 minLength: 3
   *               password:
   *                 type: string
   *                 minLength: 6
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               phone:
   *                 type: string
   *               role:
   *                 type: string
   *                 enum: [user, admin, moderator]
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Data:
   *                   $ref: '#/components/schemas/User'
   *                 StatusCode:
   *                   type: integer
   *                   example: 1000
   *       409:
   *         description: User already exists
   *       400:
   *         description: Bad request or missing required fields
   */
  async create(req: Request, res: Response): Promise<void> {
    // Get the prepared Result object from centralized middleware
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      // Log that endpoint started
      result.addMessage(AuditMessageType.info, 'UserController', 'create', 'Endpoint started');
      
      const userData: CreateUserData = req.body;
      // Basic validation
      if (!userData.email || !userData.username || !userData.password) {
        result.addMessage(AuditMessageType.warn, 'UserController', 'create', 'Missing required fields');
        result.statusCode = 1001; // Missing required fields
        result.errors = [{ message: 'Email, username, and password are required' }];
        result.data = null;
        handleResponse(res, result);
        return;
      }
      
      // Get data from service
      const serviceResult = await this.userService.create(userData);
      
      // Merge service data into our Result object
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      // Log that endpoint finished
      result.addMessage(AuditMessageType.info, 'UserController', 'create', 'Endpoint finished successfully');
      
      // Send response
      handleResponse(res, result);
      
    } catch (error: any) {
      // Log error and send error response
      result.addMessage(AuditMessageType.error, 'UserController', 'create', 'Endpoint failed');
      result.addException('UserController', 'create', error);
      result.statusCode = 1002; // Error code
      result.data = null;
      
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/{id}:
   *   put:
   *     summary: Update user
   *     description: Update an existing user's information
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
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
   *               phone:
   *                 type: string
   *               avatar:
   *                 type: string
   *               isActive:
   *                 type: boolean
   *               role:
   *                 type: string
   *                 enum: [user, admin, moderator]
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Data:
   *                   $ref: '#/components/schemas/User'
   *                 StatusCode:
   *                   type: integer
   *                   example: 1000
   *       404:
   *         description: User not found
   */
  async update(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { id } = req.params;
      const userData: UpdateUserData = req.body;
      const result = await this.userService.update(id, userData);
      result.requestIdentifier = requestIdentifier as string;
      handleResponse(res, result);
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to update user' }], null, requestIdentifier as string));
    }
  }

  /**
   * @openapi
   * /api/users/{id}:
   *   delete:
   *     summary: Delete user
   *     description: Soft delete a user (sets status to 0)
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
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
   *               type: object
   *               properties:
   *                 Data:
   *                   type: boolean
   *                   example: true
   *                 StatusCode:
   *                   type: integer
   *                   example: 1000
   *       404:
   *         description: User not found
   */
  async delete(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { id } = req.params;
      const result = await this.userService.delete(id);
      result.requestIdentifier = requestIdentifier as string;
      handleResponse(res, result);
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to delete user' }], null, requestIdentifier as string));
    }
  }

  /**
   * @openapi
   * /api/users/profile:
   *   get:
   *     summary: Get user profile
   *     description: Get the current authenticated user's profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 Data:
   *                   $ref: '#/components/schemas/User'
   *                 StatusCode:
   *                   type: integer
   *                   example: 1000
   *       401:
   *         description: User not authenticated
   *       404:
   *         description: User not found
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // Assuming user ID is available from auth middleware
      const userId = (req as any).user?.id;
      if (!userId) {
        handleResponse(res, Result.unauthorized('User not authenticated'));
        return;
      }
      const result = await this.userService.getById(userId);
      handleResponse(res, result);
    } catch (error: any) {
      handleResponse(res, Result.error('Failed to fetch profile', error.message));
    }
  }

  /**
   * @openapi
   * /api/users/profile:
   *   put:
   *     summary: Update user profile
   *     description: Update the current authenticated user's profile
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
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
   *               phone:
   *                 type: string
   *               avatar:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *       401:
   *         description: User not authenticated
   *       400:
   *         description: Bad request
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        const result = new Result(null, ResponseCode.Unauthorized, [{ message: 'User not authenticated' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      
      const userData: UpdateUserData = req.body;
      const result = await this.userService.update(userId, userData);
      result.requestIdentifier = requestIdentifier as string;
      handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: 'Failed to update profile' }], null, requestIdentifier as string);
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/change-password:
   *   post:
   *     summary: Change user password
   *     description: Change the current authenticated user's password
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *             required:
   *               - currentPassword
   *               - newPassword
   *     responses:
   *       200:
   *         description: Password changed successfully
   *       401:
   *         description: User not authenticated
   *       400:
   *         description: Bad request or invalid current password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        const result = new Result(null, ResponseCode.Unauthorized, [{ message: 'User not authenticated' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Current password and new password are required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      
      const result = await this.userService.changePassword(userId, currentPassword, newPassword);
      result.requestIdentifier = requestIdentifier as string;
      handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: 'Failed to change password' }], null, requestIdentifier as string);
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/deactivate:
   *   post:
   *     summary: Deactivate user account
   *     description: Deactivate the current authenticated user's account
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Account deactivated successfully
   *       401:
   *         description: User not authenticated
   */
  async deactivateAccount(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        const result = new Result(null, ResponseCode.Unauthorized, [{ message: 'User not authenticated' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      
      const result = await this.userService.deactivate(userId);
      result.requestIdentifier = requestIdentifier as string;
      handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: 'Failed to deactivate account' }], null, requestIdentifier as string);
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/search:
   *   get:
   *     summary: Search users
   *     description: Search users by email, username, or name
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search query
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of results to return
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number
   *     responses:
   *       200:
   *         description: Search results
   *       400:
   *         description: Bad request
   */
  async searchUsers(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { q, limit = 10, page = 1 } = req.query;
      if (!q) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Search query is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      
      const result = await this.userService.search(q as string, parseInt(limit as string), parseInt(page as string));
      result.requestIdentifier = requestIdentifier as string;
      handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: 'Failed to search users' }], null, requestIdentifier as string);
      handleResponse(res, result);
    }
  }
    /**
     * @swagger
     * /api/users/search:
     *   get:
     *     summary: Search users
     *     description: Search users by criteria
     *     tags: [Users]
     *     parameters:
     *       - in: query
     *         name: q
     *         schema:
     *           type: string
     *         description: Search query
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *         description: Number of results per page
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: Page number
     *     responses:
     *       200:
     *         description: Search completed successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: object
     *                   properties:
     *                     users:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/User'
     *                     pagination:
     *                       type: object
     *                       properties:
     *                         page:
     *                           type: integer
     *                         limit:
     *                           type: integer
     *                         total:
     *                           type: integer
     *                         totalPages:
     *                           type: integer
     *                 statusCode:
     *                   type: integer
     *                   example: 1000
     *                 errors:
     *                   type: array
     *                   items:
     *                     type: object
     *                 requestIdentifier:
     *                   type: string
     *       400:
     *         description: Bad request
     */
    async search(req: Request, res: Response): Promise<void> {
        const requestIdentifier = req.headers['x-request-id'] || uuidv4();
        try {
          const query = req.query.q as string || '';
          const limit = parseInt(req.query.limit as string) || 10;
          const page = parseInt(req.query.page as string) || 1;
          const result = await this.userService.search(query, limit, page);
          return handleResponse(res, result);
        } catch (error: any) {
          const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
          return handleResponse(res, result);
        }
      }

  /**
   * @openapi
   * /api/users/{id}/orders:
   *   get:
   *     summary: Get user with orders
   *     description: Retrieve user information along with their orders from external service
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User with orders retrieved successfully
   *       404:
   *         description: User not found
   */
  async getUserWithOrders(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { id } = req.params;
      const result = await this.userService.getUserWithOrders(id);
      result.requestIdentifier = requestIdentifier as string;
      handleResponse(res, result);
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to get user with orders' }], null, requestIdentifier as string));
    }
  }

  /**
   * @openapi
   * /api/users/{id}/favorites:
   *   get:
   *     summary: Get user with favorites
   *     description: Retrieve user information along with their favorite products from external service
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User ID
   *     responses:
   *       200:
   *         description: User with favorites retrieved successfully
   *       404:
   *         description: User not found
   */
  async getUserWithFavorites(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { id } = req.params;
      const result = await this.userService.getUserWithFavorites(id);
      result.requestIdentifier = requestIdentifier as string;
      handleResponse(res, result);
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to get user with favorites' }], null, requestIdentifier as string));
    }
  }

  /**
   * @openapi
   * /api/users/with-notification:
   *   post:
   *     summary: Create user with notification
   *     description: Create a new user and send welcome notification via external service
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - username
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *     responses:
   *       201:
   *         description: User created with notification sent
   *       400:
   *         description: Bad request
   */
  async createUserWithNotification(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const userData: CreateUserData = req.body;
      if (!userData.email || !userData.username || !userData.password) {
        handleResponse(res, new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Email, username, and password are required' }], null, requestIdentifier as string));
        return;
      }
      const result = await this.userService.createUserWithNotification(userData);
      result.requestIdentifier = requestIdentifier as string;
      handleResponse(res, result);
    } catch (error: any) {
      handleResponse(res, new Result(null, ResponseCode.Error, [{ message: 'Failed to create user with notification' }], null, requestIdentifier as string));
    }
  }

  // ==================== PERMISSION MANAGEMENT ENDPOINTS ====================

  /**
   * @openapi
   * /api/users/{id}/roles:
   *   put:
   *     summary: Assign roles to user
   *     description: Assign specific roles to a user
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
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
  async assignRoles(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'UserController', 'assignRoles', 'Endpoint started');
      
      const userId = req.params.id;
      const { roles } = req.body;
      
      if (!roles || !Array.isArray(roles)) {
        result.addMessage(AuditMessageType.error, 'UserController', 'assignRoles', 'Invalid roles data');
        result.statusCode = ResponseCode.MissingRequiredFields;
        result.errors = [{ message: 'Roles array is required' }];
        handleResponse(res, result);
        return;
      }
      
      const serviceResult = await this.userService.assignRoles(userId, roles);
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'UserController', 'assignRoles', 'Roles assigned successfully');
      handleResponse(res, result);
      
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'UserController', 'assignRoles', 'Endpoint failed');
      result.addException('UserController', 'assignRoles', error);
      result.statusCode = ResponseCode.Error;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/{id}/permissions:
   *   put:
   *     summary: Assign permissions to user
   *     description: Assign specific permissions to a user
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
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
  async assignPermissions(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'UserController', 'assignPermissions', 'Endpoint started');
      
      const userId = req.params.id;
      const { permissions } = req.body;
      
      if (!permissions || !Array.isArray(permissions)) {
        result.addMessage(AuditMessageType.error, 'UserController', 'assignPermissions', 'Invalid permissions data');
        result.statusCode = ResponseCode.MissingRequiredFields;
        result.errors = [{ message: 'Permissions array is required' }];
        handleResponse(res, result);
        return;
      }
      
      const serviceResult = await this.userService.assignPermissions(userId, permissions);
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'UserController', 'assignPermissions', 'Permissions assigned successfully');
      handleResponse(res, result);
      
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'UserController', 'assignPermissions', 'Endpoint failed');
      result.addException('UserController', 'assignPermissions', error);
      result.statusCode = ResponseCode.Error;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/{id}/permissions/add:
   *   post:
   *     summary: Add permissions to user
   *     description: Add permissions to existing user permissions (append)
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
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
  async addPermissions(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'UserController', 'addPermissions', 'Endpoint started');
      
      const userId = req.params.id;
      const { permissions } = req.body;
      
      if (!permissions || !Array.isArray(permissions)) {
        result.addMessage(AuditMessageType.error, 'UserController', 'addPermissions', 'Invalid permissions data');
        result.statusCode = ResponseCode.MissingRequiredFields;
        result.errors = [{ message: 'Permissions array is required' }];
        handleResponse(res, result);
        return;
      }
      
      const serviceResult = await this.userService.addPermissions(userId, permissions);
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'UserController', 'addPermissions', 'Permissions added successfully');
      handleResponse(res, result);
      
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'UserController', 'addPermissions', 'Endpoint failed');
      result.addException('UserController', 'addPermissions', error);
      result.statusCode = ResponseCode.Error;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/{id}/permissions/remove:
   *   delete:
   *     summary: Remove permissions from user
   *     description: Remove specific permissions from a user
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
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
  async removePermissions(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'UserController', 'removePermissions', 'Endpoint started');
      
      const userId = req.params.id;
      const { permissions } = req.body;
      
      if (!permissions || !Array.isArray(permissions)) {
        result.addMessage(AuditMessageType.error, 'UserController', 'removePermissions', 'Invalid permissions data');
        result.statusCode = ResponseCode.MissingRequiredFields;
        result.errors = [{ message: 'Permissions array is required' }];
        handleResponse(res, result);
        return;
      }
      
      const serviceResult = await this.userService.removePermissions(userId, permissions);
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'UserController', 'removePermissions', 'Permissions removed successfully');
      handleResponse(res, result);
      
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'UserController', 'removePermissions', 'Endpoint failed');
      result.addException('UserController', 'removePermissions', error);
      result.statusCode = ResponseCode.Error;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/{id}/admin:
   *   put:
   *     summary: Set user admin status
   *     description: Set or unset a user as admin
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
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
  async setAdmin(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'UserController', 'setAdmin', 'Endpoint started');
      
      const userId = req.params.id;
      const { isAdmin } = req.body;
      
      if (typeof isAdmin !== 'boolean') {
        result.addMessage(AuditMessageType.error, 'UserController', 'setAdmin', 'Invalid admin status data');
        result.statusCode = ResponseCode.MissingRequiredFields;
        result.errors = [{ message: 'isAdmin boolean is required' }];
        handleResponse(res, result);
        return;
      }
      
      const serviceResult = await this.userService.setAdmin(userId, isAdmin);
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'UserController', 'setAdmin', 'Admin status updated successfully');
      handleResponse(res, result);
      
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'UserController', 'setAdmin', 'Endpoint failed');
      result.addException('UserController', 'setAdmin', error);
      result.statusCode = ResponseCode.Error;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/role/{role}:
   *   get:
   *     summary: Get users by role
   *     description: Retrieve all users with a specific role
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: role
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
  async getUsersByRole(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'UserController', 'getUsersByRole', 'Endpoint started');
      
      const role = req.params.role;
      const serviceResult = await this.userService.getUsersByRole(role);
      result.data = serviceResult.data;
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'UserController', 'getUsersByRole', 'Users retrieved successfully');
      handleResponse(res, result);
      
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'UserController', 'getUsersByRole', 'Endpoint failed');
      result.addException('UserController', 'getUsersByRole', error);
      result.statusCode = ResponseCode.Error;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/permission/{permission}:
   *   get:
   *     summary: Get users by permission
   *     description: Retrieve all users with a specific permission
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: permission
   *         name: permission
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
  async getUsersByPermission(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'UserController', 'getUsersByPermission', 'Endpoint started');
      
      const permission = req.params.permission;
      const serviceResult = await this.userService.getUsersByPermission(permission);
      result.data = serviceResult.data;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'UserController', 'getUsersByPermission', 'Users retrieved successfully');
      handleResponse(res, result);
      
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'UserController', 'getUsersByPermission', 'Endpoint failed');
      result.addException('UserController', 'getUsersByPermission', error);
      result.statusCode = ResponseCode.Error;
      result.data = null;
      handleResponse(res, result);
    }
  }

  /**
   * @openapi
   * /api/users/{id}/check-permission:
   *   post:
   *     summary: Check user permission
   *     description: Check if a user has a specific permission
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: id
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
  async checkPermission(req: Request, res: Response): Promise<void> {
    const result = CentralizedRequestMiddleware.getResult(req);
    
    try {
      result.addMessage(AuditMessageType.info, 'UserController', 'checkPermission', 'Endpoint started');
      
      const userId = req.params.id;
      const { permission } = req.body;
      
      if (!permission) {
        result.addMessage(AuditMessageType.error, 'UserController', 'checkPermission', 'Invalid permission data');
        result.statusCode = ResponseCode.MissingRequiredFields;
        result.errors = [{ message: 'Permission code is required' }];
        handleResponse(res, result);
        return;
      }
      
      const serviceResult = await this.userService.hasPermission(userId, permission);
      result.data = { hasPermission: serviceResult.data };
      result.statusCode = serviceResult.statusCode;
      result.errors = serviceResult.errors;
      result.messages = [...(result.messages || []), ...(serviceResult.messages || [])];
      
      result.addMessage(AuditMessageType.info, 'UserController', 'checkPermission', 'Permission check completed');
      handleResponse(res, result);
      
    } catch (error: any) {
      result.addMessage(AuditMessageType.error, 'UserController', 'checkPermission', 'Endpoint failed');
      result.addException('UserController', 'checkPermission', error);
      result.statusCode = ResponseCode.Error;
      result.data = null;
      handleResponse(res, result);
    }
  }
}


function uuidv4(): string | string[] {
  throw new Error('Function not implemented.');
}
/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: User ID
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         username:
 *           type: string
 *           description: Username
 *         firstName:
 *           type: string
 *           description: First name
 *         lastName:
 *           type: string
 *           description: Last name
 *         phone:
 *           type: string
 *           description: Phone number
 *         avatar:
 *           type: string
 *           description: Avatar URL
 *         isActive:
 *           type: boolean
 *           description: Whether user is active
 *         lastLoginAt:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         emailVerified:
 *           type: boolean
 *           description: Whether email is verified
 *         phoneVerified:
 *           type: boolean
 *           description: Whether phone is verified
 *         role:
 *           type: string
 *           enum: [user, admin, moderator]
 *           description: User role
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *           description: User permissions
 *         status:
 *           type: integer
 *           description: User status (1 - active, 0 - deleted, -1 - suspended)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required:
 *         - email
 *         - username
 *         - isActive
 *         - emailVerified
 *         - phoneVerified
 *         - role
 *         - status
 *         - createdAt
 *         - updatedAt
 */ 