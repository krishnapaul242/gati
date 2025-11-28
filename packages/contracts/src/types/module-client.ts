/**
 * @module contracts/types/module-client
 * @description Module client contract for inter-module communication
 */

/**
 * ModuleClient - Interface for calling other modules via RPC
 * 
 * Provides method invocation and health checking for modules.
 * 
 * @example
 * ```typescript
 * const dbModule: ModuleClient = {
 *   id: 'db-module',
 *   async call(method, payload, opts) {
 *     if (method === 'findUser') {
 *       return { id: payload.id, name: 'Alice' };
 *     }
 *     throw new Error(`Unknown method: ${method}`);
 *   },
 *   async health() {
 *     return { ok: true, meta: { connections: 10 } };
 *   }
 * };
 * ```
 */
export interface ModuleClient {
  /** Module identifier */
  id: string;
  
  /**
   * Call module method with payload
   * 
   * Invokes a method on the module using RPC semantics.
   * 
   * @param method - Method name to invoke
   * @param payload - Method payload
   * @param opts - Optional call options
   * @returns Promise resolving to method result
   */
  call(
    method: string,
    payload: any,
    opts?: { timeoutMs?: number }
  ): Promise<any>;
  
  /**
   * Check module health status
   * 
   * @returns Promise resolving to health status
   */
  health(): Promise<{ ok: boolean; meta?: any }>;
}
