import {
    DatabaseAdapter,
    DatabaseConfig,
    Transaction,
} from '../types/database-adapter'
import {
    User,
    CreateUserData,
    UpdateUserData,
    UserQuery,
    UserFilters,
    UserSort,
    UserPagination,
    UserListResult,
} from '../../modules/user/entities/user.entity'
import { v4 as uuidv4 } from 'uuid'
import { ObjectId } from 'mongodb'

export class MongoDBAdapter implements DatabaseAdapter {
    private client: any
    private db: any
    private collection: any
    private config: DatabaseConfig

    constructor(config: DatabaseConfig) {
        this.config = config
    }
    // Note: The MongoDB connection logic is simplified for demonstration purposes. In a production environment, you would want to handle connection pooling, retries, and other edge cases more robustly.
    async connect(): Promise<void> {
        try {
            // to prevent connection refused errors on Render startup.
            // will change back to actual connection logic once we need to use our database for real operations.
            console.log('MongoDB connection bypassed.')
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error)
            throw error
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close()
        }
    }

    isConnected(): boolean {
        return (
            this.client &&
            this.client.topology &&
            this.client.topology.isConnected()
        )
    }

    async findUserById(id: string): Promise<User | null> {
        try {
            // Try to find by ObjectId first, then by string ID
            let user = null
            try {
                user = await this.collection.findOne({ _id: new ObjectId(id) })
            } catch (objectIdError) {
                // If ObjectId conversion fails, try with string ID
                user = await this.collection.findOne({ _id: id })
            }
            return user ? this.mapToUser(user) : null
        } catch (error) {
            console.error('Error finding user by ID:', error)
            throw error
        }
    }

    async findUserByEmail(email: string): Promise<User | null> {
        try {
            const user = await this.collection.findOne({
                email: email.toLowerCase(),
            })
            return user ? this.mapToUser(user) : null
        } catch (error) {
            console.error('Error finding user by email:', error)
            throw error
        }
    }

    async findUserByUsername(username: string): Promise<User | null> {
        try {
            const user = await this.collection.findOne({
                username: username.toLowerCase(),
            })
            return user ? this.mapToUser(user) : null
        } catch (error) {
            console.error('Error finding user by username:', error)
            throw error
        }
    }

    async findUserByMobile(mobile: string): Promise<User | null> {
        try {
            const user = await this.collection.findOne({ mobile })
            return user ? this.mapToUser(user) : null
        } catch (error) {
            console.error('Error finding user by mobile:', error)
            throw error
        }
    }

    async findUsers(
        query: UserQuery,
        filters?: UserFilters,
        sort?: UserSort,
        pagination?: UserPagination
    ): Promise<UserListResult> {
        try {
            const filter: any = {}

            // Apply query filters
            if (query.email)
                filter.email = { $regex: query.email, $options: 'i' }
            if (query.username)
                filter.username = { $regex: query.username, $options: 'i' }
            if (query.mobile) filter.mobile = query.mobile
            if (query.isActive !== undefined) filter.isActive = query.isActive
            if (query.isEmailVerified !== undefined)
                filter.isEmailVerified = query.isEmailVerified
            if (query.isMobileVerified !== undefined)
                filter.isMobileVerified = query.isMobileVerified

            // Apply additional filters
            if (filters?.search) {
                filter.$or = [
                    { email: { $regex: filters.search, $options: 'i' } },
                    { username: { $regex: filters.search, $options: 'i' } },
                    { firstName: { $regex: filters.search, $options: 'i' } },
                    { lastName: { $regex: filters.search, $options: 'i' } },
                ]
            }
            if (filters?.isActive !== undefined)
                filter.isActive = filters.isActive
            if (filters?.isEmailVerified !== undefined)
                filter.isEmailVerified = filters.isEmailVerified
            if (filters?.isMobileVerified !== undefined)
                filter.isMobileVerified = filters.isMobileVerified
            if (filters?.createdAfter)
                filter.createdAt = { $gte: filters.createdAfter }
            if (filters?.createdBefore)
                filter.createdAt = {
                    ...filter.createdAt,
                    $lte: filters.createdBefore,
                }
            if (filters?.lastLoginAfter)
                filter.lastLoginAt = { $gte: filters.lastLoginAfter }
            if (filters?.lastLoginBefore)
                filter.lastLoginAt = {
                    ...filter.lastLoginAt,
                    $lte: filters.lastLoginBefore,
                }

            // Build sort object
            const sortObj: any = {}
            if (sort) {
                sortObj[sort.field] = sort.direction === 'asc' ? 1 : -1
            } else {
                sortObj.createdAt = -1 // Default sort by creation date
            }

            // Apply pagination
            const page = pagination?.page || 1
            const limit = pagination?.limit || 10
            const skip = (page - 1) * limit

            const [users, total] = await Promise.all([
                this.collection
                    .find(filter)
                    .sort(sortObj)
                    .skip(skip)
                    .limit(limit)
                    .toArray(),
                this.collection.countDocuments(filter),
            ])

            return {
                users: users.map(this.mapToUser),
                pagination: {
                    page,
                    limit,
                    total,
                },
                filters: filters || {},
                sort: sort || { field: 'createdAt', direction: 'desc' },
            }
        } catch (error) {
            console.error('Error finding users:', error)
            throw error
        }
    }

    async createUser(userData: CreateUserData): Promise<User> {
        try {
            const user: User = {
                _id: uuidv4(),
                email: userData.email.toLowerCase(),
                password: userData.password,
                username: userData.username.toLowerCase(),
                mobile: userData.mobile,
                firstName: userData.firstName,
                lastName: userData.lastName,
                isEmailVerified: false,
                isMobileVerified: false,
                isActive: true,
                loginAttempts: 0,
                status: 1, // Active

                // Role Management (ID-based relations)
                roleIds: userData.roleIds || [],
                isAdmin: userData.isAdmin || false,
                lastRoleUpdate: undefined,

                createdAt: new Date(),
                updatedAt: new Date(),
            }

            const result = await this.collection.insertOne(
                this.mapToMongo(user)
            )
            return user
        } catch (error) {
            console.error('Error creating user:', error)
            throw error
        }
    }

    async updateUser(
        id: string,
        userData: UpdateUserData
    ): Promise<User | null> {
        try {
            const updateData: any = {
                ...userData,
                updatedAt: new Date(),
            }

            // Ensure email and username are lowercase
            if (updateData.email)
                updateData.email = updateData.email.toLowerCase()
            if (updateData.username)
                updateData.username = updateData.username.toLowerCase()

            const result = await this.collection.findOneAndUpdate(
                { _id: id },
                { $set: this.mapToMongo(updateData) },
                { returnDocument: 'after' }
            )

            return result.value ? this.mapToUser(result.value) : null
        } catch (error) {
            console.error('Error updating user:', error)
            throw error
        }
    }

    async deleteUser(id: string): Promise<boolean> {
        try {
            const result = await this.collection.deleteOne({ _id: id })
            return result.deletedCount > 0
        } catch (error) {
            console.error('Error deleting user:', error)
            throw error
        }
    }

    async updateLoginAttempts(id: string, attempts: number): Promise<void> {
        try {
            await this.collection.updateOne(
                { _id: id },
                { $set: { loginAttempts: attempts, updatedAt: new Date() } }
            )
        } catch (error) {
            console.error('Error updating login attempts:', error)
            throw error
        }
    }

    async updateLastLogin(id: string, lastLoginAt: Date): Promise<void> {
        try {
            await this.collection.updateOne(
                { _id: id },
                {
                    $set: {
                        lastLoginAt,
                        loginAttempts: 0,
                        updatedAt: new Date(),
                    },
                }
            )
        } catch (error) {
            console.error('Error updating last login:', error)
            throw error
        }
    }

    async lockUser(id: string, lockedUntil: Date): Promise<void> {
        try {
            await this.collection.updateOne(
                { _id: id },
                { $set: { lockedUntil, updatedAt: new Date() } }
            )
        } catch (error) {
            console.error('Error locking user:', error)
            throw error
        }
    }

    async unlockUser(id: string): Promise<void> {
        try {
            await this.collection.updateOne(
                { _id: id },
                { $unset: { lockedUntil: '' }, $set: { updatedAt: new Date() } }
            )
        } catch (error) {
            console.error('Error unlocking user:', error)
            throw error
        }
    }

    async createUsers(usersData: CreateUserData[]): Promise<User[]> {
        try {
            const users = usersData.map((userData) => ({
                _id: uuidv4(),
                email: userData.email.toLowerCase(),
                password: userData.password,
                username: userData.username.toLowerCase(),
                mobile: userData.mobile,
                firstName: userData.firstName,
                lastName: userData.lastName,
                isEmailVerified: false,
                isMobileVerified: false,
                isActive: true,
                loginAttempts: 0,
                status: 1, // Active

                // Role Management (ID-based relations)
                roleIds: userData.roleIds || [],
                isAdmin: userData.isAdmin || false,
                lastRoleUpdate: undefined,

                createdAt: new Date(),
                updatedAt: new Date(),
            }))

            const result = await this.collection.insertMany(
                users.map(this.mapToMongo)
            )
            return users
        } catch (error) {
            console.error('Error creating users:', error)
            throw error
        }
    }

    async updateUsers(
        ids: string[],
        userData: UpdateUserData
    ): Promise<User[]> {
        try {
            const updateData: any = {
                ...userData,
                updatedAt: new Date(),
            }

            if (updateData.email)
                updateData.email = updateData.email.toLowerCase()
            if (updateData.username)
                updateData.username = updateData.username.toLowerCase()

            const result = await this.collection.updateMany(
                { _id: { $in: ids } },
                { $set: this.mapToMongo(updateData) }
            )

            // Return updated users
            const users = await this.collection
                .find({ _id: { $in: ids } })
                .toArray()
            return users.map(this.mapToUser)
        } catch (error) {
            console.error('Error updating users:', error)
            throw error
        }
    }

    async deleteUsers(ids: string[]): Promise<boolean> {
        try {
            const result = await this.collection.deleteMany({
                _id: { $in: ids },
            })
            return result.deletedCount > 0
        } catch (error) {
            console.error('Error deleting users:', error)
            throw error
        }
    }

    async countUsers(
        query?: UserQuery,
        filters?: UserFilters
    ): Promise<number> {
        try {
            const filter: any = {}

            if (query?.email)
                filter.email = { $regex: query.email, $options: 'i' }
            if (query?.username)
                filter.username = { $regex: query.username, $options: 'i' }
            if (query?.mobile) filter.mobile = query.mobile
            if (query?.isActive !== undefined) filter.isActive = query.isActive
            if (query?.isEmailVerified !== undefined)
                filter.isEmailVerified = query.isEmailVerified
            if (query?.isMobileVerified !== undefined)
                filter.isMobileVerified = query.isMobileVerified

            if (filters?.search) {
                filter.$or = [
                    { email: { $regex: filters.search, $options: 'i' } },
                    { username: { $regex: filters.search, $options: 'i' } },
                    { firstName: { $regex: filters.search, $options: 'i' } },
                    { lastName: { $regex: filters.search, $options: 'i' } },
                ]
            }

            return await this.collection.countDocuments(filter)
        } catch (error) {
            console.error('Error counting users:', error)
            throw error
        }
    }

    async userExists(
        email?: string,
        username?: string,
        mobile?: string
    ): Promise<boolean> {
        try {
            const filter: any = {}
            if (email) filter.email = email.toLowerCase()
            if (username) filter.username = username.toLowerCase()
            if (mobile) filter.mobile = mobile

            if (Object.keys(filter).length === 0) return false

            const count = await this.collection.countDocuments(filter)
            return count > 0
        } catch (error) {
            console.error('Error checking if user exists:', error)
            throw error
        }
    }

    async beginTransaction(): Promise<Transaction> {
        const session = this.client.startSession()
        await session.startTransaction()

        return {
            id: uuidv4(),
            commit: async () => {
                await session.commitTransaction()
                await session.endSession()
            },
            rollback: async () => {
                await session.abortTransaction()
                await session.endSession()
            },
        }
    }

    async commitTransaction(transaction: Transaction): Promise<void> {
        await transaction.commit()
    }

    async rollbackTransaction(transaction: Transaction): Promise<void> {
        await transaction.rollback()
    }

    private mapToUser(mongoDoc: any): User {
        return {
            _id: mongoDoc._id,
            email: mongoDoc.email,
            password: mongoDoc.password,
            username: mongoDoc.username,
            mobile: mongoDoc.mobile,
            firstName: mongoDoc.firstName,
            lastName: mongoDoc.lastName,
            isEmailVerified: mongoDoc.isEmailVerified || false,
            isMobileVerified: mongoDoc.isMobileVerified || false,
            isActive: mongoDoc.isActive !== false,
            lastLoginAt: mongoDoc.lastLoginAt,
            loginAttempts: mongoDoc.loginAttempts || 0,
            lockedUntil: mongoDoc.lockedUntil,
            avatar: mongoDoc.avatar,
            timezone: mongoDoc.timezone,
            locale: mongoDoc.locale,
            preferences: mongoDoc.preferences,
            metadata: mongoDoc.metadata,
            status: mongoDoc.status || 1, // Default to active

            // Role Management (ID-based relations)
            roleIds: mongoDoc.roleIds || [],
            isAdmin: mongoDoc.isAdmin || false,
            lastRoleUpdate: mongoDoc.lastRoleUpdate,

            createdAt: mongoDoc.createdAt,
            updatedAt: mongoDoc.updatedAt,
        }
    }

    private mapToMongo(user: Partial<User>): any {
        const mongoDoc: any = { ...user }
        if (user._id) mongoDoc._id = user._id
        delete mongoDoc.id
        return mongoDoc
    }
}
