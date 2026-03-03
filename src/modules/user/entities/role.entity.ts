import { BaseEntity } from '../../../shared/types/base-entity';

export interface Role extends BaseEntity {
  _id?: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  isSystem: boolean; // System roles can't be deleted
  
  // ID-based relations
  permissionIds: string[]; // Array of Permission ObjectIds (stored as strings)
  parentRoleId?: string; // For role inheritance (optional, stored as string)
  
  // Metadata
  metadata?: {
    type?: string;
    scope?: string;
    category?: string;
    priority?: number;
    color?: string;
  };
  
  // Audit fields
  createdBy: string; // User ObjectId (stored as string)
  updatedBy: string; // User ObjectId (stored as string)
  lastUsedAt?: Date;
  usageCount: number;
}

export interface CreateRoleData {
  name: string;
  code: string;
  description: string;
  isActive?: boolean;
  isSystem?: boolean;
  permissionIds?: string[];
  parentRoleId?: string;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy: string;
}

export interface UpdateRoleData {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: string[];
  parentRoleId?: string;
  metadata?: Record<string, any>;
  updatedBy: string;
}

export interface RoleQuery {
  code?: string;
  isActive?: boolean;
  isSystem?: boolean;
  permissionIds?: string[];
}

export interface RoleFilters {
  search?: string;
  isActive?: boolean;
  isSystem?: boolean;
  category?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface RoleSort {
  field: keyof Role;
  direction: 'asc' | 'desc';
}

export interface RolePagination {
  page: number;
  limit: number;
  total?: number;
}

export interface RoleListResult {
  roles: Role[];
  pagination: RolePagination;
  filters: RoleFilters;
  sort: RoleSort;
}
