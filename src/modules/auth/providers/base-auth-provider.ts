import { User } from '../../../shared/types/common';
import { AuthProvider } from '../../../shared/constants/enums';

export interface AuthProviderConfig {
  enabled: boolean;
  [key: string]: any;
}

export interface AuthCredentials {
  email?: string;
  password?: string;
  token?: string;
  code?: string;
  phone?: string;
  [key: string]: any;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
  provider: string;
}

export interface AuthProviderHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface AuthProviderMetrics {
  isActive: boolean;
  totalAuthentications: number;
  successfulAuthentications: number;
  failedAuthentications: number;
  averageResponseTime: number;
  lastAuthentication?: Date;
}

export abstract class BaseAuthProvider {
  protected name: string;
  protected config: any;
  protected isInitialized: boolean = false;

  constructor(name: string, config: any) {
    this.name = name;
    this.config = config;
  }

  /**
   * Initialize the auth provider
   */
  abstract initialize(): Promise<void>;

  /**
   * Authenticate user credentials
   */
  abstract authenticate(credentials: AuthCredentials): Promise<AuthResult>;

  /**
   * Validate a token
   */
  abstract validateToken(token: string): Promise<any>;

  /**
   * Refresh a token
   */
  abstract refreshToken(refreshToken: string): Promise<AuthResult>;

  /**
   * Register a new user
   */
  abstract register(userData: any): Promise<any>;

  /**
   * Cleanup resources
   */
  abstract cleanup(): Promise<void>;

  /**
   * Get provider health status
   */
  abstract getHealth(): Promise<AuthProviderHealth>;

  /**
   * Get provider metrics
   */
  abstract getMetrics(): Promise<AuthProviderMetrics>;

  /**
   * Verify email with verification code
   */
  abstract verifyEmail(email: string, code: string): Promise<any>;

  /**
   * Send verification code to email
   */
  abstract sendVerificationCode(email: string): Promise<void>;

  /**
   * Send password reset code to email
   */
  abstract sendPasswordResetCode(email: string): Promise<void>;

  /**
   * Reset password using reset code
   */
  abstract resetPassword(email: string, code: string, newPassword: string): Promise<any>;

  /**
   * Get provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Check if provider is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
} 