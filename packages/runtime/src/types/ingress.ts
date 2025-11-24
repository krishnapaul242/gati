/**
 * @module runtime/types/ingress
 * @description Ingress component types for request normalization and authentication
 */

import type { IncomingMessage } from 'http';
import type { HttpHeaders } from './request.js';

/**
 * Authentication methods supported by Ingress
 */
export type AuthMethod = 'jwt' | 'api-key' | 'oauth' | 'none';

/**
 * Authentication result
 */
export interface AuthResult {
  /**
   * Whether authentication succeeded
   */
  authenticated: boolean;

  /**
   * User/client identifier
   */
  clientId?: string;

  /**
   * User roles for authorization
   */
  roles?: string[];

  /**
   * Authentication error message
   */
  error?: string;
}

/**
 * Normalized HTTP headers
 */
export interface NormalizedHeaders extends HttpHeaders {
  'x-request-id': string;
  'x-forwarded-for'?: string;
  'user-agent'?: string;
  authorization?: string;
}

/**
 * Request descriptor published to routing fabric
 */
export interface RequestDescriptor {
  /**
   * Unique request identifier
   */
  requestId: string;

  /**
   * Request URL path
   */
  path: string;

  /**
   * HTTP method
   */
  method: string;

  /**
   * Normalized headers
   */
  headers: NormalizedHeaders;

  /**
   * Request body as buffer
   */
  body: Buffer;

  /**
   * Version preference from header or query
   */
  versionPreference?: string;

  /**
   * Request priority (0-10, higher is more important)
   */
  priority: number;

  /**
   * Debug and feature flags
   */
  flags: string[];

  /**
   * Authentication context
   */
  authContext?: AuthResult;

  /**
   * Timestamp when request was received
   */
  timestamp: number;
}

/**
 * Request ID metadata
 */
export interface RequestIdMetadata {
  /**
   * Request path
   */
  path: string;

  /**
   * Version preference
   */
  versionPreference?: string;

  /**
   * Priority level
   */
  priority: number;

  /**
   * Debug flags
   */
  flags: string[];

  /**
   * Timestamp
   */
  timestamp: number;
}

/**
 * Ingress configuration
 */
export interface IngressConfig {
  /**
   * Authentication method to use
   */
  authMethod: AuthMethod;

  /**
   * JWT secret for JWT authentication
   */
  jwtSecret?: string;

  /**
   * Valid API keys for API key authentication
   */
  apiKeys?: Set<string>;

  /**
   * OAuth configuration
   */
  oauth?: {
    issuer: string;
    audience: string;
  };

  /**
   * Whether to require authentication
   */
  requireAuth: boolean;

  /**
   * Request ID prefix
   */
  requestIdPrefix?: string;

  /**
   * Queue fabric topic for publishing requests
   */
  routingTopic: string;
}

/**
 * Queue fabric interface for publishing requests
 * Re-exported from queue-fabric types for convenience
 */
export type { QueueFabric } from './queue-fabric.js';

/**
 * Ingress component interface
 */
export interface IngressComponent {
  /**
   * Handle an incoming HTTP request
   */
  handleRequest(rawRequest: IncomingMessage): Promise<void>;

  /**
   * Authenticate a request
   */
  authenticate(request: IncomingMessage): Promise<AuthResult>;

  /**
   * Normalize HTTP headers
   */
  normalizeHeaders(headers: HttpHeaders): NormalizedHeaders;

  /**
   * Assign a unique request ID with metadata
   */
  assignRequestId(metadata: RequestIdMetadata): string;

  /**
   * Publish request descriptor to routing fabric
   */
  publishToRoutingFabric(descriptor: RequestDescriptor): Promise<void>;
}
