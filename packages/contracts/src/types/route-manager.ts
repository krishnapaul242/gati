/**
 * @module contracts/types/route-manager
 * @description Route manager contract for handler version resolution and forwarding
 */

import type { GatiRequestEnvelope, GatiResponseEnvelope } from './envelope.js';
import type { HandlerVersion } from './handler-version.js';

/**
 * RouteManagerContract - Interface for routing and handler version management
 * 
 * Defines behavior for resolving which handler version should process a request
 * and forwarding requests to the appropriate handler.
 * 
 * @example
 * ```typescript
 * class TimescapeRouteManager implements RouteManagerContract {
 *   async resolveHandlerVersion(path: string, env: GatiRequestEnvelope): Promise<HandlerVersion> {
 *     const handlerId = this.pathToHandlerId(path);
 *     const version = env.version || 'latest';
 *     return this.registry.getVersion(handlerId, version);
 *   }
 *   
 *   async forwardToHandler(version: HandlerVersion, env: GatiRequestEnvelope): Promise<GatiResponseEnvelope> {
 *     const handler = await this.loadHandler(version);
 *     return handler(env, this.createLocalContext(), this.globalContext);
 *   }
 *   
 *   async registerHandlerVersion(version: HandlerVersion): Promise<void> {
 *     await this.registry.register(version);
 *   }
 *   
 *   async deregisterHandlerVersion(versionId: string): Promise<void> {
 *     await this.registry.deregister(versionId);
 *   }
 * }
 * ```
 */
export interface RouteManagerContract {
  /**
   * Resolve which handler version should process the request
   * 
   * Uses path, version hints, and Timescape resolution to determine
   * the appropriate handler version.
   * 
   * @param path - Request path
   * @param env - Request envelope with version hints
   * @returns Promise resolving to handler version metadata
   */
  resolveHandlerVersion(
    path: string,
    env: GatiRequestEnvelope
  ): Promise<HandlerVersion>;
  
  /**
   * Forward request to resolved handler version
   * 
   * Loads and executes the handler, passing the request envelope
   * and contexts.
   * 
   * @param version - Handler version to invoke
   * @param env - Request envelope
   * @returns Promise resolving to response envelope
   */
  forwardToHandler(
    version: HandlerVersion,
    env: GatiRequestEnvelope
  ): Promise<GatiResponseEnvelope>;
  
  /**
   * Register a new handler version
   * 
   * Makes a handler version available for routing. Should validate
   * the version metadata before registration.
   * 
   * @param version - Handler version metadata
   * @returns Promise resolving when registration is complete
   */
  registerHandlerVersion(version: HandlerVersion): Promise<void>;
  
  /**
   * Deregister a handler version
   * 
   * Removes a handler version from routing. Should handle graceful
   * draining of in-flight requests.
   * 
   * @param versionId - Version identifier to remove
   * @returns Promise resolving when deregistration is complete
   */
  deregisterHandlerVersion(versionId: string): Promise<void>;
}
