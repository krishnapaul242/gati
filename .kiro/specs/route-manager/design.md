# Design Document

## Overview

The Gati Route Manager is a gRPC service that centralizes routing decisions, handler version resolution, and request forwarding logic. It serves as the intelligent routing layer between the Ingress and Handler Modules, determining which handler version should process each request based on Timescape version information, routing policies, and system health. The initial implementation includes a mock server for local development and testing, with a production implementation planned for future phases.

The mock server provides configurable routing behavior based on request paths, enabling end-to-end testing of the ingress layer without requiring a full Gati deployment. The production Route Manager will integrate with Timescape for version resolution, maintain a handler registry, perform health checks, and implement advanced routing strategies including canary deployments and A/B testing.

## Architecture

### High-Level Flow

```
Ingress (gRPC Client)
    ↓
[Route Manager gRPC Server]
    ↓
[Version Resolution] → Timescape
    ↓
[Handler Registry Lookup]
    ↓
[Routing Decision]
    ↓
[Response: Handled or Forward]
```

### Component Structure (Mock)

```
route-manager-mock/
├── proto/
│   ├── gati_ingress.proto    # Shared with ingress
│   └── route_manager.proto   # Service definition
├── src/
│   ├── main.rs               # Server entry point
│   ├── service.rs            # RouteManager service implementation
│   └── lib.rs                # Module exports
├── build.rs                  # Protobuf compilation
├── Cargo.toml
├── Dockerfile
└── README.md
```

### Component Structure (Production - Future)

```
@gati/route-manager/
├── src/
│   ├── server.ts             # gRPC server setup
│   ├── service.ts            # RouteManagerContract implementation
│   ├── registry.ts           # Handler version registry
│   ├── timescape.ts          # Timescape integration
│   ├── health.ts             # Health checking
│   ├── routing/
│   │   ├── canary.ts
│   │   ├── ab-testing.ts
│   │   └── traffic-split.ts
│   └── index.ts
└── test/
```

## Components and Interfaces

### 1. gRPC Service Definition

#### route_manager.proto

```protobuf
syntax = "proto3";
package gati.routemgr;

import "gati_ingress.proto";

message RouteRequest {
  gati.ingress.GatiRequestEnvelope envelope = 1;
}

message RouteResponse {
  bool handled = 1;              // true if response is provided
  int32 status_code = 2;         // HTTP status code
  bytes body = 3;                // Response body
  repeated gati.ingress.Header response_headers = 4;
  string upstream = 5;           // Upstream module ID (if not handled)
}

service RouteManager {
  rpc RouteRequest (RouteRequest) returns (RouteResponse);
}
```

**Design Rationale:**
- `handled` flag distinguishes between direct response and forwarding
- `upstream` provides module identifier for forwarding
- Reuses Header message from gati_ingress.proto
- Simple request/response pattern (streaming added later)

### 2. Mock Server Implementation (Rust)

#### main.rs

```rust
use tonic::{transport::Server, Request, Response, Status};
use tracing::{info, error};
use std::net::SocketAddr;

pub mod proto {
    tonic::include_proto!("gati.routemgr");
    tonic::include_proto!("gati.ingress");
}

use proto::route_manager_server::{RouteManager, RouteManagerServer};
use proto::{RouteRequest, RouteResponse};

#[derive(Default)]
pub struct MockRouteManager {}

#[tonic::async_trait]
impl RouteManager for MockRouteManager {
    async fn route_request(
        &self,
        req: Request<RouteRequest>,
    ) -> Result<Response<RouteResponse>, Status> {
        let envelope = req.into_inner().envelope
            .ok_or_else(|| Status::invalid_argument("missing envelope"))?;
        
        let path = envelope.path.clone();
        info!(%path, "route_request received");
        
        // Mock routing logic based on path
        let reply = if path.contains("/echo") {
            // Echo the request body
            RouteResponse {
                handled: true,
                status_code: 200,
                body: envelope.body.clone(),
                response_headers: vec![],
                upstream: String::new(),
            }
        } else if path.contains("/upstream") {
            // Return forward directive
            RouteResponse {
                handled: false,
                status_code: 0,
                body: vec![],
                response_headers: vec![],
                upstream: "module://user-service-v2".to_string(),
            }
        } else {
            // Default: return JSON response
            let json = serde_json::json!({
                "msg": "mock route manager default response",
                "path": path,
                "envelope_id": envelope.id,
            });
            RouteResponse {
                handled: true,
                status_code: 200,
                body: serde_json::to_vec(&json).unwrap_or_default(),
                response_headers: vec![],
                upstream: String::new(),
            }
        };
        
        Ok(Response::new(reply))
    }
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    
    let addr: SocketAddr = "0.0.0.0:50051".parse()?;
    let svc = MockRouteManager::default();
    
    info!("RouteManager mock listening on {}", addr);
    Server::builder()
        .add_service(RouteManagerServer::new(svc))
        .serve(addr)
        .await?;
    
    Ok(())
}
```

**Design Rationale:**
- Simple path-based routing for testing different scenarios
- `/echo` path returns handled response with body echo
- `/upstream` path returns forward directive
- Default path returns JSON with request metadata
- Uses tonic for gRPC server implementation
- Async/await with tokio runtime

#### build.rs

```rust
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let proto_files = &[
        "proto/gati_ingress.proto",
        "proto/route_manager.proto",
    ];
    let proto_includes = &["proto"];
    
    tonic_build::configure()
        .build_server(true)
        .compile(proto_files, proto_includes)?;
    
    println!("cargo:rerun-if-changed=proto/gati_ingress.proto");
    println!("cargo:rerun-if-changed=proto/route_manager.proto");
    Ok(())
}
```

### 3. Production Implementation (Future)

#### Handler Registry

```typescript
export interface HandlerRegistryEntry {
  version: HandlerVersion;
  endpoint: string;
  healthy: boolean;
  lastHealthCheck: number;
}

export class HandlerRegistry {
  private entries = new Map<string, HandlerRegistryEntry[]>();
  
  register(version: HandlerVersion, endpoint: string): void {
    const key = version.handlerId;
    const existing = this.entries.get(key) || [];
    existing.push({
      version,
      endpoint,
      healthy: true,
      lastHealthCheck: Date.now(),
    });
    this.entries.set(key, existing);
  }
  
  deregister(versionId: string): void {
    for (const [key, entries] of this.entries) {
      const filtered = entries.filter(e => e.version.versionId !== versionId);
      if (filtered.length > 0) {
        this.entries.set(key, filtered);
      } else {
        this.entries.delete(key);
      }
    }
  }
  
  getHealthyVersions(handlerId: string): HandlerRegistryEntry[] {
    const entries = this.entries.get(handlerId) || [];
    return entries.filter(e => e.healthy);
  }
}
```

#### Routing Strategies

```typescript
export interface RoutingStrategy {
  selectVersion(
    handlerId: string,
    envelope: GatiRequestEnvelope,
    availableVersions: HandlerRegistryEntry[]
  ): HandlerRegistryEntry | null;
}

export class CanaryRoutingStrategy implements RoutingStrategy {
  constructor(
    private canaryVersionId: string,
    private canaryPercentage: number
  ) {}
  
  selectVersion(
    handlerId: string,
    envelope: GatiRequestEnvelope,
    availableVersions: HandlerRegistryEntry[]
  ): HandlerRegistryEntry | null {
    // Deterministic selection based on request ID
    const hash = this.hashRequestId(envelope.id);
    const useCanary = (hash % 100) < this.canaryPercentage;
    
    if (useCanary) {
      const canary = availableVersions.find(
        v => v.version.versionId === this.canaryVersionId
      );
      if (canary) return canary;
    }
    
    // Fallback to stable version
    return availableVersions.find(
      v => v.version.versionId !== this.canaryVersionId
    ) || null;
  }
  
  private hashRequestId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
```

## Data Models

### RouteRequest

```typescript
export interface RouteRequest {
  envelope: GatiRequestEnvelope;
}
```

### RouteResponse

```typescript
export interface RouteResponse {
  handled: boolean;
  statusCode: number;
  body: Buffer;
  responseHeaders: Array<{ key: string; value: string }>;
  upstream: string;
}
```

### Handler Registry Entry

```typescript
export interface HandlerRegistryEntry {
  version: HandlerVersion;
  endpoint: string;
  healthy: boolean;
  lastHealthCheck: number;
}
```

## Error Handling

### Error Types

```typescript
export class HandlerNotFoundError extends Error {
  constructor(public handlerId: string) {
    super(`No handler found for ${handlerId}`);
    this.name = 'HandlerNotFoundError';
  }
}

export class NoHealthyVersionError extends Error {
  constructor(public handlerId: string) {
    super(`No healthy versions available for ${handlerId}`);
    this.name = 'NoHealthyVersionError';
  }
}

export class TimescapeResolutionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'TimescapeResolutionError';
  }
}
```

### Error Handling Strategy

1. **Handler Not Found**: Return 503 Service Unavailable
2. **No Healthy Versions**: Return 503 Service Unavailable
3. **Timescape Resolution Failed**: Use cached data or default version
4. **Internal Errors**: Return 500 Internal Server Error

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Version Resolution Determinism
*For any* request with the same path and version, resolving the handler version should return the same result
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 2: Health Check Consistency
*For any* handler version, if health checks fail, the version should not be selected for routing
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 3: Canary Traffic Distribution
*For any* canary deployment with X% traffic, approximately X% of requests should route to the canary version over a large sample
**Validates: Requirements 7.1, 7.2**

### Property 4: Registry Consistency
*For any* registered handler version, deregistering it should remove it from all routing decisions
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

## Testing Strategy

### Unit Tests (Mock)

1. **Path-based Routing**
   - Test /echo path returns handled response
   - Test /upstream path returns forward directive
   - Test default path returns JSON response

2. **Error Handling**
   - Test missing envelope returns error
   - Test invalid request returns error

### Integration Tests (Mock)

1. **gRPC Communication**
   - Start mock server
   - Send RouteRequest via gRPC client
   - Verify RouteResponse

2. **Docker Deployment**
   - Build Docker image
   - Run container
   - Test gRPC connectivity

### Unit Tests (Production - Future)

1. **Handler Registry**
   - Test register/deregister operations
   - Test healthy version filtering
   - Test concurrent access

2. **Routing Strategies**
   - Test canary percentage distribution
   - Test A/B testing rules
   - Test traffic splitting

### Property-Based Tests (Production - Future)

Using `fast-check`:

```typescript
describe('Route Manager Properties', () => {
  it('Property 1: Version resolution determinism', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        async (path, version) => {
          const result1 = await routeManager.resolveHandlerVersion(path, { version } as any);
          const result2 = await routeManager.resolveHandlerVersion(path, { version } as any);
          return result1.versionId === result2.versionId;
        }
      )
    );
  });
});
```

## Performance Considerations

1. **Throughput Target**: 50,000 requests/second (mock)
2. **Latency Target**: p99 < 5ms (mock, no external calls)
3. **Memory**: < 256MB (mock)
4. **Production**: Will require caching, connection pooling, and optimization

## Security Considerations

1. **Input Validation**: Validate all envelope fields
2. **Handler Authentication**: Verify handler identity (production)
3. **Rate Limiting**: Prevent abuse (production)
4. **Audit Logging**: Log all routing decisions (production)

## Deployment

### Docker Image (Mock)

```dockerfile
FROM rust:1.73 as builder
WORKDIR /app
RUN apt-get update && apt-get install -y protobuf-compiler
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/route-manager-mock /usr/local/bin/route-manager-mock
EXPOSE 50051
ENTRYPOINT ["/usr/local/bin/route-manager-mock"]
```

### Docker Compose Integration

```yaml
version: "3.8"
services:
  route-manager:
    image: gati/route-manager-mock:latest
    build: ./route-manager
    ports:
      - "50051:50051"
  
  ingress:
    image: gati/ingress-node:latest
    build: ./ingress
    environment:
      - ROUTE_MANAGER_ADDR=route-manager:50051
    depends_on:
      - route-manager
    ports:
      - "8080:8080"
```

## Future Enhancements

1. **Streaming Support**: Bidirectional streaming for WebSocket
2. **Advanced Routing**: Weighted routing, geo-routing
3. **Circuit Breaker**: Protect against cascading failures
4. **Request Replay**: Replay requests for debugging
5. **Metrics**: Expose routing metrics via Prometheus
