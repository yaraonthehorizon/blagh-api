export enum ResponseCode {
    Ok = 1000,
    Duplicate = 1001,
    NotExist = 1002,
    Exist = 1003,
    Error = 0,
    Authorized = 1010,
    Unauthorized = 1011,
    NotRelated = 1004,
    NeedVerification = 1005,
    Incompelete = 1006,
    MissingRequiredFields = 1007
}

export enum AuditMessageType {
    info = 1,
    warn = 2,
    error = 3,
    exception = 4,
    unknown = 10,
    trace = 11,
    socket = 12
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
  Pending = 'pending'
}

export enum AuthProvider {
  Internal = 'internal',
  Firebase = 'firebase',
  Google = 'google',
  GitHub = 'github',
  Facebook = 'facebook',
  SMS = 'sms',
  Email = 'email'
}

export enum NotificationType {
  Email = 'email',
  SMS = 'sms',
  Push = 'push',
  InApp = 'in-app'
}

export enum NotificationStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
  Delivered = 'delivered'
}

export enum JobStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed'
}

export enum FileType {
  Image = 'image',
  Document = 'document',
  Video = 'video',
  Audio = 'audio',
  Archive = 'archive',
  Other = 'other'
}

export enum PermissionAction {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Execute = 'execute'
}

export enum DatabaseDialect {
  MySQL = 'mysql',
  PostgreSQL = 'postgres',
  SQLite = 'sqlite',
  MariaDB = 'mariadb'
}

export enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug'
}

export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  UAT = 'uat'
}

export enum CacheStrategy {
  Memory = 'memory',
  Redis = 'redis',
  Database = 'database'
}

export enum RateLimitStrategy {
  Memory = 'memory',
  Redis = 'redis',
  Database = 'database'
}

export enum ValidationRule {
  Required = 'required',
  Email = 'email',
  MinLength = 'minLength',
  MaxLength = 'maxLength',
  Pattern = 'pattern',
  Custom = 'custom'
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc'
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
  PDF = 'pdf'
}

export enum ImportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx'
}

export enum WebhookEvent {
  UserCreated = 'user.created',
  UserUpdated = 'user.updated',
  UserDeleted = 'user.deleted',
  AuthLogin = 'auth.login',
  AuthLogout = 'auth.logout',
  NotificationSent = 'notification.sent',
  FileUploaded = 'file.uploaded',
  JobCompleted = 'job.completed',
  JobFailed = 'job.failed'
}

export enum PluginStatus {
  Enabled = 'enabled',
  Disabled = 'disabled',
  Error = 'error'
}

export enum HealthStatus {
  Healthy = 'healthy',
  Unhealthy = 'unhealthy',
  Degraded = 'degraded'
}

// HTTP Status Messages
export const HTTP_STATUS_MESSAGES = {
  [ResponseCode.Ok]: 'OK',
  [ResponseCode.Duplicate]: 'Duplicate',
  [ResponseCode.NotExist]: 'Not Found',
  [ResponseCode.Exist]: 'Exists',
  [ResponseCode.Error]: 'Error',
  [ResponseCode.Authorized]: 'Authorized',
  [ResponseCode.Unauthorized]: 'Unauthorized',
  [ResponseCode.NotRelated]: 'Not Related',
  [ResponseCode.NeedVerification]: 'Need Verification',
  [ResponseCode.Incompelete]: 'Incomplete',
  [ResponseCode.MissingRequiredFields]: 'Missing Required Fields'
} as const;

// Default Values
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 10,
  maxLimit: 100
} as const;

export const DEFAULT_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
} as const;

export const DEFAULT_CACHE_TTL = {
  short: 300, // 5 minutes
  medium: 3600, // 1 hour
  long: 86400, // 1 day
  veryLong: 604800 // 1 week
} as const;

export const DEFAULT_JWT_EXPIRY = {
  access: '1h',
  refresh: '7d'
} as const;

export const DEFAULT_PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
} as const;

// File Upload Limits
export const FILE_UPLOAD_LIMITS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/*', 'application/pdf', 'text/*'],
  maxFiles: 10
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  url: /^https?:\/\/.+/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource conflict',
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  WEAK_PASSWORD: 'Password does not meet requirements',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  PLUGIN_NOT_FOUND: 'Plugin not found',
  PLUGIN_LOAD_ERROR: 'Failed to load plugin',
  CONFIGURATION_ERROR: 'Configuration error'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  EMAIL_SENT: 'Email sent successfully',
  SMS_SENT: 'SMS sent successfully',
  FILE_UPLOADED: 'File uploaded successfully',
  PLUGIN_LOADED: 'Plugin loaded successfully',
  PLUGIN_ENABLED: 'Plugin enabled successfully',
  PLUGIN_DISABLED: 'Plugin disabled successfully'
} as const; 