# Requirements Document

## Introduction

The Gati Code Generation system provides automated tooling to generate language-specific bindings from contract definitions. This enables Rust and Go implementations to be generated from TypeScript interfaces, JSON schemas, and Protobuf definitions, ensuring type safety and contract parity across all runtime implementations. The code generation workflow includes Protobuf compilation for gRPC services, JSON Schema to typed code conversion using quicktype, automated scripts for consistent generation, and CI integration for automatic updates when contracts change.

The system follows a contract-first approach where TypeScript definitions and schemas serve as the source of truth, and generated code in other languages is derived automatically. This ensures that all runtime implementations maintain identical API surfaces and behavior while allowing each language to use idiomatic patterns and optimal performance characteristics.

## Glossary

- **Code Generation**: Automated process of creating language-specific code from contract definitions
- **Protobuf Compilation**: Converting .proto files into language-specific message types and gRPC stubs
- **quicktype**: Tool for generating typed code from JSON Schema definitions
- **protoc**: Protocol Buffers compiler for generating code from .proto files
- **prost**: Rust library for Protocol Buffers serialization
- **tonic**: Rust library for gRPC client and server implementations
- **protoc-gen-go**: Go plugin for protoc to generate Go code
- **protoc-gen-go-grpc**: Go plugin for protoc to generate gRPC service code
- **build.rs**: Rust build script that runs at compile time
- **Roundtrip Test**: Test that encodes and decodes data to verify serialization correctness
- **Contract Parity**: Ensuring all language implementations conform to the same contract
- **Source of Truth**: The canonical definition from which other artifacts are derived

## Requirements

### Requirement 1

**User Story:** As a Rust developer, I want to generate Rust bindings from Protobuf definitions, so that I can implement Gati components in Rust with type safety.

#### Acceptance Criteria

1. WHEN Rust bindings are generated THEN the system SHALL use prost and tonic crates for Protobuf and gRPC support
2. WHEN Rust bindings are generated THEN the system SHALL use a build.rs script to compile protos at build time
3. WHEN Rust bindings are generated THEN the system SHALL output generated code to src/protos directory
4. WHEN Rust bindings are generated THEN the system SHALL support both client and server code generation
5. WHEN Rust bindings are used THEN the system SHALL provide tonic::include_proto macro for importing generated modules

### Requirement 2

**User Story:** As a Go developer, I want to generate Go bindings from Protobuf definitions, so that I can implement Gati components in Go with type safety.

#### Acceptance Criteria

1. WHEN Go bindings are generated THEN the system SHALL use protoc-gen-go and protoc-gen-go-grpc plugins
2. WHEN Go bindings are generated THEN the system SHALL output code to languages/go/gen directory with source_relative paths
3. WHEN Go bindings are generated THEN the system SHALL generate both message types and gRPC service stubs
4. WHEN Go bindings are generated THEN the system SHALL use go_package option in proto files for correct package names
5. WHEN Go bindings are used THEN the system SHALL support google.golang.org/grpc and google.golang.org/protobuf packages

### Requirement 3

**User Story:** As a Rust developer, I want to generate Rust types from JSON Schema, so that I can validate and deserialize JSON payloads with type safety.

#### Acceptance Criteria

1. WHEN Rust types are generated from JSON Schema THEN the system SHALL use quicktype tool for code generation
2. WHEN Rust types are generated THEN the system SHALL output code to languages/rust/src/schema directory
3. WHEN Rust types are generated THEN the system SHALL include serde derive attributes for serialization
4. WHEN Rust types are generated THEN the system SHALL support serde_json for JSON parsing
5. WHEN Rust types are used THEN the system SHALL validate JSON payloads against the schema at runtime

### Requirement 4

**User Story:** As a Go developer, I want to generate Go types from JSON Schema, so that I can validate and deserialize JSON payloads with type safety.

#### Acceptance Criteria

1. WHEN Go types are generated from JSON Schema THEN the system SHALL use quicktype tool for code generation
2. WHEN Go types are generated THEN the system SHALL output code to languages/go/schema directory
3. WHEN Go types are generated THEN the system SHALL include JSON struct tags for serialization
4. WHEN Go types are generated THEN the system SHALL support encoding/json package for JSON parsing
5. WHEN Go types are used THEN the system SHALL validate JSON payloads against the schema at runtime

### Requirement 5

**User Story:** As a framework maintainer, I want automated scripts for code generation, so that bindings can be regenerated consistently.

#### Acceptance Criteria

1. WHEN generation scripts are created THEN the system SHALL provide scripts/gen-proto.sh for Protobuf generation
2. WHEN generation scripts are created THEN the system SHALL provide scripts/gen-jsonschema.sh for JSON Schema type generation
3. WHEN generation scripts are executed THEN the system SHALL create output directories if they do not exist
4. WHEN generation scripts fail THEN the system SHALL exit with non-zero status and display error messages
5. WHEN generation scripts succeed THEN the system SHALL log completion messages indicating which files were generated

### Requirement 6

**User Story:** As a framework maintainer, I want CI automation for code generation, so that bindings are automatically updated when contracts change.

#### Acceptance Criteria

1. WHEN CI is configured THEN the system SHALL trigger generation on changes to proto or schemas directories
2. WHEN CI runs generation THEN the system SHALL install protoc, Go, Rust, Node.js, and quicktype dependencies
3. WHEN CI generates bindings THEN the system SHALL run gen-proto.sh and gen-jsonschema.sh scripts
4. WHEN CI generates bindings THEN the system SHALL build Rust crates to validate generated code compiles
5. WHEN CI completes generation THEN the system SHALL optionally commit generated code back to the repository

### Requirement 7

**User Story:** As a framework maintainer, I want roundtrip validation tests, so that I can verify contract parity between TypeScript, Rust, and Go implementations.

#### Acceptance Criteria

1. WHEN roundtrip tests are created THEN the system SHALL encode test fixtures to Protobuf and decode in Go and Rust
2. WHEN roundtrip tests are created THEN the system SHALL serialize test fixtures to JSON and deserialize in all languages
3. WHEN roundtrip tests are created THEN the system SHALL verify that decoded values match original test fixtures
4. WHEN roundtrip tests fail THEN the system SHALL report which fields differ between implementations
5. WHEN roundtrip tests pass THEN the system SHALL confirm contract parity across all runtime implementations

### Requirement 8

**User Story:** As a framework maintainer, I want consistent package naming conventions, so that generated code is organized and discoverable.

#### Acceptance Criteria

1. WHEN proto files are created THEN the system SHALL use package gati; declaration consistently
2. WHEN proto files are created THEN the system SHALL include go_package option with full import path
3. WHEN generated Go code is organized THEN the system SHALL use languages/go/gen for Protobuf and languages/go/schema for JSON types
4. WHEN generated Rust code is organized THEN the system SHALL use src/protos for Protobuf and src/schema for JSON types
5. WHEN generated code is imported THEN the system SHALL use consistent module paths across all implementations

### Requirement 9

**User Story:** As a framework maintainer, I want build configuration for Rust code generation, so that Protobuf compilation is integrated into the Cargo build process.

#### Acceptance Criteria

1. WHEN Rust build configuration is created THEN the system SHALL include prost-build and tonic-build in build-dependencies
2. WHEN Rust build configuration is created THEN the system SHALL create a build.rs script at the crate root
3. WHEN build.rs executes THEN the system SHALL compile all proto files from the proto directory
4. WHEN build.rs executes THEN the system SHALL configure both server and client code generation
5. WHEN Cargo build runs THEN the system SHALL automatically regenerate Rust bindings if proto files change

### Requirement 10

**User Story:** As a framework maintainer, I want dependency management for generated code, so that all required libraries are documented and versioned.

#### Acceptance Criteria

1. WHEN Rust dependencies are specified THEN the system SHALL include prost, prost-types, tonic, and serde in Cargo.toml
2. WHEN Go dependencies are specified THEN the system SHALL include google.golang.org/grpc and google.golang.org/protobuf in go.mod
3. WHEN Node.js dependencies are specified THEN the system SHALL include quicktype as a dev dependency for code generation
4. WHEN dependencies are updated THEN the system SHALL use compatible version ranges to prevent breaking changes
5. WHEN dependencies are documented THEN the system SHALL include installation instructions in README files

### Requirement 11

**User Story:** As a framework maintainer, I want code generation to handle errors gracefully, so that build failures are clear and actionable.

#### Acceptance Criteria

1. WHEN protoc is not installed THEN the system SHALL display an error message with installation instructions
2. WHEN proto files contain syntax errors THEN the system SHALL display the error location and description
3. WHEN quicktype fails THEN the system SHALL display which schema file caused the failure
4. WHEN output directories cannot be created THEN the system SHALL display permission error messages
5. WHEN generation completes with warnings THEN the system SHALL log warnings without failing the build

### Requirement 12

**User Story:** As a framework maintainer, I want generated code to include metadata, so that developers know the source and generation timestamp.

#### Acceptance Criteria

1. WHEN code is generated THEN the system SHALL include a header comment indicating it is auto-generated
2. WHEN code is generated THEN the system SHALL include the generation timestamp in the header
3. WHEN code is generated THEN the system SHALL include the source proto or schema file path in the header
4. WHEN code is generated THEN the system SHALL include the tool name and version used for generation
5. WHEN code is generated THEN the system SHALL include a warning not to manually edit the file
