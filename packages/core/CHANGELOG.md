# @gati-framework/core

## 0.4.4

### Patch Changes

- ### BREAKING CHANGES

  The type extraction process has been optimized with the introduction of an extraction cache. This enhancement significantly improves performance by avoiding redundant type extraction for unchanged files.

  ### Features Added
  - Implemented `ExtractionCache` class to manage cached type extraction results.
  - Added file-level caching with SHA-256 hash verification to detect changes.
  - Integrated cache loading and saving mechanisms to persist extracted types.
  - Enhanced `TypeExtractor` to utilize the new caching system for improved performance.
  - Created comprehensive tests for `TypeExtractor` covering various type scenarios, including primitive, branded, and complex types.
  - Added error handling and validation for extraction processes.
  - Defined type interfaces for extraction options, results, warnings, and errors.

## 0.4.1

### Patch Changes

- docs: add comprehensive READMEs for CLI and Core packages so they render on npm

## 0.4.0

### Minor Changes

- 63649ee: Rename package scope from @gati/core to @gati-framework/core
  - Changed npm package scope to @gati-framework organization
  - Updated all internal imports and references
  - Repository URL remains at krishnapaul242/gati

## 0.3.0

### Minor Changes

- Rename package scope from @gati/core to @gati-framework/core
  - Changed npm package scope to @gati-framework organization
  - Updated all internal imports and references
  - Repository URL remains at krishnapaul242/gati

## 0.2.0

### Minor Changes

- # Initial release of @gati-framework/core

  Introduce the initial @gati-framework/core package:
  - Export base TypeScript types (Handler, Request, Response, GlobalContext, LocalContext)
  - Provide reusable tsconfig.base.json for app scaffolds
  - Prepare for future runtime exports
