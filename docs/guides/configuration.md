# Configuration Guide

Gati uses a minimal configuration approach with sensible defaults. The `gati.config.ts` file allows you to customize behavior while maintaining zero-configuration for basic use cases.

## Basic Configuration

### Minimal Config (Recommended)
```typescript
// gati.config.ts
export default {
  // Everything is optional!
};
```

### Common Settings
```typescript
// gati.config.ts
export default {
  server: {
    port: 3000,
    host: 'localhost'
  }
};
```

## Configuration Structure

### Complete Configuration Schema
```typescript
// gati.config.ts
export default {
  // Server configuration
  server: {
    port: 3000,
    host: 'localhost',
    cors: { /* CORS options */ },
    rateLimit: { /* Rate limiting */ }
  },
  
  // Route overrides
  overrides: {
    'GET /users/:id': { /* route config */ },
    'POST /webhook': customHandler
  },
  
  // Global middleware
  middleware: [
    corsMiddleware,
    authMiddleware
  ],
  
  // Module configuration
  modules: {
    database: databaseConfig,
    cache: redisConfig
  },
  
  // Development settings
  dev: {
    hotReload: true,
    verbose: false,
    watch: { /* watch options */ }
  },
  
  // Build settings
  build: {
    outDir: 'dist',
    target: 'node18'
  }
};
```

## Server Configuration

### Basic Server Settings
```typescript
export default {
  server: {
    port: 3000,              // Server port
    host: 'localhost',       // Bind address
    timeout: 30000,          // Request timeout (ms)
    keepAlive: true,         // Keep connections alive
    compression: true        // Enable gzip compression
  }
};
```

### CORS Configuration
```typescript
export default {
  server: {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://myapp.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  }
};
```

### Rate Limiting
```typescript
export default {
  server: {
    rateLimit: {
      windowMs: 15 * 60 * 1000,  // 15 minutes
      max: 100,                   // Max requests per window
      message: 'Too many requests',
      standardHeaders: true,
      legacyHeaders: false
    }
  }
};
```

## Route Overrides

### Disable Auto-Discovered Routes
```typescript
export default {
  overrides: {
    // Disable specific routes
    'GET /internal/debug': false,
    'DELETE /users/:id': false,
    
    // Disable all routes matching pattern
    'GET /admin/*': false
  }
};
```

### Add Custom Routes
```typescript
import { webhookHandler, healthHandler } from './custom-handlers';

export default {
  overrides: {
    // Add routes not in handlers/ directory
    'POST /webhook': webhookHandler,
    'GET /custom-health': healthHandler,
    
    // Override auto-discovered routes
    'GET /users/:id': customUserHandler
  }
};
```

### Route-Specific Configuration
```typescript
export default {
  overrides: {
    'GET /users/:id': {
      middleware: [authMiddleware, validateUserAccess],
      rateLimit: {
        windowMs: 60 * 1000,  // 1 minute
        max: 10               // 10 requests per minute
      },
      timeout: 5000,          // 5 second timeout
      cache: {
        ttl: 300,             // Cache for 5 minutes
        key: (req) => `user:${req.params.id}`
      }
    }
  }
};
```

## Middleware Configuration

### Global Middleware
Applied to all routes:

```typescript
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware, loggerMiddleware } from './middleware';

export default {
  middleware: [
    cors(),
    helmet(),
    loggerMiddleware,
    authMiddleware
  ]
};
```

### Conditional Middleware
```typescript
export default {
  middleware: [
    // Apply only in development
    ...(process.env.NODE_ENV === 'development' ? [debugMiddleware] : []),
    
    // Apply only to API routes
    {
      path: '/api/*',
      middleware: [authMiddleware, rateLimitMiddleware]
    },
    
    // Apply to specific methods
    {
      method: 'POST',
      middleware: [validateBodyMiddleware]
    }
  ]
};
```

### Custom Middleware
```typescript
const customMiddleware = (req, res, next) => {
  // Add custom headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Request-ID', req.id);
  next();
};

export default {
  middleware: [customMiddleware]
};
```

## Module Configuration

### Database Module
```typescript
export default {
  modules: {
    database: {
      type: 'postgresql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'myapp',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'password',
      pool: {
        min: 2,
        max: 10
      }
    }
  }
};
```

### Cache Module
```typescript
export default {
  modules: {
    cache: {
      type: 'redis',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASS,
      db: 0,
      keyPrefix: 'myapp:',
      ttl: 3600 // Default TTL in seconds
    }
  }
};
```

### Custom Module Factory
```typescript
export default {
  modules: {
    logger: (gctx) => {
      return {
        info: (message, meta) => console.log(message, meta),
        error: (message, error) => console.error(message, error),
        debug: (message, meta) => {
          if (process.env.NODE_ENV === 'development') {
            console.debug(message, meta);
          }
        }
      };
    },
    
    emailService: async (gctx) => {
      const config = gctx.config.email;
      return new EmailService(config);
    }
  }
};
```

## Development Configuration

### Hot Reload Settings
```typescript
export default {
  dev: {
    hotReload: true,
    verbose: false,
    openBrowser: true,
    
    watch: {
      patterns: [
        'src/**/*.ts',
        'src/**/*.js'
      ],
      ignore: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/node_modules/**'
      ],
      debounce: 100  // ms
    }
  }
};
```

### Development-Only Features
```typescript
export default {
  dev: {
    // Enable GraphQL playground
    playground: process.env.NODE_ENV === 'development',
    
    // Mock external services
    mocks: {
      enabled: true,
      services: ['payment', 'email', 'sms']
    },
    
    // Development middleware
    middleware: [
      ...(process.env.NODE_ENV === 'development' ? [
        debugMiddleware,
        mockMiddleware
      ] : [])
    ]
  }
};
```

## Build Configuration

### TypeScript Build Settings
```typescript
export default {
  build: {
    outDir: 'dist',
    target: 'node18',
    sourceMaps: true,
    minify: process.env.NODE_ENV === 'production',
    
    // Include/exclude files
    include: ['src/**/*'],
    exclude: ['**/*.test.ts', '**/*.spec.ts'],
    
    // TypeScript compiler options
    compilerOptions: {
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true
    }
  }
};
```

### Asset Handling
```typescript
export default {
  build: {
    assets: {
      // Copy static files
      copy: [
        { from: 'public', to: 'dist/public' },
        { from: 'templates', to: 'dist/templates' }
      ],
      
      // Process images
      images: {
        optimize: true,
        formats: ['webp', 'avif']
      }
    }
  }
};
```

## Environment-Specific Configuration

### Multi-Environment Setup
```typescript
// gati.config.ts
const baseConfig = {
  server: {
    cors: {
      credentials: true
    }
  }
};

const developmentConfig = {
  ...baseConfig,
  server: {
    ...baseConfig.server,
    port: 3000,
    cors: {
      ...baseConfig.server.cors,
      origin: ['http://localhost:3000', 'http://localhost:3001']
    }
  },
  dev: {
    hotReload: true,
    verbose: true
  }
};

const productionConfig = {
  ...baseConfig,
  server: {
    ...baseConfig.server,
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0',
    cors: {
      ...baseConfig.server.cors,
      origin: process.env.ALLOWED_ORIGINS?.split(',')
    }
  }
};

export default process.env.NODE_ENV === 'production' 
  ? productionConfig 
  : developmentConfig;
```

### Environment Variables
```typescript
// gati.config.ts
export default {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost'
  },
  
  modules: {
    database: {
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
    },
    
    cache: {
      url: process.env.REDIS_URL
    }
  },
  
  // Feature flags
  features: {
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    debugging: process.env.NODE_ENV === 'development'
  }
};
```

## Advanced Configuration

### Custom Route Discovery
```typescript
export default {
  discovery: {
    // Custom handler patterns
    handlerPatterns: [
      'src/handlers/**/*.ts',
      'src/api/**/*.handler.ts'
    ],
    
    // Custom module patterns
    modulePatterns: [
      'src/modules/**/*.ts',
      'src/services/**/*.service.ts'
    ],
    
    // Custom route mapping
    routeMapper: (filePath) => {
      // Custom logic to map file paths to routes
      return filePath.replace(/\.handler\.ts$/, '');
    }
  }
};
```

### Plugin System
```typescript
import { analyticsPlugin, authPlugin } from './plugins';

export default {
  plugins: [
    analyticsPlugin({
      apiKey: process.env.ANALYTICS_API_KEY
    }),
    
    authPlugin({
      jwtSecret: process.env.JWT_SECRET,
      providers: ['google', 'github']
    })
  ]
};
```

### Lifecycle Hooks
```typescript
export default {
  hooks: {
    beforeStart: async (gctx) => {
      console.log('Server starting...');
      await gctx.modules.database.migrate();
    },
    
    afterStart: async (gctx) => {
      console.log('Server started successfully');
      await gctx.modules.analytics.track('server_started');
    },
    
    beforeShutdown: async (gctx) => {
      console.log('Server shutting down...');
      await gctx.modules.database.close();
    }
  }
};
```

## Configuration Validation

### Schema Validation
```typescript
import { z } from 'zod';

const ConfigSchema = z.object({
  server: z.object({
    port: z.number().min(1).max(65535),
    host: z.string()
  }).optional(),
  
  modules: z.record(z.any()).optional(),
  
  overrides: z.record(z.any()).optional()
});

const config = {
  server: {
    port: 3000,
    host: 'localhost'
  }
};

// Validate configuration
const validatedConfig = ConfigSchema.parse(config);

export default validatedConfig;
```

### Runtime Validation
```typescript
export default {
  validate: {
    // Validate environment variables
    env: {
      DATABASE_URL: 'required',
      JWT_SECRET: 'required',
      REDIS_URL: 'optional'
    },
    
    // Validate module dependencies
    modules: {
      database: ['pg', 'typeorm'],
      cache: ['redis', 'ioredis']
    }
  }
};
```

## Configuration Examples

### REST API Server
```typescript
export default {
  server: {
    port: 3000,
    cors: { origin: true },
    rateLimit: { max: 1000 }
  },
  
  middleware: [
    corsMiddleware,
    authMiddleware,
    validationMiddleware
  ],
  
  modules: {
    database: databaseConfig,
    auth: jwtConfig
  }
};
```

### GraphQL API Server
```typescript
export default {
  server: {
    port: 4000,
    playground: true
  },
  
  overrides: {
    'POST /graphql': graphqlHandler,
    'GET /graphql': playgroundHandler
  },
  
  modules: {
    schema: graphqlSchema,
    resolvers: graphqlResolvers
  }
};
```

### Microservice Configuration
```typescript
export default {
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: '0.0.0.0'
  },
  
  modules: {
    serviceDiscovery: consulConfig,
    messaging: rabbitMQConfig,
    tracing: jaegerConfig
  },
  
  middleware: [
    tracingMiddleware,
    metricsMiddleware
  ]
};
```

## Next Steps

- [Development Server](./development-server.md) - Server features and options
- [Modules Guide](./modules.md) - Creating and configuring modules
- [Deployment Guide](./deployment.md) - Production configuration