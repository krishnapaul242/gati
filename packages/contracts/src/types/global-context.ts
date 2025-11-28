/**
 * @module contracts/types/global-context
 * @description Global context contract for application-wide state and resources
 */

import type { ModuleClient } from './module-client.js';

/**
 * GlobalContext - Application-wide state and resources
 * 
 * Provides access to modules, secrets, metrics, Timescape,
 * and global event bus shared across all requests.
 * 
 * @example
 * ```typescript
 * const gctx: GlobalContext = {
 *   appId: 'my-app',
 *   env: 'production',
 *   modules: {
 *     db: dbModuleClient,
 *     cache: cacheModuleClient
 *   },
 *   secrets: {
 *     async get(name) {
 *       return process.env[name];
 *     }
 *   },
 *   metrics: {
 *     incr(metric, tags) {
 *       console.log(`Increment ${metric}`, tags);
 *     },
 *     gauge(name, value) {
 *       console.log(`Gauge ${name} = ${value}`);
 *     }
 *   },
 *   timescape: {
 *     async resolveVersion(handlerId, prefer) {
 *       return 'v1.0.0';
 *     },
 *     async diffSchemas(oldId, newId) {
 *       return [];
 *     }
 *   },
 *   async publish(topic, payload) {
 *     console.log(`Publish to ${topic}`, payload);
 *   },
 *   async callAgent(agentId, payload) {
 *     return { result: 'ok' };
 *   }
 * };
 * ```
 */
export interface GlobalContext {
  /** Application identifier */
  appId: string;
  
  /** Environment (development, staging, production) */
  env: string;
  
  /** Module registry for inter-module communication */
  modules: Record<string, ModuleClient>;
  
  /** Secrets management interface */
  secrets: {
    /**
     * Get secret value by name
     * 
     * @param name - Secret name
     * @returns Promise resolving to secret value or undefined
     */
    get(name: string): Promise<string | undefined>;
  };
  
  /** Metrics collection interface */
  metrics: {
    /**
     * Increment counter metric
     * 
     * @param metric - Metric name
     * @param tags - Optional metric tags
     */
    incr(metric: string, tags?: Record<string, string>): void;
    
    /**
     * Set gauge metric value
     * 
     * @param name - Metric name
     * @param value - Metric value
     */
    gauge(name: string, value: number): void;
  };
  
  /** Timescape version resolution interface */
  timescape: {
    /**
     * Resolve handler version
     * 
     * @param handlerId - Handler identifier
     * @param prefer - Preferred version or timestamp
     * @returns Promise resolving to version ID
     */
    resolveVersion(handlerId: string, prefer?: string): Promise<string>;
    
    /**
     * Diff two schema versions
     * 
     * @param oldId - Old schema version ID
     * @param newId - New schema version ID
     * @returns Promise resolving to diff results
     */
    diffSchemas(oldId: string, newId: string): Promise<any>;
  };
  
  /**
   * Publish event to global event bus
   * 
   * @param topic - Event topic
   * @param payload - Event payload
   * @returns Promise resolving when event is published
   */
  publish(topic: string, payload: any): Promise<void>;
  
  /**
   * Call agent with payload
   * 
   * @param agentId - Agent identifier
   * @param payload - Request payload
   * @returns Promise resolving to agent response
   */
  callAgent(agentId: string, payload: any): Promise<any>;
}
