/**
 * @module brands/cuid
 * @description CUID branded type and validator
 */

import { BrandRegistry } from '../registry.js';
import type { Brand } from '../index.js';

/**
 * CUID branded type
 * Validates CUID2 format (default length 24)
 */
export type Cuid = string & Brand<'cuid'>;

/**
 * CUID2 regex (default 24-character format)
 * Format: [a-z0-9]{24}
 * CUID2 uses lowercase alphanumeric characters
 */
const CUID_REGEX = /^[a-z0-9]{24}$/;

/**
 * CUID validator
 */
export const cuidValidator = {
  name: 'cuid',
  validate: (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return CUID_REGEX.test(value);
  },
  description: 'Valid CUID2 format (24 alphanumeric characters)',
};

// Auto-register on import
BrandRegistry.register(cuidValidator);
