import { PermissionService } from '../services/permission.service';
import { Result } from '../../../shared/types/result';

/**
 * Script to set up default permissions for the USERS module
 * Run this script to initialize the permission system
 */
export class UserPermissionSetup {
  private static permissionService = new PermissionService();

  /**
   * Set up all default permissions for the USERS module
   */
  static async setupDefaultPermissions(): Promise<void> {
    console.log('🚀 Setting up default permissions for USERS module...');

    try {
      // Define all the permissions needed for the USERS module
      const userPermissions = [
        {
          name: 'Read All Users',
          code: 'USERS_READ',
          description: 'Permission to view all users in the system',
          module: 'USERS',
          action: 'READ',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin', 'manager'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        },
        {
          name: 'Create Users',
          code: 'USERS_CREATE',
          description: 'Permission to create new users',
          module: 'USERS',
          action: 'CREATE',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        },
        {
          name: 'Update Users',
          code: 'USERS_UPDATE',
          description: 'Permission to update user information',
          module: 'USERS',
          action: 'UPDATE',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin', 'manager'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        },
        {
          name: 'Delete Users',
          code: 'USERS_DELETE',
          description: 'Permission to delete users from the system',
          module: 'USERS',
          action: 'DELETE',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        },
        {
          name: 'Read Own Profile',
          code: 'USERS_READ_PROFILE',
          description: 'Permission to read own user profile',
          module: 'USERS',
          action: 'READ_PROFILE',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['user', 'admin', 'manager'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        },
        {
          name: 'Search Users',
          code: 'USERS_SEARCH',
          description: 'Permission to search users by criteria',
          module: 'USERS',
          action: 'SEARCH',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin', 'manager'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        },
        {
          name: 'Read User Orders',
          code: 'USERS_READ_ORDERS',
          description: 'Permission to read user orders',
          module: 'USERS',
          action: 'READ_ORDERS',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin', 'manager'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        },
        {
          name: 'Read User Favorites',
          code: 'USERS_READ_FAVORITES',
          description: 'Permission to read user favorites',
          module: 'USERS',
          action: 'READ_FAVORITES',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin', 'manager'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        },
        {
          name: 'Export Users',
          code: 'USERS_EXPORT',
          description: 'Permission to export user data',
          module: 'USERS',
          action: 'EXPORT',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        },
        {
          name: 'Import Users',
          code: 'USERS_IMPORT',
          description: 'Permission to import user data',
          module: 'USERS',
          action: 'IMPORT',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        },
        {
          name: 'User Analytics',
          code: 'USERS_ANALYTICS',
          description: 'Permission to view user analytics and reports',
          module: 'USERS',
          action: 'ANALYTICS',
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin', 'manager'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: []
        }
      ];

      // Create each permission
      for (const permissionData of userPermissions) {
        try {
          const result = await this.permissionService.createPermission({
            ...permissionData,
            createdBy: 'system', // System user
            updatedBy: 'system'
          });

          if (result.statusCode === 1000) {
            console.log(`✅ Created permission: ${permissionData.code}`);
          } else {
            console.log(`⚠️  Failed to create permission ${permissionData.code}:`, result.errors);
          }
        } catch (error: any) {
          console.log(`❌ Error creating permission ${permissionData.code}:`, error.message);
        }
      }

      console.log('🎉 User permissions setup completed!');

    } catch (error: any) {
      console.error('💥 Error setting up user permissions:', error.message);
    }
  }

  /**
   * Create a custom permission with conditions
   */
  static async createCustomPermission(): Promise<void> {
    console.log('🔧 Creating custom permission with conditions...');

    try {
      // Example: Users can only edit their own profile
      const customPermission = {
        name: 'Edit Own Profile Only',
        code: 'USERS_EDIT_OWN',
        description: 'Users can only edit their own profile information',
        module: 'USERS',
        action: 'EDIT_OWN',
        isActive: true,
        requiresAuth: true,
        allowedRoles: ['user', 'admin', 'manager'],
        allowedUsers: [],
        deniedUsers: [],
        conditions: [
          {
            field: 'user.id',
            operator: 'eq' as const,
            value: 'resource.id'
          }
        ],
        createdBy: 'system',
        updatedBy: 'system'
      };

      const result = await this.permissionService.createPermission(customPermission);

      if (result.statusCode === 1000) {
        console.log('✅ Created custom permission: USERS_EDIT_OWN');
        console.log('📋 This permission allows users to edit only their own profile');
      } else {
        console.log('❌ Failed to create custom permission:', result.errors);
      }

    } catch (error: any) {
      console.error('💥 Error creating custom permission:', error.message);
    }
  }

  /**
   * Create department-based permissions
   */
  static async createDepartmentPermissions(): Promise<void> {
    console.log('🏢 Creating department-based permissions...');

    try {
      // Example: Managers can only manage users in their department
      const deptPermission = {
        name: 'Manage Users in Department',
        code: 'USERS_MANAGE_DEPARTMENT',
        description: 'Managers can only manage users in their own department',
        module: 'USERS',
        action: 'MANAGE_DEPARTMENT',
        isActive: true,
        requiresAuth: true,
        allowedRoles: ['manager'],
        allowedUsers: [],
        deniedUsers: [],
        conditions: [
          {
            field: 'user.department',
            operator: 'eq' as const,
            value: 'resource.department'
          }
        ],
        createdBy: 'system',
        updatedBy: 'system'
      };

      const result = await this.permissionService.createPermission(deptPermission);

      if (result.statusCode === 1000) {
        console.log('✅ Created department permission: USERS_MANAGE_DEPARTMENT');
        console.log('📋 This permission allows managers to manage users in their department only');
      } else {
        console.log('❌ Failed to create department permission:', result.errors);
      }

    } catch (error: any) {
      console.error('💥 Error creating department permission:', error.message);
    }
  }

  /**
   * Test the permission system
   */
  static async testPermissions(): Promise<void> {
    console.log('🧪 Testing permission system...');

    try {
      // Test basic permission check
      const testUser = {
        id: 'test-user-123',
        role: 'manager',
        department: 'IT'
      };

      const testResource = {
        id: 'test-user-123',
        department: 'IT'
      };

      const permissionResult = await this.permissionService.checkPermission({
        module: 'USERS',
        action: 'READ',
        user: testUser,
        resource: testResource,
        context: { timeOfDay: 14 }
      });

      console.log('🔍 Permission test result:', {
        allowed: permissionResult.allowed,
        reason: permissionResult.reason,
        permission: permissionResult.permission?.code
      });

    } catch (error: any) {
      console.error('💥 Error testing permissions:', error.message);
    }
  }

  /**
   * Main setup function
   */
  static async run(): Promise<void> {
    console.log('🎯 Starting User Permission Setup...\n');

    await this.setupDefaultPermissions();
    console.log('');
    
    await this.createCustomPermission();
    console.log('');
    
    await this.createDepartmentPermissions();
    console.log('');
    
    await this.testPermissions();
    console.log('');

    console.log('🎉 User Permission Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Visit /api-docs to see the new permission endpoints');
    console.log('2. Use the permission endpoints to manage permissions');
    console.log('3. Test permissions with different users and roles');
    console.log('4. Create custom permissions for your specific needs');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  UserPermissionSetup.run().catch(console.error);
}
