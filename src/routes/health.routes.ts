import { Router } from 'express';
import { ModuleCommunicationService } from '../shared/services/module-communication.service';
import { Result } from '../shared/types/result';
import { ResponseCode, AuditMessageType } from '../shared/constants/enums';
import { handleResponse } from '../shared/utils/handle-response';

const router = Router();
const moduleComm = new ModuleCommunicationService();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 modules:
 *                   type: object
 *                   description: Status of all modules
 */
router.get('/health', async (req, res) => {
  try {
    // Set controller context for logging
    (req as any)._controllerName = 'HealthRoute';
    (req as any)._functionName = 'health';
    
    await moduleComm.initialize();
    const moduleStatus = await moduleComm.getModuleStatus();
    
    const successResult = Result.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      modules: moduleStatus,
      version: process.env.npm_package_version || '1.0.0'
    });
    successResult.addMessage(AuditMessageType.info, 'HealthRoute', 'health', 'Health check completed');
    
    handleResponse(res, successResult);
  } catch (error) {
    const errorResult = Result.error('Service is unhealthy');
    errorResult.addException('HealthRoute', 'health', error);
    errorResult.statusCode = 1003; // Service unavailable
    
    handleResponse(res, errorResult);
  }
});

/**
 * @openapi
 * /health/modules:
 *   get:
 *     summary: Get detailed module status
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Module status information
 */
router.get('/health/modules', async (req, res) => {
  try {
    await moduleComm.initialize();
    const moduleStatus = await moduleComm.getModuleStatus();
    
    const successResult = Result.success({
      modules: moduleStatus,
      timestamp: new Date().toISOString()
    });
    successResult.addMessage(AuditMessageType.info, 'HealthRoute', 'modules', 'Module status retrieved');
    
    handleResponse(res, successResult);
  } catch (error) {
    const errorResult = Result.error('Failed to get module status');
    errorResult.addException('HealthRoute', 'modules', error);
    
    handleResponse(res, errorResult);
  }
});

/**
 * @openapi
 * /health/external:
 *   get:
 *     summary: Check external module health
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: External module health status
 */
router.get('/health/external', async (req, res) => {
  try {
    await moduleComm.initialize();
    const healthStatus = await moduleComm.checkExternalHealth();
    
    const successResult = Result.success({
      external_modules: healthStatus,
      timestamp: new Date().toISOString()
    });
    successResult.addMessage(AuditMessageType.info, 'HealthRoute', 'external', 'External health check completed');
    
    handleResponse(res, successResult);
  } catch (error) {
    const errorResult = Result.error('Failed to check external health');
    errorResult.addException('HealthRoute', 'external', error);
    
    handleResponse(res, errorResult);
  }
});

export default router; 