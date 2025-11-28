/**
 * @module contracts/types/envelope
 * @description Canonical request and response envelope structures for Gati framework
 */

/**
 * GatiRequestEnvelope - Standardized request structure for internal communication
 * 
 * This envelope wraps all incoming requests and provides a consistent interface
 * between ingress, route manager, and handlers.
 * 
 * @example
 * ```typescript
 * const envelope: GatiRequestEnvelope = {
 *   id: 'req_abc123',
 *   method: 'POST',
 *   path: '/api/users',
 *   headers: { 'content-type': 'application/json' },
 *   receivedAt: Date.now(),
 *   body: { name: 'Alice' }
 * };
 * ```
 */
export interface GatiRequestEnvelope {
  /** Unique request identifier (UUID/nanoid) */
  id: string;
  
  /** HTTP method (GET, POST, PUT, DELETE, etc.) */
  method: string;
  
  /** Normalized request path */
  path: string;
  
  /** HTTP headers as key-value pairs */
  headers: Record<string, string>;
  
  /** Request received timestamp (epoch milliseconds) */
  receivedAt: number;
  
  /** Query parameters */
  query?: Record<string, string | string[]>;
  
  /** Path parameters extracted from route */
  params?: Record<string, string>;
  
  /** Request body (parsed or raw) */
  body?: unknown;
  
  /** Timescape version ID or timestamp */
  version?: string;
  
  /** Request priority (1 = highest) */
  priority?: number;
  
  /** Debug/feature flags */
  flags?: string[];
  
  /** Client IP address */
  clientIp?: string;
  
  /** Ingress-specific metadata */
  ingestMeta?: Record<string, any>;
}

/**
 * GatiResponseEnvelope - Standardized response structure from handlers
 * 
 * This envelope wraps all handler responses and provides consistent
 * response format across the framework.
 * 
 * @example
 * ```typescript
 * const envelope: GatiResponseEnvelope = {
 *   requestId: 'req_abc123',
 *   status: 200,
 *   producedAt: Date.now(),
 *   body: { user: { id: '1', name: 'Alice' } }
 * };
 * ```
 */
export interface GatiResponseEnvelope {
  /** Correlates with request envelope ID */
  requestId: string;
  
  /** HTTP status code */
  status: number;
  
  /** Response produced timestamp (epoch milliseconds) */
  producedAt: number;
  
  /** Response headers */
  headers?: Record<string, string>;
  
  /** Response body */
  body?: unknown;
  
  /** Non-fatal warnings */
  warnings?: string[];
}
