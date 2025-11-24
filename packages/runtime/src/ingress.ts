/**
 * @module runtime/ingress
 * @description Ingress component for receiving and normalizing HTTP requests
 */

import type { IncomingMessage } from 'http';
import { randomUUID } from 'crypto';
import type {
  IngressComponent,
  IngressConfig,
  AuthResult,
  NormalizedHeaders,
  RequestDescriptor,
  RequestIdMetadata,
  QueueFabric,
} from './types/ingress.js';
import type { HttpHeaders } from './types/request.js';

/**
 * Ingress component implementation
 * Receives external HTTP requests, authenticates, normalizes, and publishes to routing fabric
 */
export class Ingress implements IngressComponent {
  private config: IngressConfig;
  private queueFabric: QueueFabric;

  constructor(config: IngressConfig, queueFabric: QueueFabric) {
    this.config = config;
    this.queueFabric = queueFabric;
  }

  /**
   * Handle an incoming HTTP request
   * Main entry point for all external requests
   */
  async handleRequest(rawRequest: IncomingMessage): Promise<void> {
    // Authenticate the request
    const authResult = await this.authenticate(rawRequest);

    if (this.config.requireAuth && !authResult.authenticated) {
      throw new Error(`Authentication failed: ${authResult.error}`);
    }

    // Read request body
    const body = await this.readBody(rawRequest);

    // Normalize headers
    const headers = this.normalizeHeaders(rawRequest.headers as HttpHeaders);

    // Extract metadata from request
    const metadata = this.extractMetadata(rawRequest, headers);

    // Assign request ID
    const requestId = this.assignRequestId(metadata);

    // Add request ID to headers
    headers['x-request-id'] = requestId;

    // Create request descriptor
    const descriptor: RequestDescriptor = {
      requestId,
      path: metadata.path,
      method: rawRequest.method || 'GET',
      headers,
      body,
      versionPreference: metadata.versionPreference,
      priority: metadata.priority,
      flags: metadata.flags,
      authContext: authResult.authenticated ? authResult : undefined,
      timestamp: metadata.timestamp,
    };

    // Publish to routing fabric
    await this.publishToRoutingFabric(descriptor);
  }

  /**
   * Authenticate a request based on configured auth method
   */
  async authenticate(request: IncomingMessage): Promise<AuthResult> {
    const headers = request.headers;

    switch (this.config.authMethod) {
      case 'jwt':
        return this.authenticateJWT(headers);

      case 'api-key':
        return this.authenticateApiKey(headers);

      case 'oauth':
        return this.authenticateOAuth(headers);

      case 'none':
        return { authenticated: true };

      default:
        return {
          authenticated: false,
          error: `Unknown auth method: ${this.config.authMethod}`,
        };
    }
  }

  /**
   * Authenticate using JWT
   */
  private authenticateJWT(
    headers: IncomingMessage['headers']
  ): Promise<AuthResult> {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Promise.resolve({
        authenticated: false,
        error: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7);

    if (!this.config.jwtSecret) {
      return Promise.resolve({
        authenticated: false,
        error: 'JWT secret not configured',
      });
    }

    try {
      // Simple JWT validation (in production, use a proper JWT library)
      // This is a minimal implementation for the spec
      const parts = token.split('.');
      if (parts.length !== 3) {
        return Promise.resolve({
          authenticated: false,
          error: 'Invalid JWT format',
        });
      }

      // Decode payload (without verification for now - would use jsonwebtoken in production)
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8')
      ) as { sub?: string; userId?: string; roles?: string[] };

      return Promise.resolve({
        authenticated: true,
        clientId: payload.sub ?? payload.userId,
        roles: payload.roles ?? [],
      });
    } catch (error) {
      return Promise.resolve({
        authenticated: false,
        error: `JWT validation failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /**
   * Authenticate using API key
   */
  private authenticateApiKey(
    headers: IncomingMessage['headers']
  ): Promise<AuthResult> {
    const authHeader = headers['authorization'];
    const apiKeyHeader = headers['x-api-key'];
    const apiKey = apiKeyHeader ?? (typeof authHeader === 'string' ? authHeader.replace('ApiKey ', '') : undefined);

    if (!apiKey) {
      return Promise.resolve({
        authenticated: false,
        error: 'Missing API key',
      });
    }

    if (!this.config.apiKeys || !this.config.apiKeys.has(apiKey as string)) {
      return Promise.resolve({
        authenticated: false,
        error: 'Invalid API key',
      });
    }

    return Promise.resolve({
      authenticated: true,
      clientId: apiKey as string,
      roles: ['api-user'],
    });
  }

  /**
   * Authenticate using OAuth
   */
  private authenticateOAuth(
    headers: IncomingMessage['headers']
  ): Promise<AuthResult> {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Promise.resolve({
        authenticated: false,
        error: 'Missing or invalid Authorization header',
      });
    }

    // OAuth validation would integrate with OAuth provider
    // This is a placeholder implementation
    return Promise.resolve({
      authenticated: true,
      clientId: 'oauth-user',
      roles: ['user'],
    });
  }

  /**
   * Normalize HTTP headers to consistent format
   */
  normalizeHeaders(headers: HttpHeaders): NormalizedHeaders {
    const normalized: NormalizedHeaders = {
      'x-request-id': '', // Will be set later
    };

    // Normalize header names to lowercase
    for (const [key, value] of Object.entries(headers)) {
      const normalizedKey = key.toLowerCase();
      normalized[normalizedKey] = value;
    }

    // Ensure x-forwarded-for is set
    if (!normalized['x-forwarded-for']) {
      normalized['x-forwarded-for'] = 'unknown';
    }

    return normalized;
  }

  /**
   * Assign a unique request ID with embedded metadata
   */
  assignRequestId(_metadata: RequestIdMetadata): string {
    const prefix = this.config.requestIdPrefix || 'req';
    const uuid = randomUUID();
    
    // Format: prefix-uuid-timestamp
    // Metadata is embedded in the descriptor, not the ID itself
    return `${prefix}-${uuid}`;
  }

  /**
   * Publish request descriptor to routing fabric
   */
  async publishToRoutingFabric(descriptor: RequestDescriptor): Promise<void> {
    await this.queueFabric.publish(this.config.routingTopic, descriptor);
  }

  /**
   * Read request body from IncomingMessage
   */
  private async readBody(request: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      request.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      request.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      request.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Extract metadata from request
   */
  private extractMetadata(
    request: IncomingMessage,
    headers: NormalizedHeaders
  ): RequestIdMetadata {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    
    // Extract version preference from header or query
    const versionPreference =
      (headers['x-version'] as string) ||
      url.searchParams.get('version') ||
      undefined;

    // Extract priority from header (default to 5)
    const priorityHeader = headers['x-priority'] as string;
    const priority = priorityHeader ? parseInt(priorityHeader, 10) : 5;

    // Extract debug flags from header
    const flagsHeader = headers['x-flags'] as string;
    const flags = flagsHeader ? flagsHeader.split(',').map((f) => f.trim()) : [];

    return {
      path: url.pathname,
      versionPreference,
      priority: isNaN(priority) ? 5 : Math.max(0, Math.min(10, priority)),
      flags,
      timestamp: Date.now(),
    };
  }
}

/**
 * Create an Ingress instance
 */
export function createIngress(
  config: IngressConfig,
  queueFabric: QueueFabric
): Ingress {
  return new Ingress(config, queueFabric);
}
