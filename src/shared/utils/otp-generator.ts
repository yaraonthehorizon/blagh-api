/**
 * OTP (One-Time Password) Generator Utility
 * Provides configurable OTP generation with various options
 */

export interface OTPOptions {
  length?: number;
  type?: 'numeric' | 'alphanumeric' | 'alphabetic';
  excludeSimilar?: boolean;
  excludeAmbiguous?: boolean;
}

export interface OTPResult {
  code: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isExpired: boolean;
}

export class OTPGenerator {
  private static readonly DEFAULT_LENGTH = 6;
  private static readonly DEFAULT_EXPIRY_MINUTES = 15;
  private static readonly DEFAULT_MAX_ATTEMPTS = 3;

  /**
   * Generate a random OTP code
   * @param options OTP generation options
   * @returns Generated OTP code
   */
  static generate(options: OTPOptions = {}): string {
    const length = options.length || parseInt(process.env.OTP_LENGTH || '6') || this.DEFAULT_LENGTH;
    const type = options.type || (process.env.OTP_TYPE as 'numeric' | 'alphanumeric' | 'alphabetic') || 'numeric';
    
    let charset = this.getCharset(type, options);
    let code = '';

    // Generate OTP with exclusion rules
    for (let i = 0; i < length; i++) {
      let char: string;
      do {
        char = charset[Math.floor(Math.random() * charset.length)];
      } while (this.shouldExcludeChar(char, code, options));

      code += char;
    }

    return code;
  }

  /**
   * Get charset based on OTP type
   * @param type OTP type
   * @param options OTP options
   * @returns Character set string
   */
  private static getCharset(type: string, options: OTPOptions): string {
    let charset = '';

    switch (type) {
      case 'numeric':
        charset = '0123456789';
        break;
      case 'alphanumeric':
        charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        break;
      case 'alphabetic':
        charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        break;
      default:
        charset = '0123456789';
    }

    // Apply exclusions
    if (options.excludeSimilar) {
      charset = charset.replace(/[0O1I]/g, '');
    }

    if (options.excludeAmbiguous) {
      charset = charset.replace(/[2Z5S8B6G9]/g, '');
    }

    return charset;
  }

  /**
   * Check if character should be excluded
   * @param char Character to check
   * @param currentCode Current OTP code
   * @param options OTP options
   * @returns True if should exclude
   */
  private static shouldExcludeChar(char: string, currentCode: string, options: OTPOptions): boolean {
    // Exclude similar characters if option is enabled
    if (options.excludeSimilar) {
      const similarChars = ['0', 'O', '1', 'I'];
      if (similarChars.includes(char)) return true;
    }

    // Exclude ambiguous characters if option is enabled
    if (options.excludeAmbiguous) {
      const ambiguousChars = ['2', 'Z', '5', 'S', '8', 'B', '6', 'G', '9'];
      if (ambiguousChars.includes(char)) return true;
    }

    return false;
  }
}

// Export default instance for convenience
export default OTPGenerator;
