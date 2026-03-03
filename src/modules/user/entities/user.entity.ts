import { BaseEntity } from '../../../shared/types/base-entity';

export interface User extends BaseEntity {
  _id?: string;
  email: string;
  password: string;
  username: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  avatar?: string;
  timezone?: string;
  locale?: string;
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
  status: number; // Required by BaseEntity (1: active, 0: deleted, -1: suspended)
  
  // Role Management (ID-based relations)
  roleIds: string[]; // Array of Role ObjectIds
  isAdmin: boolean; // Quick admin check flag (for backward compatibility)
  lastRoleUpdate?: Date; // Track when roles were last updated
}

export interface CreateUserData {
  email: string;
  password: string;
  username: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  roleIds?: string[]; // Optional role IDs during creation
  isAdmin?: boolean; // Optional admin flag
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  mobile?: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  isActive?: boolean;
  avatar?: string;
  timezone?: string;
  locale?: string;
  preferences?: Record<string, any>;
  metadata?: Record<string, any>;
  password?: string; // Allow password update
  
  // Role Management
  roleIds?: string[];
  isAdmin?: boolean;
}

export interface UserQuery {
  email?: string;
  username?: string;
  mobile?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
}

export interface UserFilters {
  search?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastLoginAfter?: Date;
  lastLoginBefore?: Date;
}

export interface UserSort {
  field: keyof User;
  direction: 'asc' | 'desc';
}

export interface UserPagination {
  page: number;
  limit: number;
  total?: number;
}

export interface UserListResult {
  users: User[];
  pagination: UserPagination;
  filters: UserFilters;
  sort: UserSort;
} 