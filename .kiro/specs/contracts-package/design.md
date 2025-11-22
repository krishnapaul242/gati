# Design Document

## Overview

The @gati/contracts package is the foundational contract layer for the Gati framework, providing language-neutral interface definitions, JSON schemas, and Protobuf specifications. This package serves as the single source of truth for all runtime implementations (Node.js, Rust, Go), ensuring consistent API surfaces and behavior across different languages while enabling independent evolution of runtime implementations.

The package is designed with three primary serialization formats: TypeScript interfaces for development-time type safety, JSON Schema for runtime validation and cross-language compatibility, and Protocol Buffers for efficient binary RPC communication. All three formats are kept in sync through automated generation and validation tests.

## Architecture

### High-Level Structure

```
@gati/contracts
├── src/
│   ├── types/           # TypeScript interface definitions
│   │   ├── envelope.ts
│   │   ├── error.ts
│   │   ├── handler.ts
│   │   ├── ingress.ts
│   │   ├── routeManager.ts
│   │   ├── lcc.ts
│   │   ├── gctx.ts
│   │   ├── moduleClient.ts
│   │   ├── manifest.ts
│   │   ├── gtype.ts
│   │   ├── timescape.ts
│   │   └── observability.ts
│   ├── schemas/         # JSON Schema definitions
│   │   ├── envelope.schema.json
│   │   ├── manifest.schema.json
│   │   └── gtype.schema.json
│   ├── proto/           # Protobuf definitions
│   │   ├── gati.proto
│   │   ├── envelope.proto
│   │   ├── manifest.proto
│   │   └── gtype.proto
│   ├── utils/           # Helper utilities
│   │   ├── validation.ts
│   │   ├── serialization.ts
│   │   └── cli.ts
│   └── index.ts         # Main export file
├── test/
│   ├── fixtures/        # Test data
│   │   ├── envelope.example.json
│   │   ├── manifest.example.json
│   │   └── gtype.example.json
│   └── contract.spec.ts # Validation tests
└── scripts/
    ├── gen-jsonschema.ts
    └── validate-contracts.ts
```

### Design Principles

1. **Minimal Surface Area**: Only include fields required for deterministic runtime behavior
2. **Full Serializability**: Every contract must have TypeScript, JSON Schema, and Protobuf representations
3. **Backward Compatibility**: Use semantic versioning; extend with optional fields only
4. **Language Neutrality**: Avoid language-specific constructs; focus on data structures
5. **Testability**: Include comprehensive test fixtures and validation helpers

## Components and Interfaces

### 1. Envelope Contracts

#### GatiRequestEnvelope

The canonical request structure used internally between ingress, route manager, and handlers.

```typescript
export interface GatiRequestEnvelope {
  // Required fields
  id: string;                    // UUID/nanoid request identifier
  method: string;                // HTTP method (GET, POST, etc.)
  path: string;                  // Normalized request path
  headers: Record<string, string>; // HTTP headers
  receivedAt: number;            // Epoch milliseconds
  
  // Optional fields
  query?: Record<string, string | string[]>; // Query parameters
  params?: Record<string, string>;           // Path parameters
  body?: unknown;                            // Request body (raw or parsed)
  version?: string;                          // Timescape version ID or timestamp
  priority?: number;                         // Request priority (1 = highest)
  flags?: string[];                          // Debug flags (e.g., ['debug', 'playground'])
  clientIp?: string;                         // Client IP address
  ingestMeta?: Record<string, any>;          // Ingress-specific metadata
}
```

**Design Rationale:**
- `id` is required for tracing and correlation
- `receivedAt` provides accurate timing for metrics
- Optional fields allow flexibility without breaking changes
- `ingestMeta` provides extensibility for ingress-specific data

#### GatiResponseEnvelope

The canonical response structure returned from handlers.

```typescript
export interface GatiResponseEnvelope {
  // Required fields
  requestId: string;             // Correlates with request envelope ID
  status: number;                // HTTP status code
  producedAt: number;            // Epoch milliseconds
  
  // Optional fields
  headers?: Record<string, string>; // Response headers
  body?: unknown;                   // Response body
  warnings?: string[];              // Non-fatal warnings
}
```

**Design Rationale:**
- `requestId` enables request/response correlation
- `producedAt` allows latency calculation
- `warnings` provide non-breaking error communication

### 2. Error Contract

#### GatiError

Standardized error format for consistent error handling.

```typescript
export interface GatiError {
  message: string;               // Human-readable error message
  code?: string;                 // Machine-readable code (e.g., "validation.failed")
  status?: number;               // HTTP status code
  details?: any;                 // Structured error details
  traceId?: string;              // Correlation with request ID
}
```

**Design Rationale:**
- `message` is required for basic error communication
- `code` enables programmatic error handling
- `details` provides structured context without breaking schema
- Dot-notation codes (e.g., "auth.token.expired") enable hierarchical error handling

### 3. Handler Contract

#### HandlerFunction

The signature for all handler implementations.

```typescript
export type HandlerFunction = (
  env: GatiRequestEnvelope,
  lctx: LocalContext,
  gctx: GlobalContext
) => Promise<GatiResponseEnvelope>;
```

**Design Rationale:**
- Three-parameter signature provides clear separation of concerns
- `env` contains request data
- `lctx` provides request-scoped state and hooks
- `gctx` provides application-wide resources
- Promise return type enables async operations

### 4. Ingress Contract

#### IngressContract

Defines the lifecycle and behavior of ingress implementations.

```typescript
export interface IngressContract {
  /**
   * Transform incoming raw HTTP request into GatiRequestEnvelope
   * @param raw - Platform-specific request object (e.g., Fastify request)
   * @returns Promise resolving to GatiRequestEnvelope
   */
  toEnvelope(raw: any): Promise<GatiRequestEnvelope>;
  
  /**
   * Start the ingress server
   * @returns Promise resolving when server is ready
   */
  start(): Promise<void>;
  
  /**
   * Stop the ingress server gracefully
   * @returns Promise resolving when server is stopped
   */
  stop(): Promise<void>;
}
```

**Design Rationale:**
- `toEnvelope` abstracts platform-specific request handling
- `start`/`stop` provide standard lifecycle management
- Async methods enable proper initialization and cleanup

### 5. Route Manager Contract

#### RouteManagerContract

Defines routing behavior and handler version management.

```typescript
export interface RouteManagerContract {
  /**
   * Resolve which handler version should process the request
   * @param path - Request path
   * @param env - Request envelope
   * @returns Promise resolving to HandlerVersion
   */
  resolveHandlerVersion(
    path: string,
    env: GatiRequestEnvelope
  ): Promise<HandlerVersion>;
  
  /**
   * Forward request to resolved handler version
   * @param version - Handler version to invoke
   * @param env - Request envelope
   * @returns Promise resolving to response envelope
   */
  forwardToHandler(
    version: HandlerVersion,
    env: GatiRequestEnvelope
  ): Promise<GatiResponseEnvelope>;
  
  /**
   * Register a new handler version
   * @param version - Handler version metadata
   */
  registerHandlerVersion(version: HandlerVersion): Promise<void>;
  
  /**
   * Deregister a handler version
   * @param versionId - Version identifier to remove
   */
  deregisterHandlerVersion(versionId: string): Promise<void>;
}
```

**Design Rationale:**
- Separation of version resolution and forwarding enables caching and optimization
- Registration methods enable dynamic handler management
- All methods are async to support remote operations

### 6. Local Context Contract

#### LocalContext

Per-request state management and lifecycle hooks.

```typescript
export interface LocalContext {
  requestId: string;
  meta: Record<string, any>;
  
  // Key-value storage
  get<T = any>(k: string): T | undefined;
  set<T = any>(k: string, v: T): void;
  delete(k: string): void;
  clean(): void;
  
  // Hook registration
  before(fn: (env: GatiRequestEnvelope, gctx: GlobalContext) => Promise<void> | void): string;
  after(fn: (env: GatiRequestEnvelope, res: GatiResponseEnvelope, gctx: GlobalContext) => Promise<void> | void): string;
  catch(fn: (err: any, env: GatiRequestEnvelope, gctx: GlobalContext) => Promise<void> | void): string;
  
  // State management
  snapshot(): unknown;
  restore(snapshot: unknown): void;
  
  // Events and logging
  publishLocal(topic: string, payload: any): Promise<void>;
  log(message: string, level?: "debug" | "info" | "warn" | "error"): void;
}
```

**Design Rationale:**
- Generic `get`/`set` provides type-safe storage
- Hook methods return IDs for deregistration
- `snapshot`/`restore` enable state rollback for error recovery
- `publishLocal` enables request-scoped event bus
- `log` provides request-correlated logging

### 7. Global Context Contract

#### GlobalContext

Application-wide state and resources.

```typescript
export interface GlobalContext {
  appId: string;
  env: string;
  modules: Record<string, ModuleClient>;
  
  secrets: {
    get(name: string): Promise<string | undefined>;
  };
  
  metrics: {
    incr(metric: string, tags?: Record<string, string>): void;
    gauge(name: string, value: number): void;
  };
  
  timescape: {
    resolveVersion(handlerId: string, prefer?: string): Promise<string>;
    diffSchemas(oldId: string, newId: string): Promise<any>;
  };
  
  publish(topic: string, payload: any): Promise<void>;
  callAgent(agentId: string, payload: any): Promise<any>;
}
```

**Design Rationale:**
- `appId` and `env` provide application context
- `modules` provides access to other modules
- `secrets` abstracts secret management
- `metrics` provides observability
- `timescape` integrates version resolution
- `publish` enables global event bus
- `callAgent` enables agent communication

### 8. Module Client Contract

#### ModuleClient

Interface for inter-module communication.

```typescript
export interface ModuleClient {
  id: string;
  
  call(
    method: string,
    payload: any,
    opts?: { timeoutMs?: number }
  ): Promise<any>;
  
  health(): Promise<{ ok: boolean; meta?: any }>;
}
```

**Design Rationale:**
- `id` identifies the module
- `call` provides generic RPC mechanism
- `opts` allows per-call configuration
- `health` enables health checking

### 9. Manifest Contracts

#### HandlerVersion

Metadata about a specific handler version.

```typescript
export interface HandlerVersion {
  handlerId: string;
  versionId: string;
  createdAt: number;
  image?: string;
  entrypoint?: string;
  exportedFunctions?: string[];
  manifestHash?: string;
  schemaRefs?: string[];
}
```

#### ModuleManifest

Metadata describing a module.

```typescript
export interface ModuleManifest {
  name: string;
  id: string;
  version: string;
  type: "node" | "oci" | "wasm" | "binary" | "external";
  exports: Record<string, { inputRef?: string; outputRef?: string }>;
  capabilities?: string[];
  resources?: { cpu?: string; mem?: string };
  signature?: string;
}
```

**Design Rationale:**
- `type` enables different module runtimes
- `exports` maps function names to schema references
- `capabilities` declares required permissions
- `resources` specifies resource requirements
- `signature` enables verification

### 10. GType System

#### GType

Minimal schema type system for validation.

```typescript
export type GTypeKind = 
  | "string" | "number" | "boolean" 
  | "object" | "array" | "union" 
  | "enum" | "ref" | "tuple" | "null";

export interface GTypeBase {
  kind: GTypeKind;
  nullable?: boolean;
  description?: string;
  metadata?: Record<string, any>;
}

export interface GPrimitiveType extends GTypeBase {
  kind: "string" | "number" | "boolean";
  brand?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface GObjectType extends GTypeBase {
  kind: "object";
  properties: Record<string, GType>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface GArrayType extends GTypeBase {
  kind: "array";
  items: GType;
  minItems?: number;
  maxItems?: number;
}

export interface GRefType extends GTypeBase {
  kind: "ref";
  refId: string;
}

export type GType = 
  | GPrimitiveType 
  | GObjectType 
  | GArrayType 
  | GRefType;
```

**Design Rationale:**
- Discriminated union enables type-safe handling
- `brand` enables nominal typing
- Constraints enable validation
- `ref` enables schema reuse
- Minimal set covers common validation needs

### 11. Timescape Client Contract

#### TimescapeClientContract

Interface for version resolution and schema diffing.

```typescript
export interface SchemaDiff {
  path: string;
  type: "added" | "removed" | "changed" | "constraint_changed";
  old?: any;
  new?: any;
  breaking: boolean;
  suggestion?: any;
}

export interface TimescapeClientContract {
  diff(oldRef: string, newRef: string): Promise<SchemaDiff[]>;
  registerVersion(handlerId: string, manifestHash: string): Promise<string>;
  listVersions(handlerId: string): Promise<string[]>;
}
```

**Design Rationale:**
- `diff` enables breaking change detection
- `breaking` flag enables automated compatibility checks
- `suggestion` can provide transformer hints
- `registerVersion` returns version ID for tracking

## Data Models

### JSON Schema Representations

#### envelope.schema.json

```json
{
  "$id": "https://gati.dev/schemas/envelope.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "GatiRequestEnvelope": {
      "type": "object",
      "required": ["id", "method", "path", "headers", "receivedAt"],
      "properties": {
        "id": { "type": "string" },
        "method": { "type": "string" },
        "path": { "type": "string" },
        "headers": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        },
        "receivedAt": { "type": "integer" },
        "query": {
          "type": "object",
          "additionalProperties": {
            "oneOf": [
              { "type": "string" },
              { "type": "array", "items": { "type": "string" } }
            ]
          }
        },
        "params": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        },
        "body": {},
        "version": { "type": "string" },
        "priority": { "type": "integer", "minimum": 1 },
        "flags": {
          "type": "array",
          "items": { "type": "string" }
        },
        "clientIp": { "type": "string" },
        "ingestMeta": { "type": "object" }
      }
    },
    "GatiResponseEnvelope": {
      "type": "object",
      "required": ["requestId", "status", "producedAt"],
      "properties": {
        "requestId": { "type": "string" },
        "status": { "type": "integer", "minimum": 100, "maximum": 599 },
        "producedAt": { "type": "integer" },
        "headers": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        },
        "body": {},
        "warnings": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    }
  }
}
```

### Protobuf Representations

#### envelope.proto

```protobuf
syntax = "proto3";
package gati;

import "google/protobuf/timestamp.proto";
import "google/protobuf/struct.proto";

message Header {
  string key = 1;
  string value = 2;
}

message GatiRequestEnvelope {
  string id = 1;
  string method = 2;
  string path = 3;
  repeated Header headers = 4;
  bytes body = 5;
  string version = 6;
  int32 priority = 7;
  repeated string flags = 8;
  string client_ip = 9;
  int64 received_at = 10;
  google.protobuf.Struct ingest_meta = 11;
}

message GatiResponseEnvelope {
  string request_id = 1;
  int32 status = 2;
  repeated Header headers = 3;
  bytes body = 4;
  int64 produced_at = 5;
  repeated string warnings = 6;
}
```

## Error Handling

### Validation Errors

```typescript
export class ContractValidationError extends Error {
  constructor(
    public contractName: string,
    public errors: Array<{
      path: string;
      message: string;
      value?: any;
    }>
  ) {
    super(`Contract validation failed for ${contractName}`);
    this.name = "ContractValidationError";
  }
}
```

### Serialization Errors

```typescript
export class SerializationError extends Error {
  constructor(
    public format: "json" | "protobuf" | "messagepack",
    public originalError: Error
  ) {
    super(`Serialization failed for format ${format}: ${originalError.message}`);
    this.name = "SerializationError";
  }
}
```

## Testing Strategy

### Unit Tests

1. **Type Definition Tests**
   - Verify TypeScript interfaces compile without errors
   - Test optional vs required field enforcement
   - Validate discriminated union types

2. **JSON Schema Validation Tests**
   - Validate example fixtures against schemas
   - Test required field enforcement
   - Test constraint validation (min, max, pattern)

3. **Protobuf Round-trip Tests**
   - Encode fixtures to Protobuf
   - Decode back to objects
   - Verify equality with original

### Integration Tests

1. **Cross-Format Consistency Tests**
   - Serialize same data to JSON, Protobuf, MessagePack
   - Verify semantic equivalence
   - Test edge cases (null, undefined, empty arrays)

2. **Helper Utility Tests**
   - Test validation functions with valid/invalid data
   - Test serialization helpers
   - Test CLI tool with sample files

### Contract Conformance Tests

```typescript
describe("Contract Conformance", () => {
  it("should validate GatiRequestEnvelope against schema", () => {
    const envelope: GatiRequestEnvelope = {
      id: "test-123",
      method: "POST",
      path: "/api/test",
      headers: { "content-type": "application/json" },
      receivedAt: Date.now()
    };
    
    const result = validateEnvelope(envelope);
    expect(result.valid).toBe(true);
  });
  
  it("should reject invalid GatiRequestEnvelope", () => {
    const invalid = {
      id: "test-123",
      // missing required fields
    };
    
    const result = validateEnvelope(invalid as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(3); // method, path, headers missing
  });
});
```

## Implementation Notes

### Package Structure

```json
{
  "name": "@gati/contracts",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "schemas",
    "proto"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./schemas/*": "./schemas/*",
    "./proto/*": "./proto/*"
  }
}
```

### Build Process

1. Compile TypeScript to JavaScript
2. Generate type definitions (.d.ts)
3. Copy JSON schemas to dist
4. Copy Protobuf definitions to dist
5. Run validation tests
6. Package for NPM

### Versioning Strategy

- **Major version**: Breaking changes to required fields or method signatures
- **Minor version**: New optional fields or new contracts
- **Patch version**: Bug fixes, documentation, non-breaking clarifications

### Migration Path

When introducing breaking changes:

1. Add new contract version alongside old (e.g., `GatiRequestEnvelopeV2`)
2. Deprecate old version with migration guide
3. Provide automated migration tools
4. Remove old version in next major release

## Dependencies

### Runtime Dependencies

- None (contracts are pure data structures)

### Development Dependencies

- `typescript`: ^5.0.0
- `ajv`: ^8.12.0 (JSON Schema validation)
- `@types/node`: ^20.0.0
- `vitest`: ^1.0.0 (testing)

### Peer Dependencies

- None (self-contained package)

## Performance Considerations

1. **JSON Schema Validation**: Use Ajv with JIT compilation for fast validation
2. **Protobuf Serialization**: Binary format is ~3-10x smaller than JSON
3. **Type Checking**: Zero runtime overhead (compile-time only)
4. **Bundle Size**: ~50KB minified (types + schemas + utils)

## Security Considerations

1. **Input Validation**: Always validate external data against schemas
2. **Prototype Pollution**: Use `Object.create(null)` for metadata objects
3. **DoS Prevention**: Set max sizes for arrays and strings in schemas
4. **Injection Prevention**: Sanitize string fields used in queries or commands

## Future Enhancements

1. **OpenAPI Generation**: Generate OpenAPI specs from contracts
2. **GraphQL Schema Generation**: Generate GraphQL schemas from GType
3. **Additional Language Bindings**: Python, Java, C#
4. **Contract Evolution Tools**: Automated migration generators
5. **Visual Contract Explorer**: Web UI for browsing contracts
