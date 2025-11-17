/**
 * @module brands/url
 * @description URL branded type and validator
 */

import { BrandRegistry } from '../registry.js';
import type { Brand } from '../index.js';

/**
 * URL branded type
 * Validates URL format using URL constructor
 */
export type Url = string & Brand<'url'>;

/**
 * URL validator using native URL constructor
 */
export const urlValidator = {
  name: 'url',
  validate: (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  description: 'Valid URL format',
};

// Auto-register on import
BrandRegistry.register(urlValidator);
