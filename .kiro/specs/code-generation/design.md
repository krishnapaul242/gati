# Design Document

## Overview

The Gati Code Generation system provides automated tooling to generate language-specific bindings from the @gati/contracts package. This enables Rust and Go implementations to be generated from TypeScript interfaces, JSON schemas, and Protobuf definitions, ensuring type safety and contract parity across all runtime implementations. The system includes Protobuf compilation for gRPC services, JSON Schema to typed code conversion using quicktype, automated scripts for consistent generation, and CI integration for automatic updates when contracts change.

## Architecture

### Generation Pipeline

```
@gati/contracts (Source of Truth)
    ├── TypeScript Interfaces
    ├── JSON Schemas
    └── Protobuf Definitions
         ↓
    [Generation Scripts]
         ↓
    ├── Rust Bindings (prost + tonic)
    ├── Go Bindings (protoc-gen-go)
    └── Validation Tests
```

### Directory Structure

```
@gati/contracts/
├── proto/                    # Source Protobuf files
├── schemas/                  # Source JSON schemas
├── scripts/
│   ├── gen-proto.sh         # Generate Protobuf bindings
│   ├── gen-jsonschema.sh    # Generate JSON Schema types
│   └── validate-bindings.sh # Validate generated code
└── languages/
    ├── rust/
    │   ├── Cargo.toml
    │   ├── build.rs
    │   ├── src/
    │   │   ├── protos/      # Generated Protobuf code
    │   │   └── schema/      # Generated JSON Schema types
    │   └── tests/
    └── go/
        ├── go.mod
        ├── gen/             # Generated Protobuf code
        ├── schema/          # Generated JSON Schema types
        └── tests/
```

## Components

### 1. Protobuf Generation for Go

#### scripts/gen-proto.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

PROTO_DIR="proto"
GO_OUT="languages/go/gen"
mkdir -p "$GO_OUT"

# Ensure protoc-gen-go is in PATH
export PATH="$PATH:$(go env GOPATH)/bin"

# Generate Go messages and gRPC stubs
protoc \
  -I="$PROTO_DIR" \
  --go_out="$GO_OUT" --go_opt=paths=source_relative \
  --go-grpc_out="$GO_OUT" --go-grpc_opt=paths=source_relative \
  "$PROTO_DIR"/*.proto

echo "✓ Go proto generation complete"
```

**Design Rationale:**
- Uses protoc with Go plugins
- source_relative paths keep generated code organized
- Generates both messages and gRPC service stubs

### 2. Protobuf Generation for Rust

#### languages/rust/build.rs

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let proto_files = &[
        "../../proto/envelope.proto",
        "../../proto/manifest.proto",
        "../../proto/gtype.proto",
    ];
    let proto_includes = &["../../proto"];
    
    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .out_dir("src/protos")
        .compile(proto_files, proto_includes)?;
    
    println!("cargo:rerun-if-changed=../../proto");
    Ok(())
}
```

**Design Rationale:**
- Build-time generation integrates with Cargo
- Generates both client and server code
- Automatic regeneration on proto changes

### 3. JSON Schema to Rust Types

#### scripts/gen-jsonschema.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

SCHEMA_DIR="schemas"
RUST_SCHEMA_OUT="languages/rust/src/schema"
GO_SCHEMA_OUT="languages/go/schema"

mkdir -p "$RUST_SCHEMA_OUT" "$GO_SCHEMA_OUT"

for f in "$SCHEMA_DIR"/*.json; do
  base=$(basename "$f" .json)
  
  # Generate Rust types
  npx quicktype --src "$f" \
    -l rust \
    -o "$RUST_SCHEMA_OUT/${base}_types.rs" \
    --crate-name gati_schema \
    --derive-debug
  
  # Generate Go types
  npx quicktype --src "$f" \
    -l go \
    -o "$GO_SCHEMA_OUT/${base}_types.go" \
    --package protos
done

echo "✓ JSON Schema type generation complete"
```

**Design Rationale:**
- quicktype generates idiomatic code for each language
- Rust types include serde derives
- Go types include JSON tags

### 4. Roundtrip Validation Tests

#### languages/rust/tests/roundtrip.rs

```rust
use gati_protos::*;
use prost::Message;

#[test]
fn test_envelope_roundtrip() {
    let original = GatiRequestEnvelope {
        id: "test-123".to_string(),
        method: "POST".to_string(),
        path: "/api/test".to_string(),
        headers: vec![],
        received_at: 1234567890,
        ..Default::default()
    };
    
    // Encode to Protobuf
    let mut buf = Vec::new();
    original.encode(&mut buf).unwrap();
    
    // Decode from Protobuf
    let decoded = GatiRequestEnvelope::decode(&buf[..]).unwrap();
    
    // Verify equality
    assert_eq!(original.id, decoded.id);
    assert_eq!(original.method, decoded.method);
    assert_eq!(original.path, decoded.path);
}
```

**Design Rationale:**
- Validates encode/decode correctness
- Ensures no data loss in serialization
- Tests all major contract types

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Protobuf Roundtrip Preservation
*For any* valid contract object, encoding to Protobuf and decoding should produce an equivalent object
**Validates: Requirements 7.1, 7.2, 7.3**

### Property 2: JSON Schema Type Equivalence
*For any* JSON object conforming to a schema, deserializing in Rust and Go should produce semantically equivalent data structures
**Validates: Requirements 3.5, 4.5**

### Property 3: Generated Code Compilation
*For any* generated code file, it should compile without errors in the target language
**Validates: Requirements 1.5, 2.5, 3.5, 4.5**

## Testing Strategy

### Unit Tests

1. **Generation Script Tests**
   - Test scripts run without errors
   - Test output directories are created
   - Test generated files exist

2. **Compilation Tests**
   - Test Rust code compiles
   - Test Go code compiles
   - Test no warnings in strict mode

### Integration Tests

1. **Roundtrip Tests**
   - Test Protobuf encode/decode for all contracts
   - Test JSON serialize/deserialize for all contracts
   - Verify data equivalence

2. **Cross-Language Tests**
   - Encode in Rust, decode in Go
   - Encode in Go, decode in Rust
   - Verify compatibility

## CI Integration

### GitHub Actions Workflow

```yaml
name: Generate Bindings
on:
  push:
    paths:
      - 'proto/**'
      - 'schemas/**'
      - 'scripts/**'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.20'
      
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Tools
        run: |
          npm i -g quicktype
          sudo apt-get update && sudo apt-get install -y protobuf-compiler
          go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
          go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
      
      - name: Generate Bindings
        run: |
          bash scripts/gen-proto.sh
          bash scripts/gen-jsonschema.sh
      
      - name: Build Rust
        working-directory: languages/rust
        run: cargo build --verbose
      
      - name: Build Go
        working-directory: languages/go
        run: go build ./...
      
      - name: Run Tests
        run: |
          cd languages/rust && cargo test
          cd languages/go && go test ./...
```

## Performance Considerations

1. **Generation Speed**: < 10 seconds for all bindings
2. **Generated Code Size**: Rust ~500KB, Go ~300KB
3. **Compilation Time**: Rust ~30s, Go ~5s
4. **CI Time**: < 2 minutes total

## Future Enhancements

1. **Python Bindings**: Add Python code generation
2. **Java Bindings**: Add Java code generation
3. **Incremental Generation**: Only regenerate changed files
4. **Validation Reports**: Generate compatibility reports
5. **Version Tracking**: Track which contract version generated which code
