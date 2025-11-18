/**
 * @file phase1-copy.ts
 * @description Readonly copy of Phase 1 branded types from packages/types/src/index.ts
 * 
 * MAINTENANCE STRATEGY: Manual sync with event listener queue
 * 
 * When Phase 1 types change in packages/types/src/index.ts:
 * 1. Manually update type definitions below to match
 * 2. Event listener queue tracks test completions for future auto-sync
 * 3. Run tests to verify extraction still works
 * 
 * Event Queue System:
 * - Tests emit completion events with filename on afterEach
 * - Listener accumulates events during test run
 * - Provides foundation for automated sync validation
 * 
 * WHY READONLY COPY:
 * - Avoids Windows file locking issues on packages/types/src/index.ts
 * - Enables parallel test execution without conflicts
 * - Test-only fixture doesn't affect production code
 * 
 * Last synced: 2025-11-18 (Initial Phase 1 implementation)
 */

// Phase 1 String Branded Types
export type EmailString = string & { __pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' } & { __brand: 'email' };
export type UUID = string & { __pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' } & { __brand: 'uuid' };
export type URLString = string & { __brand: 'url' };
export type TimestampString = string & { __brand: 'timestamp' };
export type CUID = string & { __pattern: '^c[a-z0-9]{23}$' } & { __brand: 'cuid' };

// Type aliases for backward compatibility with test expectations
export type Email = EmailString;
export type Timestamp = TimestampString;

// Additional Phase 1 types for comprehensive testing
export type PasswordString = string & { __minLen: 8 };
export type PhoneString = string & { __brand: 'phone' };
export type HexString = string & { __pattern: '^[0-9a-fA-F]+$' };
export type Base64String = string & { __brand: 'base64' };

// Phase 1 Number Branded Types
export type PositiveNumber = number & { __min: 0 };
export type NegativeNumber = number & { __max: 0 };
export type IntegerNumber = number & { __integer: true };
export type PortNumber = number & { __min: 1 } & { __max: 65535 } & { __integer: true };

// Test extraction metadata
export const PHASE1_TYPES = [
  'EmailString',
  'UUID',
  'URLString',
  'TimestampString',
  'CUID',
  'PasswordString',
  'PhoneString',
  'HexString',
  'Base64String',
  'PositiveNumber',
  'NegativeNumber',
  'IntegerNumber',
  'PortNumber',
] as const;

export type Phase1TypeName = typeof PHASE1_TYPES[number];
