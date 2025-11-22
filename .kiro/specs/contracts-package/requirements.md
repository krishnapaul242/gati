# Requirements Document

## Introduction

The @gati/contracts package is a language-neutral, contract-first collection of TypeScript interfaces, JSON schemas, and Protobuf definitions that serve as the single source of truth for all Gati runtime components. This package enables multiple runtime implementations (Node.js, Rust, Go) to coexist while maintaining identical API surfaces and behavior. The contracts define envelope structures, error formats, handler signatures, and all interfaces required for ingress, routing, lifecycle management, and module communication.

The package follows strict design principles: minimal field sets for deterministic behavior, full serializability across JSON Schema and Protobuf, backward compatibility through semantic versioning, and comprehensive test fixtures for validation. By extracting contracts into a dedicated package, Gati ensures that runtime implementations can evolve independently without breaking user code or requiring framework-wide changes.

## Glossary

- **Contract**: A language-neutral interface specification defining input/output behavior and semantics
- **@gati/contracts**: NPM package containing all TypeScript interfaces, JSON schemas, and Protobuf definitions
- **GatiRequestEnvelope**: A standardized message structure containing all request metadata, headers, body, and routing hints
- **GatiResponseEnvelope**: A standardized message structure containing response status, headers, and body
- **GatiError**: Standardized error format with message, code, status, and optional details
- **HandlerFunction**: The signature for handler code: (envelope, localContext, globalContext) => Promise<ResponseEnvelope>
- **IngressContract**: Interface defining ingress behavior (toEnvelope, start, stop methods)
- **RouteManagerContract**: Interface defining routing behavior (resolveHandlerVersion, forwardToHandler methods)
- **LocalContext**: Per-request state container with hooks API and key-value storage
- **GlobalContext**: Application-wide state including modules, metrics, secrets, and Timescape client
- **ModuleClient**: Interface for calling methods on other modules with health checking
- **HandlerVersion**: Metadata about a specific version of a handler including version ID, manifest hash, and schema references
- **ModuleManifest**: Metadata describing a module's exports, capabilities, and resource requirements
- **GType**: Gati's minimal schema type system used for validation and analysis
- **TimescapeClientContract**: Interface for version resolution and schema diffing
- **Protocol Buffers (Protobuf)**: Binary serialization format for efficient RPC communication
- **JSON Schema**: Standard for describing JSON data structures for validation
- **quicktype**: Tool for generating typed code from JSON Schema
- **prost**: Rust library for Protocol Buffers serialization
- **tonic**: Rust library for gRPC client and server implementations

## Requirements

### Requirement 1

**User Story:** As a framework architect, I want a dedicated contracts package, so that all runtime implementations share a single source of truth for interfaces and schemas.

#### Acceptance Criteria

1. WHEN the contracts package is created THEN the system SHALL publish it as @gati/contracts on NPM
2. WHEN the contracts package is structured THEN the system SHALL organize TypeScript interfaces in src/types directory
3. WHEN the contracts package is structured THEN the system SHALL include JSON schemas in schemas directory
4. WHEN the contracts package is structured THEN the system SHALL include Protobuf definitions in proto directory
5. WHEN the contracts package is published THEN the system SHALL include compiled JavaScript, type definitions, schemas, and proto files

### Requirement 2

**User Story:** As a framework maintainer, I want the GatiRequestEnvelope contract to be fully specified, so that all ingress implementations create identical envelope structures.

#### Acceptance Criteria

1. WHEN the GatiRequestEnvelope is defined THEN the system SHALL include id, method, path, headers, and receivedAt as required fields
2. WHEN the GatiRequestEnvelope is defined THEN the system SHALL include version, priority, flags, clientIp, query, params, and body as optional fields
3. WHEN the GatiRequestEnvelope is defined THEN the system SHALL support an ingestMeta field for ingress-specific metadata
4. WHEN the GatiRequestEnvelope is serialized THEN the system SHALL provide both JSON Schema and Protobuf representations
5. WHEN the GatiRequestEnvelope is validated THEN the system SHALL enforce that receivedAt is an epoch millisecond timestamp

### Requirement 3

**User Story:** As a framework maintainer, I want the GatiResponseEnvelope contract to be fully specified, so that all handlers return consistent response structures.

#### Acceptance Criteria

1. WHEN the GatiResponseEnvelope is defined THEN the system SHALL include requestId, status, and producedAt as required fields
2. WHEN the GatiResponseEnvelope is defined THEN the system SHALL include headers, body, and warnings as optional fields
3. WHEN the GatiResponseEnvelope is validated THEN the system SHALL enforce that status is a valid HTTP status code
4. WHEN the GatiResponseEnvelope is serialized THEN the system SHALL provide both JSON Schema and Protobuf representations
5. WHEN the GatiResponseEnvelope includes warnings THEN the system SHALL store them as an array of strings

### Requirement 4

**User Story:** As a framework maintainer, I want the GatiError contract to standardize error handling, so that errors are consistent across all components.

#### Acceptance Criteria

1. WHEN the GatiError is defined THEN the system SHALL include message as a required field
2. WHEN the GatiError is defined THEN the system SHALL include code, status, details, and traceId as optional fields
3. WHEN the GatiError includes a status THEN the system SHALL use standard HTTP status codes
4. WHEN the GatiError includes a code THEN the system SHALL use dot-notation machine-readable codes
5. WHEN the GatiError is serialized THEN the system SHALL provide both JSON Schema and Protobuf representations

### Requirement 5

**User Story:** As a framework maintainer, I want the IngressContract interface to define ingress behavior, so that all ingress implementations follow the same lifecycle.

#### Acceptance Criteria

1. WHEN the IngressContract is defined THEN the system SHALL include a toEnvelope method that transforms raw requests to GatiRequestEnvelope
2. WHEN the IngressContract is defined THEN the system SHALL include a start method that initializes the ingress server
3. WHEN the IngressContract is defined THEN the system SHALL include a stop method that gracefully shuts down the ingress
4. WHEN the IngressContract methods are called THEN the system SHALL return Promises for async operations
5. WHEN the IngressContract is implemented THEN the system SHALL validate that implementations conform to the interface signature

### Requirement 6

**User Story:** As a framework maintainer, I want the RouteManagerContract interface to define routing behavior, so that routing logic is consistent across implementations.

#### Acceptance Criteria

1. WHEN the RouteManagerContract is defined THEN the system SHALL include a resolveHandlerVersion method
2. WHEN the RouteManagerContract is defined THEN the system SHALL include a forwardToHandler method
3. WHEN the RouteManagerContract is defined THEN the system SHALL include registerHandlerVersion and deregisterHandlerVersion methods
4. WHEN resolveHandlerVersion is called THEN the system SHALL return a Promise resolving to HandlerVersion
5. WHEN forwardToHandler is called THEN the system SHALL return a Promise resolving to GatiResponseEnvelope

### Requirement 7

**User Story:** As a framework maintainer, I want the LocalContext contract to define per-request state management, so that handlers have consistent access to request-scoped data.

#### Acceptance Criteria

1. WHEN the LocalContext is defined THEN the system SHALL include get, set, delete, and clean methods for key-value storage
2. WHEN the LocalContext is defined THEN the system SHALL include before, after, and catch methods for hook registration
3. WHEN the LocalContext is defined THEN the system SHALL include snapshot and restore methods for state management
4. WHEN the LocalContext is defined THEN the system SHALL include publishLocal and log methods for events and logging
5. WHEN LocalContext hooks are registered THEN the system SHALL return a string identifier for deregistration

### Requirement 8

**User Story:** As a framework maintainer, I want the GlobalContext contract to define application-wide state, so that handlers have consistent access to modules, metrics, and secrets.

#### Acceptance Criteria

1. WHEN the GlobalContext is defined THEN the system SHALL include appId and env fields for application identification
2. WHEN the GlobalContext is defined THEN the system SHALL include a modules field containing ModuleClient instances
3. WHEN the GlobalContext is defined THEN the system SHALL include secrets, metrics, and timescape client interfaces
4. WHEN the GlobalContext is defined THEN the system SHALL include publish and callAgent methods for inter-component communication
5. WHEN the GlobalContext metrics are used THEN the system SHALL support incr and gauge methods

### Requirement 9

**User Story:** As a framework maintainer, I want the ModuleClient contract to define module communication, so that handlers can call other modules consistently.

#### Acceptance Criteria

1. WHEN the ModuleClient is defined THEN the system SHALL include an id field identifying the module
2. WHEN the ModuleClient is defined THEN the system SHALL include a call method accepting method name, payload, and optional timeout
3. WHEN the ModuleClient is defined THEN the system SHALL include a health method returning module health status
4. WHEN the ModuleClient call method is invoked THEN the system SHALL return a Promise resolving to the method result
5. WHEN the ModuleClient health method is invoked THEN the system SHALL return a Promise with ok boolean and optional metadata

### Requirement 10

**User Story:** As a framework maintainer, I want HandlerVersion and ModuleManifest contracts to define module metadata, so that Timescape can manage versions consistently.

#### Acceptance Criteria

1. WHEN HandlerVersion is defined THEN the system SHALL include handlerId, versionId, and createdAt as required fields
2. WHEN HandlerVersion is defined THEN the system SHALL include image, entrypoint, manifestHash, and schemaRefs as optional fields
3. WHEN ModuleManifest is defined THEN the system SHALL include name, id, version, and type as required fields
4. WHEN ModuleManifest is defined THEN the system SHALL include exports, capabilities, resources, and signature as optional fields
5. WHEN ModuleManifest type is specified THEN the system SHALL support node, oci, wasm, binary, and external types

### Requirement 11

**User Story:** As a framework maintainer, I want the GType contract to define schema types, so that validation and analysis are consistent across components.

#### Acceptance Criteria

1. WHEN GType is defined THEN the system SHALL support string, number, boolean, object, array, union, enum, ref, tuple, and null kinds
2. WHEN GType primitives are defined THEN the system SHALL support brand, min, max, minLength, maxLength, and pattern constraints
3. WHEN GType objects are defined THEN the system SHALL include properties, required fields, and additionalProperties flag
4. WHEN GType arrays are defined THEN the system SHALL include items type and minItems, maxItems constraints
5. WHEN GType references are defined THEN the system SHALL include a refId field for schema lookups

### Requirement 12

**User Story:** As a framework maintainer, I want the TimescapeClientContract to define version resolution, so that Timescape integration is consistent.

#### Acceptance Criteria

1. WHEN TimescapeClientContract is defined THEN the system SHALL include a diff method comparing two schema versions
2. WHEN TimescapeClientContract is defined THEN the system SHALL include a registerVersion method for publishing new versions
3. WHEN TimescapeClientContract is defined THEN the system SHALL include a listVersions method for querying available versions
4. WHEN the diff method is called THEN the system SHALL return an array of SchemaDiff objects with breaking change indicators
5. WHEN the registerVersion method is called THEN the system SHALL return a Promise resolving to the new version ID

### Requirement 13

**User Story:** As a framework maintainer, I want JSON Schema files for all major contracts, so that validation can be performed in any language.

#### Acceptance Criteria

1. WHEN JSON schemas are created THEN the system SHALL provide envelope.schema.json for GatiRequestEnvelope and GatiResponseEnvelope
2. WHEN JSON schemas are created THEN the system SHALL provide manifest.schema.json for ModuleManifest
3. WHEN JSON schemas are created THEN the system SHALL provide gtype.schema.json for GType definitions
4. WHEN JSON schemas are published THEN the system SHALL include $id and $schema fields with valid URIs
5. WHEN JSON schemas are used THEN the system SHALL validate that example fixtures conform to the schemas

### Requirement 14

**User Story:** As a framework maintainer, I want Protobuf definitions for all major contracts, so that binary RPC is efficient and type-safe.

#### Acceptance Criteria

1. WHEN Protobuf definitions are created THEN the system SHALL provide envelope.proto for request and response envelopes
2. WHEN Protobuf definitions are created THEN the system SHALL provide manifest.proto for module manifests
3. WHEN Protobuf definitions are created THEN the system SHALL provide gtype.proto for schema types
4. WHEN Protobuf definitions are created THEN the system SHALL use proto3 syntax
5. WHEN Protobuf definitions are compiled THEN the system SHALL generate language bindings for TypeScript, Rust, and Go

### Requirement 15

**User Story:** As a framework maintainer, I want contract validation tests, so that implementations can verify conformance automatically.

#### Acceptance Criteria

1. WHEN contract tests are created THEN the system SHALL validate example envelopes against JSON schemas using Ajv
2. WHEN contract tests are created THEN the system SHALL validate Protobuf encode/decode round-trips
3. WHEN contract tests are created THEN the system SHALL validate manifest examples conform to manifest schema
4. WHEN contract tests are created THEN the system SHALL validate GType examples round-trip through serialization
5. WHEN contract tests run THEN the system SHALL fail the build if any validation fails

### Requirement 16

**User Story:** As a framework maintainer, I want the contracts package to include test fixtures, so that implementations can use consistent test data.

#### Acceptance Criteria

1. WHEN test fixtures are created THEN the system SHALL provide envelope.example.json with valid request and response examples
2. WHEN test fixtures are created THEN the system SHALL provide manifest.example.json with valid module manifest examples
3. WHEN test fixtures are created THEN the system SHALL provide gtype.example.json with valid schema examples
4. WHEN test fixtures are published THEN the system SHALL include them in the test/fixtures directory
5. WHEN test fixtures are used THEN the system SHALL validate that they conform to their respective schemas

### Requirement 17

**User Story:** As a developer using Gati, I want the contracts package to provide helper utilities, so that I can validate and work with contracts easily.

#### Acceptance Criteria

1. WHEN helper utilities are provided THEN the system SHALL include a validateEnvelope function using JSON Schema
2. WHEN helper utilities are provided THEN the system SHALL include a validateManifest function using JSON Schema
3. WHEN helper utilities are provided THEN the system SHALL include serialization helpers for JSON, Protobuf, and MessagePack
4. WHEN helper utilities are provided THEN the system SHALL include a CLI tool gati-contracts-validate for validating files
5. WHEN validation helpers are used THEN the system SHALL return detailed error messages indicating which fields failed validation

### Requirement 18

**User Story:** As a framework maintainer, I want contract definitions to be language-agnostic, so that multiple runtime implementations can coexist and be validated for compatibility.

#### Acceptance Criteria

1. WHEN contracts are defined THEN the system SHALL provide TypeScript interface definitions in a dedicated contracts package
2. WHEN contracts are defined THEN the system SHALL provide JSON Schema representations for validation
3. WHEN contracts are defined THEN the system SHALL include comprehensive JSDoc comments describing behavior semantics
4. WHEN contracts change THEN the system SHALL use semantic versioning to indicate breaking changes
5. WHEN new runtime implementations are created THEN the system SHALL validate conformance to contract specifications through automated tests

### Requirement 19

**User Story:** As a framework maintainer, I want the contracts package to be independently versioned, so that runtime implementations can evolve while maintaining backward compatibility.

#### Acceptance Criteria

1. WHEN the contracts package is published THEN the system SHALL use semantic versioning (semver)
2. WHEN breaking changes are introduced THEN the system SHALL increment the major version number
3. WHEN new optional features are added THEN the system SHALL increment the minor version number
4. WHEN bug fixes are made THEN the system SHALL increment the patch version number
5. WHEN runtime implementations are released THEN the system SHALL declare compatible contract version ranges

### Requirement 20

**User Story:** As a developer, I want comprehensive TypeScript types for all contracts, so that I have full IDE support and compile-time type safety.

#### Acceptance Criteria

1. WHEN contracts are defined THEN the system SHALL provide complete TypeScript type definitions
2. WHEN contracts include optional fields THEN the system SHALL use TypeScript optional property syntax
3. WHEN contracts define unions THEN the system SHALL use TypeScript discriminated unions
4. WHEN contracts are imported THEN the system SHALL provide full IntelliSense support in VS Code and other IDEs
5. WHEN contract types are used THEN the system SHALL catch type errors at compile time before runtime execution
