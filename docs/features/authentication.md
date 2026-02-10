# Authentication and Authorization Middleware

Gati provides comprehensive authentication and authorization middleware for securing your applications.

## Table of Contents

- [Authentication Middleware](#authentication-middleware)
  - [JWT Authentication](#jwt-authentication)
  - [API Key Authentication](#api-key-authentication)
  - [Custom Authentication](#custom-authentication)
- [Authorization Middleware](#authorization-middleware)
  - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
  - [Policy-Based Authorization](#policy-based-authorization)
- [User Identity](#user-identity)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Authentication Middleware

Authentication middleware verifies user identity and enriches the request context with user data.

### JWT Authentication

```typescript
import {
  createAuthMiddleware,
  JWTAuthProvider,
  type UserIdentity,
} from '@gati-framework/runtime';

// Create JWT provider
const jwtProvider = new JWTAuthProvider({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  issuer: 'your-app',
  audience: 'your-api',
  algorithms: ['HS256'],
});

// Create authentication middleware
const authMiddleware = createAuthMiddleware({
  provider: jwtProvider,
  skipPaths: ['/health', '/login', '/register'],
  skipMethods: ['OPTIONS'],
  enrichContext: true, // Add user to lctx.state.user
});

// Use in app
app.use(authMiddleware, {
  path: '/api/*',
  priority: 100, // High priority
});
```

### API Key Authentication

```typescript
import {
  createAuthMiddleware,
  APIKeyAuthProvider,
} from '@gati-framework/runtime';

// Create API key provider
const apiKeyProvider = new APIKeyAuthProvider({
  validateKey: async (apiKey: string) => {
    // Look up API key in database
    const user = await db.findUserByApiKey(apiKey);
    
    if (!user) {
      return null; // Invalid key
    }

    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };
  },
  headerName: 'X-API-Key', // Default
});

// Create authentication middleware
const authMiddleware = createAuthMiddleware({
  provider: apiKeyProvider,
  extractToken: (req) => {
    // Extract from custom header
    return req.headers?.['x-api-key'] as string;
  },
});
```

### Custom Authentication

Implement your own authentication provider:

```typescript
import { type AuthProvider, type UserIdentity } from '@gati-framework/runtime';

class CustomAuthProvider implements AuthProvider {
  async verify(token: string): Promise<UserIdentity> {
    // Your custom verification logic
    const decoded = await yourCustomVerify(token);
    
    return {
      id: decoded.userId,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions,
    };
  }
  
  async refresh?(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Optional: implement token refresh
    return yourCustomRefresh(refreshToken);
  }
}

const authMiddleware = createAuthMiddleware({
  provider: new CustomAuthProvider(),
});
```

## Authorization Middleware

Authorization middleware controls access based on user roles and permissions.

### Role-Based Access Control (RBAC)

Restrict access based on user roles:

```typescript
import { createRBACMiddleware } from '@gati-framework/runtime';

// Require admin role
const adminOnly = createRBACMiddleware({
  roles: ['admin'],
});

// Require at least one of multiple roles
const moderatorOrAdmin = createRBACMiddleware({
  roles: ['admin', 'moderator'],
});

// Require specific permissions
const canEditPosts = createRBACMiddleware({
  permissions: ['posts:edit', 'posts:delete'],
});

// Use in handlers
app.use(adminOnly, {
  path: '/admin/*',
  priority: 90,
});

app.use(canEditPosts, {
  path: '/posts/:id',
  methods: ['PUT', 'DELETE'],
  priority: 90,
});
```

### Policy-Based Authorization

Fine-grained authorization using policies:

```typescript
import { createPolicyAuthMiddleware } from '@gati-framework/runtime';

const policyAuth = createPolicyAuthMiddleware({
  evaluatePolicy: async (user, resource, action, context) => {
    // Example: Check if user owns the resource
    if (action === 'DELETE' && resource.startsWith('/posts/')) {
      const postId = resource.split('/').pop();
      const post = await db.getPost(postId);
      
      // Allow if user owns the post or is admin
      return post.authorId === user.id || user.roles?.includes('admin');
    }
    
    // Example: Check if user is in same organization
    if (resource.startsWith('/organizations/')) {
      const orgId = resource.split('/')[2];
      return user.metadata?.organizationId === orgId;
    }
    
    // Default: deny
    return false;
  },
  
  getResource: (req) => req.path || '',
  getAction: (req) => req.method,
});

app.use(policyAuth, {
  path: '/api/*',
  priority: 80,
});
```

## User Identity

After authentication, user identity is available in handlers:

```typescript
import type { Handler, UserIdentity } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  // Get authenticated user from local context
  const user = lctx.state.user as UserIdentity;
  
  console.log('User ID:', user.id);
  console.log('User roles:', user.roles);
  console.log('User permissions:', user.permissions);
  
  res.json({
    message: `Hello, ${user.email}!`,
    userId: user.id,
  });
};
```

### UserIdentity Structure

```typescript
interface UserIdentity {
  id: string;                        // Unique user ID
  email?: string;                    // User email
  username?: string;                 // Username
  roles?: string[];                  // User roles (e.g., ['admin', 'user'])
  permissions?: string[];            // Permissions (e.g., ['posts:edit', 'users:view'])
  metadata?: Record<string, unknown>; // Additional user data
}
```

## Examples

### Complete Authentication Flow

```typescript
import {
  createAuthMiddleware,
  createRBACMiddleware,
  JWTAuthProvider,
} from '@gati-framework/runtime';

// 1. Create JWT provider
const jwtProvider = new JWTAuthProvider({
  secret: process.env.JWT_SECRET!,
  issuer: 'my-app',
  audience: 'my-api',
});

// 2. Create authentication middleware
const authMiddleware = createAuthMiddleware({
  provider: jwtProvider,
  skipPaths: ['/health', '/login', '/register', '/public'],
  enrichContext: true,
});

// 3. Create role-based middleware
const adminOnly = createRBACMiddleware({
  roles: ['admin'],
});

const userOrAdmin = createRBACMiddleware({
  roles: ['user', 'admin'],
});

// 4. Apply middleware
app.use(authMiddleware, {
  path: '/api/*',
  priority: 100, // Authentication first
});

app.use(adminOnly, {
  path: '/admin/*',
  priority: 90, // Authorization second
});

app.use(userOrAdmin, {
  path: '/dashboard/*',
  priority: 90,
});
```

### Login Handler

```typescript
import type { Handler } from '@gati-framework/runtime';
import jwt from 'jsonwebtoken';

type LoginInput = {
  email: string;
  password: string;
};

export const loginHandler: Handler<LoginInput> = async (req, res, gctx, lctx) => {
  const { email, password } = req.body;
  
  // Verify credentials
  const user = await db.getUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HandlerError('Invalid credentials', 401);
  }
  
  // Generate JWT
  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1h',
      issuer: 'my-app',
      audience: 'my-api',
    }
  );
  
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles,
    },
  });
};
```

### Resource Ownership Check

```typescript
import type { Handler, UserIdentity } from '@gati-framework/runtime';

type Params = { id: string };

export const deletePostHandler: Handler<void, void, Params> = async (req, res, gctx, lctx) => {
  const user = lctx.state.user as UserIdentity;
  const postId = req.params.id;
  
  // Get post
  const post = await db.getPost(postId);
  if (!post) {
    throw new HandlerError('Post not found', 404);
  }
  
  // Check ownership (or admin)
  if (post.authorId !== user.id && !user.roles?.includes('admin')) {
    throw new HandlerError('Not authorized to delete this post', 403);
  }
  
  // Delete post
  await db.deletePost(postId);
  
  res.status(204).json(undefined);
};
```

## Best Practices

### 1. Use HTTPS in Production

Always use HTTPS when transmitting authentication tokens:

```typescript
// In production, enforce HTTPS
if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
  throw new HandlerError('HTTPS required', 400);
}
```

### 2. Rotate Secrets Regularly

Rotate JWT secrets and API keys regularly:

```typescript
const jwtProvider = new JWTAuthProvider({
  secret: getLatestSecret(), // Function that rotates secrets
  // Consider supporting multiple secrets for zero-downtime rotation
});
```

### 3. Use Short Token Lifetimes

Keep access token lifetimes short and use refresh tokens:

```typescript
const token = jwt.sign(payload, secret, {
  expiresIn: '15m', // Short-lived access token
});

const refreshToken = jwt.sign(payload, refreshSecret, {
  expiresIn: '7d', // Longer-lived refresh token
});
```

### 4. Validate Input

Always validate authentication input:

```typescript
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginHandler: Handler = async (req, res, gctx, lctx) => {
  const validated = LoginSchema.parse(req.body);
  // Use validated data...
};
```

### 5. Rate Limit Authentication Endpoints

Prevent brute force attacks:

```typescript
import { createRateLimitMiddleware } from '@gati-framework/runtime';

const authRateLimit = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts',
});

app.use(authRateLimit, {
  path: '/login',
  priority: 110,
});
```

### 6. Log Authentication Events

Log all authentication attempts for security auditing:

```typescript
import { logger } from '@gati-framework/runtime';

export const loginHandler: Handler = async (req, res, gctx, lctx) => {
  const { email } = req.body;
  
  try {
    const user = await authenticateUser(email, password);
    
    logger.info({
      event: 'login_success',
      userId: user.id,
      email: user.email,
      ip: lctx.client.ip,
    }, 'User logged in');
    
    // Generate token...
  } catch (error) {
    logger.warn({
      event: 'login_failure',
      email,
      ip: lctx.client.ip,
      error: error.message,
    }, 'Login failed');
    
    throw error;
  }
};
```

### 7. Use Least Privilege

Grant minimum necessary permissions:

```typescript
// Instead of:
const user = {
  roles: ['admin'], // Too broad
};

// Use specific permissions:
const user = {
  roles: ['content_manager'],
  permissions: [
    'posts:create',
    'posts:edit',
    'posts:delete',
    // Only what's needed
  ],
};
```

### 8. Implement Token Revocation

Support token revocation for logout:

```typescript
const revokedTokens = new Set<string>();

export const logoutHandler: Handler = async (req, res, gctx, lctx) => {
  const token = extractToken(req);
  if (token) {
    revokedTokens.add(token);
    // In production, use Redis with expiration
  }
  
  res.json({ message: 'Logged out' });
};

// Check revocation in auth middleware
const authMiddleware = createAuthMiddleware({
  provider: {
    async verify(token: string) {
      if (revokedTokens.has(token)) {
        throw new Error('Token revoked');
      }
      // Verify token...
    },
  },
});
```

## API Reference

### Authentication Types

- `AuthProvider`: Interface for authentication providers
- `JWTAuthProvider`: JWT-based authentication
- `APIKeyAuthProvider`: API key-based authentication
- `UserIdentity`: User identity structure
- `AuthMiddlewareConfig`: Authentication middleware configuration

### Authorization Types

- `RBACConfig`: Role-based access control configuration
- `PolicyAuthConfig`: Policy-based authorization configuration

### Functions

- `createAuthMiddleware(config)`: Create authentication middleware
- `createRBACMiddleware(config)`: Create RBAC middleware
- `createPolicyAuthMiddleware(config)`: Create policy-based middleware

### Error Handling

Authentication and authorization errors throw `HandlerError` with:
- Status 401: Authentication failed (invalid/missing token)
- Status 403: Authorization failed (insufficient permissions)

```typescript
try {
  // Handler logic...
} catch (error) {
  if (error instanceof HandlerError) {
    // error.statusCode: 401 or 403
    // error.context: Additional error details
  }
}
```
