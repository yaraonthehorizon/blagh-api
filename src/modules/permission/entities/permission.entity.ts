import { BaseEntity } from '../../../shared/types/base-entity';

export interface IPermission extends BaseEntity {
  _id?: string;
  name: string;
  code: string;
  description: string;
  module: string;
  action: string;
  isActive: boolean;
  requiresAuth: boolean;
  
  // ID-based relations instead of string arrays
  allowedRoleIds: string[]; // Array of Role ObjectIds
  allowedUserIds: string[]; // Array of User ObjectIds (for specific user grants)
  deniedUserIds: string[]; // Array of User ObjectIds (for specific user denials)
  
  // Flexible conditions for complex rules
  conditions: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'exists' | 'regex';
    value: any;
    resourceField?: string; // For resource-based permissions
  }>;
  
  // Metadata for admin interface
  metadata?: {
    type?: string;
    scope?: string;
    isWildcard?: boolean;
    category?: string;
    priority?: number;
  };
  
  // Audit fields
  createdBy: string; // User ObjectId
  updatedBy: string; // User ObjectId
  lastUsedAt?: Date;
  usageCount: number;
}

export interface CreatePermissionData {
  name: string;
  code: string;
  description: string;
  module: string;
  action: string;
  isActive?: boolean;
  requiresAuth?: boolean;
  allowedRoleIds?: string[];
  allowedUserIds?: string[];
  deniedUserIds?: string[];
  conditions?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'exists' | 'regex';
    value: any;
    resourceField?: string;
  }>;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy: string;
}

export interface UpdatePermissionData {
  name?: string;
  code?: string;
  description?: string;
  module?: string;
  action?: string;
  isActive?: boolean;
  requiresAuth?: boolean;
  allowedRoleIds?: string[];
  allowedUserIds?: string[];
  deniedUserIds?: string[];
  conditions?: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'exists' | 'regex';
    value: any;
    resourceField?: string;
  }>;
  metadata?: Record<string, any>;
  updatedBy: string;
}

export interface PermissionQuery {
  module?: string;
  action?: string;
  isActive?: boolean;
  allowedRoleIds?: string[];
  allowedUserIds?: string[];
}

export interface PermissionFilters {
  search?: string;
  module?: string;
  action?: string;
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  category?: string;
}

export interface PermissionSort {
  field: keyof IPermission;
  direction: 'asc' | 'desc';
}

export interface PermissionPagination {
  page: number;
  limit: number;
  total?: number;
}

export interface PermissionListResult {
  permissions: IPermission[];
  pagination: PermissionPagination;
  filters: PermissionFilters;
  sort: PermissionSort;
}
