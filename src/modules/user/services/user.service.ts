import { Result } from '../../../shared/types/result';
import { UserModel, IUserDocument } from '../schemas/user.schema';
import { User, CreateUserData, UpdateUserData } from '../entities/user.entity';
import { ModuleCommunicationService } from '../../../shared/services/module-communication.service';
import * as bcrypt from 'bcryptjs';

export class UserService {
  private moduleComm: ModuleCommunicationService;

  constructor() {
    this.moduleComm = new ModuleCommunicationService();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await this.moduleComm.initialize();
  }

  /**
   * Get all active users
   */
  async getAll(): Promise<Result<User[]>> {
    try {
      const users = await UserModel.find({ status: 1 }).select('-password').lean();
      const transformedUsers = users.map(user => ({
        ...user,
        _id: user._id.toString()
      })) as User[];
      return Result.success(transformedUsers);
    } catch (error: any) {
      return Result.error('Failed to fetch users', error.message);
    }
  }

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<Result<User | null>> {
    try {
      const user = await UserModel.findOne({ _id: id, status: 1 }).select('-password');
      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }
      const userObj = user.toObject();
      return Result.success({ ...userObj, _id: userObj._id.toString() } as unknown as User);
    } catch (error: any) {
      return Result.error('Failed to fetch user', error.message);
    }
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<Result<User | null>> {
    try {
      const user = await UserModel.findOne({ email: email.toLowerCase(), status: 1 });
      if (!user) {
        return Result.error('User not found', 'User with the specified email does not exist');
      }
      const userObj = user.toObject();
      return Result.success({ ...userObj, _id: userObj._id.toString() } as unknown as User);
    } catch (error: any) {
      return Result.error('Failed to fetch user', error.message);
    }
  }

  /**
   * Get user by email with password (for auth purposes)
   */
  async getByEmailWithPassword(email: string): Promise<Result<User | null>> {
    try {
      const user = await UserModel.findOne({ email: email.toLowerCase(), status: 1 });
      if (!user) {
        return Result.error('User not found', 'User with the specified email does not exist');
      }
      const userObj = user.toObject();
      return Result.success({ ...userObj, _id: userObj._id.toString() } as unknown as User);
    } catch (error: any) {
      return Result.error('Failed to fetch user', error.message);
    }
  }

  /**
   * Create new user
   */
  async create(userData: CreateUserData): Promise<Result<User>> {
    try {
      // Check if user already exists
      const existingUser = await UserModel.findOne({
        $or: [
          { email: userData.email.toLowerCase() },
          { username: userData.username }
        ],
        status: 1
      });
      if (existingUser) {
        return Result.error('User already exists', 'A user with this email or username already exists');
      }
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      // Create user
      const user = new UserModel({
        ...userData,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        status: 1
      });
      const savedUser = await user.save();
      const userObj = savedUser.toObject();
      delete userObj.password;
      return Result.success({ ...userObj, _id: userObj._id.toString() } as unknown as User);
    } catch (error: any) {
      return Result.error('Failed to create user', error.message);
    }
  }

  /**
   * Update user
   */
  async update(id: string, userData: UpdateUserData): Promise<Result<User | null>> {
    try {
      const user = await UserModel.findOne({ _id: id, status: 1 });
      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }
      Object.assign(user, userData);
      const updatedUser = await user.save();
      const userObj = updatedUser.toObject();
      delete userObj.password;
      return Result.success({ ...userObj, _id: userObj._id.toString() } as unknown as User);
    } catch (error: any) {
      return Result.error('Failed to update user', error.message);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id: string): Promise<Result<boolean>> {
    try {
      const user = await UserModel.findOne({ _id: id, status: 1 });
      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      user.status = 0;
      await user.save();

      return Result.success(true);
    } catch (error: any) {
      return Result.error('Failed to delete user', error.message);
    }
  }

  /**
   * Verify user password
   */
  async verifyPassword(userId: string, password: string): Promise<Result<boolean>> {
    try {
      const user = await UserModel.findOne({ _id: userId, status: 1 });
      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      const isValid = await bcrypt.compare(password, user.password);
      return Result.success(isValid);
    } catch (error: any) {
      return Result.error('Failed to verify password', error.message);
    }
  }

  /**
   * Update last login
   */
  async updateLastLogin(id: string): Promise<Result<boolean>> {
    try {
      const user = await UserModel.findOne({ _id: id, status: 1 });
      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      user.lastLoginAt = new Date();
      await user.save();

      return Result.success(true);
    } catch (error: any) {
      return Result.error('Failed to update last login', error.message);
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<Result<boolean>> {
    try {
      const user = await UserModel.findOne({ _id: userId, status: 1 });
      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return Result.error('Invalid current password', 'The current password is incorrect');
      }

      // Validate new password
      if (newPassword.length < 8) {
        return Result.error('Invalid new password', 'New password must be at least 8 characters long');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return Result.success(true);
    } catch (error: any) {
      return Result.error('Failed to change password', error.message);
    }
  }

  /**
   * Deactivate user account
   */
  async deactivate(userId: string): Promise<Result<boolean>> {
    try {
      const user = await UserModel.findOne({ _id: userId, status: 1 });
      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      user.isActive = false;
      await user.save();

      return Result.success(true);
    } catch (error: any) {
      return Result.error('Failed to deactivate account', error.message);
    }
  }

  /**
   * Search users
   */
  async search(query: string, limit: number = 10, page: number = 1): Promise<Result<any>> {
    try {
      const skip = (page - 1) * limit;
      
      const searchFilter = {
        $or: [
          { email: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ],
        status: 1
      };

      const [users, total] = await Promise.all([
        UserModel.find(searchFilter)
          .select('-password')
          .skip(skip)
          .limit(limit)
          .lean(),
        UserModel.countDocuments(searchFilter)
      ]);

      const transformedUsers = users.map(user => ({
        ...user,
        _id: user._id.toString()
      }));

      return Result.success({
        users: transformedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error: any) {
      return Result.error('Failed to search users', error.message);
    }
  }

  /**
   * Get user with their orders (cross-module communication example)
   */
  async getUserWithOrders(userId: string): Promise<Result<any>> {
    try {
      // Get user data locally
      const userResult = await this.getById(userId);
      if (userResult.statusCode !== 1000 || !userResult.data) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      // Call external orders module
      try {
        const orders = await this.moduleComm.callModule('orders', 'getUserOrders', {
          userId: userId
        });

        return Result.success({
          user: userResult.data,
          orders: orders.data || []
        });
      } catch (error) {
        console.warn('Failed to fetch orders from external module:', error.message);
        return Result.success({
          user: userResult.data,
          orders: [],
          warning: 'Orders service temporarily unavailable'
        });
      }
    } catch (error: any) {
      return Result.error('Failed to get user with orders', error.message);
    }
  }

  /**
   * Get user with their favorite products (cross-module communication example)
   */
  async getUserWithFavorites(userId: string): Promise<Result<any>> {
    try {
      // Get user data locally
      const userResult = await this.getById(userId);
      if (userResult.statusCode !== 1000 || !userResult.data) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      // Call external products module
      try {
        const favorites = await this.moduleComm.callModule('products', 'getUserFavorites', {
          userId: userId
        });

        return Result.success({
          user: userResult.data,
          favorites: favorites.data || []
        });
      } catch (error) {
        console.warn('Failed to fetch favorites from external module:', error.message);
        return Result.success({
          user: userResult.data,
          favorites: [],
          warning: 'Products service temporarily unavailable'
        });
      }
    } catch (error: any) {
      return Result.error('Failed to get user with favorites', error.message);
    }
  }

  /**
   * Create user with welcome notification (cross-module communication example)
   */
  async createUserWithNotification(userData: CreateUserData): Promise<Result<User>> {
    try {
      // Create user locally
      const userResult = await this.create(userData);
      if (userResult.statusCode !== 1000 || !userResult.data) {
        return userResult;
      }

      // Send welcome notification via external module
      try {
        await this.moduleComm.callModule('notification', 'sendWelcomeEmail', {
          userId: userResult.data._id,
          email: userResult.data.email,
          firstName: userResult.data.firstName
        });

        console.log(`✅ Welcome notification sent to user ${userResult.data._id}`);
      } catch (error) {
        console.warn('Failed to send welcome notification:', error.message);
        // Continue without notification - user creation succeeded
      }

      return userResult;
    } catch (error: any) {
      return Result.error('Failed to create user with notification', error.message);
    }
  }

  // ==================== PERMISSION MANAGEMENT METHODS ====================

  /**
   * Assign roles to a user
   */
  async assignRoles(userId: string, roles: string[]): Promise<Result<User>> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            roles: roles,
            lastPermissionUpdate: new Date()
          }
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      const userObj = user.toObject();
      return Result.success({ ...userObj, _id: userObj._id.toString() } as unknown as User);
    } catch (error: any) {
      return Result.error('Failed to assign roles', error.message);
    }
  }

  /**
   * Assign permissions to a user
   */
  async assignPermissions(userId: string, permissions: string[]): Promise<Result<User>> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            permissions: permissions,
            lastPermissionUpdate: new Date()
          }
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      const userObj = user.toObject();
      return Result.success({ ...userObj, _id: userObj._id.toString() } as unknown as User);
    } catch (error: any) {
      return Result.error('Failed to assign permissions', error.message);
    }
  }

  /**
   * Add permissions to a user (append to existing)
   */
  async addPermissions(userId: string, permissions: string[]): Promise<Result<User>> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { 
          $addToSet: { 
            permissions: { $each: permissions },
            lastPermissionUpdate: new Date()
          }
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      const userObj = user.toObject();
      return Result.success({ ...userObj, _id: userObj._id.toString() } as unknown as User);
    } catch (error: any) {
      return Result.error('Failed to add permissions', error.message);
    }
  }

  /**
   * Remove permissions from a user
   */
  async removePermissions(userId: string, permissions: string[]): Promise<Result<User>> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { 
          $pull: { 
            permissions: { $in: permissions },
            lastPermissionUpdate: new Date()
          }
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      const userObj = user.toObject();
      return Result.success({ ...userObj, _id: userObj._id.toString() } as unknown as User);
    } catch (error: any) {
      return Result.error('Failed to remove permissions', error.message);
    }
  }

  /**
   * Set user as admin
   */
  async setAdmin(userId: string, isAdmin: boolean = true): Promise<Result<User>> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { 
          $set: { 
            isAdmin: isAdmin,
            lastPermissionUpdate: new Date()
          }
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      const userObj = user.toObject();
      return Result.success({ ...userObj, _id: userObj._id.toString() } as unknown as User);
    } catch (error: any) {
      return Result.error('Failed to set admin status', error.message);
    }
  }

  /**
   * Get users by role (using roleIds)
   */
  async getUsersByRole(roleId: string): Promise<Result<User[]>> {
    try {
      const users = await UserModel.find({ 
        roleIds: roleId, 
        status: 1 
      }).select('-password').lean();

      const transformedUsers = users.map(user => ({
        ...user,
        _id: user._id.toString()
      })) as User[];

      return Result.success(transformedUsers);
    } catch (error: any) {
      return Result.error('Failed to fetch users by role', error.message);
    }
  }

  /**
   * Get users by permission (using roleIds and checking roles)
   */
  async getUsersByPermission(permission: string): Promise<Result<User[]>> {
    try {
      // This method needs to be updated to work with the new role-based system
      // For now, return empty array as this requires role lookup
      return Result.success([]);
    } catch (error: any) {
      return Result.error('Failed to fetch users by permission', error.message);
    }
  }

  /**
   * Check if user has specific permission (using roleIds)
   */
  async hasPermission(userId: string, permission: string): Promise<Result<boolean>> {
    try {
      const user = await UserModel.findById(userId).select('roleIds isAdmin');
      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      // Admin users have all permissions
      if (user.isAdmin) {
        return Result.success(true);
      }

      // For now, return false as this requires role lookup
      // TODO: Implement role-based permission checking
      return Result.success(false);
    } catch (error: any) {
      return Result.error('Failed to check permission', error.message);
    }
  }

  /**
   * Check if user has any of the specified permissions (using roleIds)
   */
  async hasAnyPermission(userId: string, permissions: string[]): Promise<Result<boolean>> {
    try {
      const user = await UserModel.findById(userId).select('roleIds isAdmin');
      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      // Admin users have all permissions
      if (user.isAdmin) {
        return Result.success(true);
      }

      // For now, return false as this requires role lookup
      // TODO: Implement role-based permission checking
      return Result.success(false);
    } catch (error: any) {
      return Result.error('Failed to check permissions', error.message);
    }
  }

  /**
   * Check if user has all of the specified permissions (using roleIds)
   */
  async hasAllPermissions(userId: string, permissions: string[]): Promise<Result<boolean>> {
    try {
      const user = await UserModel.findById(userId).select('roleIds isAdmin');
      if (!user) {
        return Result.error('User not found', 'User with the specified ID does not exist');
      }

      // Admin users have all permissions
      if (user.isAdmin) {
        return Result.success(true);
      }

      // For now, return false as this requires role lookup
      // TODO: Implement role-based permission checking
      return Result.success(false);
    } catch (error: any) {
      return Result.error('Failed to check permissions', error.message);
    }
  }

  /**
   * Bulk assign permissions to multiple users
   */
  async bulkAssignPermissions(userIds: string[], permissions: string[]): Promise<Result<{ success: string[], failed: string[] }>> {
    try {
      const result = await UserModel.updateMany(
        { _id: { $in: userIds } },
        { 
          $addToSet: { 
            permissions: { $each: permissions },
            lastPermissionUpdate: new Date()
          }
        }
      );

      return Result.success({
        success: userIds,
        failed: [],
        updatedCount: result.modifiedCount
      });
    } catch (error: any) {
      return Result.error('Failed to bulk assign permissions', error.message);
    }
  }
} 