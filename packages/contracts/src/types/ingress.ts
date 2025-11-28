/**
 * @module contracts/types/ingress
 * @description Ingress contract for pluggable ingress implementations
 */

import type { GatiRequestEnvelope } from './envelope.js';

/**
 * IngressContract - Interface for ingress implementations
 * 
 * Defines the lifecycle and behavior of ingress layers that transform
 * platform-specific requests into GatiRequestEnvelope format.
 * 
 * @example
 * ```typescript
 * class FastifyIngress implements IngressContract {
 *   async toEnvelope(raw: FastifyRequest): Promise<GatiRequestEnvelope> {
 *     return {
 *       id: raw.id,
 *       method: raw.method,
 *       path: raw.url,
 *       headers: raw.headers as Record<string, string>,
 *       receivedAt: Date.now(),
 *       body: raw.body
 *     };
 *   }
 *   
 *   async start(): Promise<void> {
 *     await this.server.listen({ port: 3000 });
 *   }
 *   
 *   async stop(): Promise<void> {
 *     await this.server.close();
 *   }
 * }
 * ```
 */
export interface IngressContract {
  /**
   * Transform platform-specific request into GatiRequestEnvelope
   * 
   * @param raw - Platform-specific request object (e.g., Fastify, Express)
   * @returns Promise resolving to standardized envelope
   */
  toEnvelope(raw: any): Promise<GatiRequestEnvelope>;
  
  /**
   * Start the ingress server
   * 
   * Initialize and begin accepting requests. Should resolve when
   * server is ready to accept connections.
   * 
   * @returns Promise resolving when server is ready
   */
  start(): Promise<void>;
  
  /**
   * Stop the ingress server gracefully
   * 
   * Stop accepting new requests and wait for in-flight requests
   * to complete before shutting down.
   * 
   * @returns Promise resolving when server is stopped
   */
  stop(): Promise<void>;
}
