export interface BaseEntity {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface User extends BaseEntity {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  metadata?: Record<string, any>;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  error?: string;
  provider?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: string[];
  timestamp: Date;
  requestId?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface AuditLog extends BaseEntity {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface Notification extends BaseEntity {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in-app';
  title: string;
  message: string;
  data?: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sentAt?: Date;
  deliveredAt?: Date;
  error?: string;
}

export interface Session extends BaseEntity {
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  isActive: boolean;
  ipAddress?: string;
  userAgent?: string;
  lastActivityAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role extends BaseEntity {
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
}

export interface UserRole extends BaseEntity {
  userId: string;
  roleId: string;
  grantedAt: Date;
  grantedBy?: string;
}

export interface FileUpload extends BaseEntity {
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface Webhook extends BaseEntity {
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  lastTriggeredAt?: Date;
  lastError?: string;
}

export interface ApiKey extends BaseEntity {
  userId: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

export interface RateLimit {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface CacheOptions {
  ttl: number;
  key?: string;
  tags?: string[];
}

export interface DatabaseQuery {
  where?: Record<string, any>;
  order?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
  include?: string[];
  attributes?: string[];
}

export interface SearchOptions {
  query: string;
  fields: string[];
  filters?: Record<string, any>;
  sort?: Record<string, 'asc' | 'desc'>;
  pagination?: PaginationOptions;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  fields?: string[];
  filters?: Record<string, any>;
  filename?: string;
}

export interface ImportOptions {
  format: 'csv' | 'json' | 'xlsx';
  mapping?: Record<string, string>;
  validation?: Record<string, any>;
  onError?: 'skip' | 'stop' | 'log';
}

export interface Job extends BaseEntity {
  name: string;
  data: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  attempts: number;
  maxAttempts: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
}

export interface CronJob extends BaseEntity {
  name: string;
  schedule: string;
  command: string;
  isActive: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastError?: string;
  metadata?: Record<string, any>;
} 