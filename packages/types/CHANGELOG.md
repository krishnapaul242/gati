# @gati-framework/types

## 1.0.0

### Major Changes

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
