/**
 * @module timescape/phase3-example
 * @description Example usage of Timescape Phase 3 (Request Routing)
 */

import { VersionRegistry } from './registry.js';
import { TransformerEngine } from './transformer.js';
import { TimescapeMetrics } from './metrics.js';
import { TimescapeIntegration } from './integration.js';
import type { Request, Response, GlobalContext, LocalContext } from '../types/index.js';
import type { TSV } from './types.js';

// ============================================================================
// Setup
// ============================================================================

const registry = new VersionRegistry();
const transformerEngine = new TransformerEngine();
const metrics = new TimescapeMetrics();
const integration = new TimescapeIntegration(registry, transformerEngine, metrics);

// ============================================================================
// Register Versions
// ============================================================================

// Version 1: Initial API
const v1: TSV = 'tsv:1732100000-users-001';
registry.registerVersion('/api/users', v1, {
    hash: 'abc123',
    schema: {
        request: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                email: { type: 'string' },
            },
        },
        response: {
            type: 'object',
            properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                email: { type: 'string' },
            },
        },
    },
});
registry.tagVersion(v1, 'v1.0.0');

// Version 2: Add age field (non-breaking)
const v2: TSV = 'tsv:1732200000-users-002';
registry.registerVersion('/api/users', v2, {
    hash: 'def456',
    schema: {
        request: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                age: { type: 'number' }, // New optional field
            },
        },
        response: {
            type: 'object',
            properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                email: { type: 'string' },
                age: { type: 'number' }, // New field
            },
        },
    },
});
registry.tagVersion(v2, 'v1.1.0');

// Version 3: Rename email to emailAddress (breaking)
const v3: TSV = 'tsv:1732300000-users-003';
registry.registerVersion('/api/users', v3, {
    hash: 'ghi789',
    schema: {
        request: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                emailAddress: { type: 'string' }, // Renamed from email
                age: { type: 'number' },
            },
        },
        response: {
            type: 'object',
            properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                emailAddress: { type: 'string' }, // Renamed from email
                age: { type: 'number' },
            },
        },
    },
});
registry.tagVersion(v3, 'v2.0.0');

// ============================================================================
// Register Transformers
// ============================================================================

// Transformer: v1 ↔ v2 (add/remove age field)
transformerEngine.register({
    fromVersion: v1,
    toVersion: v2,
    forward: {
        request: async (data: any) => ({
            ...data,
            age: data.age || 0, // Default age if not provided
        }),
        response: async (data: any) => data, // v2 response includes age
    },
    backward: {
        request: async (data: any) => {
            const { age, ...rest } = data;
            return rest; // Remove age for v1
        },
        response: async (data: any) => {
            const { age, ...rest } = data;
            return rest; // Remove age from v1 response
        },
    },
});

// Transformer: v2 ↔ v3 (rename email to emailAddress)
transformerEngine.register({
    fromVersion: v2,
    toVersion: v3,
    forward: {
        request: async (data: any) => ({
            name: data.name,
            emailAddress: data.email, // Rename
            age: data.age,
        }),
        response: async (data: any) => data, // v3 response uses emailAddress
    },
    backward: {
        request: async (data: any) => ({
            name: data.name,
            email: data.emailAddress, // Rename back
            age: data.age,
        }),
        response: async (data: any) => ({
            id: data.id,
            name: data.name,
            email: data.emailAddress, // Rename back for v2
            age: data.age,
        }),
    },
});

// ============================================================================
// Handler (Always uses latest version - v3)
// ============================================================================

async function createUserHandler(
    req: Request,
    res: Response,
    gctx: GlobalContext,
    lctx: LocalContext
): Promise<void> {
    // Handler always works with v3 schema
    const { name, emailAddress, age } = req.body;

    // Simulate database insert
    const user = {
        id: Math.floor(Math.random() * 1000),
        name,
        emailAddress,
        age,
        createdAt: new Date().toISOString(),
    };

    console.log('[Handler] Created user with v3 schema:', user);

    // Get version metadata
    const metadata = integration.getMetadata(lctx);
    if (metadata) {
        console.log('[Handler] Version metadata:', {
            requestedVersion: metadata.requestedVersion,
            resolvedVersion: metadata.resolvedVersion,
            handlerVersion: metadata.handlerVersion,
            transformerChainLength: metadata.transformerChainLength,
        });
    }

    // Return v3 response
    res.json(user);
}

// ============================================================================
// Middleware (Applies version resolution and transformation)
// ============================================================================

async function timescapeMiddleware(
    req: Request,
    res: Response,
    gctx: GlobalContext,
    lctx: LocalContext,
    next: () => Promise<void>
): Promise<void> {
    const handlerPath = req.path;

    // 1. Resolve version
    const metadata = await integration.resolveVersion(handlerPath, req);

    if ('error' in metadata) {
        res.status(metadata.statusCode).json({ error: metadata.error });
        return;
    }

    console.log('[Middleware] Resolved version:', {
        source: metadata.source,
        resolvedVersion: metadata.resolvedVersion,
        handlerVersion: metadata.handlerVersion,
    });

    // 2. Transform request (client version → handler version)
    try {
        const transformedReq = await integration.transformRequest(req, metadata);
        req.body = transformedReq.body;

        console.log('[Middleware] Transformed request:', {
            original: req.body,
            transformed: transformedReq.body,
            chainLength: metadata.transformerChainLength,
        });
    } catch (error) {
        console.error('[Middleware] Request transformation failed:', error);
        res.status(500).json({ error: 'Request transformation failed' });
        return;
    }

    // 3. Attach metadata to context
    integration.attachMetadata(lctx, metadata);

    // 4. Execute handler
    await next();

    // 5. Transform response (handler version → client version)
    if (!res.isSent()) {
        try {
            const responseData = res.getBody();
            const transformedResponse = await integration.transformResponse(
                responseData,
                metadata
            );

            console.log('[Middleware] Transformed response:', {
                original: responseData,
                transformed: transformedResponse,
            });

            res.json(transformedResponse);
        } catch (error) {
            console.error('[Middleware] Response transformation failed:', error);
            res.status(500).json({ error: 'Response transformation failed' });
        }
    }
}

// ============================================================================
// Example Requests
// ============================================================================

async function exampleRequests() {
    console.log('\n=== Example 1: v1 Client (using tag) ===');
    const req1: Partial<Request> = {
        path: '/api/users',
        method: 'POST',
        query: { version: 'v1.0.0' },
        headers: {},
        body: {
            name: 'Alice',
            email: 'alice@example.com',
            // No age field in v1
        },
    };

    // Simulated response
    console.log('Request:', req1.body);
    console.log('Expected transformation: email → emailAddress, add age: 0');
    console.log('Handler receives:', {
        name: 'Alice',
        emailAddress: 'alice@example.com',
        age: 0,
    });
    console.log('Handler returns:', {
        id: 123,
        name: 'Alice',
        emailAddress: 'alice@example.com',
        age: 0,
    });
    console.log('Client receives (v1):', {
        id: 123,
        name: 'Alice',
        email: 'alice@example.com',
        // No age field
    });

    console.log('\n=== Example 2: v2 Client (using tag) ===');
    const req2: Partial<Request> = {
        path: '/api/users',
        method: 'POST',
        query: { version: 'v1.1.0' },
        headers: {},
        body: {
            name: 'Bob',
            email: 'bob@example.com',
            age: 30,
        },
    };

    console.log('Request:', req2.body);
    console.log('Expected transformation: email → emailAddress');
    console.log('Handler receives:', {
        name: 'Bob',
        emailAddress: 'bob@example.com',
        age: 30,
    });
    console.log('Handler returns:', {
        id: 456,
        name: 'Bob',
        emailAddress: 'bob@example.com',
        age: 30,
    });
    console.log('Client receives (v2):', {
        id: 456,
        name: 'Bob',
        email: 'bob@example.com',
        age: 30,
    });

    console.log('\n=== Example 3: v3 Client (latest) ===');
    const req3: Partial<Request> = {
        path: '/api/users',
        method: 'POST',
        query: {}, // No version specified, defaults to latest
        headers: {},
        body: {
            name: 'Charlie',
            emailAddress: 'charlie@example.com',
            age: 25,
        },
    };

    console.log('Request:', req3.body);
    console.log('Expected transformation: None (same version)');
    console.log('Handler receives:', req3.body);
    console.log('Handler returns:', {
        id: 789,
        name: 'Charlie',
        emailAddress: 'charlie@example.com',
        age: 25,
    });
    console.log('Client receives (v3):', {
        id: 789,
        name: 'Charlie',
        emailAddress: 'charlie@example.com',
        age: 25,
    });

    console.log('\n=== Example 4: Timestamp-based version ===');
    const req4: Partial<Request> = {
        path: '/api/users',
        method: 'POST',
        query: { version: '2025-11-20T10:00:00Z' }, // Between v1 and v2
        headers: {},
        body: {
            name: 'David',
            email: 'david@example.com',
        },
    };

    console.log('Request:', req4.body);
    console.log('Timestamp resolves to: v1');
    console.log('Expected transformation: v1 → v2 → v3 (multi-hop)');
    console.log('Transformer chain length: 2');

    console.log('\n=== Example 5: Header-based version ===');
    const req5: Partial<Request> = {
        path: '/api/users',
        method: 'POST',
        query: {},
        headers: { 'x-gati-version': 'v2.0.0' },
        body: {
            name: 'Eve',
            emailAddress: 'eve@example.com',
            age: 28,
        },
    };

    console.log('Request:', req5.body);
    console.log('Header resolves to: v3');
    console.log('Expected transformation: None (same version)');
}

// ============================================================================
// Run Examples
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
    exampleRequests().catch(console.error);
}

export {
    registry,
    transformerEngine,
    metrics,
    integration,
    createUserHandler,
    timescapeMiddleware,
};
