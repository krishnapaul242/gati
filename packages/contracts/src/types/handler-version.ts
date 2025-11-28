/**
 * @module contracts/types/handler-version
 * @description Handler version metadata contract
 */

/**
 * HandlerVersion - Metadata about a specific handler version
 * 
 * Contains version identification, deployment information,
 * and schema references for Timescape versioning.
 * 
 * @example
 * ```typescript
 * const version: HandlerVersion = {
 *   handlerId: 'users-get',
 *   versionId: 'v1.2.3',
 *   createdAt: 1704067200000,
 *   image: 'registry.example.com/users-handler:v1.2.3',
 *   entrypoint: 'dist/handlers/users/get.js',
 *   exportedFunctions: ['handler'],
 *   manifestHash: 'sha256:abc123...',
 *   schemaRefs: ['user-schema-v1', 'response-schema-v2']
 * };
 * ```
 */
export interface HandlerVersion {
  /** Handler identifier */
  handlerId: string;
  
  /** Version identifier */
  versionId: string;
  
  /** Version creation timestamp (epoch milliseconds) */
  createdAt: number;
  
  /** Container image reference */
  image?: string;
  
  /** Handler entrypoint path */
  entrypoint?: string;
  
  /** Exported function names */
  exportedFunctions?: string[];
  
  /** Manifest hash for integrity verification */
  manifestHash?: string;
  
  /** Schema references for Timescape */
  schemaRefs?: string[];
}
