# Requirements Document

## Introduction

The Gati Route Manager is a gRPC service responsible for routing decisions, handler version resolution, and request forwarding. It serves as the central routing intelligence between the Ingress Layer and Handler Modules, determining which handler version should process each request based on Timescape version information, routing policies, and system state. The Route Manager maintains a registry of available handler versions, performs health checks, and implements routing strategies including canary deployments, A/B testing, and traffic splitting.

The initial implementation includes a mock server for local development and testing, which simulates routing behavior with configurable responses. The mock enables end-to-end testing of the ingress layer without requiring a full Gati deployment. The production Route Manager will integrate with Timescape for version resolution, implement sophisticated routing algorithms, and provide observability through metrics and tracing.

## Glossary

- **Route Manager**: Internal gRPC service responsible for routing decisions and module endpoint resolution
- **RouteRequest**: gRPC message containing a GatiRequestEnvelope for routing
- **RouteResponse**: gRPC message containing routing decision (handled or forward) with response data or upstream identifier
- **Handler Version**: Specific version of a handler module identified by version ID and manifest hash
- **Upstream**: Target service or module identifier for request forwarding
- **Handled Response**: Route Manager directly provides the response without forwarding
- **Forward Directive**: Route Manager instructs ingress to forward request to specified upstream
- **Mock Server**: Simplified Route Manager implementation for local testing
- **gRPC**: High-performance RPC framework using Protocol Buffers
- **Timescape**: Gati's versioning system that manages API versions and temporal routing
- **Canary Deployment**: Routing strategy that gradually shifts traffic to new versions
- **Traffic Splitting**: Routing strategy that distributes requests across multiple handler versions

## Requirements

### Requirement 1

**User Story:** As a framework architect, I want a RouteManager gRPC service contract, so that routing decisions are centralized and ingress implementations can delegate routing logic.

#### Acceptance Criteria

1. WHEN the RouteManager contract is defined THEN the system SHALL provide a RouteRequest message containing a GatiRequestEnvelope
2. WHEN the RouteManager contract is defined THEN the system SHALL provide a RouteResponse message with handled flag, status, body, headers, and upstream fields
3. WHEN the RouteManager contract is defined THEN the system SHALL provide a RouteRequest RPC method accepting RouteRequest and returning RouteResponse
4. WHEN the RouteManager responds with handled true THEN the system SHALL include status code, body, and response headers
5. WHEN the RouteManager responds with handled false THEN the system SHALL include an upstream identifier for forwarding

### Requirement 2

**User Story:** As a developer, I want a mock RouteManager implementation, so that I can test ingress behavior locally without a full Gati deployment.

#### Acceptance Criteria

1. WHEN the mock RouteManager is implemented THEN the system SHALL accept RouteRequest messages via gRPC
2. WHEN the mock RouteManager receives a request with path containing "/echo" THEN the system SHALL return handled true with the request body echoed
3. WHEN the mock RouteManager receives a request with path containing "/upstream" THEN the system SHALL return handled false with an upstream module identifier
4. WHEN the mock RouteManager receives other requests THEN the system SHALL return handled true with a default JSON response
5. WHEN the mock RouteManager starts THEN the system SHALL listen on port 50051 and log startup messages

### Requirement 3

**User Story:** As a DevOps engineer, I want the RouteManager mock to be containerized, so that I can deploy it consistently across environments.

#### Acceptance Criteria

1. WHEN the RouteManager Dockerfile is created THEN the system SHALL use a multi-stage build with Rust builder and slim runtime
2. WHEN the RouteManager container is built THEN the system SHALL install protobuf-compiler in the builder stage
3. WHEN the RouteManager container runs THEN the system SHALL expose port 50051 for gRPC connections
4. WHEN the RouteManager container is deployed THEN the system SHALL include CA certificates for TLS support
5. WHEN the RouteManager container starts THEN the system SHALL execute the compiled binary as the entrypoint

### Requirement 4

**User Story:** As a Gati operator, I want the RouteManager to resolve handler versions using Timescape, so that requests are routed to the correct API version.

#### Acceptance Criteria

1. WHEN the RouteManager receives a RouteRequest THEN the system SHALL extract the version from the envelope
2. WHEN a version is specified THEN the system SHALL query Timescape to resolve the handler version ID
3. WHEN no version is specified THEN the system SHALL query Timescape for the default active version
4. WHEN Timescape resolution succeeds THEN the system SHALL use the resolved version for routing decisions
5. WHEN Timescape resolution fails THEN the system SHALL use a fallback version and log the failure

### Requirement 5

**User Story:** As a Gati operator, I want the RouteManager to maintain a handler registry, so that it knows which handler versions are available.

#### Acceptance Criteria

1. WHEN a handler version is registered THEN the system SHALL store the HandlerVersion metadata in the registry
2. WHEN a handler version is deregistered THEN the system SHALL remove it from the registry
3. WHEN the RouteManager resolves a route THEN the system SHALL check the registry for available handler versions
4. WHEN a handler version is unavailable THEN the system SHALL return an error response
5. WHEN the registry is queried THEN the system SHALL return all registered handler versions for a given handler ID

### Requirement 6

**User Story:** As a Gati operator, I want the RouteManager to perform health checks on handlers, so that unhealthy instances are not routed to.

#### Acceptance Criteria

1. WHEN a handler version is registered THEN the system SHALL begin periodic health checks
2. WHEN health checks succeed THEN the system SHALL mark the handler version as healthy
3. WHEN health checks fail THEN the system SHALL mark the handler version as unhealthy
4. WHEN routing decisions are made THEN the system SHALL only route to healthy handler versions
5. WHEN all handler versions are unhealthy THEN the system SHALL return a 503 Service Unavailable response

### Requirement 7

**User Story:** As a Gati operator, I want the RouteManager to support canary deployments, so that new versions can be tested with a subset of traffic.

#### Acceptance Criteria

1. WHEN a canary deployment is configured THEN the system SHALL route a specified percentage of traffic to the canary version
2. WHEN canary traffic percentage is updated THEN the system SHALL adjust routing decisions accordingly
3. WHEN canary health degrades THEN the system SHALL automatically reduce canary traffic
4. WHEN canary performs well THEN the system SHALL support gradual traffic increase
5. WHEN canary is promoted THEN the system SHALL route all traffic to the new version

### Requirement 8

**User Story:** As a Gati operator, I want the RouteManager to support A/B testing, so that different handler versions can be compared.

#### Acceptance Criteria

1. WHEN A/B testing is configured THEN the system SHALL route traffic to multiple versions based on routing rules
2. WHEN A/B routing rules include user attributes THEN the system SHALL use envelope metadata for routing decisions
3. WHEN A/B routing rules include random assignment THEN the system SHALL consistently route the same user to the same version
4. WHEN A/B test results are collected THEN the system SHALL emit metrics for each version
5. WHEN A/B test concludes THEN the system SHALL support promoting the winning version

### Requirement 9

**User Story:** As a platform engineer, I want the RouteManager to emit metrics, so that I can monitor routing performance and decisions.

#### Acceptance Criteria

1. WHEN routing decisions are made THEN the system SHALL increment a counter metric for each handler version
2. WHEN routing latency is measured THEN the system SHALL record duration in a histogram metric
3. WHEN routing errors occur THEN the system SHALL increment an error counter with error type labels
4. WHEN handler health changes THEN the system SHALL update a gauge metric for healthy instances
5. WHEN metrics are scraped THEN the system SHALL expose them on a /metrics endpoint in Prometheus format

### Requirement 10

**User Story:** As a distributed systems engineer, I want the RouteManager to propagate tracing context, so that requests can be traced end-to-end.

#### Acceptance Criteria

1. WHEN the RouteManager receives a RouteRequest THEN the system SHALL extract tracing context from gRPC metadata
2. WHEN routing decisions are made THEN the system SHALL create a span for the routing operation
3. WHEN forwarding to handlers THEN the system SHALL propagate tracing context in the forwarding request
4. WHEN routing completes THEN the system SHALL emit the span to the configured tracing backend
5. WHEN tracing is enabled THEN the system SHALL include handler version and routing decision as span attributes

### Requirement 11

**User Story:** As a Gati operator, I want the RouteManager to handle errors gracefully, so that clients receive meaningful error responses.

#### Acceptance Criteria

1. WHEN no handler version is available THEN the system SHALL return a 503 Service Unavailable response
2. WHEN handler resolution fails THEN the system SHALL return a 500 Internal Server Error response
3. WHEN Timescape is unreachable THEN the system SHALL use cached version data and log the failure
4. WHEN routing times out THEN the system SHALL return a 504 Gateway Timeout response
5. WHEN errors occur THEN the system SHALL log the error with envelope ID and full context

### Requirement 12

**User Story:** As a developer, I want the RouteManager mock to support Docker Compose, so that I can test locally with the ingress.

#### Acceptance Criteria

1. WHEN Docker Compose is configured THEN the system SHALL define a route-manager service
2. WHEN Docker Compose is configured THEN the system SHALL expose port 50051 for gRPC
3. WHEN Docker Compose is run THEN the system SHALL build the mock server from source
4. WHEN Docker Compose networking is configured THEN the system SHALL allow ingress to connect via service name
5. WHEN Docker Compose is stopped THEN the system SHALL gracefully shut down the mock server
