import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';
import { promisify } from 'util';

export interface DeveloperCertificate {
  id: string;
  developerId: string;
  email: string;
  licenseType: 'personal' | 'commercial' | 'enterprise';
  issuedAt: Date;
  expiresAt: Date;
  permissions: string[];
  signature: string;
  publicKey: string;
  metadata?: {
    company?: string;
    usage?: string;
    maxProjects?: number;
  };
}

export interface CertificateValidationResult {
  isValid: boolean;
  error?: string;
  certificate?: DeveloperCertificate;
  permissions?: string[];
}

export class CertificateManager {
  private static instance: CertificateManager;
  private readonly certificatePath: string;
  private readonly publicKeyPath: string;

  constructor() {
    this.certificatePath = path.join(process.cwd(), '.diagramers', 'certificate.json');
    this.publicKeyPath = path.join(process.cwd(), '.diagramers', 'public-key.pem');
  }

  static getInstance(): CertificateManager {
    if (!CertificateManager.instance) {
      CertificateManager.instance = new CertificateManager();
    }
    return CertificateManager.instance;
  }

  /**
   * Initialize certificate directory and validate existing certificate
   */
  async initialize(): Promise<CertificateValidationResult> {
    try {
      await fs.ensureDir(path.dirname(this.certificatePath));
      
      // Check if certificate exists
      if (await fs.pathExists(this.certificatePath)) {
        return await this.validateCertificate();
      } else {
        return {
          isValid: false,
          error: 'No certificate found. Please obtain a certificate from https://registry.diagramers.com/certificates'
        };
      }
    } catch (error: any) {
      return {
        isValid: false,
        error: `Certificate initialization failed: ${error.message}`
      };
    }
  }

  /**
   * Install a new certificate
   */
  async installCertificate(certificateData: string, signature: string): Promise<CertificateValidationResult> {
    try {
      // Verify the certificate signature
      const isValidSignature = await this.verifySignature(certificateData, signature);
      if (!isValidSignature) {
        return {
          isValid: false,
          error: 'Invalid certificate signature'
        };
      }

      // Parse and validate certificate
      const certificate: DeveloperCertificate = JSON.parse(certificateData);
      const validation = await this.validateCertificateData(certificate);
      
      if (!validation.isValid) {
        return validation;
      }

      // Save certificate
      await fs.writeJson(this.certificatePath, certificate, { spaces: 2 });
      
      return {
        isValid: true,
        certificate,
        permissions: certificate.permissions
      };
    } catch (error: any) {
      return {
        isValid: false,
        error: `Certificate installation failed: ${error.message}`
      };
    }
  }

  /**
   * Validate existing certificate
   */
  async validateCertificate(): Promise<CertificateValidationResult> {
    try {
      const certificateData = await fs.readJson(this.certificatePath);
      return await this.validateCertificateData(certificateData);
    } catch (error: any) {
      return {
        isValid: false,
        error: `Certificate validation failed: ${error.message}`
      };
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    const validation = await this.validateCertificate();
    if (!validation.isValid || !validation.certificate) {
      return false;
    }

    return validation.certificate.permissions.includes(permission);
  }

  /**
   * Get certificate information
   */
  async getCertificateInfo(): Promise<DeveloperCertificate | null> {
    const validation = await this.validateCertificate();
    return validation.certificate || null;
  }

  /**
   * Revoke certificate (for security)
   */
  async revokeCertificate(): Promise<void> {
    if (await fs.pathExists(this.certificatePath)) {
      await fs.remove(this.certificatePath);
    }
  }

  /**
   * Generate certificate request
   */
  async generateCertificateRequest(email: string, licenseType: string, metadata?: any): Promise<string> {
    const request = {
      email,
      licenseType,
      metadata,
      timestamp: new Date().toISOString(),
      machineId: await this.getMachineId()
    };

    return JSON.stringify(request, null, 2);
  }

  private async validateCertificateData(certificate: DeveloperCertificate): Promise<CertificateValidationResult> {
    // Check if certificate is expired
    if (new Date() > new Date(certificate.expiresAt)) {
      return {
        isValid: false,
        error: 'Certificate has expired'
      };
    }

    // Check if certificate is not yet valid
    if (new Date() < new Date(certificate.issuedAt)) {
      return {
        isValid: false,
        error: 'Certificate is not yet valid'
      };
    }

    // Validate required fields
    if (!certificate.id || !certificate.developerId || !certificate.email) {
      return {
        isValid: false,
        error: 'Invalid certificate format'
      };
    }

    return {
      isValid: true,
      certificate,
      permissions: certificate.permissions
    };
  }

  private async verifySignature(data: string, signature: string): Promise<boolean> {
    try {
      // In a real implementation, you would verify against your registry's public key
      // For now, we'll use a simple hash verification
      const expectedHash = crypto.createHash('sha256').update(data).digest('hex');
      return signature === expectedHash;
    } catch (error) {
      return false;
    }
  }

  private async getMachineId(): Promise<string> {
    // Generate a unique machine identifier
    const os = require('os');
    const hostname = os.hostname();
    const platform = os.platform();
    const arch = os.arch();
    
    return crypto.createHash('sha256')
      .update(`${hostname}-${platform}-${arch}`)
      .digest('hex');
  }
} 