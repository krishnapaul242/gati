/**
 * @module brands/timestamp
 * @description Timestamp branded type and validator
 */

import { BrandRegistry } from '../registry.js';
import type { Brand } from '../index.js';

/**
 * Timestamp branded type
 * Validates ISO 8601 timestamp format
 */
export type Timestamp = string & Brand<'timestamp'>;

/**
 * ISO 8601 timestamp regex
 * Supports:
 * - YYYY-MM-DDTHH:mm:ss.sssZ
 * - YYYY-MM-DDTHH:mm:ss.sss+HH:mm
 * - YYYY-MM-DDTHH:mm:ss+HH:mm
 * - YYYY-MM-DDTHH:mm:ssZ
 */
const TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Timestamp validator
 */
export const timestampValidator = {
  name: 'timestamp',
  validate: (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return TIMESTAMP_REGEX.test(value);
  },
  description: 'Valid ISO 8601 timestamp format',
};

// Auto-register on import
BrandRegistry.register(timestampValidator);
