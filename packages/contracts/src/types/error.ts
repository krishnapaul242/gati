/**
 * @module contracts/types/error
 * @description Standardized error format for Gati framework
 */

/**
 * GatiError - Standardized error structure for consistent error handling
 * 
 * Provides machine-readable error codes and structured error details
 * for programmatic error handling across the framework.
 * 
 * @example
 * ```typescript
 * const error: GatiError = {
 *   message: 'User not found',
 *   code: 'user.not_found',
 *   status: 404,
 *   traceId: 'req_abc123'
 * };
 * ```
 * 
 * @example Error codes use dot-notation hierarchy
 * ```typescript
 * 'validation.failed'
 * 'auth.token.expired'
 * 'database.connection.timeout'
 * 'handler.execution.error'
 * ```
 */
export interface GatiError {
  /** Human-readable error message */
  message: string;
  
  /** Machine-readable error code (dot-notation) */
  code?: string;
  
  /** HTTP status code */
  status?: number;
  
  /** Structured error details */
  details?: any;
  
  /** Correlation with request ID for tracing */
  traceId?: string;
}
