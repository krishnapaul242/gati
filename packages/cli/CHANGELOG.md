# @gati-framework/cli

## 0.2.1

### Patch Changes

- docs: add comprehensive READMEs for CLI and Core packages so they render on npm
- Updated dependencies
  - @gati-framework/core@0.4.1

## 0.2.0

### Minor Changes

- feat(cli): extract CLI into standalone package and add deploy dry-run manifest generation
  - New package `@gati-framework/cli` with commands: create, dev, build, deploy
  - Deployment system templates copied and ESM-compatible (\_\_dirname fix)
  - Dry-run deploy renders Dockerfile, Deployment, Service manifests
  - Adjusted path aliases to point to package sources
  - Core exports `GatiApp` and `AppConfig` types

  BREAKING CHANGE: Projects should invoke CLI via installed package instead of src/cli path.

### Patch Changes

- Updated dependencies [63649ee]
  - @gati-framework/core@0.4.0
