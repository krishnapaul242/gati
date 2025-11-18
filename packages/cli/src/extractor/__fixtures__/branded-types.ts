/**
 * @file branded-types.ts
 * @description Branded types importing from @gati-framework/types workspace
 */

import type {
  Email,
  UUID,
  Url,
  Timestamp,
  Cuid,
  Brand,
  MinLen,
  Pattern,
  Min,
  Max,
} from '@gati-framework/types';

// Re-export Phase 1 types for testing
export type { Email, UUID, Url, Timestamp, Cuid };

// Define missing Phase 1 types locally for testing
export type PasswordString = string & Brand<'password'> & MinLen<8>;
export type PhoneString = string & Brand<'phone'> & Pattern<'^\\+?[1-9]\\d{1,14}$'>;
export type PositiveNumber = number & Min<0>;
export type NegativeNumber = number & Max<0>;
export type IntegerNumber = number & Brand<'integer'>;
export type PortNumber = number & Min<1> & Max<65535>;

// Composite branded types using actual Phase 1 types
export type VerifiedEmail = Email & { __brand: 'verified' };
export type SecurePassword = PasswordString & MinLen<12>;
export type AdminID = UUID & { __brand: 'admin' };

