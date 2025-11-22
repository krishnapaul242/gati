# Requirements Document

## Introduction

The Gati Ingress Layer is a high-performance HTTP/WebSocket gateway that serves as the entry point for all requests into the Gati framework. It is responsible for request envelope construction, Timescape version resolution, routing coordination, observability integration, and protocol handling. The ingress layer bridges external clients with internal Gati components (Route Manager, Handler Modules) while maintaining low latency, high throughput, and production-grade reliability.

The initial implementation will be built in Node.js/TypeScript using Fastify for rapid development and maximum flexibility. However, the architecture follows a strict contract-first design approach, where all components implement language-neutral contracts defined in the @gati/contracts package. This enables future migration to Rust or Go for performance-critical deployments without breaking the API surface or requiring changes to user code.

## Glossary

- **Ingress Layer**: The edge service that accepts external HTTP/WebSocket requests and forwards them to internal Gati components
- **GatiRequestEnvelope**: A standardized message structure containing all request metadata, headers, body, and routing hints
- **GatiResponseEnvelope**: A standardized message structure containing response status, headers, and body
- **Timescape**: Gati's versioning system that manages API versions and temporal routing
- **Route Manager**: Internal gRPC service responsible for routing decisions and module endpoint resolution
- **Envelope**: The complete request package including metadata, headers, body, and routing information
- **Fastify**: High-performance Node.js web framework used for the initial ingress implementation
- **Contract**: A language-neutral interface specification defined in @gati/contracts package
- **Runtime Implementation**: A concrete implementation of Gati contracts in a specific language (Node.js, Rust, Go)
- **W3C Trace Context**: Standard for propagating distributed tracing information via traceparent header

## Requirements

### Requirement 1

**User Story:** As a client application, I want to send HTTP requests to Gati, so that my requests are properly routed to the correct handler modules with version awareness.

#### Acceptance Criteria

1. WHEN a client sends an HTTP/1.1 or HTTP/2 request to the ingress THEN the system SHALL accept the request and create a GatiRequestEnvelope
2. WHEN the ingress receives a request THEN the system SHALL extract method, path, headers, and body into the envelope
3. WHEN the ingress creates an envelope THEN the system SHALL assign a unique UUID request identifier
4. WHEN the ingress processes headers THEN the system SHALL preserve all client headers in the envelope
5. WHEN the ingress receives the request body THEN the system SHALL store it in the envelope without modification

### Requirement 2

**User Story:** As a Gati operator, I want the ingress to resolve Timescape versions for incoming requests, so that requests are routed to the correct API version.

#### Acceptance Criteria

1. WHEN a request contains an `x-gati-version` header THEN the system SHALL use that value as the Timescape version
2. WHEN a request lacks a version header THEN the system SHALL query the Timescape service to resolve the active version for the request path
3. WHEN the Timescape query succeeds THEN the system SHALL include the resolved version in the envelope
4. WHEN the Timescape query fails THEN the system SHALL use a default version and log the failure
5. WHEN the ingress resolves versions THEN the system SHALL cache Timescape responses with a configurable TTL to reduce lookup latency

### Requirement 3

**User Story:** As a developer, I want the ingress to support custom flags and metadata, so that I can enable debugging, playground mode, and feature toggles per request.

#### Acceptance Criteria

1. WHEN a request contains an `x-gati-flags` header THEN the system SHALL parse comma-separated flags and include them in the envelope
2. WHEN the ingress parses flags THEN the system SHALL normalize flag names to lowercase
3. WHEN the envelope is created THEN the system SHALL support a priority field for request prioritization
4. WHEN the envelope is created THEN the system SHALL include an extensible metadata field for custom key-value pairs
5. WHEN a request contains routing hints THEN the system SHALL include them in the envelope for Route Manager optimization

### Requirement 4

**User Story:** As a Gati operator, I want the ingress to communicate with the Route Manager via gRPC, so that routing decisions are centralized and consistent.

#### Acceptance Criteria

1. WHEN the ingress completes envelope creation THEN the system SHALL send the envelope to the Route Manager via gRPC
2. WHEN the Route Manager responds THEN the system SHALL receive either a Forward directive or a Handled response
3. WHEN the ingress sends a gRPC request THEN the system SHALL apply a configurable timeout with a default of 10 seconds
4. WHEN the gRPC call times out THEN the system SHALL return a 504 Gateway Timeout response to the client
5. WHEN the gRPC call fails THEN the system SHALL return a 502 Bad Gateway response and log the error with full context

### Requirement 5

**User Story:** As a client application, I want to establish WebSocket connections through the ingress, so that I can maintain bidirectional streaming communication with Gati handlers.

#### Acceptance Criteria

1. WHEN a client sends a WebSocket upgrade request THEN the system SHALL detect the upgrade and set the `isWebSocket` flag in the envelope
2. WHEN the ingress accepts a WebSocket connection THEN the system SHALL establish a bidirectional stream with the Route Manager
3. WHEN WebSocket frames are received THEN the system SHALL forward them to the Route Manager without buffering entire messages
4. WHEN the Route Manager sends WebSocket frames THEN the system SHALL forward them to the client immediately
5. WHEN a WebSocket connection closes THEN the system SHALL gracefully terminate the gRPC stream and clean up resources

### Requirement 6

**User Story:** As a DevOps engineer, I want the ingress to expose health check endpoints, so that Kubernetes can monitor service health and route traffic appropriately.

#### Acceptance Criteria

1. WHEN a request is sent to `/healthz` THEN the system SHALL return a 200 OK response if the service is ready to accept traffic
2. WHEN a request is sent to `/livez` THEN the system SHALL return a 200 OK response if the service process is alive
3. WHEN the Route Manager gRPC connection is unavailable THEN the readiness check SHALL return 503 Service Unavailable
4. WHEN the health check endpoints are called THEN the system SHALL respond within 100 milliseconds
5. WHEN health checks fail THEN the system SHALL log the failure reason with sufficient detail for debugging

### Requirement 7

**User Story:** As a platform engineer, I want the ingress to emit Prometheus metrics, so that I can monitor performance, throughput, and error rates.

#### Acceptance Criteria

1. WHEN the ingress processes requests THEN the system SHALL increment a counter metric `gati_ingress_requests_total` with labels for method, path, and status
2. WHEN the ingress completes a request THEN the system SHALL record the duration in a histogram metric `gati_ingress_request_duration_seconds`
3. WHEN the ingress receives request bodies THEN the system SHALL record sizes in a histogram metric `gati_ingress_request_size_bytes`
4. WHEN the ingress maintains connections THEN the system SHALL expose a gauge metric `gati_ingress_active_connections`
5. WHEN metrics are scraped THEN the system SHALL expose them on a `/metrics` endpoint in Prometheus text format

### Requirement 8

**User Story:** As a distributed systems engineer, I want the ingress to propagate distributed tracing context, so that requests can be traced across all Gati components.

#### Acceptance Criteria

1. WHEN a request contains a `traceparent` header THEN the system SHALL extract and propagate the W3C trace context
2. WHEN a request lacks tracing headers THEN the system SHALL generate a new trace ID and span ID
3. WHEN the ingress forwards requests to the Route Manager THEN the system SHALL include tracing context in gRPC metadata
4. WHEN the ingress completes processing THEN the system SHALL emit a span to the configured tracing backend
5. WHEN tracing is enabled THEN the system SHALL include envelope ID, version, and flags as span attributes

### Requirement 9

**User Story:** As a Gati operator, I want the ingress to support dynamic configuration reloading, so that I can update settings without restarting the service.

#### Acceptance Criteria

1. WHEN the ingress starts THEN the system SHALL load configuration from environment variables and a ConfigMap
2. WHEN the ConfigMap changes THEN the system SHALL detect the change within 30 seconds
3. WHEN configuration is reloaded THEN the system SHALL apply new settings without dropping active connections
4. WHEN configuration reload fails THEN the system SHALL log the error and continue using the previous valid configuration
5. WHEN configuration includes feature flags THEN the system SHALL support toggling playground mode, debug logging, and validation rules

### Requirement 10

**User Story:** As a security engineer, I want the ingress to extract and validate client IP addresses, so that rate limiting and access control can be enforced.

#### Acceptance Criteria

1. WHEN a request contains a `Forwarded` header THEN the system SHALL parse the client IP from the header
2. WHEN a request contains an `X-Forwarded-For` header THEN the system SHALL extract the leftmost IP address as the client IP
3. WHEN no forwarding headers are present THEN the system SHALL use the direct connection IP address
4. WHEN the client IP is extracted THEN the system SHALL include it in the envelope `clientIp` field
5. WHEN IP extraction fails THEN the system SHALL use "unknown" as the client IP and log a warning

### Requirement 11

**User Story:** As a developer, I want the ingress to support request validation, so that malformed requests are rejected early without reaching handler modules.

#### Acceptance Criteria

1. WHEN validation is enabled for a route THEN the system SHALL validate the request against a JSON schema before forwarding
2. WHEN validation fails THEN the system SHALL return a 400 Bad Request response with detailed error messages
3. WHEN validation succeeds THEN the system SHALL forward the request to the Route Manager without modification
4. WHEN validation is disabled THEN the system SHALL skip validation and forward all requests
5. WHEN validation schemas are updated THEN the system SHALL reload them without restarting the ingress

### Requirement 12

**User Story:** As a Gati operator, I want the ingress to handle errors gracefully, so that clients receive meaningful error responses and internal failures are logged.

#### Acceptance Criteria

1. WHEN the Route Manager is unreachable THEN the system SHALL return a 502 Bad Gateway response
2. WHEN a request times out THEN the system SHALL return a 504 Gateway Timeout response
3. WHEN an internal error occurs THEN the system SHALL return a 500 Internal Server Error response
4. WHEN errors occur THEN the system SHALL log the error with envelope ID, timestamp, and full stack trace
5. WHEN error responses are sent THEN the system SHALL include a correlation ID header for client-side debugging

### Requirement 13

**User Story:** As a platform engineer, I want the ingress to support TLS termination, so that client connections are encrypted and secure.

#### Acceptance Criteria

1. WHEN TLS is enabled THEN the system SHALL accept HTTPS connections on the configured port
2. WHEN TLS certificates are provided THEN the system SHALL load them from Kubernetes secrets or file paths
3. WHEN TLS handshake fails THEN the system SHALL log the failure and close the connection
4. WHEN TLS is disabled THEN the system SHALL accept plain HTTP connections for internal-only deployments
5. WHEN certificates expire THEN the system SHALL reload updated certificates without downtime

### Requirement 14

**User Story:** As a developer, I want the ingress to support CORS headers, so that browser-based clients can make cross-origin requests to Gati APIs.

#### Acceptance Criteria

1. WHEN a preflight OPTIONS request is received THEN the system SHALL respond with appropriate CORS headers
2. WHEN CORS is enabled THEN the system SHALL include `Access-Control-Allow-Origin` headers in responses
3. WHEN CORS configuration specifies allowed origins THEN the system SHALL validate the request origin and respond accordingly
4. WHEN CORS is disabled THEN the system SHALL not add any CORS headers to responses
5. WHEN CORS configuration changes THEN the system SHALL apply new settings without restarting

### Requirement 15

**User Story:** As a Gati developer, I want the Node.js ingress implementation to use Fastify, so that I benefit from high performance, low overhead, and built-in lifecycle hooks.

#### Acceptance Criteria

1. WHEN the Node.js ingress starts THEN the system SHALL initialize a Fastify server instance
2. WHEN requests are received THEN the system SHALL leverage Fastify's async request handling
3. WHEN routes are registered THEN the system SHALL use Fastify's routing capabilities for path matching
4. WHEN request validation is needed THEN the system SHALL use Fastify's schema validation features
5. WHEN the ingress processes requests THEN the system SHALL achieve throughput comparable to native Fastify applications

### Requirement 16

**User Story:** As a platform engineer, I want the ingress to support runtime hot-swapping, so that I can deploy Rust or Go implementations in production while keeping Node.js for development.

#### Acceptance Criteria

1. WHEN the ingress is deployed THEN the system SHALL support a runtime flag to select implementation (node, rust, go)
2. WHEN different runtimes are used THEN the system SHALL maintain identical API surface and behavior
3. WHEN runtime implementations differ THEN the system SHALL expose the same metrics, logs, and tracing formats
4. WHEN switching runtimes THEN the system SHALL not require changes to handler modules or client code
5. WHEN multiple runtimes coexist THEN the system SHALL allow gradual migration through canary deployments

### Requirement 17

**User Story:** As a framework architect, I want the ingress to implement the IngressContract interface, so that all implementations follow the same lifecycle and behavior.

#### Acceptance Criteria

1. WHEN the ingress is implemented THEN the system SHALL implement the IngressContract interface from @gati/contracts
2. WHEN the ingress transforms requests THEN the system SHALL use the toEnvelope method to create GatiRequestEnvelope
3. WHEN the ingress starts THEN the system SHALL call the start method to initialize the server
4. WHEN the ingress stops THEN the system SHALL call the stop method to gracefully shut down
5. WHEN the ingress is tested THEN the system SHALL validate conformance to the IngressContract specification

### Requirement 18

**User Story:** As a framework architect, I want envelope serialization to support multiple formats, so that future runtime implementations can optimize for performance without breaking compatibility.

#### Acceptance Criteria

1. WHEN envelopes are serialized THEN the system SHALL support JSON format for debugging and development
2. WHEN envelopes are serialized THEN the system SHALL support Protocol Buffers format for production efficiency
3. WHEN envelopes are serialized THEN the system SHALL support MessagePack format as an alternative binary encoding
4. WHEN serialization format is chosen THEN the system SHALL maintain semantic equivalence across all formats
5. WHEN envelopes are deserialized THEN the system SHALL validate structure against the contract schema

### Requirement 19

**User Story:** As a Gati operator, I want the ingress to support graceful shutdown, so that in-flight requests complete before the process terminates.

#### Acceptance Criteria

1. WHEN shutdown is initiated THEN the system SHALL stop accepting new connections
2. WHEN shutdown is initiated THEN the system SHALL wait for in-flight requests to complete
3. WHEN shutdown is initiated THEN the system SHALL close the Route Manager gRPC connection gracefully
4. WHEN shutdown timeout is reached THEN the system SHALL forcefully terminate remaining connections
5. WHEN shutdown completes THEN the system SHALL log shutdown statistics including request count and duration

### Requirement 20

**User Story:** As a platform engineer, I want the ingress to support connection pooling, so that gRPC connections to the Route Manager are reused efficiently.

#### Acceptance Criteria

1. WHEN the ingress starts THEN the system SHALL establish a connection pool to the Route Manager
2. WHEN requests are processed THEN the system SHALL reuse connections from the pool
3. WHEN connections fail THEN the system SHALL remove them from the pool and establish new connections
4. WHEN the pool is exhausted THEN the system SHALL queue requests or create additional connections based on configuration
5. WHEN the ingress stops THEN the system SHALL drain and close all pooled connections
