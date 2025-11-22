# Implementation Plan

- [ ] 1. Set up directory structure
  - Create languages/rust directory
  - Create languages/go directory
  - Create scripts directory
  - _Requirements: 8.3, 8.4_

- [ ] 2. Create Go Protobuf generation script
  - [ ] 2.1 Create scripts/gen-proto.sh
    - Add shebang and set options
    - Define PROTO_DIR and GO_OUT variables
    - Create output directory
    - Add protoc-gen-go to PATH
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 2.2 Add protoc command for Go
    - Use source_relative paths
    - Generate both messages and gRPC stubs
    - Process all proto files
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 2.3 Add success logging
    - Echo completion message
    - _Requirements: 5.4, 5.5_

- [ ] 3. Create Rust Protobuf generation configuration
  - [ ] 3.1 Create languages/rust/Cargo.toml
    - Add prost, prost-types, tonic dependencies
    - Add prost-build, tonic-build build-dependencies
    - _Requirements: 10.1_
  
  - [ ] 3.2 Create languages/rust/build.rs
    - List proto files to compile
    - Configure tonic_build with server and client generation
    - Set output directory to src/protos
    - Add rerun-if-changed directives
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 3.3 Create languages/rust/src/lib.rs
    - Re-export generated modules
    - Add module documentation
    - _Requirements: 1.5_

- [ ] 4. Create JSON Schema generation script
  - [ ] 4.1 Create scripts/gen-jsonschema.sh
    - Add shebang and set options
    - Define schema directories
    - Create output directories
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [ ] 4.2 Add quicktype commands
    - Loop through schema files
    - Generate Rust types with serde derives
    - Generate Go types with JSON tags
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 4.3 Add success logging
    - Echo completion message
    - _Requirements: 5.4, 5.5_

- [ ] 5. Create Go module configuration
  - [ ] 5.1 Create languages/go/go.mod
    - Set module name
    - Add grpc and protobuf dependencies
    - _Requirements: 10.2_
  
  - [ ] 5.2 Create languages/go/README.md
    - Document usage
    - Add import examples
    - _Requirements: 10.5_

- [ ] 6. Write Rust roundtrip tests
  - [ ] 6.1 Create languages/rust/tests/roundtrip.rs
    - Test GatiRequestEnvelope encode/decode
    - Test GatiResponseEnvelope encode/decode
    - Test ModuleManifest encode/decode
    - Verify all fields preserved
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 7. Write Go roundtrip tests
  - [ ] 7.1 Create languages/go/tests/roundtrip_test.go
    - Test GatiRequestEnvelope marshal/unmarshal
    - Test GatiResponseEnvelope marshal/unmarshal
    - Test ModuleManifest marshal/unmarshal
    - Verify all fields preserved
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 8. Create CI workflow
  - [ ] 8.1 Create .github/workflows/generate-bindings.yml
    - Configure trigger on proto/schema changes
    - Set up Go, Rust, Node.js
    - Install protoc, quicktype, protoc plugins
    - _Requirements: 6.1, 6.2_
  
  - [ ] 8.2 Add generation steps
    - Run gen-proto.sh
    - Run gen-jsonschema.sh
    - _Requirements: 6.3_
  
  - [ ] 8.3 Add build validation steps
    - Build Rust crate
    - Build Go module
    - Run tests
    - _Requirements: 6.4_
  
  - [ ] 8.4 Add commit step (optional)
    - Commit generated code
    - Push to repository
    - _Requirements: 6.5_

- [ ] 9. Create error handling
  - [ ] 9.1 Add error handling to gen-proto.sh
    - Check protoc is installed
    - Display installation instructions on error
    - Exit with non-zero on failure
    - _Requirements: 11.1, 11.2, 11.4_
  
  - [ ] 9.2 Add error handling to gen-jsonschema.sh
    - Check quicktype is available
    - Display error for failed schemas
    - Exit with non-zero on failure
    - _Requirements: 11.3, 11.4_
  
  - [ ] 9.3 Add warnings handling
    - Log warnings without failing
    - _Requirements: 11.5_

- [ ] 10. Add generated code metadata
  - [ ] 10.1 Add header comments to generated files
    - Include "auto-generated" warning
    - Include generation timestamp
    - Include source file path
    - Include tool name and version
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 11. Create documentation
  - Write README for code generation
  - Document prerequisites (protoc, Go, Rust, quicktype)
  - Add usage examples
  - Document CI integration

- [ ] 12. Final validation
  - Run generation scripts locally
  - Verify Rust code compiles
  - Verify Go code compiles
  - Run all roundtrip tests
  - Test CI workflow
