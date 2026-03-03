import { v4 as uuidv4 } from 'uuid';

export interface RequestIdentifierConfig {
  moduleCode: string;
  actionCode: string;
  customId?: string;
}

/**
 * Generate a proper request identifier in format: MODULECODE_ACTIONCODE_UUID
 * @param config Configuration for the request identifier
 * @returns Formatted request identifier
 */
export function generateRequestIdentifier(config: RequestIdentifierConfig): string {
  const { moduleCode, actionCode, customId } = config;
  
  // Use custom ID if provided, otherwise generate UUID
  const id = customId || uuidv4().replace(/-/g, '');
  
  // Format: MODULECODE_ACTIONCODE_UUID
  return `${moduleCode.toUpperCase()}_${actionCode.toUpperCase()}_${id}`;
}

/**
 * Extract request identifier from headers or generate new one
 * @param headers Request headers
 * @param config Configuration for generating new identifier
 * @returns Request identifier
 */
export function getRequestIdentifier(headers: any, config: RequestIdentifierConfig): string {
  // Check for existing request ID in headers
  const existingId = headers['x-request-id'] || headers['x-correlation-id'];
  
  if (existingId) {
    return existingId;
  }
  
  // Generate new identifier
  return generateRequestIdentifier(config);
}

/**
 * Common module codes for consistency
 */
export const ModuleCodes = {
  USER: 'USR',
  AUTH: 'AUTH',
  EMAIL: 'EML',
  NOTIFICATION: 'NOT',
  ODOO: 'ODO',
  SYSTEM: 'SYS',
  ADMIN: 'ADM'
} as const;

/**
 * Common action codes for consistency
 */
export const ActionCodes = {
  CREATE: 'CRT',
  READ: 'RD',
  UPDATE: 'UPD',
  DELETE: 'DEL',
  SEARCH: 'SRCH',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REG',
  VALIDATE: 'VAL',
  SEED: 'SEED',
  INIT: 'INIT'
} as const;
