# @gati-framework/contracts

**Type-safe contracts for Gati framework** - Language-neutral interfaces, JSON schemas, and Protobuf definitions for building multi-runtime Gati applications.

[![npm version](https://img.shields.io/npm/v/@gati-framework/contracts.svg)](https://www.npmjs.com/package/@gati-framework/contracts)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## Overview

This package provides the foundational contracts for the Gati framework, enabling:

- **Core Runtime Contracts** - Request/response envelopes, handlers, contexts, modules
- **Type System** - GType schema definitions for validation
- **Timescape Integration** - API versioning contracts
- **Infrastructure Contracts** - Observability (metrics, tracing, logging) and deployment
- **Multi-Format Support** - TypeScript, JSON Schema, and Protobuf definitions
- **Validation Utilities** - Built-in validators and CLI tool

## Installation

```bash
npm install @gati-framework/contracts
# or
pnpm add @gati-framework/contracts
```

## Quick Start

### Using Core Contracts

```typescript
import type {
  GatiRequestEnvelope,
  GatiResponseEnvelope,
  HandlerFunction,
  LocalContext,
  GlobalContext
} from '@gati-framework/contracts';

// Define a handler
const handler: HandlerFunction = async (env, lctx, gctx) => {
  return {
    requestId: env.id,
    status: 200,
    producedAt: Date.now(),
    body: { message: 'Hello from Gati!' }
  };
};
```

### Validating Contracts

```typescript
import { validateEnvelope, validateManifest } from '@gati-framework/contracts';

const envelope = {
  id: 'req_123',
  method: 'GET',
  path: '/api/users',
  headers: {},
  receivedAt: Date.now()
};

const result = validateEnvelope(envelope, 'request');
if (result.valid) {
  console.log('✓ Valid envelope');
} else {
  console.error('✗ Validation errors:', result.errors);
}
```

### CLI Tool

```bash
# Validate a contract file
gati-contracts-validate envelope.json request
gati-contracts-validate manifest.json module
```

## Core Contracts

### Request/Response Envelopes

**GatiRequestEnvelope** - Standardized request structure:

```typescript
interface GatiRequestEnvelope {
  id: string;                    // Required: Request ID
  method: string;                // Required: HTTP method
  path: string;                  // Required: Request path
  headers: Record<string, string>; // Required: Headers
  receivedAt: number;            // Required: Timestamp
  
  query?: Record<string, string | string[]>; // Optional: Query params
  params?: Record<string, string>;           // Optional: Path params
  body?: unknown;                            // Optional: Request body
  version?: string;                          // Optional: Timescape version
  priority?: number;                         // Optional: Priority (1=highest)
  flags?: string[];                          // Optional: Debug flags
  clientIp?: string;                         // Optional: Client IP
  ingestMeta?: Record<string, any>;          // Optional: Ingress metadata
}
```

**GatiResponseEnvelope** - Standardized response structure:

```typescript
interface GatiResponseEnvelope {
  requestId: string;             // Required: Correlates with request
  status: number;                // Required: HTTP status code
  producedAt: number;            // Required: Timestamp
  
  headers?: Record<string, string>; // Optional: Response headers
  body?: unknown;                   // Optional: Response body
  warnings?: string[];              // Optional: Non-fatal warnings
}
```

### Error Contract

```typescript
interface GatiError {
  message: string;               // Required: Error message
  code?: string;                 // Optional: Machine-readable code (e.g., "user.not_found")
  status?: number;               // Optional: HTTP status code
  details?: any;                 // Optional: Structured details
  traceId?: string;              // Optional: Request correlation ID
}
```

### Handler Contract

```typescript
type HandlerFunction = (
  env: GatiRequestEnvelope,
  lctx: LocalContext,
  gctx: GlobalContext
) => Promise<GatiResponseEnvelope>;
```

### Context Contracts

**LocalContext** - Request-scoped state:
- Key-value storage: `get()`, `set()`, `delete()`, `clean()`
- Lifecycle hooks: `before()`, `after()`, `catch()`
- State management: `snapshot()`, `restore()`
- Events & logging: `publishLocal()`, `log()`

**GlobalContext** - Application-wide resources:
- Application metadata: `appId`, `env`
- Module registry: `modules`
- Secrets management: `secrets.get()`
- Metrics: `metrics.incr()`, `metrics.gauge()`
- Timescape: `timescape.resolveVersion()`, `timescape.diffSchemas()`
- Events: `publish()`, `callAgent()`

### Module Contracts

**ModuleClient** - Inter-module communication:

```typescript
interface ModuleClient {
  id: string;
  call(method: string, payload: any, opts?: { timeoutMs?: number }): Promise<any>;
  health(): Promise<{ ok: boolean; meta?: any }>;
}
```

**ModuleManifest** - Module metadata:

```typescript
interface ModuleManifest {
  name: string;
  id: string;
  version: string;
  type: 'node' | 'oci' | 'wasm' | 'binary' | 'external';
  exports: Record<string, { inputRef?: string; outputRef?: string }>;
  capabilities?: string[];
  resources?: { cpu?: string; mem?: string };
  signature?: string;
}
```

## Infrastructure Contracts

### Deployment Contracts

### Deployment Target

```typescript
import { IDeploymentTarget, DeploymentResource } from '@gati-framework/contracts/deployment';

class MyDeploymentTarget implements IDeploymentTarget {
  async apply(resource: DeploymentResource): Promise<void> {
    // Your implementation
  }
  
  async delete(kind: string, namespace: string, name: string): Promise<void> {
    // Your implementation
  }
  
  async get(kind: string, namespace: string, name: string): Promise<DeploymentResource | null> {
    // Your implementation
  }
  
  async list(kind: string, namespace: string, labels?: Record<string, string>): Promise<DeploymentResource[]> {
    // Your implementation
  }
  
  async watch(kind: string, namespace: string, callback: WatchCallback): Promise<void> {
    // Your implementation
  }
}
```

### Manifest Generator

```typescript
import { IManifestGenerator, HandlerSpec, ModuleSpec } from '@gati-framework/contracts/deployment';

class MyManifestGenerator implements IManifestGenerator {
  generateDeployment(spec: HandlerSpec | ModuleSpec): DeploymentSpec {
    // Your implementation
  }
  
  generateService(spec: HandlerSpec | ModuleSpec): ServiceSpec {
    // Your implementation
  }
  
  generateConfigMap(spec: HandlerSpec | ModuleSpec): ConfigMapSpec {
    // Your implementation
  }
}
```

## Observability Contracts

### Metrics Provider

```typescript
import { IMetricsProvider } from '@gati-framework/contracts';

class MyMetricsProvider implements IMetricsProvider {
  incrementCounter(name: string, labels?: Record<string, string>, value = 1): void {
    // Your implementation
  }
  
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    // Your implementation
  }
  
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    // Your implementation
  }
  
  async getMetrics(): Promise<string> {
    // Return formatted metrics
  }
}
```

### Tracing Provider

```typescript
import { ITracingProvider, ISpan } from '@gati-framework/contracts';

class MyTracingProvider implements ITracingProvider {
  createSpan(name: string, attributes?: Record<string, any>): ISpan {
    // Your implementation
  }
  
  async withSpan<T>(name: string, fn: (span: ISpan) => Promise<T>): Promise<T> {
    // Your implementation
  }
  
  getTraceContext(): string | undefined {
    // Your implementation
  }
}
```

### Logger

```typescript
import { ILogger } from '@gati-framework/contracts';

class MyLogger implements ILogger {
  debug(message: string, context?: Record<string, any>): void {
    // Your implementation
  }
  
  info(message: string, context?: Record<string, any>): void {
    // Your implementation
  }
  
  // ... other methods
}
```

## Validation & Serialization

### Validation Functions

```typescript
import {
  validateEnvelope,
  validateGatiError,
  validateManifest,
  validateGTypeSchema
} from '@gati-framework/contracts';

// Validate request envelope
const result = validateEnvelope(data, 'request');
if (!result.valid) {
  result.errors?.forEach(err => {
    console.error(`${err.path}: ${err.message}`);
  });
}

// Validate module manifest
const manifestResult = validateManifest(manifest, 'module');
```

### Serialization Helpers

```typescript
import {
  serializeJSON,
  deserializeJSON,
  serializeProtobuf,
  deserializeProtobuf
} from '@gati-framework/contracts';

// JSON serialization
const { success, data, error } = serializeJSON(envelope);

// Protobuf serialization (stub implementation)
const buffer = serializeProtobuf(envelope);
```

## JSON Schemas & Protobuf

All contracts are available in multiple formats:

- **TypeScript**: Full type definitions with JSDoc
- **JSON Schema**: `src/schemas/*.schema.json` (draft-07)
- **Protobuf**: `src/proto/*.proto` (proto3)

### Using JSON Schemas

```typescript
import envelopeSchema from '@gati-framework/contracts/src/schemas/envelope.schema.json';
import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile(envelopeSchema.definitions.GatiRequestEnvelope);

if (validate(data)) {
  console.log('Valid!');
}
```

### Using Protobuf Definitions

```protobuf
// src/proto/envelope.proto
syntax = "proto3";
package gati;

message GatiRequestEnvelope {
  string id = 1;
  string method = 2;
  string path = 3;
  // ...
}
```

## Test Fixtures

Example data for testing:

```typescript
import envelopeExamples from '@gati-framework/contracts/test/fixtures/envelope.example.json';
import manifestExamples from '@gati-framework/contracts/test/fixtures/manifest.example.json';

const validRequest = envelopeExamples.examples.validRequest;
const nodeModule = manifestExamples.examples.nodeModule;
```

## Package Exports

```typescript
// Main exports (all contracts)
import * from '@gati-framework/contracts';

// Core runtime contracts only
import * from '@gati-framework/contracts/types';

// Validation utilities
import * from '@gati-framework/contracts/utils';

// Observability contracts
import * from '@gati-framework/contracts/observability';

// Deployment contracts
import * from '@gati-framework/contracts/deployment';
```

## Compatible Implementations

- **Deployment**: Kubernetes, Helm, GitOps (ArgoCD/Flux), Terraform
- **Metrics**: Prometheus, Datadog, CloudWatch, New Relic
- **Tracing**: OpenTelemetry, Jaeger, Zipkin, Datadog APM
- **Logging**: Pino, Winston, Loki, CloudWatch Logs

## Versioning Strategy

This package follows [Semantic Versioning](https://semver.org/):

- **Major**: Breaking changes to required fields or method signatures
- **Minor**: New optional fields or new contracts
- **Patch**: Bug fixes, documentation updates

## Contributing

Contributions are welcome! Please ensure:

1. All TypeScript types compile without errors
2. JSON schemas are valid (draft-07)
3. Protobuf definitions use proto3 syntax
4. Tests pass: `npm test`
5. Build succeeds: `npm run build`

## License

MIT © Krishna Paul
