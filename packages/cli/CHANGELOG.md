# @gati-framework/cli

## 1.0.15

### Patch Changes

- Fix critical build issues and improve stability
  - Remove exports for excluded metrics-client functionality
  - Fix ManifestStore type export
  - Exclude incomplete Timescape features from CLI build
  - Correct import paths in cloud provider packages
  - Fix Pino logger format

- Updated dependencies
  - @gati-framework/runtime@2.0.5

## 1.0.14

### Patch Changes

- Updated dependencies [cab87b8]
  - @gati-framework/core@0.4.5
  - @gati-framework/types@1.0.1

## 1.0.13

### Patch Changes

- Updated dependencies
  - @gati-framework/types@1.0.0
  - @gati-framework/core@0.4.4

## 1.0.0

### Major Changes

- Updated file generator and fixed create command

## 0.3.0

### Minor Changes

- feat(deploy): add advanced local deployment options
  - `--health-check-path <path>`: run HTTP GET probe after rollout
  - `--port-forward`: start persistent kubectl port-forward with cleanup
  - `--timeout <seconds>`: configurable rollout timeout (default 120s)
  - `--auto-tag`: image tag = `YYYYMMDD-HHMMSS-<gitsha>` (git SHA optional)
- docs(cli): README updates with new flags, examples, troubleshooting
- test(cli): advanced unit tests and an E2E-style deploy flow

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
