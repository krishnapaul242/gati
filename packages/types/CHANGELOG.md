# @gati-framework/types

## 1.0.1

### Patch Changes

- cab87b8: # Documentation Update: CI/CD Completion and Timescape Placeholders

  ## Major Updates

  ### CI/CD Documentation
  - Added comprehensive CI/CD completion changelog (November 22, 2025)
  - Updated all documentation to reflect CI/CD pipeline status
  - Added CI/CD status indicators across contributing guides
  - Updated package versions and status tables

  ### Timescape Planning Documentation
  - Created detailed Timescape implementation status document
  - Added beginner and intermediate Timescape example placeholders
  - Created database migrations guide placeholder
  - All planned for M3 (Q1 2026) with comprehensive specifications

  ### Documentation Site Improvements
  - Updated VitePress homepage with current package status
  - Marked M1 and M2 milestones as complete
  - Updated roadmap timelines (Q1 2026, Q2 2026, Q3 2026)
  - Resolved all dead links (using GitHub URLs for external files)
  - Added new changelog entries to sidebar navigation

  ### Build Status
  - Documentation builds successfully (23.43s)
  - All dead links resolved
  - Ready for GitHub Pages deployment

  ## Files Updated

  **Changelogs:**
  - `docs/changelog/2025-11-22-ci-cd-complete.md` (NEW)
  - `docs/changelog/current-state.md`
  - `docs/changelog/README.md`

  **Main Site:**
  - `docs/index.md`
  - `docs/.vitepress/config.ts`

  **Contributing:**
  - `docs/contributing/ci-cd.md`
  - `docs/contributing/README.md`

  **Placeholders Created:**
  - `.kiro/specs/timescape-api-versioning/CURRENT_STATUS.md`
  - `examples/timescape-beginner/README.md`
  - `examples/timescape-intermediate/README.md`
  - `docs/guides/database-migrations.md`

  This update provides complete transparency about the project's CI/CD status and comprehensive planning documentation for upcoming Timescape features.

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
