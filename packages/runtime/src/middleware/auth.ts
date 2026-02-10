/**
 * @module runtime/middleware/auth
 * @description Authentication and authorization middleware
 */

import type { Middleware } from '../types/middleware.js';
import type { Request, Response, GlobalContext, LocalContext } from '../types/index.js';
import { HandlerError } from '../types/handler.js';
import { logger } from '../logger.js';

/**
 * JWT token payload structure
 */
export interface JWTPayload {
  sub: string; // Subject (user ID)
  iat: number; // Issued at
  exp: number; // Expiration
  [key: string]: unknown; // Additional claims
}

/**
 * User identity extracted from authentication
 */
export interface UserIdentity {
  id: string;
  email?: string;
  username?: string;
  roles?: string[];
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Authentication provider interface
 */
export interface AuthProvider {
  /**
   * Verify token and extract user identity
   */
  verify(token: string): Promise<UserIdentity>;

  /**
   * Optional: Refresh token
   */
  refresh?(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
}

/**
 * JWT authentication provider
 */
export class JWTAuthProvider implements AuthProvider {
  constructor(
    private options: {
      secret: string | Buffer;
      issuer?: string;
      audience?: string;
      algorithms?: string[];
    }
  ) {}

  async verify(token: string): Promise<UserIdentity> {
    try {
      // In production, use a proper JWT library like 'jsonwebtoken'
      // This is a simplified implementation for demonstration
      const [headerB64, payloadB64, signature] = token.split('.');
      
      if (!headerB64 || !payloadB64 || !signature) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));

      // Verify expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new Error('Token expired');
      }

      // Verify issuer
      if (this.options.issuer && payload.iss !== this.options.issuer) {
        throw new Error('Invalid issuer');
      }

      // Verify audience
      if (this.options.audience && payload.aud !== this.options.audience) {
        throw new Error('Invalid audience');
      }

      // TODO: Verify signature with secret
      // In production: verify(token, this.options.secret, { algorithms: this.options.algorithms })

      return {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
        metadata: payload.metadata || {},
      };
    } catch (error) {
      logger.error({ error }, 'JWT verification failed');
      throw new HandlerError('Invalid authentication token', 401);
    }
  }
}

/**
 * API Key authentication provider
 */
export class APIKeyAuthProvider implements AuthProvider {
  constructor(
    private options: {
      /**
       * Function to validate API key and return user identity
       */
      validateKey: (apiKey: string) => Promise<UserIdentity | null>;
      
      /**
       * Header name for API key (default: 'X-API-Key')
       */
      headerName?: string;
    }
  ) {}

  async verify(apiKey: string): Promise<UserIdentity> {
    const user = await this.options.validateKey(apiKey);
    
    if (!user) {
      throw new HandlerError('Invalid API key', 401);
    }

    return user;
  }
}

/**
 * Authentication middleware configuration
 */
export interface AuthMiddlewareConfig {
  /**
   * Authentication provider
   */
  provider: AuthProvider;

  /**
   * Token extraction strategy
   */
  extractToken?: (req: Request) => string | null;

  /**
   * Skip authentication for specific paths
   */
  skipPaths?: string[];

  /**
   * Skip authentication for specific methods
   */
  skipMethods?: string[];

  /**
   * Optional: Enrich local context with user data
   */
  enrichContext?: boolean;
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(config: AuthMiddlewareConfig): Middleware {
  const {
    provider,
    extractToken = defaultTokenExtractor,
    skipPaths = [],
    skipMethods = [],
    enrichContext = true,
  } = config;

  return async (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, next) => {
    // Check if path should skip auth
    if (skipPaths.some((path) => req.path?.startsWith(path))) {
      await next();
      return;
    }

    // Check if method should skip auth
    if (skipMethods.includes(req.method)) {
      await next();
      return;
    }

    // Extract token
    const token = extractToken(req);
    
    if (!token) {
      throw new HandlerError('Authentication required', 401, {
        message: 'No authentication token provided',
      });
    }

    try {
      // Verify token and get user identity
      const user = await provider.verify(token);

      // Enrich local context with user data
      if (enrichContext) {
        lctx.refs.userId = user.id;
        lctx.state.user = user;
      }

      logger.debug({ userId: user.id }, 'User authenticated');

      // Continue to next middleware/handler
      await next();
    } catch (error) {
      if (error instanceof HandlerError) {
        throw error;
      }
      
      logger.error({ error }, 'Authentication failed');
      throw new HandlerError('Authentication failed', 401);
    }
  };
}

/**
 * Default token extractor (looks for Bearer token in Authorization header)
 */
function defaultTokenExtractor(req: Request): string | null {
  const authHeader = req.headers?.authorization;
  
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Role-Based Access Control (RBAC) configuration
 */
export interface RBACConfig {
  /**
   * Required roles (user must have at least one)
   */
  roles?: string[];

  /**
   * Required permissions (user must have all)
   */
  permissions?: string[];

  /**
   * Custom authorization function
   */
  authorize?: (user: UserIdentity, req: Request) => boolean | Promise<boolean>;
}

/**
 * Create RBAC authorization middleware
 * 
 * Note: Must be used AFTER authentication middleware
 */
export function createRBACMiddleware(config: RBACConfig): Middleware {
  return async (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, next) => {
    // Get user from local context (set by auth middleware)
    const user = lctx.state.user as UserIdentity | undefined;

    if (!user) {
      throw new HandlerError('Authentication required', 401, {
        message: 'User not authenticated',
      });
    }

    // Check roles
    if (config.roles && config.roles.length > 0) {
      const hasRole = config.roles.some((role) => user.roles?.includes(role));
      
      if (!hasRole) {
        throw new HandlerError('Insufficient permissions', 403, {
          message: 'User does not have required role',
          requiredRoles: config.roles,
          userRoles: user.roles,
        });
      }
    }

    // Check permissions
    if (config.permissions && config.permissions.length > 0) {
      const hasAllPermissions = config.permissions.every((perm) =>
        user.permissions?.includes(perm)
      );

      if (!hasAllPermissions) {
        throw new HandlerError('Insufficient permissions', 403, {
          message: 'User does not have required permissions',
          requiredPermissions: config.permissions,
          userPermissions: user.permissions,
        });
      }
    }

    // Custom authorization
    if (config.authorize) {
      const authorized = await config.authorize(user, req);
      
      if (!authorized) {
        throw new HandlerError('Authorization failed', 403, {
          message: 'Custom authorization check failed',
        });
      }
    }

    logger.debug({ userId: user.id, roles: user.roles }, 'User authorized');

    // Continue to next middleware/handler
    await next();
  };
}

/**
 * Policy-based authorization (Cedar/OPA style)
 */
export interface PolicyAuthConfig {
  /**
   * Policy evaluation function
   */
  evaluatePolicy: (
    user: UserIdentity,
    resource: string,
    action: string,
    context?: Record<string, unknown>
  ) => Promise<boolean>;

  /**
   * Resource identifier extractor
   */
  getResource?: (req: Request) => string;

  /**
   * Action identifier extractor
   */
  getAction?: (req: Request) => string;
}

/**
 * Create policy-based authorization middleware
 * 
 * Note: Must be used AFTER authentication middleware
 */
export function createPolicyAuthMiddleware(config: PolicyAuthConfig): Middleware {
  const {
    evaluatePolicy,
    getResource = (req) => req.path || '',
    getAction = (req) => req.method,
  } = config;

  return async (req: Request, res: Response, gctx: GlobalContext, lctx: LocalContext, next) => {
    // Get user from local context (set by auth middleware)
    const user = lctx.state.user as UserIdentity | undefined;

    if (!user) {
      throw new HandlerError('Authentication required', 401);
    }

    const resource = getResource(req);
    const action = getAction(req);

    logger.debug({ userId: user.id, resource, action }, 'Evaluating policy');

    // Evaluate policy
    const allowed = await evaluatePolicy(user, resource, action, {
      ip: lctx.client.ip,
      timestamp: lctx.timestamp,
    });

    if (!allowed) {
      throw new HandlerError('Access denied', 403, {
        message: 'Policy evaluation denied access',
        resource,
        action,
      });
    }

    logger.debug({ userId: user.id, resource, action }, 'Policy authorized');

    // Continue to next middleware/handler
    await next();
  };
}
