/**
 * @module cli/extractor/types
 * @description Type definitions for type extraction
 */

import type { GType } from '@gati-framework/types/gtype';

/**
 * Configuration options for type extraction
 */
export interface ExtractionOptions {
  /**
   * Maximum depth for nested types
   * @default { warn: 20, error: 50 }
   */
  depthLimit?: {
    warn: number;
    error: number;
  };

  /**
   * Maximum schema size in bytes
   * @default { warn: 51200, error: 512000 } // 50KB warn, 500KB error
   */
  sizeLimit?: {
    warn: number;
    error: number;
  };

  /**
   * Allow external types from node_modules
   * @default false
   */
  allowExternalTypes?: boolean;

  /**
   * Enable incremental extraction with caching
   * @default true
   */
  incremental?: boolean;

  /**
   * Cache directory for incremental extraction
   * @default '.gati/cache/types'
   */
  cacheDir?: string;

  /**
   * Source root directory (for relative paths)
   */
  sourceRoot: string;

  /**
   * TypeScript config file path
   * @default 'tsconfig.json'
   */
  tsConfigPath?: string;
}

/**
 * Warning emitted during extraction
 */
export interface ExtractionWarning {
  /**
   * Warning type
   */
  type: 'depth-limit' | 'size-limit' | 'external-type' | 'unsupported-type' | 'circular-reference';

  /**
   * Warning message
   */
  message: string;

  /**
   * Source location (file path and position)
   */
  location?: {
    filePath: string;
    line: number;
    column: number;
  };

  /**
   * Type name that caused the warning
   */
  typeName?: string;
}

/**
 * Error during extraction
 */
export interface ExtractionError {
  /**
   * Error type
   */
  type: 'depth-exceeded' | 'size-exceeded' | 'parse-error' | 'external-type-forbidden' | 'unknown';

  /**
   * Error message
   */
  message: string;

  /**
   * Source location
   */
  location?: {
    filePath: string;
    line: number;
    column: number;
  };

  /**
   * Type name that caused the error
   */
  typeName?: string;

  /**
   * Stack trace (for debugging)
   */
  stack?: string;
}

/**
 * Result of type extraction
 */
export interface ExtractionResult {
  /**
   * Extracted GType schema
   */
  schema: GType | null;

  /**
   * Warnings emitted during extraction
   */
  warnings: ExtractionWarning[];

  /**
   * Errors encountered during extraction
   */
  errors: ExtractionError[];

  /**
   * Metadata about the extraction
   */
  metadata: {
    /**
     * Source file path
     */
    filePath: string;

    /**
     * Type name extracted
     */
    typeName: string;

    /**
     * Maximum depth reached
     */
    maxDepth: number;

    /**
     * Schema size in bytes
     */
    sizeBytes: number;

    /**
     * Extraction duration in milliseconds
     */
    durationMs: number;

    /**
     * Whether result came from cache
     */
    fromCache: boolean;
  };
}

/**
 * Cache entry for extracted types
 */
export interface CacheEntry {
  /**
   * File path (absolute)
   */
  filePath: string;

  /**
   * Type name
   */
  typeName: string;

  /**
   * File content hash (for change detection)
   */
  contentHash: string;

  /**
   * Extracted schema
   */
  schema: GType;

  /**
   * Extraction metadata
   */
  metadata: {
    maxDepth: number;
    sizeBytes: number;
    extractedAt: number; // timestamp
  };

  /**
   * Warnings from extraction
   */
  warnings: ExtractionWarning[];
}

/**
 * Type context during traversal
 */
export interface TypeContext {
  /**
   * Current depth in type tree
   */
  depth: number;

  /**
   * Visited type references (for circular detection)
   */
  visited: Set<string>;

  /**
   * Type reference stack (for error reporting)
   */
  stack: string[];

  /**
   * Accumulated warnings
   */
  warnings: ExtractionWarning[];

  /**
   * Extraction options
   */
  options: Required<ExtractionOptions>;
}
