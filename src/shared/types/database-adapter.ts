import { User, CreateUserData, UpdateUserData, UserQuery, UserFilters, UserSort, UserPagination, UserListResult } from '../../modules/user/entities/user.entity';

export interface DatabaseAdapter {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // User operations
  findUserById(id: string): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByUsername(username: string): Promise<User | null>;
  findUserByMobile(mobile: string): Promise<User | null>;
  findUsers(query: UserQuery, filters?: UserFilters, sort?: UserSort, pagination?: UserPagination): Promise<UserListResult>;
  
  createUser(userData: CreateUserData): Promise<User>;
  updateUser(id: string, userData: UpdateUserData): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  
  // Authentication specific operations
  updateLoginAttempts(id: string, attempts: number): Promise<void>;
  updateLastLogin(id: string, lastLoginAt: Date): Promise<void>;
  lockUser(id: string, lockedUntil: Date): Promise<void>;
  unlockUser(id: string): Promise<void>;
  
  // Batch operations
  createUsers(usersData: CreateUserData[]): Promise<User[]>;
  updateUsers(ids: string[], userData: UpdateUserData): Promise<User[]>;
  deleteUsers(ids: string[]): Promise<boolean>;
  
  // Utility operations
  countUsers(query?: UserQuery, filters?: UserFilters): Promise<number>;
  userExists(email?: string, username?: string, mobile?: string): Promise<boolean>;
  
  // Transaction support
  beginTransaction(): Promise<Transaction>;
  commitTransaction(transaction: Transaction): Promise<void>;
  rollbackTransaction(transaction: Transaction): Promise<void>;
}

export interface Transaction {
  id: string;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface DatabaseConfig {
  type: 'mongodb' | 'postgresql' | 'mysql' | 'sqlite' | 'redis';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
  options?: Record<string, any>;
}

export interface DatabaseFactory {
  createAdapter(config: DatabaseConfig): DatabaseAdapter;
}

// MongoDB specific adapter
export interface MongoDBAdapter extends DatabaseAdapter {
  collection: any; // MongoDB collection
}

// PostgreSQL/MySQL specific adapter
export interface SQLAdapter extends DatabaseAdapter {
  table: string;
  query(sql: string, params?: any[]): Promise<any>;
}

// Redis specific adapter
export interface RedisAdapter extends DatabaseAdapter {
  client: any; // Redis client
  keyPrefix: string;
} 