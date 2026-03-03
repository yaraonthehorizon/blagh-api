import { BaseAuthProvider, AuthCredentials, AuthResult, AuthProviderHealth, AuthProviderMetrics } from './base-auth-provider';
import { InternalAuthConfig } from '../../../core/config/interfaces';
import { DatabaseAdapter } from '../../../shared/types/database-adapter';
import { CreateUserData } from '../../user/entities/user.entity';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { VerificationCodeModel } from '../schemas/verification-code.schema';
import * as nodemailer from 'nodemailer';
import OTPGenerator from '../../../shared/utils/otp-generator';

export class InternalAuthProvider extends BaseAuthProvider {
  private authConfig: InternalAuthConfig;
  private databaseAdapter?: DatabaseAdapter;
  private metrics: AuthProviderMetrics = {
    isActive: false,
    totalAuthentications: 0,
    successfulAuthentications: 0,
    failedAuthentications: 0,
    averageResponseTime: 0,
    lastAuthentication: undefined
  };

  constructor(config: InternalAuthConfig, databaseAdapter?: DatabaseAdapter) {
    super('internal', config);
    this.authConfig = config;
    this.databaseAdapter = databaseAdapter;
  }

  async initialize(): Promise<void> {
    try {
      // Validate configuration
      if (!this.authConfig.enabled) {
        throw new Error('Internal auth provider is disabled');
      }

      // Initialize database connections if needed
      // In a real implementation, this would set up the database connection
      console.log('[InternalAuthProvider] Initializing internal authentication...');
      
      this.isInitialized = true;
      this.metrics.isActive = true;
      
      console.log('[InternalAuthProvider] Internal authentication initialized successfully');
    } catch (error) {
      console.error('[InternalAuthProvider] Failed to initialize:', error);
      throw error;
    }
  }

  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    const startTime = Date.now();
    this.metrics.totalAuthentications++;

    try {
      // Validate required credentials
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(credentials.email)) {
        throw new Error('Invalid email format');
      }

      // Validate password policy
      await this.validatePasswordPolicy(credentials.password);

      // Query the database for the user
      const user = await this.findUserByEmail(credentials.email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked && user.lockoutExpires && user.lockoutExpires > new Date()) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        await this.incrementFailedAttempts(user._id);
        throw new Error('Invalid credentials');
      }

      await this.resetFailedAttempts(user._id);

      // Check if email verification is required
      if (this.authConfig.requireEmailVerification && !user.emailVerified) {
        throw new Error('Email verification required');
      }

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'default-secret';
      const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
      
      // Get user roles from roleIds
      let userRoles: string[] = [];
      if (user.roleIds && user.roleIds.length > 0) {
        try {
          console.log('[InternalAuthProvider] User roleIds:', user.roleIds);
          
          // Properly query the database for role codes
          const { RoleModel } = await import('../../user/schemas/role.schema');
          const userRoleObjects = await RoleModel.find({ _id: { $in: user.roleIds } });
          
          if (userRoleObjects && userRoleObjects.length > 0) {
            userRoles = userRoleObjects.map(role => role.code);
            console.log('[InternalAuthProvider] Found roles from database:', userRoles);
          } else {
            console.log('[InternalAuthProvider] No roles found in database, using default');
            userRoles = ['user'];
          }
          
          console.log('[InternalAuthProvider] Final userRoles:', userRoles);
        } catch (error) {
          console.error('[InternalAuthProvider] Error getting roles from database:', error);
          // If we can't get roles from database, use a default
          userRoles = ['user'];
        }
      } else {
        console.log('[InternalAuthProvider] No roleIds found, using default');
        userRoles = ['user'];
      }
      
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          provider: 'internal',
          roles: userRoles, // Include actual roles
          jti: require('uuid').v4() // Add unique identifier
        },
        jwtSecret,
        { expiresIn: jwtExpiresIn } as jwt.SignOptions
      );
      const refreshToken = jwt.sign(
        { 
          userId: user._id, 
          type: 'refresh',
          jti: require('uuid').v4() // Add unique identifier
        },
        jwtSecret,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      await this.updateLastLogin(user._id);

      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
          roles: userRoles, // Include actual roles
          emailVerified: user.emailVerified
        },
        token,
        refreshToken,
        expiresIn: this.parseExpirationTime(jwtExpiresIn),
        provider: 'internal'
      };

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);
      return {
        success: false,
        error: error.message,
        provider: 'internal'
      };
    }
  }

  async validateToken(token: string): Promise<any> {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'default-secret';
      const decoded = jwt.verify(token, jwtSecret) as any;
      
      if (decoded.provider !== 'internal') {
        throw new Error('Invalid token provider');
      }

      // In a real implementation, check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      return {
        valid: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          roles: decoded.roles || ['user'] // Include roles from token
        }
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const jwtSecret = process.env.JWT_SECRET || 'default-secret';
      const decoded = jwt.verify(refreshToken, jwtSecret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Get user details
      const user = await this.findUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const newToken = jwt.sign(
        { 
          userId: user._id, 
          email: user.email,
          provider: 'internal',
          role: user.role || 'user',
          jti: require('uuid').v4() // Add unique identifier
        },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
      );

      // Generate new refresh token
      const newRefreshToken = jwt.sign(
        { 
          userId: user._id, 
          type: 'refresh',
          jti: require('uuid').v4() // Add unique identifier
        },
        jwtSecret,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token: newToken,
        refreshToken: newRefreshToken,
        expiresIn: this.parseExpirationTime(process.env.JWT_EXPIRES_IN || '1h'),
        provider: 'internal'
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: 'internal'
      };
    }
  }

  async cleanup(): Promise<void> {
    console.log('[InternalAuthProvider] Cleaning up internal authentication...');
    this.isInitialized = false;
    this.metrics.isActive = false;
  }

  async getHealth(): Promise<AuthProviderHealth> {
    try {
      if (!this.isInitialized) {
        return {
          status: 'unhealthy',
          message: 'Provider not initialized',
          timestamp: new Date()
        };
      }

      // In a real implementation, check database connection
      const dbHealthy = await this.checkDatabaseHealth();
      
      return {
        status: dbHealthy ? 'healthy' : 'degraded',
        message: dbHealthy ? 'Internal auth provider is healthy' : 'Database connection issues',
        details: {
          database: dbHealthy ? 'connected' : 'disconnected',
          config: {
            allowRegistration: this.authConfig.allowRegistration,
            requireEmailVerification: this.authConfig.requireEmailVerification,
            allowPasswordReset: this.authConfig.allowPasswordReset
          }
        },
        timestamp: new Date()
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: error.message,
        timestamp: new Date()
      };
    }
  }

  async getMetrics(): Promise<AuthProviderMetrics> {
    return {
      ...this.metrics,
      lastAuthentication: this.metrics.lastAuthentication
    };
  }

  // User management methods
  async register(userData: any): Promise<AuthResult> {
    try {
      if (!this.authConfig.allowRegistration) {
        throw new Error('Registration is disabled');
      }

      // Validate required fields
      if (!userData.email || !userData.password || !userData.name) {
        throw new Error('Email, password, and name are required');
      }

      // Check if user already exists
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists',
          provider: 'internal'
        };
      }

      // Validate password policy
      await this.validatePasswordPolicy(userData.password);

      // Hash password
      const password = await bcrypt.hash(userData.password, this.authConfig.bcryptRounds);

      // Create user
      const user = await this.createUser({
        email: userData.email,
        password,
        name: userData.name,
        phone: userData.phone,
        role: 'user',
        emailVerified: !this.authConfig.requireEmailVerification,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Send verification email if required
      if (this.authConfig.requireEmailVerification) {
        await this.sendVerificationCode(user.email);
      }

      return {
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified
        },
        provider: 'internal'
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        provider: 'internal'
      };
    }
  }

  async verifyEmail(email: string, code: string): Promise<any> {
    const user = await this.findUserByEmail(email);
    if (!user) throw new Error('User not found');
    const record = await VerificationCodeModel.findOne({
      userId: user._id,
      code,
      type: 'email_verification',
      used: false,
      expiresAt: { $gt: new Date() }
    });
    if (!record) throw new Error('Invalid or expired code');
    await VerificationCodeModel.updateOne({ _id: record._id }, { used: true });
    if (this.databaseAdapter) {
      await this.databaseAdapter.updateUser(user._id, { isEmailVerified: true });
    }
    return { verified: true };
  }

  async sendVerificationCode(email: string): Promise<void> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is already verified
    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }
    
    // Generate verification code using OTP generator
    const code = OTPGenerator.generate();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    
    // Invalidate any existing verification codes for this user
    await VerificationCodeModel.updateMany(
      { 
        userId: user._id, 
        type: 'email_verification',
        used: false 
      },
      { used: true }
    );
    
    // Create new verification code
    await VerificationCodeModel.create({
      userId: user._id,
      code,
      type: 'email_verification',
      expiresAt,
      used: false,
      createdAt: new Date()
    });
    
    // Send email with verification code (dev transport)
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    });
    
    await transporter.sendMail({
      from: 'no-reply@diagramers.com',
      to: email,
      subject: 'Your Email Verification Code',
      text: `Your email verification code is: ${code}\n\nThis code will expire in 15 minutes.`
    });
    
    // Log for development (remove in production)
    console.log(`[DEV] Email verification code for ${email}: ${code}`);
    console.log(`[DEV] Code expires at: ${expiresAt.toISOString()}`);
  }

  async sendPasswordResetCode(email: string): Promise<void> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('User account is not active');
      }

      // Generate reset code using OTP generator
      const code = OTPGenerator.generate();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

      // Invalidate any existing password reset codes for this user
      await VerificationCodeModel.updateMany(
        { userId: user._id, type: 'password_reset', used: false },
        { used: true }
      );

      // Create new password reset code
      await VerificationCodeModel.create({
        userId: user._id,
        code,
        type: 'password_reset',
        expiresAt,
        used: false,
        createdAt: new Date()
      });

      // Send password reset email (dev transport)
      const transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });

      await transporter.sendMail({
        from: 'no-reply@diagramers.com',
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this password reset, please ignore this email.`
      });

      console.log(`[DEV] Password reset code for ${email}: ${code}`);
      console.log(`[DEV] Code expires at: ${expiresAt.toISOString()}`);

    } catch (error: any) {
      console.error('[InternalAuthProvider] Error sending password reset code:', error);
      throw error;
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<any> {
    try {
      // Validate new password
      await this.validatePasswordPolicy(newPassword);

      // Find user by email
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.isActive) {
        throw new Error('User account is not active');
      }

      // Find and validate reset code
      const resetCode = await VerificationCodeModel.findOne({
        userId: user._id,
        code,
        type: 'password_reset',
        used: false,
        expiresAt: { $gt: new Date() }
      });

      if (!resetCode) {
        throw new Error('Invalid or expired reset code');
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password
      if (this.databaseAdapter) {
        await this.databaseAdapter.updateUser(user._id, { password: hashedPassword });
      } else {
        // Fallback: Update user directly if no database adapter
        const UserModel = require('../../user/schemas/user.schema').UserModel;
        await UserModel.findByIdAndUpdate(user._id, { password: hashedPassword });
      }

      // Mark reset code as used
      await VerificationCodeModel.findByIdAndUpdate(resetCode._id, { used: true });

      // Invalidate all existing sessions/tokens for this user (optional security measure)
      // This would typically involve blacklisting tokens or clearing refresh tokens

      console.log(`[InternalAuthProvider] Password reset successful for user: ${email}`);

      return {
        success: true,
        message: 'Password reset successful'
      };

    } catch (error: any) {
      console.error('[InternalAuthProvider] Error resetting password:', error);
      throw error;
    }
  }

  // Private helper methods
  private async validatePasswordPolicy(password: string): Promise<void> {
    const passwordPolicy = {
      minLength: parseInt(process.env.AUTH_PASSWORD_MIN_LENGTH || '8'),
      requireUppercase: process.env.AUTH_PASSWORD_REQUIRE_UPPERCASE === 'true',
      requireLowercase: process.env.AUTH_PASSWORD_REQUIRE_LOWERCASE === 'true',
      requireNumbers: process.env.AUTH_PASSWORD_REQUIRE_NUMBERS === 'true',
      requireSpecialChars: process.env.AUTH_PASSWORD_REQUIRE_SPECIAL_CHARS === 'true'
    };

    if (password.length < passwordPolicy.minLength) {
      throw new Error(`Password must be at least ${passwordPolicy.minLength} characters long`);
    }

    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  private async findUserByEmail(email: string): Promise<any> {
    if (!this.databaseAdapter) {
      throw new Error('Database adapter not configured');
    }
    const user = await this.databaseAdapter.findUserByEmail(email);
    if (user) {
      return {
        _id: user._id,
        email: user.email,
        password: user.password,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        role: 'user',
        emailVerified: user.isEmailVerified,
        isActive: user.isActive,
        isLocked: user.lockedUntil && user.lockedUntil > new Date(),
        failedLoginAttempts: user.loginAttempts,
        lockoutExpires: user.lockedUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roleIds: user.roleIds // Include roleIds for role lookup
      };
    }
    return null;
  }

  private async findUserById(id: string): Promise<any> {
    if (!this.databaseAdapter) {
      throw new Error('Database adapter not configured');
    }
    const user = await this.databaseAdapter.findUserById(id);
    if (user) {
      return {
        _id: user._id,
        email: user.email,
        password: user.password,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        role: 'user',
        emailVerified: user.isEmailVerified,
        isActive: user.isActive,
        isLocked: user.lockedUntil && user.lockedUntil > new Date(),
        failedLoginAttempts: user.loginAttempts,
        lockoutExpires: user.lockedUntil,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    }
    return null;
  }

  private async createUser(userData: any): Promise<any> {
    if (!this.databaseAdapter) {
      throw new Error('Database adapter not configured');
    }
    const createUserData: CreateUserData = {
      email: userData.email,
      password: userData.password,
      username: userData.email.split('@')[0],
      mobile: userData.phone,
      firstName: userData.name.split(' ')[0],
      lastName: userData.name.split(' ').slice(1).join(' ')
    };
    const user = await this.databaseAdapter.createUser(createUserData);
    return {
      _id: user._id,
      email: user.email,
      password: user.password,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
      role: 'user',
      emailVerified: user.isEmailVerified,
      isActive: user.isActive,
      isLocked: false,
      failedLoginAttempts: 0,
      lockoutExpires: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private async incrementFailedAttempts(userId: string): Promise<void> {
    if (this.databaseAdapter) {
      const user = await this.databaseAdapter.findUserById(userId);
      if (user) {
        const newAttempts = user.loginAttempts + 1;
        await this.databaseAdapter.updateLoginAttempts(userId, newAttempts);
        
        // Lock user if max attempts exceeded
        const maxAttempts = parseInt(process.env.AUTH_MAX_LOGIN_ATTEMPTS || '5');
        if (newAttempts >= maxAttempts) {
          const lockoutDuration = parseInt(process.env.AUTH_LOCKOUT_DURATION || '900'); // 15 minutes
          const lockedUntil = new Date(Date.now() + lockoutDuration * 1000);
          await this.databaseAdapter.lockUser(userId, lockedUntil);
        }
      }
    } else {
      console.log(`Incrementing failed attempts for user ${userId}`);
    }
  }

  private async resetFailedAttempts(userId: string): Promise<void> {
    if (this.databaseAdapter) {
      await this.databaseAdapter.updateLoginAttempts(userId, 0);
      await this.databaseAdapter.unlockUser(userId);
    } else {
      console.log(`Resetting failed attempts for user ${userId}`);
    }
  }

  private async updateLastLogin(userId: string): Promise<void> {
    if (this.databaseAdapter) {
      await this.databaseAdapter.updateLastLogin(userId, new Date());
    } else {
      console.log(`Updating last login for user ${userId}`);
    }
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    // In a real implementation, this would check a blacklist in the database or cache
    return false;
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    // In a real implementation, this would check database connectivity
    return true;
  }



  private parseExpirationTime(expiresIn: string): number {
    // Parse JWT expiration time to seconds
    const timeUnit = expiresIn.slice(-1);
    const timeValue = parseInt(expiresIn.slice(0, -1));
    
    switch (timeUnit) {
      case 's': return timeValue;
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 60 * 60;
      case 'd': return timeValue * 60 * 60 * 24;
      default: return 3600; // Default to 1 hour
    }
  }

  private updateMetrics(success: boolean, responseTime: number): void {
    if (success) {
      this.metrics.successfulAuthentications++;
    } else {
      this.metrics.failedAuthentications++;
    }

    // Update average response time
    const totalResponses = this.metrics.successfulAuthentications + this.metrics.failedAuthentications;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalResponses - 1) + responseTime) / totalResponses;
    
    this.metrics.lastAuthentication = new Date();
  }
} 