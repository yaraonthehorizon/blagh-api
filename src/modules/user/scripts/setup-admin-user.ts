import { UserService } from '../services/user.service';
import { PermissionService } from '../../permission/services/permission.service';
import { Result } from '../../../shared/types/result';

/**
 * Script to set up an admin user with all necessary permissions
 */
export class AdminUserSetup {
  private static userService = new UserService();
  private static permissionService = new PermissionService();

  /**
   * Create or update admin user
   */
  static async setupAdminUser(adminData: {
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<void> {
    console.log('👤 Setting up Admin User...');

    try {
      // Check if admin user already exists
      const existingUser = await this.userService.getByEmail(adminData.email);
      
      if (existingUser.statusCode === 1000 && existingUser.data) {
        console.log('✅ Admin user already exists, updating permissions...');
        await this.updateUserToAdmin(existingUser.data._id!);
      } else {
        console.log('🆕 Creating new admin user...');
        const createResult = await this.userService.create({
          ...adminData,
          roleIds: [], // Will be populated after role creation
          isAdmin: true
        });

        if (createResult.statusCode === 1000 && createResult.data) {
          console.log('✅ Admin user created successfully');
          await this.updateUserToAdmin(createResult.data._id!);
        } else {
          console.log('❌ Failed to create admin user:', createResult.errors);
          return;
        }
      }

      console.log('🎉 Admin user setup completed successfully!');
    } catch (error: any) {
      console.error('💥 Error setting up admin user:', error.message);
    }
  }

  /**
   * Update existing user to admin status
   */
  private static async updateUserToAdmin(userId: string): Promise<void> {
    try {
      // Set admin status
      await this.userService.setAdmin(userId, true);
      console.log('✅ User admin status set');

      // Assign admin role
      await this.userService.assignRoles(userId, ['admin']);
      console.log('✅ Admin role assigned');

      // Get all available permissions
      const permissionsResult = await this.permissionService.getAllPermissions();
      if (permissionsResult.statusCode === 1000 && permissionsResult.data) {
        const allPermissions = permissionsResult.data.map(p => p.code);
        
        // For now, just log the permissions (role-based assignment will be handled separately)
        console.log(`✅ Found ${allPermissions.length} permissions in system`);
      } else {
        console.log('⚠️  No permissions found, admin user will have basic access');
      }

    } catch (error: any) {
      console.error('💥 Error updating user to admin:', error.message);
    }
  }

  /**
   * Create default admin user with common credentials
   */
  static async createDefaultAdmin(): Promise<void> {
    const defaultAdmin = {
      email: 'admin@domain.com',
      username: 'superadmin',
      password: 'Diagramers#1',
      firstName: 'Super',
      lastName: 'Administrator'
    };

    console.log('🚀 Creating Default Admin User...');
    console.log(`📧 Email: ${defaultAdmin.email}`);
    console.log(`👤 Username: ${defaultAdmin.username}`);
    console.log(`🔑 Password: ${defaultAdmin.password}`);
    console.log('');

    await this.setupAdminUser(defaultAdmin);

    console.log('');
    console.log('📋 Default Admin Credentials:');
    console.log(`   Email: ${defaultAdmin.email}`);
    console.log(`   Username: ${defaultAdmin.username}`);
    console.log(`   Password: ${defaultAdmin.password}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
  }

  /**
   * Create custom admin user
   */
  static async createCustomAdmin(): Promise<void> {
    console.log('🎯 Creating Custom Admin User...');
    
    // You can modify these values as needed
    const customAdmin = {
      email: 'custom.admin@yourcompany.com',
      username: 'customadmin',
      password: 'SecurePassword123!',
      firstName: 'Custom',
      lastName: 'Admin'
    };

    console.log(`📧 Email: ${customAdmin.email}`);
    console.log(`👤 Username: ${customAdmin.username}`);
    console.log(`🔑 Password: ${customAdmin.password}`);
    console.log('');

    await this.setupAdminUser(customAdmin);
  }

  /**
   * List all admin users
   */
  static async listAdminUsers(): Promise<void> {
    console.log('👥 Listing All Admin Users...');

    try {
      const adminUsers = await this.userService.getUsersByRole('admin');
      
      if (adminUsers.statusCode === 1000 && adminUsers.data) {
        console.log(`✅ Found ${adminUsers.data.length} admin users:`);
        adminUsers.data.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
          console.log(`      Username: ${user.username}`);
                  console.log(`      Role IDs: ${user.roleIds?.join(', ') || 'None'}`);
        console.log(`      Admin Status: ${user.isAdmin ? 'Yes' : 'No'}`);
          console.log(`      Admin Flag: ${user.isAdmin ? 'Yes' : 'No'}`);
          console.log('');
        });
      } else {
        console.log('❌ No admin users found');
      }
    } catch (error: any) {
      console.error('💥 Error listing admin users:', error.message);
    }
  }

  /**
   * Verify admin user permissions
   */
  static async verifyAdminPermissions(adminEmail: string): Promise<void> {
    console.log(`🔍 Verifying Admin Permissions for: ${adminEmail}`);

    try {
      const user = await this.userService.getByEmail(adminEmail);
      
      if (user.statusCode !== 1000 || !user.data) {
        console.log('❌ User not found');
        return;
      }

      const adminUser = user.data;
      console.log(`👤 User: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`📧 Email: ${adminUser.email}`);
              console.log(`👑 Role IDs: ${adminUser.roleIds?.join(', ') || 'None'}`);
        console.log(`🔑 Admin Flag: ${adminUser.isAdmin ? 'Yes' : 'No'}`);
        console.log(`📋 Role-based permissions will be checked through role system`);

      // Test some key permissions
      const testPermissions = ['USERS_READ', 'USERS_CREATE', 'PERMISSIONS_READ'];
      console.log('');
      console.log('🧪 Testing Key Permissions:');
      
      for (const permission of testPermissions) {
        const hasPermission = await this.userService.hasPermission(adminUser._id!, permission);
        const status = hasPermission.data ? '✅' : '❌';
        console.log(`   ${status} ${permission}`);
      }

    } catch (error: any) {
      console.error('💥 Error verifying admin permissions:', error.message);
    }
  }

  /**
   * Main setup function
   */
  static async run(): Promise<void> {
    console.log('🎯 Starting Admin User Setup...\n');

    // Create default admin user
    await this.createDefaultAdmin();
    console.log('');

    // List all admin users
    await this.listAdminUsers();
    console.log('');

    // Verify admin permissions
    await this.verifyAdminPermissions('admin@domain.com');
    console.log('');

    console.log('🎉 Admin User Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Login with admin credentials');
    console.log('2. Change default password');
    console.log('3. Create additional admin users if needed');
    console.log('4. Test admin functionality');
    console.log('5. Monitor admin user activities');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  AdminUserSetup.run().catch(console.error);
}
