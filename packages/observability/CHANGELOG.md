# @gati-framework/observability

## 2.0.0

### Major Changes

- BREAKING CHANGE: Restructure observability package - remove external adapters

  External adapters have been moved to @gati-framework/observability-adapters:
  - CloudWatchMetricsAdapter
  - CloudWatchLogsAdapter
  - XRayAdapter
  - DatadogMetricsAdapter
  - DatadogAPMAdapter
  - NewRelicAdapter
  - JaegerAdapter
  - ZipkinAdapter
  - SentryAdapter

  Core package now only includes:
  - PrometheusAdapter
  - OpenTelemetryAdapter
  - PinoAdapter

  Migration:

  ```typescript
  // OLD
  import { CloudWatchMetricsAdapter } from '@gati-framework/observability';

  // NEW
  import { CloudWatchMetricsAdapter } from '@gati-framework/observability-adapters';
  ```

  Added:
  - Integration tests for multi-provider scenarios
  - Performance tests (<1ms overhead validated)
  - Memory leak detection tests

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @gati-framework/contracts@1.1.0
  - @gati-framework/observability-adapters@1.1.0

## 1.0.2

### Patch Changes

- Updated dependencies [cab87b8]
  - @gati-framework/core@0.4.5

## 1.0.1

### Patch Changes

- Updated dependencies
  - @gati-framework/core@0.4.4
