import { Router } from 'express';
import { AdminPanelController } from '../controllers/admin-panel.controller';
import { CentralizedRequestMiddleware } from '../../../core/middleware/centralized-request';

const router = Router();
const adminPanelController = new AdminPanelController();

// Custom middleware to check for super_admin role
const requireSuperAdmin = async (req: any, res: any, next: any) => {
  try {
    // Check if user has super_admin role
    if (req.user && req.user.roles) {
      const hasSuperAdminRole = req.user.roles.some((role: any) => 
        role === 'SUPER_ADMIN' || role.code === 'SUPER_ADMIN'
      );
      
      if (hasSuperAdminRole) {
        return next();
      }
    }
    
    // If no super_admin role, return unauthorized
    return res.status(403).json({
      data: null,
      statusCode: 1003, // Forbidden
      errors: [{ message: 'Access denied. Super Admin role required.' }],
      requestIdentifier: req.requestIdentifier || 'ADMIN_PANEL_ACCESS_DENIED',
      messages: [],
      additionalInfo: null,
      user: req.user
    });
  } catch (error) {
    return res.status(500).json({
      data: null,
      statusCode: 1000, // Error
      errors: [{ message: 'Error checking user role' }],
      requestIdentifier: req.requestIdentifier || 'ADMIN_PANEL_ACCESS_ERROR',
      messages: [],
      additionalInfo: null,
      user: req.user
    });
  }
};

// Admin index page (redirects to login) - no auth required
router.get('/', adminPanelController.serveLoginPage.bind(adminPanelController));

// Login page (no auth required)
router.get('/login', adminPanelController.serveLoginPage.bind(adminPanelController));

// Main admin panel interface - serve directly, let client handle auth
router.get('/panel', adminPanelController.serveAdminPanel.bind(adminPanelController));

// Admin panel assets (requires super_admin)
router.get('/assets/*', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.serveAdminAssets.bind(adminPanelController));

// Admin panel API endpoints (requires super_admin)
router.get('/config', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.getAdminConfig.bind(adminPanelController));
router.get('/navigation', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.getAdminNavigation.bind(adminPanelController));
router.get('/stats', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.getAdminStats.bind(adminPanelController));
router.get('/overview', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.getAdminOverview.bind(adminPanelController));
router.get('/health', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.getSystemHealth.bind(adminPanelController));
router.post('/actions', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.executeAdminAction.bind(adminPanelController));

// User management endpoints (requires super_admin)
router.get('/users', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.getUsers.bind(adminPanelController));
router.post('/users', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.createUser.bind(adminPanelController));
router.put('/users/:id', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.updateUser.bind(adminPanelController));
router.delete('/users/:id', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.deleteUser.bind(adminPanelController));

// Role management endpoints (requires super_admin)
router.get('/roles', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.getRoles.bind(adminPanelController));
router.post('/roles', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.createRole.bind(adminPanelController));
router.put('/roles/:id', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.updateRole.bind(adminPanelController));
router.delete('/roles/:id', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.deleteRole.bind(adminPanelController));

// Permission management endpoints (requires super_admin)
router.get('/permissions', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.getPermissions.bind(adminPanelController));
router.post('/permissions', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.createPermission.bind(adminPanelController));
router.put('/permissions/:id', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.updatePermission.bind(adminPanelController));
router.delete('/permissions/:id', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.deletePermission.bind(adminPanelController));

// Module discovery endpoints (requires super_admin)
router.get('/modules', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.getModules.bind(adminPanelController));

// Catch-all route for SPA routing (requires super_admin)
router.get('*', CentralizedRequestMiddleware.process('ADMIN_PANEL', 'ACCESS', true), requireSuperAdmin, adminPanelController.serveAdminPanel.bind(adminPanelController));

export default router;
