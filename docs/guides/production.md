# Production Hardening Guide

Security, validation, and best practices for production Gati deployments using `@gati-framework/production-hardening`.

## Overview

Production hardening ensures your Gati application is secure, reliable, and performant in production environments.

## Installation

```bash
pnpm add @gati-framework/production-hardening
```

## Security

### Input Validation

```typescript
import { z } from 'zod';
import type { Handler } from '@gati-framework/runtime';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100)
});

export const handler: Handler = async (req, res, gctx, lctx) => {
  const result = CreateUserSchema.safeParse(req.body);
  
  if (!result.success) {
    lctx.logger.warn('Validation failed', { errors: result.error.errors });
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors
    });
  }
  
  const user = await createUser(result.data);
  res.status(201).json({ user });
};
```

### Rate Limiting

```typescript
import { createRateLimiter } from '@gati-framework/production-hardening';

const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later'
});

app.use(rateLimiter);
```

### CORS Configuration

```typescript
import { configureCORS } from '@gati-framework/production-hardening';

app.use(configureCORS({
  origin: ['https://example.com', 'https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
```

### Helmet Security Headers

```typescript
import { securityHeaders } from '@gati-framework/production-hardening';

app.use(securityHeaders({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Secrets Management

### Environment Variables

```typescript
import { loadSecrets } from '@gati-framework/production-hardening';

// Load from environment
const secrets = loadSecrets({
  DATABASE_URL: { required: true },
  API_KEY: { required: true },
  JWT_SECRET: { required: true },
  REDIS_URL: { required: false, default: 'redis://localhost:6379' }
});

// Use in app
const app = createApp({
  config: {
    databaseUrl: secrets.DATABASE_URL,
    apiKey: secrets.API_KEY
  }
});
```

### AWS Secrets Manager

```typescript
import { loadFromAWSSecrets } from '@gati-framework/production-hardening';

const secrets = await loadFromAWSSecrets({
  secretName: 'gati/production',
  region: 'us-east-1'
});
```

### Kubernetes Secrets

```bash
# Create secret
kubectl create secret generic gati-secrets \
  --from-literal=DATABASE_URL=postgresql://... \
  --from-literal=API_KEY=secret123

# Reference in deployment
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: gati-secrets
        key: DATABASE_URL
```

## Error Handling

### Production Error Responses

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  try {
    const result = await operation();
    res.json({ result });
  } catch (error) {
    // Log full error internally
    lctx.logger.error('Operation failed', {
      error,
      stack: error.stack,
      userId: req.params.id
    });
    
    // Return generic error to client
    res.status(500).json({
      error: 'Internal server error',
      requestId: lctx.requestId,
      timestamp: new Date().toISOString()
    });
  }
};
```

### Error Monitoring

```typescript
import { setupErrorMonitoring } from '@gati-framework/production-hardening';

setupErrorMonitoring({
  service: 'gati-app',
  environment: process.env.NODE_ENV,
  sentry: {
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1
  }
});
```

## Health Checks

### Basic Health Check

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Comprehensive Health Check

```typescript
import { createHealthCheck } from '@gati-framework/production-hardening';

const healthCheck = createHealthCheck({
  checks: {
    database: async () => {
      await db.query('SELECT 1');
      return { status: 'healthy' };
    },
    redis: async () => {
      await redis.ping();
      return { status: 'healthy' };
    },
    externalAPI: async () => {
      const response = await fetch('https://api.example.com/health');
      return { status: response.ok ? 'healthy' : 'unhealthy' };
    }
  },
  timeout: 5000
});

app.get('/health', healthCheck);
```

## Logging

### Structured Logging

```typescript
export const handler: Handler = async (req, res, gctx, lctx) => {
  lctx.logger.info('Processing request', {
    method: req.method,
    path: req.path,
    userId: req.params.id
  });
  
  const user = await getUser(req.params.id);
  
  lctx.logger.info('Request completed', {
    userId: user.id,
    duration: Date.now() - lctx.startTime
  });
  
  res.json({ user });
};
```

### Log Levels

```typescript
// Production: Only log warnings and errors
if (process.env.NODE_ENV === 'production') {
  logger.level = 'warn';
}

// Development: Log everything
if (process.env.NODE_ENV === 'development') {
  logger.level = 'debug';
}
```

## Performance

### Connection Pooling

```typescript
import { createPool } from '@gati-framework/production-hardening';

const dbPool = createPool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Caching

```typescript
import { createCache } from '@gati-framework/production-hardening';

const cache = createCache({
  type: 'redis',
  url: process.env.REDIS_URL,
  ttl: 3600 // 1 hour
});

export const handler: Handler = async (req, res, gctx, lctx) => {
  const cacheKey = `user:${req.params.id}`;
  
  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    lctx.logger.info('Cache hit');
    return res.json({ user: cached });
  }
  
  // Fetch from database
  const user = await db.users.findById(req.params.id);
  
  // Update cache
  await cache.set(cacheKey, user);
  
  lctx.logger.info('Cache miss');
  res.json({ user });
};
```

### Request Timeout

```typescript
import { withTimeout } from '@gati-framework/production-hardening';

export const handler: Handler = withTimeout(
  async (req, res, gctx, lctx) => {
    const result = await longRunningOperation();
    res.json({ result });
  },
  5000 // 5 second timeout
);
```

## Monitoring

### Metrics Collection

```typescript
import { metrics } from '@gati-framework/production-hardening';

export const handler: Handler = async (req, res, gctx, lctx) => {
  const start = Date.now();
  
  try {
    const result = await operation();
    
    metrics.increment('requests.success', {
      route: req.path,
      method: req.method
    });
    
    res.json({ result });
  } catch (error) {
    metrics.increment('requests.error', {
      route: req.path,
      method: req.method,
      error: error.name
    });
    
    throw error;
  } finally {
    const duration = Date.now() - start;
    metrics.histogram('requests.duration', duration, {
      route: req.path
    });
  }
};
```

### APM Integration

```typescript
import { setupAPM } from '@gati-framework/production-hardening';

setupAPM({
  serviceName: 'gati-app',
  environment: process.env.NODE_ENV,
  datadog: {
    apiKey: process.env.DD_API_KEY,
    site: 'datadoghq.com'
  }
});
```

## Graceful Shutdown

```typescript
import { setupGracefulShutdown } from '@gati-framework/production-hardening';

const app = createApp();

setupGracefulShutdown(app, {
  timeout: 30000, // 30 seconds
  signals: ['SIGTERM', 'SIGINT'],
  onShutdown: async () => {
    // Close database connections
    await db.close();
    
    // Close Redis connections
    await redis.quit();
    
    // Flush metrics
    await metrics.flush();
  }
});
```

## Best Practices

### 1. Never Log Sensitive Data

```typescript
// ❌ Bad
lctx.logger.info('User login', {
  email: req.body.email,
  password: req.body.password // Never log passwords!
});

// ✅ Good
lctx.logger.info('User login', {
  email: req.body.email,
  userId: user.id
});
```

### 2. Use Environment-Specific Configuration

```typescript
const config = {
  development: {
    logLevel: 'debug',
    rateLimitMax: 1000
  },
  production: {
    logLevel: 'warn',
    rateLimitMax: 100
  }
}[process.env.NODE_ENV || 'development'];
```

### 3. Validate All Input

```typescript
// ✅ Always validate user input
const result = schema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ error: 'Invalid input' });
}
```

### 4. Set Resource Limits

```typescript
// Kubernetes deployment
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1Gi
```

### 5. Enable HTTPS Only

```typescript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});
```

## Checklist

### Pre-Production

- [ ] All secrets stored securely (not in code)
- [ ] Input validation on all endpoints
- [ ] Rate limiting configured
- [ ] CORS configured correctly
- [ ] Security headers enabled
- [ ] Error monitoring setup
- [ ] Health checks implemented
- [ ] Logging configured
- [ ] Metrics collection enabled
- [ ] Graceful shutdown implemented

### Production

- [ ] HTTPS enabled
- [ ] Database connection pooling
- [ ] Caching strategy implemented
- [ ] Resource limits set
- [ ] Auto-scaling configured
- [ ] Backup strategy in place
- [ ] Monitoring dashboards created
- [ ] Alerts configured
- [ ] Incident response plan documented

## Related

- [Observability Guide](./observability.md) - Monitoring and metrics
- [Error Handling](./error-handling.md) - Error patterns
- [Deployment Guide](./deployment.md) - Deployment strategies
- [Kubernetes Guide](./kubernetes.md) - K8s deployment
