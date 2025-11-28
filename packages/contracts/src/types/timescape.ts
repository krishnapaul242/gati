/**
 * @module contracts/types/timescape
 * @description Timescape client contract for version resolution and schema diffing
 */

/**
 * Schema diff result
 */
export interface SchemaDiff {
  /** Path to changed field */
  path: string;
  
  /** Type of change */
  type: 'added' | 'removed' | 'changed' | 'constraint_changed';
  
  /** Old value */
  old?: any;
  
  /** New value */
  new?: any;
  
  /** Whether change is breaking */
  breaking: boolean;
  
  /** Suggested transformer or migration */
  suggestion?: any;
}

/**
 * TimescapeClientContract - Interface for Timescape version resolution
 * 
 * Provides schema diffing, version registration, and version listing
 * for API versioning and backward compatibility.
 * 
 * @example
 * ```typescript
 * const timescape: TimescapeClientContract = {
 *   async diff(oldRef, newRef) {
 *     return [
 *       {
 *         path: 'user.email',
 *         type: 'added',
 *         new: { type: 'string', required: true },
 *         breaking: true
 *       }
 *     ];
 *   },
 *   async registerVersion(handlerId, manifestHash) {
 *     return 'v1.2.3';
 *   },
 *   async listVersions(handlerId) {
 *     return ['v1.0.0', 'v1.1.0', 'v1.2.3'];
 *   }
 * };
 * ```
 */
export interface TimescapeClientContract {
  /**
   * Diff two schema versions
   * 
   * Compares schemas and identifies breaking and non-breaking changes.
   * 
   * @param oldRef - Old schema version reference
   * @param newRef - New schema version reference
   * @returns Promise resolving to array of diffs
   */
  diff(oldRef: string, newRef: string): Promise<SchemaDiff[]>;
  
  /**
   * Register new handler version
   * 
   * Publishes a new version to the Timescape registry.
   * 
   * @param handlerId - Handler identifier
   * @param manifestHash - Manifest hash for integrity
   * @returns Promise resolving to new version ID
   */
  registerVersion(handlerId: string, manifestHash: string): Promise<string>;
  
  /**
   * List available versions for handler
   * 
   * @param handlerId - Handler identifier
   * @returns Promise resolving to array of version IDs
   */
  listVersions(handlerId: string): Promise<string[]>;
}
