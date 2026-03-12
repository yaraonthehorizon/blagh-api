import { UserModel } from '../../modules/user/schemas/user.schema'
import { EmailConfigModel } from '../../modules/email/schemas/email-config.schema'
import { RoleModel } from '../../modules/user/schemas/role.schema'
import { PermissionModel } from '../../modules/permission/schemas/permission.schema'
import { DatabaseConfig } from '../config/interfaces'
import { logger } from '../logging'
import { DatabaseManager } from './connection'
import * as bcrypt from 'bcryptjs'

export interface SeedData {
    users?: any[]
    roles?: any[]
    permissions?: any[]
    emailconfigs?: any[]
    [key: string]: any[] | undefined
}

export interface SeederOptions {
    force?: boolean // Force reseed even if data exists
    truncate?: boolean // Truncate tables before seeding
    environment?: string // Environment-specific seeding
}

export class DatabaseSeeder {
    private dbManager: DatabaseManager
    private config: DatabaseConfig

    constructor(dbManager: DatabaseManager, config: DatabaseConfig) {
        this.dbManager = dbManager
        this.config = config
    }

    /**
     * Run database seeding
     */
    async seed(options: SeederOptions = {}): Promise<void> {
        try {
            logger.info('[DatabaseSeeder] Starting database seeding...')

            // Check if seeding is needed
            if (!options.force && (await this.hasData())) {
                logger.info(
                    '[DatabaseSeeder] Database already has data, skipping seeding'
                )
                return
            }

            // Truncate if requested
            if (options.truncate) {
                await this.truncate()
            }

            // Load seed data based on environment
            const seedData = await this.loadSeedData(options.environment)

            // Seed core data in proper order
            await this.seedRoles(seedData.roles || [])
            await this.seedPermissions(seedData.permissions || [])
            await this.seedUsers(seedData.users || [], options)
            await this.seedEmailconfigs(seedData.emailconfigs || [])

            // Link roles, permissions, and users
            await this.linkRolesAndPermissions()

            // Seed dynamic module data
            await this.seedDynamicModules(seedData)

            logger.info(
                '[DatabaseSeeder] Database seeding completed successfully'
            )
        } catch (error) {
            logger.error('[DatabaseSeeder] Failed to seed database:', error)
            throw error
        }
    }

    /**
     * Seed dynamic modules data
     */
    private async seedDynamicModules(seedData: SeedData): Promise<void> {
        const coreKeys = ['users', 'roles', 'permissions', 'emailconfigs']
        const dynamicKeys = Object.keys(seedData).filter(
            (key) => !coreKeys.includes(key)
        )

        for (const key of dynamicKeys) {
            const data = seedData[key]
            if (data && Array.isArray(data) && data.length > 0) {
                // Try to find corresponding seeder method
                const methodName = `seed${key.charAt(0).toUpperCase() + key.slice(1)}`
                if (typeof (this as any)[methodName] === 'function') {
                    await (this as any)[methodName](data)
                } else {
                    logger.warn(
                        `[DatabaseSeeder] No seeder method found for ${key}, skipping`
                    )
                }
            }
        }
    }

    /**
     * Check if database already has data
     */
    private async hasData(): Promise<boolean> {
        try {
            if (this.config.dialect === 'mongodb') {
                const userCount = await UserModel.countDocuments()
                const roleCount = await RoleModel.countDocuments()
                const permissionCount = await PermissionModel.countDocuments()
                return userCount > 0 || roleCount > 0 || permissionCount > 0
            } else {
                // For SQL databases, you'd check the users table
                // This is a placeholder for SQL implementation
                return false
            }
        } catch (error) {
            logger.error(
                '[DatabaseSeeder] Error checking if database has data:',
                error
            )
            return false
        }
    }

    /**
     * Truncate all tables
     */
    private async truncate(): Promise<void> {
        try {
            logger.info('[DatabaseSeeder] Truncating database...')

            if (this.config.dialect === 'mongodb') {
                // For MongoDB, we can drop collections or delete all documents
                await UserModel.deleteMany({})
                await EmailConfigModel.deleteMany({})
                await RoleModel.deleteMany({})
                await PermissionModel.deleteMany({})
                // Add other models as needed
            } else {
                // For SQL databases, you'd use TRUNCATE statements
                // This is a placeholder for SQL implementation
            }

            logger.info('[DatabaseSeeder] Database truncated successfully')
        } catch (error) {
            logger.error('[DatabaseSeeder] Error truncating database:', error)
            throw error
        }
    }

    /**
     * Load seed data based on environment
     */
    private async loadSeedData(environment?: string): Promise<SeedData> {
        const env = environment || process.env.NODE_ENV || 'development'

        // Default seed data
        const defaultData: SeedData = {
            users: [
                {
                    email: 'admin@domain.com',
                    username: 'superadmin',
                    password: 'Diagramers#1',
                    firstName: 'Super',
                    lastName: 'Admin',
                    isEmailVerified: true,
                    isActive: true,
                    isAdmin: true,
                    status: 1,
                },
            ],
            roles: [
                {
                    name: 'Super Admin',
                    code: 'SUPER_ADMIN',
                    description: 'Super administrator with full system access',
                    isActive: true,
                    isSystem: true,
                    createdBy: 'system',
                    updatedBy: 'system',
                },
                {
                    name: 'Admin',
                    code: 'ADMIN',
                    description: 'Administrator with elevated privileges',
                    isActive: true,
                    isSystem: false,
                    createdBy: 'system',
                    updatedBy: 'system',
                },
                {
                    name: 'Identity Manager',
                    code: 'IDENTITY_MANAGER',
                    description:
                        'Identity manager with permissions management access',
                    isActive: true,
                    isSystem: false,
                    createdBy: 'system',
                    updatedBy: 'system',
                },
                {
                    name: 'User',
                    code: 'USER',
                    description: 'Regular user with basic access',
                    isActive: true,
                    isSystem: false,
                    createdBy: 'system',
                    updatedBy: 'system',
                },
            ],
            permissions: [
                // Super Admin - Full Access
                {
                    name: 'Super Admin - All Access',
                    code: 'SUPER_ADMIN_ALL',
                    description:
                        'Super admin has access to everything in the system',
                    module: '*',
                    action: '*',
                    isActive: true,
                    requiresAuth: true,
                    allowedRoleIds: [], // Will be set after roles are created
                    allowedUserIds: [], // Will be set after users are created
                    deniedUserIds: [],
                    conditions: [],
                    metadata: {
                        type: 'super_admin',
                        scope: 'system_wide',
                        isWildcard: true,
                    },
                    createdBy: 'system',
                    updatedBy: 'system',
                },
                // Admin - Module Management
                {
                    name: 'Admin - Module Management',
                    code: 'ADMIN_MODULE_MANAGEMENT',
                    description:
                        'Admin can manage modules and basic system functions',
                    module: 'SYSTEM',
                    action: 'MANAGE',
                    isActive: true,
                    requiresAuth: true,
                    allowedRoleIds: [], // Will be set after roles are created
                    allowedUserIds: [],
                    deniedUserIds: [],
                    conditions: [],
                    metadata: {
                        type: 'admin',
                        scope: 'system_management',
                    },
                    createdBy: 'system',
                    updatedBy: 'system',
                },
                // User - Basic Operations
                {
                    name: 'User - Basic Operations',
                    code: 'USER_BASIC',
                    description: 'Basic user operations like read own data',
                    module: 'USER',
                    action: 'READ_OWN',
                    isActive: true,
                    requiresAuth: true,
                    allowedRoleIds: [], // Will be set after roles are created
                    allowedUserIds: [],
                    deniedUserIds: [],
                    conditions: [],
                    metadata: {
                        type: 'user',
                        scope: 'basic_access',
                    },
                    createdBy: 'system',
                    updatedBy: 'system',
                },
                // Permissions Manager - Full Access
                {
                    name: 'Permissions Manager - Full Access',
                    code: 'PERMISSIONS_MANAGER_ALL',
                    description:
                        'Full access to permissions manager for super admins',
                    module: 'PERMISSIONS_MANAGER',
                    action: '*',
                    isActive: true,
                    requiresAuth: true,
                    allowedRoleIds: [], // Will be set after roles are created
                    allowedUserIds: [],
                    deniedUserIds: [],
                    conditions: [],
                    metadata: {
                        type: 'permissions_manager',
                        scope: 'full_access',
                    },
                    createdBy: 'system',
                    updatedBy: 'system',
                },
                {
                    name: 'Admin Panel - Access',
                    code: 'ADMIN_PANEL_ACCESS',
                    description: 'Access to the admin panel interface',
                    module: 'ADMIN_PANEL',
                    action: 'ACCESS',
                    isActive: true,
                    requiresAuth: true,
                    allowedRoleIds: [], // Will be set after roles are created
                    allowedUserIds: [],
                    deniedUserIds: [],
                    conditions: [],
                    metadata: {
                        type: 'system',
                        scope: 'admin_panel',
                    },
                    createdBy: 'system',
                    updatedBy: 'system',
                },
                {
                    name: 'Admin Panel - Full Access',
                    code: 'ADMIN_PANEL_FULL_ACCESS',
                    description: 'Full access to all admin panel features',
                    module: 'ADMIN_PANEL',
                    action: '*',
                    isActive: true,
                    requiresAuth: true,
                    allowedRoleIds: [], // Will be set after roles are created
                    allowedUserIds: [],
                    deniedUserIds: [],
                    conditions: [],
                    metadata: {
                        type: 'system',
                        scope: 'admin_panel_full',
                    },
                    createdBy: 'system',
                    updatedBy: 'system',
                },
            ],
            emailconfigs: [
                {
                    userId: 'system',
                    provider: 'smtp',
                    credentials: {
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        auth: {
                            user: 'your-email@gmail.com',
                            pass: 'your-app-password',
                        },
                    },
                    code: 'welcome',
                    fromName: 'System Admin',
                    fromEmail: 'noreply@example.com',
                    default: true,
                },
            ],
        }

        // Environment-specific data
        if (env === 'development') {
            return defaultData
        } else if (env === 'production') {
            // Production data might be different
            return defaultData
        } else {
            return defaultData
        }
    }

    /**
     * Seed users
     */
    private async seedUsers(
        users: any[],
        options: SeederOptions = {}
    ): Promise<void> {
        if (users.length === 0) return

        logger.info(`[DatabaseSeeder] Seeding ${users.length} users...`)

        for (const userData of users) {
            try {
                const existing = await UserModel.findOne({
                    email: userData.email,
                })
                if (!existing) {
                    // Hash password if provided
                    if (userData.password) {
                        userData.password = await bcrypt.hash(
                            userData.password,
                            10
                        )
                    }

                    const user = new UserModel({
                        ...userData,
                        status: 1,
                    })
                    await user.save()
                    logger.info(
                        `[DatabaseSeeder] Created user: ${userData.email}`
                    )
                } else {
                    logger.info(
                        `[DatabaseSeeder] User ${userData.email} already exists, skipping`
                    )
                }
            } catch (error) {
                logger.error(
                    `[DatabaseSeeder] Failed to create user ${userData.email}:`,
                    error
                )
            }
        }
    }

    /**
     * Seed roles
     */
    private async seedRoles(roles: any[]): Promise<void> {
        if (roles.length === 0) return

        logger.info(`[DatabaseSeeder] Seeding ${roles.length} roles...`)

        for (const role of roles) {
            try {
                const existing = await RoleModel.findOne({ code: role.code })
                if (!existing) {
                    const newRole = new RoleModel(role)
                    await newRole.save()
                    logger.info(
                        `[DatabaseSeeder] Created role: ${role.name} (${role.code})`
                    )
                } else {
                    logger.info(
                        `[DatabaseSeeder] Role ${role.name} (${role.code}) already exists, skipping`
                    )
                }
            } catch (error) {
                logger.error(
                    `[DatabaseSeeder] Failed to create role ${role.name}:`,
                    error
                )
            }
        }
    }

    /**
     * Seed permissions
     */
    private async seedPermissions(permissions: any[]): Promise<void> {
        if (permissions.length === 0) return

        logger.info(
            `[DatabaseSeeder] Seeding ${permissions.length} permissions...`
        )

        for (const permission of permissions) {
            try {
                const existing = await PermissionModel.findOne({
                    code: permission.code,
                })
                if (!existing) {
                    const newPermission = new PermissionModel(permission)
                    await newPermission.save()
                    logger.info(
                        `[DatabaseSeeder] Created permission: ${permission.name} (${permission.code})`
                    )
                } else {
                    logger.info(
                        `[DatabaseSeeder] Permission ${permission.name} (${permission.code}) already exists, skipping`
                    )
                }
            } catch (error) {
                logger.error(
                    `[DatabaseSeeder] Failed to create permission ${permission.name}:`,
                    error
                )
            }
        }
    }

    /**
     * Link roles, permissions, and users
     */
    private async linkRolesAndPermissions(): Promise<void> {
        try {
            logger.info(
                '[DatabaseSeeder] Linking roles, permissions, and users...'
            )

            // Get the super admin role and permission
            const superAdminRole = await RoleModel.findOne({
                code: 'SUPER_ADMIN',
            })
            const superAdminPermission = await PermissionModel.findOne({
                code: 'SUPER_ADMIN_ALL',
            })
            const superAdminUser = await UserModel.findOne({
                email: 'admin@domain.com',
            })

            if (superAdminRole && superAdminPermission && superAdminUser) {
                // Link super admin permission to super admin role
                await PermissionModel.findByIdAndUpdate(
                    superAdminPermission._id,
                    {
                        $addToSet: { allowedRoleIds: superAdminRole._id },
                    }
                )

                // Link super admin role to super admin user (FIXED: Use roleIds array)
                await UserModel.findByIdAndUpdate(superAdminUser._id, {
                    $set: {
                        roleIds: [superAdminRole._id], // Set the roleIds array properly
                        isAdmin: true, // Ensure admin flag is set
                    },
                })

                // Link super admin permission to super admin user directly
                await PermissionModel.findByIdAndUpdate(
                    superAdminPermission._id,
                    {
                        $addToSet: { allowedUserIds: superAdminUser._id },
                    }
                )

                logger.info(
                    '[DatabaseSeeder] Successfully linked super admin role, permission, and user'
                )
                logger.info(
                    `[DatabaseSeeder] User ${superAdminUser.email} now has roleIds: [${superAdminUser.roleIds}]`
                )
            } else {
                logger.warn(
                    '[DatabaseSeeder] Could not find all required entities for linking'
                )
                if (!superAdminRole)
                    logger.warn('[DatabaseSeeder] SUPER_ADMIN role not found')
                if (!superAdminPermission)
                    logger.warn(
                        '[DatabaseSeeder] SUPER_ADMIN_ALL permission not found'
                    )
                if (!superAdminUser)
                    logger.warn(
                        '[DatabaseSeeder] admin@domain.com user not found'
                    )
            }

            // Link other roles and permissions as needed
            const adminRole = await RoleModel.findOne({ code: 'ADMIN' })
            const adminPermission = await PermissionModel.findOne({
                code: 'ADMIN_MODULE_MANAGEMENT',
            })

            if (adminRole && adminPermission) {
                await PermissionModel.findByIdAndUpdate(adminPermission._id, {
                    $addToSet: { allowedRoleIds: adminRole._id },
                })
                logger.info(
                    '[DatabaseSeeder] Successfully linked admin role and permission'
                )
            }

            const userRole = await RoleModel.findOne({ code: 'USER' })
            const userPermission = await PermissionModel.findOne({
                code: 'USER_BASIC',
            })

            if (userRole && userPermission) {
                await PermissionModel.findByIdAndUpdate(userPermission._id, {
                    $addToSet: { allowedRoleIds: userRole._id },
                })
                logger.info(
                    '[DatabaseSeeder] Successfully linked user role and permission'
                )
            }

            // Link permissions manager permission to super admin and identity manager roles
            const permissionsManagerPermission = await PermissionModel.findOne({
                code: 'PERMISSIONS_MANAGER_ALL',
            })
            const identityManagerRole = await RoleModel.findOne({
                code: 'IDENTITY_MANAGER',
            })

            if (superAdminRole && permissionsManagerPermission) {
                await PermissionModel.findByIdAndUpdate(
                    permissionsManagerPermission._id,
                    {
                        $addToSet: { allowedRoleIds: superAdminRole._id },
                    }
                )
                logger.info(
                    '[DatabaseSeeder] Successfully linked permissions manager permission to super admin role'
                )
            }

            if (identityManagerRole && permissionsManagerPermission) {
                await PermissionModel.findByIdAndUpdate(
                    permissionsManagerPermission._id,
                    {
                        $addToSet: { allowedRoleIds: identityManagerRole._id },
                    }
                )
                logger.info(
                    '[DatabaseSeeder] Successfully linked permissions manager permission to identity manager role'
                )
            }

            // Link admin panel access permission to super admin, identity manager, and admin roles
            const adminPanelAccessPermission = await PermissionModel.findOne({
                code: 'ADMIN_PANEL_ACCESS',
            })
            if (superAdminRole && adminPanelAccessPermission) {
                await PermissionModel.findByIdAndUpdate(
                    adminPanelAccessPermission._id,
                    {
                        $addToSet: { allowedRoleIds: superAdminRole._id },
                    }
                )
                logger.info(
                    '[DatabaseSeeder] Successfully linked admin panel access permission to super admin role'
                )
            }
            if (identityManagerRole && adminPanelAccessPermission) {
                await PermissionModel.findByIdAndUpdate(
                    adminPanelAccessPermission._id,
                    {
                        $addToSet: { allowedRoleIds: identityManagerRole._id },
                    }
                )
                logger.info(
                    '[DatabaseSeeder] Successfully linked admin panel access permission to identity manager role'
                )
            }
            if (adminRole && adminPanelAccessPermission) {
                await PermissionModel.findByIdAndUpdate(
                    adminPanelAccessPermission._id,
                    {
                        $addToSet: { allowedRoleIds: adminRole._id },
                    }
                )
                logger.info(
                    '[DatabaseSeeder] Successfully linked admin panel access permission to admin role'
                )
            }

            // Link admin panel full access permission to super admin and identity manager roles
            const adminPanelFullAccessPermission =
                await PermissionModel.findOne({
                    code: 'ADMIN_PANEL_FULL_ACCESS',
                })
            if (superAdminRole && adminPanelFullAccessPermission) {
                await PermissionModel.findByIdAndUpdate(
                    adminPanelFullAccessPermission._id,
                    {
                        $addToSet: { allowedRoleIds: superAdminRole._id },
                    }
                )
                logger.info(
                    '[DatabaseSeeder] Successfully linked admin panel full access permission to super admin role'
                )
            }
            if (identityManagerRole && adminPanelFullAccessPermission) {
                await PermissionModel.findByIdAndUpdate(
                    adminPanelFullAccessPermission._id,
                    {
                        $addToSet: { allowedRoleIds: identityManagerRole._id },
                    }
                )
                logger.info(
                    '[DatabaseSeeder] Successfully linked admin panel full access permission to identity manager role'
                )
            }

            // Verify the linking was successful
            await this.verifyLinking()
        } catch (error) {
            logger.error(
                '[DatabaseSeeder] Failed to link roles and permissions:',
                error
            )
            throw error
        }
    }

    /**
     * Verify that roles and permissions were linked correctly
     */
    private async verifyLinking(): Promise<void> {
        try {
            logger.info(
                '[DatabaseSeeder] Verifying role and permission linking...'
            )

            // Check super admin user
            const superAdminUser = await UserModel.findOne({
                email: 'admin@domain.com',
            })
            if (superAdminUser) {
                logger.info(
                    `[DatabaseSeeder] ✅ Super admin user found: ${superAdminUser.email}`
                )
                logger.info(
                    `[DatabaseSeeder] ✅ User roleIds: ${superAdminUser.roleIds?.join(', ') || 'None'}`
                )
                logger.info(
                    `[DatabaseSeeder] ✅ User isAdmin: ${superAdminUser.isAdmin}`
                )

                // Check if user has SUPER_ADMIN role
                if (
                    superAdminUser.roleIds &&
                    superAdminUser.roleIds.length > 0
                ) {
                    const superAdminRole = await RoleModel.findById(
                        superAdminUser.roleIds[0]
                    )
                    if (
                        superAdminRole &&
                        superAdminRole.code === 'SUPER_ADMIN'
                    ) {
                        logger.info(
                            `[DatabaseSeeder] ✅ User has SUPER_ADMIN role: ${superAdminRole.name}`
                        )
                    } else {
                        logger.warn(
                            `[DatabaseSeeder] ⚠️ User role is not SUPER_ADMIN: ${superAdminRole?.code || 'Unknown'}`
                        )
                    }
                } else {
                    logger.warn(
                        '[DatabaseSeeder] ⚠️ User has no roleIds assigned'
                    )
                }
            } else {
                logger.warn('[DatabaseSeeder] ⚠️ Super admin user not found')
            }

            // Check permissions
            const superAdminPermission = await PermissionModel.findOne({
                code: 'SUPER_ADMIN_ALL',
            })
            if (superAdminPermission) {
                logger.info(
                    `[DatabaseSeeder] ✅ Super admin permission found: ${superAdminPermission.name}`
                )
                logger.info(
                    `[DatabaseSeeder] ✅ Permission allowedRoleIds: ${superAdminPermission.allowedRoleIds?.join(', ') || 'None'}`
                )
                logger.info(
                    `[DatabaseSeeder] ✅ Permission allowedUserIds: ${superAdminPermission.allowedUserIds?.join(', ') || 'None'}`
                )
            } else {
                logger.warn(
                    '[DatabaseSeeder] ⚠️ Super admin permission not found'
                )
            }

            logger.info(
                '[DatabaseSeeder] Role and permission linking verification completed'
            )
        } catch (error) {
            logger.error('[DatabaseSeeder] Error during verification:', error)
        }
    }

    /**
     * Seed email configurations
     */
    private async seedEmailconfigs(emailconfigs: any[]): Promise<void> {
        if (emailconfigs.length === 0) return

        logger.info(
            `[DatabaseSeeder] Seeding ${emailconfigs.length} email configs...`
        )

        for (const config of emailconfigs) {
            try {
                const exists = await EmailConfigModel.findOne({
                    code: config.code,
                })
                if (!exists) {
                    await EmailConfigModel.create(config)
                    logger.info(
                        `[DatabaseSeeder] Created email config: ${config.code}`
                    )
                } else {
                    logger.info(
                        `[DatabaseSeeder] Email config ${config.code} already exists, skipping`
                    )
                }
            } catch (error) {
                logger.error(
                    `[DatabaseSeeder] Failed to create email config ${config.code}:`,
                    error
                )
                throw error // Re-throw to stop the seeding process
            }
        }
    }

    /**
     * Reset database (truncate and reseed)
     */
    async reset(): Promise<void> {
        try {
            logger.info('[DatabaseSeeder] Resetting database...')
            await this.truncate()
            await this.seed({ force: true })
            logger.info('[DatabaseSeeder] Database reset completed')
        } catch (error) {
            logger.error('[DatabaseSeeder] Failed to reset database:', error)
            throw error
        }
    }
}
