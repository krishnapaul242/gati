/**
 * @module brands
 * @description Aggregator for all built-in branded types
 */

// Email brand
export type { Email } from './email.js';
export { emailValidator } from './email.js';

// UUID brand
export type { UUID } from './uuid.js';
export { uuidValidator } from './uuid.js';

// URL brand
export type { Url } from './url.js';
export { urlValidator } from './url.js';

// Timestamp brand
export type { Timestamp } from './timestamp.js';
export { timestampValidator } from './timestamp.js';

// CUID brand
export type { Cuid } from './cuid.js';
export { cuidValidator } from './cuid.js';
