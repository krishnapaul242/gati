# Implementation Plan

- [ ] 1. Set up package structure and configuration
  - Create package.json with @gati/contracts name and metadata
  - Configure TypeScript with strict mode and declaration generation
  - Set up directory structure (src/types, schemas, proto, test, scripts)
  - Configure build scripts for compilation and packaging
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Implement core envelope contracts
  - [ ] 2.1 Create GatiRequestEnvelope TypeScript interface
    - Define required fields (id, method, path, headers, receivedAt)
    - Define optional fields (query, params, body, version, priority, flags, clientIp, ingestMeta)
    - Add comprehensive JSDoc comments
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ] 2.2 Create GatiResponseEnvelope TypeScript interface
    - Define required fields (requestId, status, producedAt)
    - Define optional fields (headers, body, warnings)
    - Add comprehensive JSDoc comments
    - _Requirements: 3.1, 3.2_
  
  - [ ] 2.3 Create envelope JSON schemas
    - Create envelope.schema.json with both request and response definitions
    - Include $id and $schema fields
    - Define required fields and constraints
    - _Requirements: 2.4, 3.4, 13.1, 13.4_
  
  - [ ] 2.4 Create envelope Protobuf definitions
    - Create envelope.proto with proto3 syntax
    - Define Header message for key-value pairs
    - Define GatiRequestEnvelope and GatiResponseEnvelope messages
    - _Requirements: 2.4, 3.4, 14.1, 14.4_

- [ ] 3. Implement error contract
  - [ ] 3.1 Create GatiError TypeScript interface
    - Define message as required field
    - Define optional fields (code, status, details, traceId)
    - Add JSDoc with examples of error codes
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 3.2 Create error JSON schema and Protobuf definition
    - Add GatiError to envelope.schema.json
    - Add GatiError message to envelope.proto
    - _Requirements: 4.5_

- [ ] 4. Implement interface contracts
  - [ ] 4.1 Create IngressContract interface
    - Define toEnvelope method signature
    - Define start and stop method signatures
    - Add comprehensive JSDoc explaining lifecycle
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ] 4.2 Create RouteManagerContract interface
    - Define resolveHandlerVersion method
    - Define forwardToHandler method
    - Define registerHandlerVersion and deregisterHandlerVersion methods
    - Add JSDoc with usage examples
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 4.3 Create HandlerFunction type
    - Define function signature with three parameters
    - Add JSDoc explaining parameter purposes
    - _Requirements: 5.1_

- [ ] 5. Implement context contracts
  - [ ] 5.1 Create LocalContext interface
    - Define key-value storage methods (get, set, delete, clean)
    - Define hook registration methods (before, after, catch)
    - Define state management methods (snapshot, restore)
    - Define event and logging methods (publishLocal, log)
    - Add comprehensive JSDoc for each method
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 5.2 Create GlobalContext interface
    - Define appId and env fields
    - Define modules field with ModuleClient record
    - Define secrets, metrics, and timescape interfaces
    - Define publish and callAgent methods
    - Add JSDoc with usage examples
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6. Implement module contracts
  - [ ] 6.1 Create ModuleClient interface
    - Define id field
    - Define call method with optional timeout
    - Define health method
    - Add JSDoc explaining RPC semantics
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ] 6.2 Create HandlerVersion interface
    - Define required fields (handlerId, versionId, createdAt)
    - Define optional fields (image, entrypoint, exportedFunctions, manifestHash, schemaRefs)
    - Add JSDoc explaining version metadata
    - _Requirements: 10.1, 10.2_
  
  - [ ] 6.3 Create ModuleManifest interface
    - Define required fields (name, id, version, type)
    - Define optional fields (exports, capabilities, resources, signature)
    - Define type union for module types
    - Add JSDoc with manifest examples
    - _Requirements: 10.3, 10.4, 10.5_
  
  - [ ] 6.4 Create manifest JSON schema and Protobuf definitions
    - Create manifest.schema.json
    - Create manifest.proto
    - _Requirements: 13.2, 14.2_

- [ ] 7. Implement GType system
  - [ ] 7.1 Create GType TypeScript types
    - Define GTypeKind union type
    - Define GTypeBase interface
    - Define GPrimitiveType, GObjectType, GArrayType, GRefType interfaces
    - Create discriminated union GType
    - Add comprehensive JSDoc explaining type system
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ] 7.2 Create GType JSON schema and Protobuf definitions
    - Create gtype.schema.json
    - Create gtype.proto
    - _Requirements: 13.3, 14.3_

- [ ] 8. Implement Timescape contracts
  - [ ] 8.1 Create TimescapeClientContract interface
    - Define SchemaDiff interface
    - Define diff method
    - Define registerVersion method
    - Define listVersions method
    - Add JSDoc explaining version resolution
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 9. Create test fixtures
  - [ ] 9.1 Create envelope.example.json
    - Include valid GatiRequestEnvelope example
    - Include valid GatiResponseEnvelope example
    - Include edge cases (empty body, no optional fields)
    - _Requirements: 16.1, 16.4_
  
  - [ ] 9.2 Create manifest.example.json
    - Include valid ModuleManifest examples for each type
    - Include HandlerVersion examples
    - _Requirements: 16.2, 16.4_
  
  - [ ] 9.3 Create gtype.example.json
    - Include examples of each GType kind
    - Include nested object and array examples
    - _Requirements: 16.3, 16.4_

- [ ] 10. Implement validation utilities
  - [ ] 10.1 Create validation helper functions
    - Implement validateEnvelope using Ajv
    - Implement validateManifest using Ajv
    - Return detailed error messages with paths
    - _Requirements: 17.1, 17.2, 17.5_
  
  - [ ] 10.2 Create serialization helpers
    - Implement JSON serialization/deserialization
    - Implement Protobuf serialization/deserialization (stub for now)
    - Implement MessagePack serialization/deserialization (stub for now)
    - _Requirements: 17.3_

- [ ] 11. Implement CLI tool
  - [ ] 11.1 Create gati-contracts-validate CLI
    - Parse command-line arguments
    - Load file and detect format
    - Validate against appropriate schema
    - Display validation results
    - Exit with appropriate status code
    - _Requirements: 17.4_

- [ ] 12. Create main export file
  - Re-export all types from src/types
  - Re-export validation utilities
  - Re-export serialization helpers
  - Add package-level JSDoc
  - _Requirements: 1.5, 20.1, 20.4_

- [ ] 13. Write contract validation tests
  - [ ] 13.1 Test envelope validation
    - Test valid GatiRequestEnvelope passes validation
    - Test invalid envelope fails with correct errors
    - Test optional field handling
    - _Requirements: 15.1, 15.5_
  
  - [ ] 13.2 Test Protobuf round-trips
    - Encode envelope to Protobuf
    - Decode back to object
    - Verify equality
    - _Requirements: 15.2, 15.5_
  
  - [ ] 13.3 Test manifest validation
    - Test valid ModuleManifest passes validation
    - Test invalid manifest fails with correct errors
    - _Requirements: 15.3, 15.5_
  
  - [ ] 13.4 Test GType validation
    - Test GType examples validate correctly
    - Test round-trip serialization
    - _Requirements: 15.4, 15.5_

- [ ] 14. Write TypeScript type tests
  - Test optional vs required field enforcement at compile time
  - Test discriminated union type narrowing
  - Test generic type parameters in LocalContext
  - _Requirements: 20.1, 20.2, 20.3, 20.5_

- [ ] 15. Configure package publishing
  - Set up package.json exports field
  - Configure files to include in package
  - Add README with usage examples
  - Add LICENSE file
  - Test local installation with npm pack
  - _Requirements: 1.1, 1.5_

- [ ] 16. Create documentation
  - Write README with installation and usage
  - Document each contract with examples
  - Create migration guide template
  - Document versioning strategy
  - _Requirements: 18.3, 19.1, 19.2, 19.3, 19.4_

- [ ] 17. Final validation and testing
  - Run all tests and ensure they pass
  - Validate all fixtures against schemas
  - Check TypeScript compilation with strict mode
  - Verify package builds correctly
  - Test CLI tool with sample files
  - _Requirements: 15.5, 16.5, 18.5_
