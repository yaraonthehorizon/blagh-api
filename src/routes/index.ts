import { Router } from 'express';
import { CentralizedRequestMiddleware } from '../core/middleware/centralized-request';
import healthRoutes from './health.routes';
import authRoutes from '../modules/auth/routes/auth.routes';
import userRoutes from '../modules/user/routes/user.routes';
import emailRoutes from '../modules/email/routes/email.routes';
import notificationRoutes from '../modules/notification/routes/notification.routes';
import odooRoutes from '../modules/odoo/routes/odoo.routes';
import permissionsManagerRoutes from '../modules/permissions-manager/routes/permissions-manager.routes';
import adminPanelRoutes from '../modules/admin-panel/routes/admin-panel.routes';

const router = Router();

// Health check routes (no auth required)
router.use('/', CentralizedRequestMiddleware.process('HEALTH', 'ACCESS', false), healthRoutes);

// Admin panel routes (serves the interface) - at root level
router.use('/admin', adminPanelRoutes);

// API routes with authentication - prefixed with /api
router.use('/api/auth', CentralizedRequestMiddleware.process('AUTH', 'ACCESS', false), authRoutes);
router.use('/api/users', CentralizedRequestMiddleware.process('USER', 'ACCESS', true), userRoutes);
router.use('/api/email', CentralizedRequestMiddleware.process('EMAIL', 'ACCESS', true), emailRoutes);
router.use('/api/notification', CentralizedRequestMiddleware.process('NOTIFICATION', 'ACCESS', true), notificationRoutes);
router.use('/api/odoo', CentralizedRequestMiddleware.process('ODOO', 'ACCESS', true), odooRoutes);
router.use('/api/permissions-manager', CentralizedRequestMiddleware.process('PERMISSIONS_MANAGER', 'ACCESS', true), permissionsManagerRoutes);

export default router; 