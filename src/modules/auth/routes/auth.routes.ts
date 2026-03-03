import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Basic Authentication Routes
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', authController.logout.bind(authController));

// Email Verification Routes
router.post('/verify-email', authController.verifyEmail.bind(authController));
router.post('/send-verification', authController.sendVerification.bind(authController));

// Password Management Routes
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.post('/change-password', authController.changePassword.bind(authController));

// SMS Authentication Routes
router.post('/sms/send', authController.sendSMSCode.bind(authController));
router.post('/sms/verify', authController.verifySMSCode.bind(authController));

// OAuth Routes
router.get('/oauth/:provider/url', authController.getOAuthURL.bind(authController));
router.get('/oauth/:provider/callback', authController.handleOAuthCallback.bind(authController));

// WebAuthn Routes (RESTful)
router.post('/webauthn/register/begin', authController.beginWebAuthnRegistration.bind(authController));
router.post('/webauthn/register/finish', authController.finishWebAuthnRegistration.bind(authController));
router.post('/webauthn/login/begin', authController.beginWebAuthnAuthentication.bind(authController));
router.post('/webauthn/login/finish', authController.finishWebAuthnAuthentication.bind(authController));
// WebAuthn Routes (Short/Swagger aliases)
router.post('/begin-webauthn-registration', authController.beginWebAuthnRegistration.bind(authController));
router.post('/finish-webauthn-registration', authController.finishWebAuthnRegistration.bind(authController));
router.post('/begin-webauthn-authentication', authController.beginWebAuthnAuthentication.bind(authController));
router.post('/finish-webauthn-authentication', authController.finishWebAuthnAuthentication.bind(authController));

// Profile and Token Management Routes
router.get('/profile', authController.getProfile.bind(authController));
router.get('/validate', authController.validateToken.bind(authController));
// POST aliases for Swagger/UI compatibility
router.post('/get-profile', authController.getProfile.bind(authController));
router.post('/validate-token', authController.validateToken.bind(authController));

export default router; 