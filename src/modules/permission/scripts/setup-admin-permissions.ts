import { PermissionService } from '../services/permission.service';

/**
 * Quick script to set up admin permissions for all modules
 */
export class AdminPermissionSetup {
  private static permissionService = new PermissionService();

  /**
   * Create admin permissions for a specific module
   */
  static async createAdminPermissionsForModule(module: string, actions: string[]): Promise<void> {
    console.log(`🔑 Creating admin permissions for ${module} module...`);

    for (const action of actions) {
      try {
        const permissionData = {
          name: `Admin ${action} ${module}`,
          code: `${module.toUpperCase()}_${action.toUpperCase()}`,
          description: `Admin can ${action.toLowerCase()} ${module.toLowerCase()}`,
          module: module.toUpperCase(),
          action: action.toUpperCase(),
          isActive: true,
          requiresAuth: true,
          allowedRoles: ['admin'],
          allowedUsers: [],
          deniedUsers: [],
          conditions: [],
          metadata: {
            type: 'admin_access',
            scope: `${module}_${action}`
          },
          createdBy: 'system',
          updatedBy: 'system'
        };

        const result = await this.permissionService.createPermission(permissionData);

        if (result.statusCode === 1000) {
          console.log(`✅ Created: ${permissionData.code}`);
        } else {
          console.log(`⚠️  Failed: ${permissionData.code} - ${result.errors?.[0]?.message}`);
        }
      } catch (error: any) {
        console.log(`❌ Error creating ${module}_${action}: ${error.message}`);
      }
    }
  }

  /**
   * Set up admin permissions for all modules
   */
  static async setupAllAdminPermissions(): Promise<void> {
    console.log('🚀 Setting up Admin Permissions for All Modules...\n');

    // USERS module permissions
    await this.createAdminPermissionsForModule('USERS', [
      'CREATE', 'READ', 'UPDATE', 'DELETE', 'READ_PROFILE',
      'SEARCH', 'READ_ORDERS', 'READ_FAVORITES', 'EXPORT',
      'IMPORT', 'ANALYTICS', 'ADMIN_FULL'
    ]);

    console.log('');

    // AUTH module permissions
    await this.createAdminPermissionsForModule('AUTH', [
      'LOGIN', 'LOGOUT', 'REGISTER', 'REFRESH', 'RESET_PASSWORD',
      'VERIFY_EMAIL', 'CHANGE_PASSWORD', 'ADMIN_FULL'
    ]);

    console.log('');

    // PERMISSIONS module permissions
    await this.createAdminPermissionsForModule('PERMISSIONS', [
      'CREATE', 'READ', 'UPDATE', 'DELETE', 'BULK_CREATE',
      'TEST', 'ADMIN_FULL'
    ]);

    console.log('');

    // EMAIL module permissions
    await this.createAdminPermissionsForModule('EMAIL', [
      'SEND', 'READ', 'DELETE', 'ADMIN_FULL'
    ]);

    console.log('');

    // NOTIFICATION module permissions
    await this.createAdminPermissionsForModule('NOTIFICATION', [
      'CREATE', 'READ', 'UPDATE', 'DELETE', 'SEND', 'ADMIN_FULL'
    ]);

    console.log('');

    // ODOO module permissions
    await this.createAdminPermissionsForModule('ODOO', [
      'CREATE', 'READ', 'UPDATE', 'DELETE', 'SYNC', 'ADMIN_FULL'
    ]);

    console.log('🎉 Admin permissions setup completed!');
    console.log('\n📋 What was created:');
    console.log('   • Full admin access to USERS module');
    console.log('   • Full admin access to AUTH module');
    console.log('   • Full admin access to PERMISSIONS module');
    console.log('   • Full admin access to EMAIL module');
    console.log('   • Full admin access to NOTIFICATION module');
    console.log('   • Full admin access to ODOO module');
    console.log('\n🔑 Admin users now have complete system access!');
  }

  /**
   * Create a super admin wildcard permission
   */
  static async createSuperAdminPermission(): Promise<void> {
    console.log('🌟 Creating Super Admin Permission...');

    try {
      const superAdminPermission = {
        name: 'Super Admin - All Access',
        code: 'SUPER_ADMIN_ALL',
        description: 'Super admin has access to everything in the system',
        module: '*',
        action: '*',
        isActive: true,
        requiresAuth: true,
        allowedRoles: ['admin'],
        allowedUsers: [],
        deniedUsers: [],
        conditions: [],
        metadata: {
          type: 'super_admin',
          scope: 'system_wide',
          isWildcard: true
        },
        createdBy: 'system',
        updatedBy: 'system'
      };

      const result = await this.permissionService.createPermission(superAdminPermission);

      if (result.statusCode === 1000) {
        console.log('✅ Created Super Admin Permission: SUPER_ADMIN_ALL');
        console.log('🔑 This gives admin users access to ALL modules and actions');
      } else {
        console.log('❌ Failed to create Super Admin Permission:', result.errors);
      }

    } catch (error: any) {
      console.error('💥 Error creating Super Admin Permission:', error.message);
    }
  }

  /**
   * Main setup function
   */
  static async run(): Promise<void> {
    console.log('🎯 Starting Admin Permission Setup...\n');

    await this.setupAllAdminPermissions();
    console.log('');
    
    await this.createSuperAdminPermission();
    console.log('');

    console.log('🎉 Admin Permission Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Admin users now have full access to all modules');
    console.log('2. Test admin access with different endpoints');
    console.log('3. Create additional custom permissions as needed');
    console.log('4. Monitor permission usage in the admin interface');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  AdminPermissionSetup.run().catch(console.error);
}
