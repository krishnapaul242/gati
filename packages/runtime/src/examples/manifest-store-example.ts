/**
 * @module runtime/examples/manifest-store-example
 * @description Example usage of Manifest Store
 */

import { createManifestStore } from '../manifest-store.js';
import type {
  HandlerManifest,
  GType,
  Transformer,
  VersionGraph,
  TimescapeMetadata,
} from '../types/manifest-store.js';

/**
 * Example: Basic manifest storage and retrieval
 */
async function basicManifestExample() {
  const store = createManifestStore();

  // Create a handler manifest
  const manifest: HandlerManifest = {
    handlerId: 'user.create',
    version: '1.0.0',
    path: '/users',
    method: 'POST',
    gtypes: {
      request: 'CreateUserRequest',
      response: 'UserResponse',
    },
    hooks: {
      before: ['auth', 'validate'],
      after: ['log', 'notify'],
    },
    timescapeVersion: 'v1',
    policies: {
      roles: ['admin', 'user-manager'],
      rateLimit: {
        limit: 100,
        window: 60000, // 1 minute
      },
    },
    dependencies: {
      modules: ['user-service', 'email-service'],
    },
    hash: 'abc123def456',
    createdAt: Date.now(),
  };

  // Store the manifest
  await store.storeManifest(manifest);
  console.log('Stored manifest:', manifest.handlerId);

  // Retrieve by ID and version
  const retrieved = await store.getManifest('user.create', '1.0.0');
  console.log('Retrieved manifest:', retrieved?.handlerId);

  // Retrieve latest version (no version specified)
  const latest = await store.getManifest('user.create');
  console.log('Latest version:', latest?.version);
}

/**
 * Example: GType schema storage
 */
async function gtypeSchemaExample() {
  const store = createManifestStore();

  // Define a GType schema for a user creation request
  const createUserRequestType: GType = {
    ref: 'CreateUserRequest',
    kind: 'object',
    properties: {
      name: {
        type: {
          ref: 'string',
          kind: 'primitive',
          primitiveType: 'string',
        },
        optional: false,
        description: 'User full name',
      },
      email: {
        type: {
          ref: 'string',
          kind: 'primitive',
          primitiveType: 'string',
        },
        optional: false,
        description: 'User email address',
      },
      age: {
        type: {
          ref: 'number',
          kind: 'primitive',
          primitiveType: 'number',
        },
        optional: true,
        description: 'User age',
      },
    },
    required: ['name', 'email'],
    validators: [
      {
        type: 'custom',
        value: 'emailValidator',
        message: 'Invalid email format',
      },
    ],
  };

  // Store the GType
  await store.storeGType(createUserRequestType);
  console.log('Stored GType:', createUserRequestType.ref);

  // Retrieve the GType
  const retrieved = await store.getGType('CreateUserRequest');
  console.log('Retrieved GType properties:', Object.keys(retrieved?.properties || {}));
}

/**
 * Example: Version graph management
 */
async function versionGraphExample() {
  const store = createManifestStore();

  // Create a version graph showing handler evolution
  const graph: VersionGraph = {
    handlerId: 'user.create',
    versions: [
      {
        version: '1.0.0',
        manifestHash: 'hash1',
        deployedAt: Date.now() - 86400000, // 1 day ago
        active: false,
        breaking: false,
      },
      {
        version: '1.1.0',
        manifestHash: 'hash2',
        deployedAt: Date.now() - 43200000, // 12 hours ago
        active: false,
        parent: '1.0.0',
        breaking: false,
      },
      {
        version: '2.0.0',
        manifestHash: 'hash3',
        deployedAt: Date.now(),
        active: true,
        parent: '1.1.0',
        breaking: true,
        transformers: [
          {
            to: '1.1.0',
            transformerId: 'user.create:v2->v1.1',
          },
        ],
      },
    ],
    currentVersion: '2.0.0',
    latestVersion: '2.0.0',
  };

  // Store the version graph
  await store.storeVersionGraph(graph);
  console.log('Stored version graph for:', graph.handlerId);

  // Retrieve the version graph
  const retrieved = await store.getVersionGraph('user.create');
  console.log('Version count:', retrieved?.versions.length);
  console.log('Current version:', retrieved?.currentVersion);
}

/**
 * Example: Transformer storage and retrieval
 */
async function transformerExample() {
  const store = createManifestStore();

  // Define a transformer for version compatibility
  const transformer: Transformer = {
    id: 'user.create:v1->v2',
    handlerId: 'user.create',
    fromVersion: '1.0.0',
    toVersion: '2.0.0',
    direction: 'forward',
    transformations: [
      {
        path: 'user.email',
        type: 'rename',
        details: { newName: 'emailAddress' },
      },
      {
        path: 'user.phoneNumber',
        type: 'add',
        details: { defaultValue: null },
      },
      {
        path: 'user.metadata',
        type: 'remove',
        details: {},
      },
    ],
    hash: 'trans123',
    createdAt: Date.now(),
  };

  // Store the transformer
  await store.storeTransformer(transformer);
  console.log('Stored transformer:', transformer.id);

  // Retrieve by ID
  const retrieved = await store.getTransformer('user.create:v1->v2');
  console.log('Retrieved transformer:', retrieved?.id);

  // Find transformers for a version pair
  const transformers = await store.getTransformersForVersions(
    'user.create',
    '1.0.0',
    '2.0.0'
  );
  console.log('Found transformers:', transformers.length);
}

/**
 * Example: Timescape metadata management
 */
async function timescapeMetadataExample() {
  const store = createManifestStore();

  // Define Timescape metadata for a handler version
  const metadata: TimescapeMetadata = {
    handlerId: 'user.create',
    version: '2.0.0',
    fingerprint: 'fp_abc123',
    compatibility: {
      compatible: ['1.9.0', '1.8.0'],
      incompatible: ['1.0.0', '1.5.0'],
      transformable: ['1.0.0', '1.5.0'],
    },
    deployment: {
      strategy: 'canary',
      rolloutPercentage: 25,
      status: 'active',
    },
    metrics: {
      requestCount: 15000,
      errorRate: 0.002,
      avgLatency: 45.5,
      lastUpdated: Date.now(),
    },
  };

  // Store the metadata
  await store.storeTimescapeMetadata(metadata);
  console.log('Stored Timescape metadata for:', metadata.handlerId);

  // Retrieve the metadata
  const retrieved = await store.getTimescapeMetadata('user.create', '2.0.0');
  console.log('Deployment strategy:', retrieved?.deployment.strategy);
  console.log('Request count:', retrieved?.metrics?.requestCount);
}

/**
 * Example: Multi-version handler management
 */
async function multiVersionExample() {
  const store = createManifestStore();

  // Store multiple versions of the same handler
  const versions = ['1.0.0', '1.1.0', '2.0.0'];

  for (const version of versions) {
    const manifest: HandlerManifest = {
      handlerId: 'user.create',
      version,
      path: '/users',
      method: 'POST',
      gtypes: {
        request: `CreateUserRequest_${version}`,
        response: `UserResponse_${version}`,
      },
      hooks: {
        before: ['auth'],
        after: ['log'],
      },
      timescapeVersion: version,
      policies: {},
      dependencies: {
        modules: ['user-service'],
      },
      hash: `hash_${version}`,
      createdAt: Date.now(),
    };

    await store.storeManifest(manifest);
  }

  console.log('Stored', versions.length, 'versions');

  // Get all versions
  const allVersions = await store.getAllManifestVersions('user.create');
  console.log('All versions:', allVersions.map((m) => m.version));

  // Get latest version
  const latest = await store.getManifest('user.create');
  console.log('Latest version:', latest?.version);

  // Get specific version
  const specific = await store.getManifest('user.create', '1.1.0');
  console.log('Specific version:', specific?.version);
}

/**
 * Example: Store statistics
 */
async function statisticsExample() {
  const store = createManifestStore();

  // Store various data types
  await store.storeManifest({
    handlerId: 'test.handler',
    version: '1.0.0',
    path: '/test',
    method: 'GET',
    gtypes: { request: 'Req', response: 'Res' },
    hooks: { before: [], after: [] },
    timescapeVersion: 'v1',
    policies: {},
    dependencies: { modules: [] },
    hash: 'hash',
    createdAt: Date.now(),
  });

  await store.storeGType({
    ref: 'TestType',
    kind: 'primitive',
    primitiveType: 'string',
  });

  // Get statistics
  const stats = store.getStats();
  console.log('Store statistics:', stats);
  console.log('Total manifests:', stats.manifestCount);
  console.log('Total GTypes:', stats.gtypeCount);
}

/**
 * Run all examples
 */
async function runExamples() {
  console.log('\n=== Basic Manifest Example ===');
  await basicManifestExample();

  console.log('\n=== GType Schema Example ===');
  await gtypeSchemaExample();

  console.log('\n=== Version Graph Example ===');
  await versionGraphExample();

  console.log('\n=== Transformer Example ===');
  await transformerExample();

  console.log('\n=== Timescape Metadata Example ===');
  await timescapeMetadataExample();

  console.log('\n=== Multi-Version Example ===');
  await multiVersionExample();

  console.log('\n=== Statistics Example ===');
  await statisticsExample();
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}

export {
  basicManifestExample,
  gtypeSchemaExample,
  versionGraphExample,
  transformerExample,
  timescapeMetadataExample,
  multiVersionExample,
  statisticsExample,
};
