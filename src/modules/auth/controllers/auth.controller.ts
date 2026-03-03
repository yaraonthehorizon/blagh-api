import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { handleResponse } from '../../../shared/utils/handle-response';
import { Result } from '../../../shared/types/result';
import { v4 as uuidv4 } from 'uuid';
import { ResponseCode } from '../../../shared/constants/enums';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login with credentials
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *               provider:
   *                 type: string
   *                 enum: [internal, firebase, oauth, sms, email, ldap, saml, oauth2, openid, webauthn, social]
   *                 default: internal
   *             required:
   *               - email
   *               - password
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *                     user:
   *                       type: object
   *                     expiresIn:
   *                       type: number
   *       401:
   *         description: Invalid credentials
   *       400:
   *         description: Bad request
   */
  async login(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { email, password, provider = 'internal' } = req.body;

      if (!email || !password) {
        const result = new Result(
          null,
          ResponseCode.MissingRequiredFields,
          [{ message: 'Email and password are required' }],
          null,
          requestIdentifier as string
        );
        return handleResponse(res, result);
      }

      const authResult = await this.authService.login({ email, password }, provider);
      const result = new Result(
        authResult.success ? {
          token: authResult.token,
          refreshToken: authResult.refreshToken,
          expiresIn: authResult.expiresIn
        } : null,
        authResult.success ? ResponseCode.Ok : ResponseCode.Unauthorized,
        authResult.success ? [] : [{ message: authResult.error }],
        null,
        requestIdentifier as string,
        null,
        authResult.success ? authResult.user : null
      );
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(
        null,
        ResponseCode.Error,
        [{ message: error.message }],
        null,
        requestIdentifier as string
      );
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Register new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *               name:
   *                 type: string
   *               phone:
   *                 type: string
   *               provider:
   *                 type: string
   *                 default: internal
   *             required:
   *               - email
   *               - password
   *               - name
   *     responses:
   *       201:
   *         description: User registered successfully
   *       400:
   *         description: Bad request
   *       409:
   *         description: User already exists
   */
  async register(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { email, password, name, phone, provider = 'internal' } = req.body;

      if (!email || !password || !name) {
        const result = new Result(
          null,
          ResponseCode.MissingRequiredFields,
          [{ message: 'Email, password, and name are required' }],
          null,
          requestIdentifier as string
        );
        return handleResponse(res, result);
      }

      const authResult = await this.authService.register({ email, password, name, phone }, provider);
      const result = new Result(
        authResult.success ? {
          user: authResult.user
        } : null,
        authResult.success ? ResponseCode.Ok : ResponseCode.Duplicate,
        authResult.success ? [] : [{ message: authResult.error }],
        null,
        requestIdentifier as string,
        null,
        authResult.success ? authResult.user : null
      );
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(
        null,
        ResponseCode.Error,
        [{ message: error.message }],
        null,
        requestIdentifier as string
      );
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh JWT token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               refreshToken:
   *                 type: string
   *             required:
   *               - refreshToken
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       400:
   *         description: Bad request
   *       401:
   *         description: Invalid or expired refresh token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Refresh token is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const authResult = await this.authService.refreshToken(refreshToken);
      const result = new Result(
        authResult.success ? {
          token: authResult.token,
          refreshToken: authResult.refreshToken,
          expiresIn: authResult.expiresIn
        } : null,
        authResult.success ? ResponseCode.Ok : ResponseCode.Unauthorized,
        authResult.success ? [] : [{ message: authResult.error }],
        null,
        requestIdentifier as string,
        null,
        authResult.success ? authResult.user : null
      );
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     summary: Logout user (invalidate token)
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *       400:
   *         description: Bad request
   */
  async logout(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Token is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      await this.authService.logout(token);
      const result = new Result(null, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/verify-email:
   *   post:
   *     summary: Verify email with code
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               code:
   *                 type: string
   *             required:
   *               - email
   *               - code
   *     responses:
   *       200:
   *         description: Email verified
   *       400:
   *         description: Bad request
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Email and code are required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const authResult = await this.authService.verifyEmail(email, code);
      const result = new Result(authResult, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/send-verification:
   *   post:
   *     summary: Send email verification code
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *             required:
   *               - email
   *     responses:
   *       200:
   *         description: Verification code sent
   *       400:
   *         description: Bad request
   */
  async sendVerification(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { email } = req.body;
      if (!email) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Email is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      await this.authService.sendVerificationCode(email);
      const result = new Result(null, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/forgot-password:
   *   post:
   *     summary: Send password reset code
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *             required:
   *               - email
   *     responses:
   *       200:
   *         description: Password reset code sent
   *       400:
   *         description: Bad request
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { email } = req.body;
      if (!email) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Email is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      await this.authService.sendPasswordResetCode(email);
      const result = new Result(null, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/reset-password:
   *   post:
   *     summary: Reset password with code
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               code:
   *                 type: string
   *               newPassword:
   *                 type: string
   *             required:
   *               - email
   *               - code
   *               - newPassword
   *     responses:
   *       200:
   *         description: Password reset successful
   *       400:
   *         description: Bad request
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Email, code, and new password are required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const resetResult = await this.authService.resetPassword(email, code, newPassword);
      const result = new Result(
        resetResult,
        ResponseCode.Ok,
        [],
        null,
        requestIdentifier as string
      );
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/change-password:
   *   post:
   *     summary: Change password
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               currentPassword:
   *                 type: string
   *               newPassword:
   *                 type: string
   *             required:
   *               - userId
   *               - currentPassword
   *               - newPassword
   *     responses:
   *       200:
   *         description: Password changed
   *       400:
   *         description: Bad request
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { userId, currentPassword, newPassword } = req.body;
      if (!userId || !currentPassword || !newPassword) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'userId, currentPassword, and newPassword are required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      await this.authService.changePassword(userId, currentPassword, newPassword);
      const result = new Result(null, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/sms/send:
   *   post:
   *     summary: Send SMS verification code
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               phone:
   *                 type: string
   *             required:
   *               - phone
   *     responses:
   *       200:
   *         description: SMS code sent
   *       400:
   *         description: Bad request
   */
  async sendSMSCode(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { phone } = req.body;
      if (!phone) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Phone is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      await this.authService.sendSMSCode(phone);
      const result = new Result(null, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/sms/verify:
   *   post:
   *     summary: Verify SMS code
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               phone:
   *                 type: string
   *               code:
   *                 type: string
   *             required:
   *               - phone
   *               - code
   *     responses:
   *       200:
   *         description: SMS verified
   *       400:
   *         description: Bad request
   */
  async verifySMSCode(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { phone, code } = req.body;
      if (!phone || !code) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Phone and code are required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const authResult = await this.authService.verifySMSCode(phone, code);
      const result = new Result(authResult, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/oauth/{provider}/url:
   *   get:
   *     summary: Get OAuth provider URL
   *     tags: [Authentication]
   *     parameters:
   *       - in: path
   *         name: provider
   *         required: true
   *         schema:
   *           type: string
   *         description: OAuth provider name
   *     responses:
   *       200:
   *         description: OAuth URL returned
   *       400:
   *         description: Bad request
   */
  async getOAuthURL(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { provider } = req.params;
      const { redirectUri } = req.query;
      if (!provider) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Provider is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const url = await this.authService.getOAuthURL(provider);
      const result = new Result({ url }, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/oauth/{provider}/callback:
   *   get:
   *     summary: Handle OAuth callback
   *     tags: [Authentication]
   *     parameters:
   *       - in: path
   *         name: provider
   *         required: true
   *         schema:
   *           type: string
   *         description: OAuth provider name
   *       - in: query
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: OAuth authorization code
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *         description: OAuth state parameter
   *     responses:
   *       200:
   *         description: OAuth callback handled
   *       400:
   *         description: Bad request
   */
  async handleOAuthCallback(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { provider } = req.params;
      const { code, state } = req.query;
      if (!provider || !code) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'Provider and code are required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const authResult = await this.authService.handleOAuthCallback(provider, code as string, state as string);
      const result = new Result(authResult, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/webauthn/register/begin:
   *   post:
   *     summary: Begin WebAuthn registration
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *             required:
   *               - userId
   *     responses:
   *       200:
   *         description: WebAuthn registration challenge
   *       400:
   *         description: Bad request
   */
  async beginWebAuthnRegistration(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { userId } = req.body;
      if (!userId) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'userId is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const data = await this.authService.beginWebAuthnRegistration(userId);
      const result = new Result(data, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/webauthn/register/finish:
   *   post:
   *     summary: Finish WebAuthn registration
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               userId:
   *                 type: string
   *               credential:
   *                 type: object
   *             required:
   *               - userId
   *               - credential
   *     responses:
   *       200:
   *         description: WebAuthn registration finished
   *       400:
   *         description: Bad request
   */
  async finishWebAuthnRegistration(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { userId, credential } = req.body;
      if (!userId || !credential) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'userId and credential are required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const data = await this.authService.finishWebAuthnRegistration(userId, credential);
      const result = new Result(data, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/webauthn/login/begin:
   *   post:
   *     summary: Begin WebAuthn authentication
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *             required:
   *               - email
   *     responses:
   *       200:
   *         description: WebAuthn authentication challenge
   *       400:
   *         description: Bad request
   */
  async beginWebAuthnAuthentication(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { email } = req.body;
      if (!email) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'email is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const data = await this.authService.beginWebAuthnAuthentication(email);
      const result = new Result(data, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/webauthn/login/finish:
   *   post:
   *     summary: Finish WebAuthn authentication
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *               credential:
   *                 type: object
   *             required:
   *               - email
   *               - credential
   *     responses:
   *       200:
   *         description: WebAuthn authentication finished
   *       400:
   *         description: Bad request
   */
  async finishWebAuthnAuthentication(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { email, credential } = req.body;
      if (!email || !credential) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'email and credential are required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const data = await this.authService.finishWebAuthnAuthentication(email, credential);
      const result = new Result(data, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     summary: Get user profile
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile returned
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { userId } = req.body;
      if (!userId) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'userId is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const data = await this.authService.getProfile(userId);
      const result = new Result(data, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }

  /**
   * @swagger
   * /api/auth/validate:
   *   get:
   *     summary: Validate JWT token
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Token validation result
   *       400:
   *         description: Bad request
   *       401:
   *         description: Unauthorized
   */
  async validateToken(req: Request, res: Response): Promise<void> {
    const requestIdentifier = req.headers['x-request-id'] || uuidv4();
    try {
      const { token } = req.body;
      if (!token) {
        const result = new Result(null, ResponseCode.MissingRequiredFields, [{ message: 'token is required' }], null, requestIdentifier as string);
        return handleResponse(res, result);
      }
      const data = await this.authService.validateToken(token);
      const result = new Result(data, ResponseCode.Ok, [], null, requestIdentifier as string);
      return handleResponse(res, result);
    } catch (error: any) {
      const result = new Result(null, ResponseCode.Error, [{ message: error.message }], null, requestIdentifier as string);
      return handleResponse(res, result);
    }
  }


} 