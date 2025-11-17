/**
 * @module brands/email
 * @description Email branded type and validator
 */

import { BrandRegistry } from '../registry.js';
import type { Brand } from '../index.js';

/**
 * Email branded type
 * Validates RFC 5322 email format (simplified)
 */
export type Email = string & Brand<'email'>;

/**
 * Email validation regex (simplified RFC 5322)
 * Matches: user@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email validator
 */
export const emailValidator = {
  name: 'email',
  validate: (value: unknown): boolean => {
    return typeof value === 'string' && EMAIL_REGEX.test(value);
  },
  description: 'RFC 5322 email format (simplified)',
};

// Auto-register on import
BrandRegistry.register(emailValidator);
