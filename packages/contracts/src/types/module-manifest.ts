/**
 * @module contracts/types/module-manifest
 * @description Module manifest contract for module metadata
 */

/**
 * Module type union
 */
export type ModuleType = 'node' | 'oci' | 'wasm' | 'binary' | 'external';

/**
 * ModuleManifest - Metadata describing a module
 * 
 * Contains module identification, type, exports, capabilities,
 * resource requirements, and signature for verification.
 * 
 * @example
 * ```typescript
 * const manifest: ModuleManifest = {
 *   name: 'database-module',
 *   id: 'db-v1',
 *   version: '1.0.0',
 *   type: 'node',
 *   exports: {
 *     findUser: {
 *       inputRef: 'find-user-input-v1',
 *       outputRef: 'user-output-v1'
 *     },
 *     createUser: {
 *       inputRef: 'create-user-input-v1',
 *       outputRef: 'user-output-v1'
 *     }
 *   },
 *   capabilities: ['database.read', 'database.write'],
 *   resources: {
 *     cpu: '500m',
 *     mem: '512Mi'
 *   },
 *   signature: 'sha256:def456...'
 * };
 * ```
 */
export interface ModuleManifest {
  /** Module name */
  name: string;
  
  /** Module identifier */
  id: string;
  
  /** Module version */
  version: string;
  
  /** Module runtime type */
  type: ModuleType;
  
  /** Exported methods with schema references */
  exports: Record<string, {
    inputRef?: string;
    outputRef?: string;
  }>;
  
  /** Required capabilities/permissions */
  capabilities?: string[];
  
  /** Resource requirements */
  resources?: {
    cpu?: string;
    mem?: string;
  };
  
  /** Cryptographic signature for verification */
  signature?: string;
}
