/**
 * @module brands/uuid
 * @description UUID branded type and validator
 */

import { BrandRegistry } from '../registry.js';
import type { Brand } from '../index.js';

/**
 * UUID branded type
 * Validates UUID v4 format
 */
export type UUID = string & Brand<'uuid'>;

/**
 * UUID v4 validation regex
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where x is any hexadecimal digit and y is one of 8, 9, A, or B
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * UUID validator
 */
export const uuidValidator = {
  name: 'uuid',
  validate: (value: unknown): boolean => {
    return typeof value === 'string' && UUID_REGEX.test(value);
  },
  description: 'UUID v4 format',
};

// Auto-register on import
BrandRegistry.register(uuidValidator);
