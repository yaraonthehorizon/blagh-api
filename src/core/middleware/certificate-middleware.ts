import { Request, Response, NextFunction } from 'express';
import { CertificateManager } from '../certificate/certificate-manager';

export interface CertificateRequest extends Request {
  certificate?: any;
  permissions?: string[];
}

export class CertificateMiddleware {
  private static certificateManager = CertificateManager.getInstance();

  /**
   * Middleware to validate certificate before API access
   */
  static async validateCertificate(req: CertificateRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validation = await CertificateMiddleware.certificateManager.initialize();
      
      if (!validation.isValid) {
        res.status(403).json({
          success: false,
          error: 'Certificate required',
          message: validation.error,
          action: 'obtain_certificate',
          url: 'https://registry.diagramers.com/certificates'
        });
        return;
      }

      // Attach certificate info to request
      req.certificate = validation.certificate;
      req.permissions = validation.permissions;
      
      next();
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Certificate validation failed',
        message: error.message
      });
    }
  }

  /**
   * Middleware to check specific permissions
   */
  static requirePermission(permission: string) {
    return async (req: CertificateRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        const hasPermission = await CertificateMiddleware.certificateManager.hasPermission(permission);
        
        if (!hasPermission) {
          res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            message: `Permission '${permission}' is required`,
            requiredPermission: permission,
            currentPermissions: req.permissions || []
          });
          return;
        }

        next();
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'Permission check failed',
          message: error.message
        });
      }
    };
  }

  /**
   * Middleware to check license type
   */
  static requireLicenseType(licenseType: string) {
    return async (req: CertificateRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.certificate) {
          res.status(403).json({
            success: false,
            error: 'Certificate required',
            message: 'Valid certificate is required'
          });
          return;
        }

        if (req.certificate.licenseType !== licenseType) {
          res.status(403).json({
            success: false,
            error: 'Insufficient license',
            message: `License type '${licenseType}' is required`,
            currentLicense: req.certificate.licenseType,
            upgradeUrl: 'https://registry.diagramers.com/upgrade'
          });
          return;
        }

        next();
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: 'License check failed',
          message: error.message
        });
      }
    };
  }

  /**
   * Middleware to log certificate usage
   */
  static logUsage(req: CertificateRequest, res: Response, next: NextFunction): void {
    if (req.certificate) {
      console.log(`[CERTIFICATE] ${req.certificate.email} (${req.certificate.licenseType}) - ${req.method} ${req.path}`);
    }
    next();
  }
} 