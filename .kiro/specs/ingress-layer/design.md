# Design Document

## Overview

The Gati Ingress Layer is a high-performance HTTP/WebSocket gateway built with Node.js and Fastify that serves as the entry point for all external requests. It transforms incoming HTTP requests into GatiRequestEnvelope structures, resolves API versions through Timescape, and forwards requests to the Route Manager via gRPC. The ingress implements the IngressContract interface from @gati/contracts, ensuring compatibility with future Rust and Go implementations.

The design prioritizes low latency, high throughput, and operational excellence through comprehensive observability (metrics, tracing, logging), graceful shutdown handling, and dynamic configuration reloading. The ingress supports both HTTP/1.1 and HTTP/2 protocols, WebSocket upgrades, TLS termination, and CORS handling.

## Architecture

### High-Level Flow

```
Client Request
    ↓
[Fastify Server]
    ↓
[Request Validation] (optional)
    ↓
[Envelope Construction]
    ↓
[Timescape Version Resolution]
    ↓
[gRPC Call to Route Manager]
    ↓
[Response Handling]
    ↓
Client Response
```

### Component Structure

```
@gati/ingress-node
├── src/
│   ├── server.ts           # Fastify server setup
│   ├── ingress.ts          # IngressContract implementation
│   ├── envelope.ts         # Envelope construction logic
│   ├── timescape.ts        # Timescape client integration
│   ├── routeManager.ts     # gRPC client for Route Manager
│   ├── middleware/
│   │   ├── cors.ts
│   │   ├── validation.ts
│   │   └── tracing.ts
│   ├── observability/
│   │   ├── metrics.ts
│   │   ├── tracing.ts
│   │   └── logging.ts
│   ├── config.ts           # Configuration management
│   └── index.ts            # Main entry point
├── test/
│   ├── ingress.test.ts
│   ├── envelope.test.ts
│   └── integration.test.ts
└── Dockerfile
```

## Components and Interfaces

### 1. Fastify Server Setup

```typescript
import Fastify from 'fastify';
import { IngressContract, GatiRequestEnvelope } from '@gati/contracts';

export class FastifyIngress implements IngressContract {
  private server: FastifyInstance;
  private routeManagerClient: RouteManagerClient;
  private timescapeClient: TimescapeClient;
  private config: IngressConfig;
  
  constructor(config: IngressConfig) {
    this.config = config;
    this.server = Fastify({
      logger: true,
      requestIdHeader: 'x-request-id',
      requestIdLogLabel: 'reqId',
      disableRequestLogging: false,
      trustProxy: true,
    });
    
    this.setupRoutes();
    this.setupMiddleware();
    this.setupHealthChecks();
  }
  
  async start(): Promise<void> {
    await this.server.listen({
      port: this.config.port,
      host: this.config.host,
    });
  }
  
  async stop(): Promise<void> {
    await this.server.close();
  }
  
  async toEnvelope(raw: FastifyRequest): Promise<GatiRequestEnvelope> {
    // Implementation in envelope.ts
  }
}
```

**Design Rationale:**
- Fastify provides high performance and built-in request ID generation
- `trustProxy` enables proper client IP extraction
- Separation of concerns: routes, middleware, health checks

### 2. Envelope Construction

```typescript
import { FastifyRequest } from 'fastify';
import { GatiRequestEnvelope } from '@gati/contracts';
import { nanoid } from 'nanoid';

export class EnvelopeBuilder {
  static async build(req: FastifyRequest): Promise<GatiRequestEnvelope> {
    const envelope: GatiRequestEnvelope = {
      id: req.id || nanoid(),
      method: req.method,
      path: req.url,
      headers: this.normalizeHeaders(req.headers),
      receivedAt: Date.now(),
    };
    
    // Optional fields
    if (req.query) {
      envelope.query = req.query as Record<string, string | string[]>;
    }
    
    if (req.params) {
      envelope.params = req.params as Record<string, string>;
    }
    
    if (req.body) {
      envelope.body = req.body;
    }
    
    // Extract version from header
    const versionHeader = req.headers['x-gati-version'];
    if (versionHeader) {
      envelope.version = Array.isArray(versionHeader) 
        ? versionHeader[0] 
        : versionHeader;
    }
    
    // Extract flags
    const flagsHeader = req.headers['x-gati-flags'];
    if (flagsHeader) {
      const flagsStr = Array.isArray(flagsHeader) 
        ? flagsHeader[0] 
        : flagsHeader;
      envelope.flags = flagsStr.split(',').map(f => f.trim().toLowerCase());
    }
    
    // Extract priority
    const priorityHeader = req.headers['x-gati-priority'];
    if (priorityHeader) {
      const priority = parseInt(
        Array.isArray(priorityHeader) ? priorityHeader[0] : priorityHeader
      );
      if (!isNaN(priority)) {
        envelope.priority = priority;
      }
    }
    
    // Extract client IP
    envelope.clientIp = this.extractClientIp(req);
    
    return envelope;
  }
  
  private static normalizeHeaders(
    headers: FastifyRequest['headers']
  ): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        normalized[key] = Array.isArray(value) ? value[0] : value;
      }
    }
    return normalized;
  }
  
  private static extractClientIp(req: FastifyRequest): string {
    // Check Forwarded header (RFC 7239)
    const forwarded = req.headers['forwarded'];
    if (forwarded) {
      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const match = forwardedStr.match(/for=([^;,]+)/);
      if (match) {
        return match[1].replace(/"/g, '');
      }
    }
    
    // Check X-Forwarded-For (leftmost is client)
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (xForwardedFor) {
      const ips = (Array.isArray(xForwardedFor) 
        ? xForwardedFor[0] 
        : xForwardedFor
      ).split(',');
      return ips[0].trim();
    }
    
    // Fallback to direct connection
    return req.ip || 'unknown';
  }
}
```

**Design Rationale:**
- Static methods for stateless envelope construction
- Proper header normalization handles arrays
- Client IP extraction follows RFC 7239 and X-Forwarded-For standards
- Flags are normalized to lowercase for consistency

### 3. Timescape Integration

```typescript
import { GatiRequestEnvelope } from '@gati/contracts';
import NodeCache from 'node-cache';

export interface TimescapeConfig {
  endpoint: string;
  cacheTTL: number; // seconds
  timeout: number;  // milliseconds
}

export class TimescapeClient {
  private cache: NodeCache;
  private config: TimescapeConfig;
  
  constructor(config: TimescapeConfig) {
    this.config = config;
    this.cache = new NodeCache({
      stdTTL: config.cacheTTL,
      checkperiod: config.cacheTTL * 0.2,
    });
  }
  
  async resolveVersion(
    path: string,
    preferredVersion?: string
  ): Promise<string> {
    // If version explicitly provided, use it
    if (preferredVersion) {
      return preferredVersion;
    }
    
    // Check cache
    const cacheKey = `version:${path}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Query Timescape service
    try {
      const response = await fetch(
        `${this.config.endpoint}/resolve?path=${encodeURIComponent(path)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(this.config.timeout),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Timescape returned ${response.status}`);
      }
      
      const data = await response.json();
      const version = data.version || 'default';
      
      // Cache the result
      this.cache.set(cacheKey, version);
      
      return version;
    } catch (error) {
      console.error('Timescape resolution failed:', error);
      return 'default';
    }
  }
}
```

**Design Rationale:**
- In-memory cache reduces Timescape load
- Explicit version header takes precedence
- Graceful fallback to 'default' on failure
- Timeout prevents hanging requests

### 4. Route Manager gRPC Client

```typescript
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { GatiRequestEnvelope, GatiResponseEnvelope } from '@gati/contracts';

export interface RouteManagerConfig {
  address: string;
  timeout: number; // milliseconds
}

export class RouteManagerClient {
  private client: any; // gRPC client
  private config: RouteManagerConfig;
  
  constructor(config: RouteManagerConfig) {
    this.config = config;
    this.initializeClient();
  }
  
  private initializeClient(): void {
    const packageDefinition = protoLoader.loadSync(
      'node_modules/@gati/contracts/proto/route_manager.proto',
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      }
    );
    
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const RouteManager = (protoDescriptor.gati as any).routemgr.RouteManager;
    
    this.client = new RouteManager(
      this.config.address,
      grpc.credentials.createInsecure()
    );
  }
  
  async routeRequest(
    envelope: GatiRequestEnvelope
  ): Promise<GatiResponseEnvelope> {
    return new Promise((resolve, reject) => {
      const deadline = Date.now() + this.config.timeout;
      
      this.client.RouteRequest(
        { envelope },
        { deadline },
        (error: any, response: any) => {
          if (error) {
            reject(error);
            return;
          }
          
          // Handle both "handled" and "forward" responses
          if (response.handled) {
            resolve({
              requestId: envelope.id,
              status: response.statusCode,
              body: response.body,
              headers: this.convertHeaders(response.responseHeaders),
              producedAt: Date.now(),
            });
          } else {
            // Forward directive - not yet implemented
            reject(new Error('Forward directive not yet supported'));
          }
        }
      );
    });
  }
  
  private convertHeaders(protoHeaders: any[]): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const header of protoHeaders || []) {
      headers[header.key] = header.value;
    }
    return headers;
  }
  
  async close(): Promise<void> {
    this.client.close();
  }
}
```

**Design Rationale:**
- Uses @grpc/grpc-js for Node.js gRPC support
- Deadline-based timeout for reliability
- Converts between Protobuf and TypeScript types
- Graceful error handling

### 5. Request Handler

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';

export class RequestHandler {
  constructor(
    private envelopeBuilder: EnvelopeBuilder,
    private timescapeClient: TimescapeClient,
    private routeManagerClient: RouteManagerClient,
    private metrics: MetricsCollector
  ) {}
  
  async handle(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Build envelope
      const envelope = await this.envelopeBuilder.build(req);
      
      // Resolve version if not provided
      if (!envelope.version) {
        envelope.version = await this.timescapeClient.resolveVersion(
          envelope.path,
          undefined
        );
      }
      
      // Forward to Route Manager
      const response = await this.routeManagerClient.routeRequest(envelope);
      
      // Send response
      reply
        .code(response.status)
        .headers(response.headers || {})
        .send(response.body);
      
      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.recordRequest(
        envelope.method,
        envelope.path,
        response.status,
        duration
      );
    } catch (error) {
      this.handleError(error, reply);
    }
  }
  
  private handleError(error: any, reply: FastifyReply): void {
    if (error.code === grpc.status.DEADLINE_EXCEEDED) {
      reply.code(504).send({
        error: 'Gateway Timeout',
        message: 'Request to Route Manager timed out',
      });
    } else if (error.code === grpc.status.UNAVAILABLE) {
      reply.code(502).send({
        error: 'Bad Gateway',
        message: 'Route Manager is unavailable',
      });
    } else {
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    }
  }
}
```

**Design Rationale:**
- Single responsibility: orchestrate envelope → route → response flow
- Proper error mapping to HTTP status codes
- Metrics collection for observability
- Clean separation of concerns

### 6. WebSocket Support

```typescript
import { FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';

export class WebSocketHandler {
  constructor(
    private routeManagerClient: RouteManagerClient
  ) {}
  
  async handleUpgrade(
    req: FastifyRequest,
    socket: any,
    head: Buffer
  ): Promise<void> {
    const envelope = await EnvelopeBuilder.build(req);
    envelope.isWebSocket = true;
    
    // Establish WebSocket connection
    const ws = new WebSocket(socket, head);
    
    // Create bidirectional stream with Route Manager
    const stream = this.routeManagerClient.createStream(envelope);
    
    // Forward messages
    ws.on('message', (data) => {
      stream.write({ data });
    });
    
    stream.on('data', (message) => {
      ws.send(message.data);
    });
    
    // Handle close
    ws.on('close', () => {
      stream.end();
    });
    
    stream.on('end', () => {
      ws.close();
    });
  }
}
```

**Design Rationale:**
- Separate handler for WebSocket upgrade logic
- Bidirectional streaming with Route Manager
- Proper cleanup on connection close

## Data Models

### Configuration

```typescript
export interface IngressConfig {
  // Server
  host: string;
  port: number;
  
  // Route Manager
  routeManagerAddress: string;
  routeManagerTimeout: number;
  
  // Timescape
  timescapeEndpoint: string;
  timescapeCacheTTL: number;
  timescapeTimeout: number;
  
  // Features
  enablePlayground: boolean;
  enableDebugLogging: boolean;
  enableValidation: boolean;
  
  // TLS
  tlsEnabled: boolean;
  tlsCertPath?: string;
  tlsKeyPath?: string;
  
  // CORS
  corsEnabled: boolean;
  corsOrigins?: string[];
  
  // Observability
  metricsPort: number;
  tracingEnabled: boolean;
  tracingEndpoint?: string;
}
```

### Metrics

```typescript
export interface IngressMetrics {
  requestsTotal: Counter;
  requestDuration: Histogram;
  requestSize: Histogram;
  activeConnections: Gauge;
  timescapeCacheHits: Counter;
  timescapeCacheMisses: Counter;
  routeManagerErrors: Counter;
}
```

## Error Handling

### Error Types

```typescript
export class EnvelopeConstructionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'EnvelopeConstructionError';
  }
}

export class TimescapeResolutionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'TimescapeResolutionError';
  }
}

export class RouteManagerError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public cause?: Error
  ) {
    super(message);
    this.name = 'RouteManagerError';
  }
}
```

### Error Handling Strategy

1. **Envelope Construction Errors**: Return 400 Bad Request
2. **Timescape Errors**: Use default version, log warning
3. **Route Manager Unavailable**: Return 502 Bad Gateway
4. **Route Manager Timeout**: Return 504 Gateway Timeout
5. **Internal Errors**: Return 500 Internal Server Error

All errors include correlation ID in response headers for debugging.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Envelope ID Uniqueness
*For any* two concurrent requests, the generated envelope IDs should be unique
**Validates: Requirements 1.3**

### Property 2: Header Preservation
*For any* request with headers, all client headers should appear in the envelope without modification
**Validates: Requirements 1.4**

### Property 3: Version Resolution Consistency
*For any* request path, resolving the version twice within the cache TTL should return the same version
**Validates: Requirements 2.5**

### Property 4: Client IP Extraction
*For any* request with forwarding headers, the extracted client IP should be the leftmost IP in X-Forwarded-For or the for= value in Forwarded header
**Validates: Requirements 10.1, 10.2**

### Property 5: Error Status Code Mapping
*For any* Route Manager error, the HTTP status code returned to the client should correctly map to the error type (502 for unavailable, 504 for timeout, 500 for internal)
**Validates: Requirements 12.1, 12.2, 12.3**

### Property 6: Graceful Shutdown
*For any* in-flight request when shutdown is initiated, the request should complete before the server terminates
**Validates: Requirements 19.1, 19.2**

## Testing Strategy

### Unit Tests

1. **Envelope Construction**
   - Test required field extraction
   - Test optional field handling
   - Test header normalization
   - Test client IP extraction with various header combinations

2. **Timescape Client**
   - Test cache hit/miss behavior
   - Test fallback to default on error
   - Test timeout handling

3. **Route Manager Client**
   - Test successful request/response
   - Test timeout handling
   - Test error mapping

### Integration Tests

1. **End-to-End Request Flow**
   - Start ingress and mock Route Manager
   - Send HTTP request
   - Verify envelope construction
   - Verify response handling

2. **WebSocket Flow**
   - Establish WebSocket connection
   - Send/receive messages
   - Verify bidirectional streaming

3. **Error Scenarios**
   - Route Manager unavailable
   - Route Manager timeout
   - Invalid request data

### Property-Based Tests

Using `fast-check` for property-based testing:

```typescript
import fc from 'fast-check';

describe('Envelope Construction Properties', () => {
  it('Property 1: Envelope IDs are unique', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          path: fc.webPath(),
          headers: fc.dictionary(fc.string(), fc.string()),
        }), { minLength: 2, maxLength: 100 }),
        async (requests) => {
          const envelopes = await Promise.all(
            requests.map(req => EnvelopeBuilder.build(req as any))
          );
          const ids = envelopes.map(e => e.id);
          const uniqueIds = new Set(ids);
          return ids.length === uniqueIds.size;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

## Performance Considerations

1. **Throughput Target**: 10,000 requests/second on 4-core machine
2. **Latency Target**: p99 < 50ms (excluding Route Manager time)
3. **Memory**: < 512MB under normal load
4. **Connection Pooling**: Reuse gRPC connections to Route Manager
5. **Caching**: Cache Timescape responses to reduce lookup latency

## Security Considerations

1. **Input Validation**: Validate all envelope fields before forwarding
2. **Header Injection**: Sanitize headers to prevent injection attacks
3. **DoS Protection**: Rate limiting (delegated to edge/NGINX)
4. **TLS**: Support TLS termination with cert rotation
5. **Secrets**: Load secrets from environment or secret manager

## Deployment

### Docker Image

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

### Environment Variables

```bash
# Server
INGRESS_HOST=0.0.0.0
INGRESS_PORT=8080

# Route Manager
ROUTE_MANAGER_ADDR=route-manager.gati.svc:50051
ROUTE_MANAGER_TIMEOUT=10000

# Timescape
TIMESCAPE_ENDPOINT=http://timescape.gati.svc:8080
TIMESCAPE_CACHE_TTL=300
TIMESCAPE_TIMEOUT=5000

# Features
FEATURE_PLAYGROUND=true
FEATURE_DEBUG_LOGGING=false
FEATURE_VALIDATION=true

# Observability
METRICS_PORT=9090
TRACING_ENABLED=true
TRACING_ENDPOINT=http://jaeger:14268/api/traces
```

## Future Enhancements

1. **Request Batching**: Batch multiple requests to Route Manager
2. **Circuit Breaker**: Implement circuit breaker for Route Manager calls
3. **Advanced Caching**: Cache Route Manager responses for idempotent requests
4. **Compression**: Support gzip/brotli compression
5. **HTTP/3**: Add QUIC/HTTP/3 support
