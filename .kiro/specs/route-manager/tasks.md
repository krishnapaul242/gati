# Implementation Plan

- [ ] 1. Set up Rust project structure
  - Create Cargo.toml with dependencies (tonic, prost, tokio, tracing)
  - Create proto directory for Protobuf definitions
  - Create src directory with main.rs
  - Configure build.rs for Protobuf compilation
  - _Requirements: 3.1_

- [ ] 2. Create Protobuf definitions
  - [ ] 2.1 Copy gati_ingress.proto from @gati/contracts
    - Include Header and GatiRequestEnvelope messages
    - _Requirements: 1.1_
  
  - [ ] 2.2 Create route_manager.proto
    - Define RouteRequest message with envelope field
    - Define RouteResponse message with handled, status_code, body, response_headers, upstream fields
    - Define RouteManager service with RouteRequest RPC method
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3. Implement build.rs for Protobuf compilation
  - Configure tonic_build to compile proto files
  - Set build_server(true) for server code generation
  - Add rerun-if-changed directives
  - _Requirements: 3.2_

- [ ] 4. Implement mock RouteManager service
  - [ ] 4.1 Create MockRouteManager struct
    - Implement Default trait
    - _Requirements: 2.1_
  
  - [ ] 4.2 Implement RouteManager trait
    - Implement route_request method
    - Extract envelope from request
    - Validate envelope is present
    - _Requirements: 2.1, 2.2_
  
  - [ ] 4.3 Implement path-based routing logic
    - Check if path contains "/echo" → return handled with body echo
    - Check if path contains "/upstream" → return forward directive with upstream ID
    - Default → return handled with JSON response
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [ ] 4.4 Add logging
    - Log incoming requests with path
    - Use tracing crate for structured logging
    - _Requirements: 2.5_

- [ ] 5. Implement server startup
  - [ ] 5.1 Create main function
    - Initialize tracing subscriber
    - Parse socket address (0.0.0.0:50051)
    - Create MockRouteManager instance
    - _Requirements: 2.5_
  
  - [ ] 5.2 Start gRPC server
    - Use tonic Server builder
    - Add RouteManagerServer service
    - Serve on configured address
    - Log startup message
    - _Requirements: 2.5_

- [ ] 6. Create Dockerfile
  - [ ] 6.1 Create multi-stage build
    - Use rust:1.73 as builder
    - Install protobuf-compiler
    - Build release binary
    - _Requirements: 3.1, 3.2_
  
  - [ ] 6.2 Create runtime image
    - Use debian:bookworm-slim
    - Install ca-certificates
    - Copy binary from builder
    - _Requirements: 3.3, 3.4_
  
  - [ ] 6.3 Configure container
    - Expose port 50051
    - Set entrypoint to binary
    - _Requirements: 3.3, 3.5_

- [ ] 7. Write unit tests
  - [ ] 7.1 Test echo path routing
    - Create request with /echo path
    - Verify handled=true and body is echoed
  
  - [ ] 7.2 Test upstream path routing
    - Create request with /upstream path
    - Verify handled=false and upstream is set
  
  - [ ] 7.3 Test default path routing
    - Create request with arbitrary path
    - Verify handled=true and JSON response
  
  - [ ] 7.4 Test missing envelope error
    - Create request without envelope
    - Verify error is returned

- [ ] 8. Write integration tests
  - [ ] 8.1 Test gRPC communication
    - Start mock server
    - Create gRPC client
    - Send RouteRequest
    - Verify RouteResponse
  
  - [ ] 8.2 Test Docker deployment
    - Build Docker image
    - Run container
    - Test connectivity with grpcurl

- [ ] 9. Create Docker Compose configuration
  - [ ] 9.1 Define route-manager service
    - Set image and build context
    - Expose port 50051
    - _Requirements: 12.1, 12.2_
  
  - [ ] 9.2 Configure networking
    - Allow ingress to connect via service name
    - _Requirements: 12.4_
  
  - [ ] 9.3 Add graceful shutdown
    - Handle SIGTERM signal
    - _Requirements: 12.5_

- [ ] 10. Create documentation
  - Write README with build instructions
  - Document mock routing behavior
  - Add usage examples with grpcurl
  - Document Docker deployment

- [ ] 11. Final validation
  - Run all tests and ensure they pass
  - Build Docker image successfully
  - Test with Docker Compose
  - Verify gRPC connectivity from ingress
