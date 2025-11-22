# Implementation Plan

- [ ] 1. Set up project structure and dependencies
  - Create package.json for @gati/ingress-node
  - Install Fastify, @grpc/grpc-js, @gati/contracts dependencies
  - Configure TypeScript with strict mode
  - Set up directory structure (src, test, config)
  - _Requirements: 15.1_

- [ ] 2. Implement configuration management
  - Create IngressConfig interface
  - Implement config loader from environment variables
  - Add validation for required config fields
  - Support ConfigMap file loading for Kubernetes
  - _Requirements: 9.1, 9.5_

- [ ] 3. Implement envelope construction
  - [ ] 3.1 Create EnvelopeBuilder class
    - Implement build method extracting required fields
    - Extract optional fields (query, params, body, version, priority, flags)
    - Add comprehensive error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ] 3.2 Implement header normalization
    - Handle array headers (take first value)
    - Preserve all client headers
    - _Requirements: 1.4_
  
  - [ ] 3.3 Implement client IP extraction
    - Parse Forwarded header (RFC 7239)
    - Parse X-Forwarded-For header
    - Fallback to direct connection IP
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 3.4 Implement flag parsing
    - Parse x-gati-flags header
    - Normalize flags to lowercase
    - _Requirements: 3.1, 3.2_

- [ ] 4. Implement Timescape integration
  - [ ] 4.1 Create TimescapeClient class
    - Implement resolveVersion method
    - Add in-memory caching with TTL
    - Handle explicit version header
    - Implement graceful fallback to 'default'
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ] 4.2 Add timeout handling
    - Use AbortSignal for fetch timeout
    - Log failures without blocking requests
    - _Requirements: 2.4_

- [ ] 5. Implement Route Manager gRPC client
  - [ ] 5.1 Create RouteManagerClient class
    - Load Protobuf definitions from @gati/contracts
    - Initialize gRPC client with credentials
    - Implement routeRequest method
    - Add deadline-based timeout
    - _Requirements: 4.1, 4.3_
  
  - [ ] 5.2 Implement response handling
    - Handle "handled" responses
    - Convert Protobuf headers to Record<string, string>
    - Map gRPC errors to HTTP status codes
    - _Requirements: 4.2, 4.4, 4.5, 12.1, 12.2, 12.3_
  
  - [ ] 5.3 Implement connection pooling
    - Reuse gRPC connections
    - Handle connection failures
    - Implement graceful close
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 6. Implement Fastify server
  - [ ] 6.1 Create FastifyIngress class implementing IngressContract
    - Initialize Fastify with logger and request ID
    - Configure trust proxy for client IP
    - Implement start method
    - Implement stop method
    - _Requirements: 15.1, 15.2, 17.1, 17.2, 17.3, 17.4_
  
  - [ ] 6.2 Implement toEnvelope method
    - Delegate to EnvelopeBuilder
    - Add error handling
    - _Requirements: 17.5_
  
  - [ ] 6.3 Set up request routing
    - Register catch-all route handler
    - Use Fastify's routing for path matching
    - _Requirements: 15.3_

- [ ] 7. Implement request handler
  - [ ] 7.1 Create RequestHandler class
    - Orchestrate envelope → timescape → route manager flow
    - Handle successful responses
    - Handle error responses
    - _Requirements: 1.1, 2.2, 4.1_
  
  - [ ] 7.2 Implement error mapping
    - Map gRPC DEADLINE_EXCEEDED to 504
    - Map gRPC UNAVAILABLE to 502
    - Map other errors to 500
    - Include correlation ID in error responses
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 8. Implement health check endpoints
  - [ ] 8.1 Create /healthz endpoint
    - Return 200 if server is ready
    - Check Route Manager connection
    - Respond within 100ms
    - _Requirements: 6.1, 6.3, 6.4_
  
  - [ ] 8.2 Create /livez endpoint
    - Return 200 if process is alive
    - Simple check without dependencies
    - _Requirements: 6.2, 6.4_
  
  - [ ] 8.3 Add health check logging
    - Log failures with details
    - _Requirements: 6.5_

- [ ] 9. Implement observability
  - [ ] 9.1 Create metrics collector
    - Implement gati_ingress_requests_total counter
    - Implement gati_ingress_request_duration_seconds histogram
    - Implement gati_ingress_request_size_bytes histogram
    - Implement gati_ingress_active_connections gauge
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 9.2 Create /metrics endpoint
    - Expose Prometheus metrics
    - Use Prometheus text format
    - _Requirements: 7.5_
  
  - [ ] 9.3 Implement distributed tracing
    - Extract traceparent header
    - Generate trace ID if missing
    - Propagate tracing context to Route Manager via gRPC metadata
    - Emit spans to tracing backend
    - Include envelope ID, version, flags as span attributes
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10. Implement TLS support
  - [ ] 10.1 Add TLS configuration
    - Load certificates from file paths or Kubernetes secrets
    - Configure Fastify HTTPS server
    - _Requirements: 13.1, 13.2_
  
  - [ ] 10.2 Implement certificate reloading
    - Watch certificate files for changes
    - Reload without downtime
    - _Requirements: 13.5_
  
  - [ ] 10.3 Add TLS error handling
    - Log handshake failures
    - Close connections on error
    - _Requirements: 13.3, 13.4_

- [ ] 11. Implement CORS support
  - [ ] 11.1 Create CORS middleware
    - Handle OPTIONS preflight requests
    - Add Access-Control-Allow-Origin headers
    - Validate origin against allowed list
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [ ] 11.2 Add CORS configuration
    - Support enabling/disabling CORS
    - Support dynamic configuration reload
    - _Requirements: 14.4, 14.5_

- [ ] 12. Implement request validation
  - [ ] 12.1 Create validation middleware
    - Validate requests against JSON schemas
    - Return 400 with detailed errors on failure
    - Skip validation when disabled
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 12.2 Implement schema reloading
    - Reload schemas without restart
    - _Requirements: 11.5_

- [ ] 13. Implement WebSocket support
  - [ ] 13.1 Create WebSocketHandler class
    - Handle WebSocket upgrade requests
    - Set isWebSocket flag in envelope
    - Establish bidirectional stream with Route Manager
    - _Requirements: 5.1, 5.2_
  
  - [ ] 13.2 Implement message forwarding
    - Forward client messages to Route Manager
    - Forward Route Manager messages to client
    - _Requirements: 5.3, 5.4_
  
  - [ ] 13.3 Implement connection cleanup
    - Close streams on WebSocket close
    - Clean up resources
    - _Requirements: 5.5_

- [ ] 14. Implement dynamic configuration reloading
  - [ ] 14.1 Create config watcher
    - Watch ConfigMap file for changes
    - Detect changes within 30 seconds
    - _Requirements: 9.2_
  
  - [ ] 14.2 Implement hot reload
    - Apply new settings without dropping connections
    - Log errors and continue with previous config on failure
    - _Requirements: 9.3, 9.4_

- [ ] 15. Implement graceful shutdown
  - [ ] 15.1 Add shutdown handler
    - Stop accepting new connections
    - Wait for in-flight requests to complete
    - Close Route Manager connection
    - _Requirements: 19.1, 19.2, 19.3_
  
  - [ ] 15.2 Add shutdown timeout
    - Force terminate after timeout
    - Log shutdown statistics
    - _Requirements: 19.4, 19.5_

- [ ] 16. Implement envelope serialization
  - [ ] 16.1 Add JSON serialization
    - Serialize envelopes to JSON
    - Deserialize from JSON
    - _Requirements: 18.1_
  
  - [ ] 16.2 Add Protobuf serialization
    - Serialize envelopes to Protobuf
    - Deserialize from Protobuf
    - _Requirements: 18.2_
  
  - [ ] 16.3 Add MessagePack serialization
    - Serialize envelopes to MessagePack
    - Deserialize from MessagePack
    - _Requirements: 18.3_
  
  - [ ] 16.4 Ensure semantic equivalence
    - Validate all formats produce equivalent data
    - Add schema validation
    - _Requirements: 18.4, 18.5_

- [ ] 17. Write unit tests
  - [ ] 17.1 Test envelope construction
    - Test required field extraction
    - Test optional field handling
    - Test header normalization
    - Test client IP extraction
    - Test flag parsing
  
  - [ ] 17.2 Test Timescape client
    - Test cache hit/miss
    - Test fallback to default
    - Test timeout handling
  
  - [ ] 17.3 Test Route Manager client
    - Test successful request/response
    - Test timeout handling
    - Test error mapping

- [ ] 18. Write integration tests
  - [ ] 18.1 Test end-to-end request flow
    - Start ingress with mock Route Manager
    - Send HTTP request
    - Verify envelope construction
    - Verify response handling
  
  - [ ] 18.2 Test WebSocket flow
    - Establish WebSocket connection
    - Send/receive messages
    - Verify bidirectional streaming
  
  - [ ] 18.3 Test error scenarios
    - Test Route Manager unavailable
    - Test Route Manager timeout
    - Test invalid request data

- [ ] 19. Write property-based tests
  - [ ] 19.1 Property 1: Envelope ID uniqueness
    - Generate random requests
    - Verify all envelope IDs are unique
    - **Validates: Requirements 1.3**
  
  - [ ] 19.2 Property 2: Header preservation
    - Generate random headers
    - Verify all headers appear in envelope
    - **Validates: Requirements 1.4**
  
  - [ ] 19.3 Property 3: Version resolution consistency
    - Resolve version multiple times within cache TTL
    - Verify same version returned
    - **Validates: Requirements 2.5**
  
  - [ ] 19.4 Property 4: Client IP extraction
    - Generate random forwarding headers
    - Verify correct IP extracted
    - **Validates: Requirements 10.1, 10.2**
  
  - [ ] 19.5 Property 5: Error status code mapping
    - Generate random Route Manager errors
    - Verify correct HTTP status codes
    - **Validates: Requirements 12.1, 12.2, 12.3**
  
  - [ ] 19.6 Property 6: Graceful shutdown
    - Start requests before shutdown
    - Verify all complete before termination
    - **Validates: Requirements 19.1, 19.2**

- [ ] 20. Create Dockerfile
  - Create multi-stage build
  - Optimize for production
  - Expose port 8080
  - Add health check

- [ ] 21. Create documentation
  - Write README with setup instructions
  - Document configuration options
  - Add usage examples
  - Document deployment

- [ ] 22. Final validation
  - Run all tests and ensure they pass
  - Check TypeScript compilation
  - Verify Docker image builds
  - Test with mock Route Manager
