/**
 * @module cli/extractor
 * @description Type extraction engine - converts TypeScript types to GType schemas
 */

export { TypeExtractor } from './type-extractor.js';
export { ExtractionCache } from './extraction-cache.js';
export { ConstraintExtractor } from './constraint-extractor.js';
export type {
  ExtractionOptions,
  ExtractionResult,
  ExtractionError,
  ExtractionWarning,
} from './types.js';
