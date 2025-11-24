/**
 * @module runtime/examples/ingress-example
 * @description Example usage of the Ingress component
 */

import { createServer } from 'http';
import { createIngress } from '../ingress.js';
import type { IngressConfig, QueueFabric, RequestDescriptor } from '../types/ingress.js';

/**
 * Example: Create an Ingress with API key authentication
 */
async function exampleApiKeyAuth() {
  // Create a simple queue fabric mock
  const queueFabric: QueueFabric = {
    async publish(topic: string, payload: RequestDescriptor): Promise<void> {
      console.log(`Published to ${topic}:`, {
        requestId: payload.requestId,
        method: payload.method,
        path: payload.path,
        authenticated: payload.authContext?.authenticated,
      });
    },
  };

  // Configure Ingress with API key authentication
  const config: IngressConfig = {
    authMethod: 'api-key',
    apiKeys: new Set(['secret-key-123', 'another-key-456']),
    requireAuth: true,
    routingTopic: 'routing.requests',
    requestIdPrefix: 'api',
  };

  const ingress = createIngress(config, queueFabric);

  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      await ingress.handleRequest(req);
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'accepted' }));
    } catch (error) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Authentication failed',
        })
      );
    }
  });

  server.listen(3000, () => {
    console.log('Ingress server listening on port 3000');
    console.log('Try: curl -H "x-api-key: secret-key-123" http://localhost:3000/api/users');
  });
}

/**
 * Example: Create an Ingress with JWT authentication
 */
async function exampleJWTAuth() {
  const queueFabric: QueueFabric = {
    async publish(topic: string, payload: RequestDescriptor): Promise<void> {
      console.log(`Published to ${topic}:`, {
        requestId: payload.requestId,
        method: payload.method,
        path: payload.path,
        clientId: payload.authContext?.clientId,
        roles: payload.authContext?.roles,
      });
    },
  };

  const config: IngressConfig = {
    authMethod: 'jwt',
    jwtSecret: 'my-secret-key',
    requireAuth: true,
    routingTopic: 'routing.requests',
  };

  const ingress = createIngress(config, queueFabric);

  const server = createServer(async (req, res) => {
    try {
      await ingress.handleRequest(req);
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'accepted' }));
    } catch (error) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Authentication failed',
        })
      );
    }
  });

  server.listen(3001, () => {
    console.log('Ingress server with JWT listening on port 3001');
  });
}

/**
 * Example: Create an Ingress without authentication
 */
async function exampleNoAuth() {
  const queueFabric: QueueFabric = {
    async publish(topic: string, payload: RequestDescriptor): Promise<void> {
      console.log(`Published to ${topic}:`, {
        requestId: payload.requestId,
        method: payload.method,
        path: payload.path,
        versionPreference: payload.versionPreference,
        priority: payload.priority,
        flags: payload.flags,
      });
    },
  };

  const config: IngressConfig = {
    authMethod: 'none',
    requireAuth: false,
    routingTopic: 'routing.requests',
  };

  const ingress = createIngress(config, queueFabric);

  const server = createServer(async (req, res) => {
    try {
      await ingress.handleRequest(req);
      res.writeHead(202, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'accepted' }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Internal error',
        })
      );
    }
  });

  server.listen(3002, () => {
    console.log('Ingress server without auth listening on port 3002');
    console.log('Try: curl -H "x-version: v2" -H "x-priority: 8" http://localhost:3002/api/users');
  });
}

// Run examples (uncomment to test)
// exampleApiKeyAuth();
// exampleJWTAuth();
// exampleNoAuth();

export { exampleApiKeyAuth, exampleJWTAuth, exampleNoAuth };
