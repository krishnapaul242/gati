# Design Document

## Overview

The Gati Registry is a unified, secure, multi-artifact registry that serves as the foundation for the Gati ecosystem and the first online component of Gati Dev Cloud. It provides OCI-compliant storage and distribution for modules (JS/TS, OCI images, WASM, binaries, external adapters), plugins, AI models, AI agents, templates, and environment snapshots.

The Registry integrates deeply with Timescape for versioning, supports marketplace monetization, powers Gati Cloud deployments, and enables community contribution. It combines the functionality of npm (package management), Docker Hub (container distribution), HuggingFace Hub (model sharing), and Vercel Registry (template distribution) into a single, unified platform optimized for Gati's architecture.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        API Gateway                           │
│  (Auth, Rate Limiting, Request Routing, API Versioning)    │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Artifact   │ │   Metadata   │ │    Search    │
│   Storage    │ │    Index     │ │    Engine    │
│  (OCI Blob)  │ │  (Postgres)  │ │ (Elastic)    │
└──────────────┘ └──────────────┘ └──────────────┘
        │            │            │
        └────────────┼────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Signing &  │ │   Billing    │ │     Auth     │
│ Verification │ │    System    │ │  & Perms     │
│  (Cosign)    │ │  (Stripe)    │ │  (OAuth)     │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Registry Components


1. **Artifact Storage Layer**
   - OCI-compliant blob storage (S3/MinIO compatible)
   - Chunked uploads for large artifacts (models, containers)
   - Layer deduplication for efficiency
   - Content-addressable storage with SHA256 checksums
   - Resumable uploads and downloads

2. **Metadata Indexing Layer**
   - PostgreSQL database for structured metadata
   - Stores: namespaces, versions, tags, manifests, GTypes, publisher info, billing settings
   - Timescape version trees and compatibility metadata
   - Security signatures and vulnerability scan results
   - Download statistics and usage metrics

3. **Search Engine**
   - Elasticsearch for full-text and semantic search
   - Indexes: artifact names, descriptions, keywords, tags, capabilities
   - Type signature search (GTypes)
   - Fuzzy matching and relevance ranking
   - Faceted search by type, language, capabilities, compatibility

4. **API Gateway**
   - RESTful API for artifact operations (push, pull, search, publish)
   - GraphQL API for complex queries and relationships
   - Rate limiting and request throttling
   - API versioning and backward compatibility
   - Request authentication and authorization

5. **Authentication & Authorization**
   - Token-based authentication (JWT)
   - API keys with scoped permissions
   - OAuth integration (GitHub, Google, custom providers)
   - Organization roles and permissions
   - Publisher verification system

6. **Signing & Verification**
   - Cosign/Sigstore integration for artifact signing
   - WASM signature validation
   - Binary checksum verification
   - Publisher certificate management
   - Signature revocation support

7. **Vulnerability Scanning**
   - Trivy/Clair integration for CVE detection
   - Static analysis for malicious code patterns
   - Model poisoning detection for ML artifacts
   - Automated security scoring (CVSS-based)
   - Continuous monitoring and alerts

8. **Billing System**
   - Stripe integration for payment processing
   - Support for one-time purchases, subscriptions, usage-based billing
   - Revenue split management (default 70/30)
   - Enterprise licensing and private repos
   - Usage tracking and metering

9. **Web UI**
   - Artifact browsing and search interface
   - Installation instructions and code examples
   - Version history and Timescape diff visualization
   - Publisher profiles and verification badges
   - Marketplace with pricing and billing

## Components and Interfaces

### Registry Client Interface

```typescript
interface RegistryClient {
  /**
   * Authenticate with the registry
   */
  login(credentials: Credentials): Promise<AuthToken>;
  
  /**
   * Publish an artifact to the registry
   */
  publish(artifact: Artifact, signature: Signature): Promise<PublishResult>;
  
  /**
   * Fetch an artifact from the registry
   */
  fetch(name: string, version: string): Promise<Artifact>;
  
  /**
   * Search for artifacts
   */
  search(query: SearchQuery): Promise<SearchResults>;
  
  /**
   * Get artifact metadata
   */
  getMetadata(name: string, version?: string): Promise<ArtifactMetadata>;
  
  /**
   * List versions of an artifact
   */
  listVersions(name: string): Promise<Version[]>;
  
  /**
   * Unpublish an artifact
   */
  unpublish(name: string, version: string): Promise<void>;
}

interface Credentials {
  type: 'token' | 'apiKey' | 'oauth';
  value: string;
}

interface AuthToken {
  token: string;
  expiresAt: Date;
  scopes: string[];
}
```

### Artifact Interface

```typescript
interface Artifact {
  // Core metadata
  name: string;
  version: string;
  namespace: string;
  type: ArtifactType;
  
  // Content
  manifest: ArtifactManifest;
  layers: Layer[];
  
  // Security
  signature: Signature;
  checksums: Checksums;
  
  // Provenance
  provenance: Provenance;
}

type ArtifactType = 
  | 'module-node'
  | 'module-oci'
  | 'module-wasm'
  | 'module-binary'
  | 'module-external'
  | 'plugin'
  | 'model'
  | 'agent'
  | 'template'
  | 'snapshot';

interface ArtifactManifest {
  // Common fields
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  keywords?: string[];
  
  // Type-specific configuration
  config: Record<string, unknown>;
  
  // Dependencies
  dependencies?: Dependency[];
  
  // GTypes (for modules and plugins)
  gtypes?: GTypeDefinition[];
  
  // Capabilities
  capabilities?: string[];
  
  // Timescape metadata
  timescape?: TimescapeMetadata;
}

interface Layer {
  digest: string;
  size: number;
  mediaType: string;
  urls?: string[];
}

interface Signature {
  algorithm: 'cosign' | 'sigstore' | 'pgp';
  value: string;
  publicKey: string;
  timestamp: Date;
}

interface Checksums {
  sha256: string;
  sha512?: string;
}

interface Provenance {
  repo: string;
  commit: string;
  buildTimestamp: Date;
  builder: string;
  buildConfig?: Record<string, unknown>;
}
```

### Search Interface

```typescript
interface SearchQuery {
  // Text search
  query?: string;
  
  // Filters
  type?: ArtifactType[];
  namespace?: string[];
  capabilities?: string[];
  language?: string[];
  license?: string[];
  
  // Version constraints
  gatiVersion?: string;
  
  // Sorting
  sortBy?: 'relevance' | 'downloads' | 'stars' | 'updated' | 'created';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  pageSize?: number;
  
  // Advanced
  semanticSearch?: boolean;
  typeSignature?: GTypeQuery;
}

interface SearchResults {
  results: ArtifactSearchResult[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
}

interface ArtifactSearchResult {
  name: string;
  version: string;
  namespace: string;
  type: ArtifactType;
  description: string;
  downloads: number;
  stars: number;
  updatedAt: Date;
  publisher: PublisherInfo;
  securityScore?: number;
  healthBadges?: HealthBadge[];
}

interface SearchFacets {
  types: FacetCount[];
  capabilities: FacetCount[];
  languages: FacetCount[];
  licenses: FacetCount[];
}

interface FacetCount {
  value: string;
  count: number;
}
```

### Publisher Interface

```typescript
interface Publisher {
  id: string;
  type: 'user' | 'organization';
  username: string;
  displayName: string;
  email: string;
  verified: boolean;
  namespace: string;
  
  // Profile
  avatar?: string;
  bio?: string;
  website?: string;
  github?: string;
  
  // Stats
  artifactCount: number;
  totalDownloads: number;
  followers: number;
  
  // Monetization
  monetizationEnabled: boolean;
  stripeAccountId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

interface PublisherInfo {
  username: string;
  displayName: string;
  verified: boolean;
  avatar?: string;
}
```

### Namespace Interface

```typescript
interface Namespace {
  name: string;
  type: 'user' | 'organization';
  owner: string;
  
  // Access control
  visibility: 'public' | 'private';
  members?: NamespaceMember[];
  
  // Settings
  settings: NamespaceSettings;
  
  // Stats
  artifactCount: number;
  totalDownloads: number;
}

interface NamespaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'write' | 'read';
  addedAt: Date;
}

interface NamespaceSettings {
  allowPublicPublish: boolean;
  requireSignedArtifacts: boolean;
  autoScanVulnerabilities: boolean;
  defaultLicense?: string;
}
```

### Billing Interface

```typescript
interface BillingConfig {
  enabled: boolean;
  type: 'free' | 'one-time' | 'subscription' | 'usage-based';
  
  // Pricing
  price?: number;
  currency?: string;
  billingPeriod?: 'monthly' | 'yearly';
  
  // Usage-based
  usageMetric?: 'downloads' | 'inference-time' | 'execution-time';
  usagePrice?: number;
  
  // Tiers
  tiers?: PricingTier[];
  
  // Enterprise
  enterpriseContact?: string;
}

interface PricingTier {
  name: string;
  price: number;
  features: string[];
  limits?: Record<string, number>;
}

interface Purchase {
  id: string;
  artifactName: string;
  artifactVersion: string;
  buyer: string;
  seller: string;
  amount: number;
  currency: string;
  type: 'one-time' | 'subscription' | 'usage';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
}
```

### Vulnerability Scanning Interface

```typescript
interface VulnerabilityScan {
  artifactName: string;
  artifactVersion: string;
  scanId: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  
  // Results
  vulnerabilities: Vulnerability[];
  securityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Timestamps
  startedAt: Date;
  completedAt?: Date;
}

interface Vulnerability {
  id: string;
  cveId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedPackage?: string;
  fixedVersion?: string;
  references: string[];
}
```

### Timescape Integration Interface

```typescript
interface TimescapeMetadata {
  versionGraph: VersionNode[];
  breakingChanges: BreakingChange[];
  transformers: TransformerReference[];
  compatibilityNotes: string[];
}

interface VersionNode {
  version: string;
  timestamp: Date;
  gtypeHash: string;
  parentVersions: string[];
  deprecated: boolean;
  deprecationReason?: string;
}

interface BreakingChange {
  fromVersion: string;
  toVersion: string;
  changes: GTypeChange[];
  migrationGuide?: string;
}

interface TransformerReference {
  fromVersion: string;
  toVersion: string;
  transformerArtifact: string;
  transformerVersion: string;
}
```

## Data Models

### Module Artifact Example

```json
{
  "name": "user-auth",
  "version": "2.1.0",
  "namespace": "gati.dev/users/krishna",
  "type": "module-wasm",
  "manifest": {
    "name": "user-auth",
    "version": "2.1.0",
    "description": "User authentication module with JWT support",
    "author": "Krishna",
    "license": "MIT",
    "keywords": ["auth", "jwt", "security"],
    "config": {
      "type": "wasm",
      "wasmFile": "user-auth.wasm",
      "wasi": true,
      "capabilities": ["db:read", "db:write", "crypto", "log"]
    },
    "dependencies": [
      { "name": "crypto-utils", "version": "^1.0.0" }
    ],
    "gtypes": [
      {
        "name": "LoginRequest",
        "fields": {
          "email": "string",
          "password": "string"
        }
      },
      {
        "name": "LoginResponse",
        "fields": {
          "token": "string",
          "expiresAt": "number"
        }
      }
    ],
    "capabilities": ["db:read", "db:write", "crypto"],
    "timescape": {
      "versionGraph": [
        {
          "version": "2.1.0",
          "timestamp": "2025-11-23T10:00:00Z",
          "gtypeHash": "abc123",
          "parentVersions": ["2.0.0"]
        }
      ]
    }
  },
  "signature": {
    "algorithm": "cosign",
    "value": "MEUCIQDx...",
    "publicKey": "-----BEGIN PUBLIC KEY-----...",
    "timestamp": "2025-11-23T10:00:00Z"
  },
  "checksums": {
    "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "provenance": {
    "repo": "github.com/krishna/user-auth",
    "commit": "abc123def456",
    "buildTimestamp": "2025-11-23T09:55:00Z",
    "builder": "gati-cli/1.0.0"
  }
}
```


### Plugin Artifact Example

```json
{
  "name": "postgres-adapter",
  "version": "1.5.0",
  "namespace": "gati.dev/orgs/gati-official",
  "type": "plugin",
  "manifest": {
    "name": "postgres-adapter",
    "version": "1.5.0",
    "description": "PostgreSQL database adapter for Gati",
    "author": "Gati Team",
    "license": "Apache-2.0",
    "keywords": ["database", "postgres", "sql", "adapter"],
    "config": {
      "type": "node",
      "entry": "dist/index.js",
      "nodeVersion": "18.x"
    },
    "capabilities": ["db:postgres", "network:outbound"],
    "requiredModules": ["database-core"],
    "gtypes": [
      {
        "name": "QueryResult",
        "fields": {
          "rows": "array",
          "rowCount": "number"
        }
      }
    ]
  },
  "signature": {
    "algorithm": "cosign",
    "value": "MEUCIQDy...",
    "publicKey": "-----BEGIN PUBLIC KEY-----...",
    "timestamp": "2025-11-20T14:30:00Z"
  }
}
```

### Model Artifact Example

```json
{
  "name": "sentiment-analyzer",
  "version": "3.0.0",
  "namespace": "gati.dev/users/ml-researcher",
  "type": "model",
  "manifest": {
    "name": "sentiment-analyzer",
    "version": "3.0.0",
    "description": "BERT-based sentiment analysis model",
    "author": "ML Researcher",
    "license": "MIT",
    "keywords": ["nlp", "sentiment", "bert", "classification"],
    "config": {
      "modelFormat": "onnx",
      "modelFile": "sentiment-bert.onnx",
      "inputShape": [1, 512],
      "outputShape": [1, 3],
      "runtime": "onnx-runtime"
    },
    "gtypes": [
      {
        "name": "SentimentInput",
        "fields": {
          "text": "string"
        }
      },
      {
        "name": "SentimentOutput",
        "fields": {
          "sentiment": "enum[positive,negative,neutral]",
          "confidence": "number"
        }
      }
    ],
    "modelCard": {
      "dataset": "IMDB Reviews",
      "accuracy": 0.94,
      "f1Score": 0.93,
      "trainingDate": "2025-10-15"
    },
    "benchmarks": {
      "inferenceTime": "12ms",
      "memoryUsage": "256MB"
    }
  },
  "billing": {
    "enabled": true,
    "type": "usage-based",
    "usageMetric": "inference-time",
    "usagePrice": 0.001,
    "currency": "USD"
  }
}
```

### Agent Artifact Example

```json
{
  "name": "code-reviewer",
  "version": "1.0.0",
  "namespace": "gati.dev/users/ai-dev",
  "type": "agent",
  "manifest": {
    "name": "code-reviewer",
    "version": "1.0.0",
    "description": "AI agent for automated code review",
    "author": "AI Developer",
    "license": "MIT",
    "keywords": ["ai", "code-review", "automation"],
    "config": {
      "runtime": "wasm",
      "wasmFile": "agent.wasm",
      "modelReferences": [
        "gati.dev/users/openai/gpt-4:latest",
        "gati.dev/users/ml-researcher/code-embeddings:2.0.0"
      ],
      "skillGraph": {
        "skills": [
          "analyze-code",
          "detect-bugs",
          "suggest-improvements",
          "generate-tests"
        ],
        "dependencies": {
          "detect-bugs": ["analyze-code"],
          "suggest-improvements": ["analyze-code"],
          "generate-tests": ["analyze-code"]
        }
      }
    },
    "capabilities": ["filesystem:read", "network:outbound", "ai:inference"],
    "permissions": {
      "maxMemory": "1GB",
      "maxCpu": "2cores",
      "allowedDomains": ["github.com", "gitlab.com"]
    }
  }
}
```

### Template Artifact Example

```json
{
  "name": "nextjs-gati-starter",
  "version": "1.2.0",
  "namespace": "gati.dev/orgs/gati-official",
  "type": "template",
  "manifest": {
    "name": "nextjs-gati-starter",
    "version": "1.2.0",
    "description": "Next.js starter template with Gati integration",
    "author": "Gati Team",
    "license": "MIT",
    "keywords": ["nextjs", "react", "starter", "template"],
    "config": {
      "templateType": "app",
      "framework": "nextjs",
      "language": "typescript",
      "includesModules": [
        "user-auth",
        "database-core"
      ],
      "variables": [
        {
          "name": "projectName",
          "description": "Name of your project",
          "required": true
        },
        {
          "name": "databaseType",
          "description": "Database to use",
          "options": ["postgres", "mysql", "mongodb"],
          "default": "postgres"
        }
      ]
    },
    "files": [
      "package.json",
      "tsconfig.json",
      "src/**/*",
      "public/**/*",
      "README.md"
    ]
  }
}
```

## Artifact Lifecycle

### Publishing Flow

```
Developer → gati module publish
    ↓
1. Bundle & Build
   - Compile code
   - Generate manifest
   - Create artifact layers
    ↓
2. Sign Artifact
   - Generate signature (cosign)
   - Include provenance metadata
    ↓
3. Upload to Registry
   - Chunked upload for large artifacts
   - Store layers in blob storage
    ↓
4. Registry Processing
   - Validate signature
   - Extract metadata
   - Scan for vulnerabilities
   - Index for search
    ↓
5. Publish Complete
   - Update namespace
   - Notify followers
   - Generate artifact URL
```

### Installation Flow

```
Developer → gati module install <name>
    ↓
1. Search Registry
   - Resolve artifact name
   - Determine version (latest or pinned)
    ↓
2. Fetch Metadata
   - Get manifest
   - Check dependencies
   - Verify compatibility
    ↓
3. Verify Signature
   - Download signature
   - Validate with public key
   - Check checksums
    ↓
4. Download Artifact
   - Fetch layers
   - Verify checksums
   - Extract files
    ↓
5. Install Dependencies
   - Recursively fetch dependencies
   - Build dependency tree
    ↓
6. Update Application
   - Add to manifest
   - Generate types
   - Update lock file
```

### Deployment Flow (Gati Cloud)

```
gati deploy
    ↓
1. Operator Reads Manifest
   - Parse application manifest
   - Identify required modules
    ↓
2. Fetch from Registry
   - Pull module images/WASM
   - Verify signatures
   - Validate checksums
    ↓
3. Provision Resources
   - Create containers/pods
   - Set environment variables
   - Configure secrets
    ↓
4. Start Modules
   - Initialize adapters
   - Register with service mesh
   - Health check
    ↓
5. Route Traffic
   - Configure load balancer
   - Enable auto-scaling
   - Monitor health
```

## Security Architecture

### Artifact Signing

All artifacts must be signed before publication:

1. **Developer Signs Artifact**
   - Uses cosign or sigstore
   - Private key stored securely (local or KMS)
   - Signature includes artifact hash and metadata

2. **Registry Verifies Signature**
   - Validates signature with publisher's public key
   - Checks certificate chain
   - Verifies artifact hasn't been tampered with

3. **Consumer Verifies Signature**
   - Downloads signature with artifact
   - Validates before installation
   - Rejects invalid or missing signatures

### Vulnerability Scanning

Automated scanning pipeline:

1. **Upload Trigger**
   - Artifact uploaded to registry
   - Scan job queued

2. **Scan Execution**
   - Trivy/Clair scans for CVEs
   - Static analysis for malicious patterns
   - Model poisoning detection (for ML models)
   - Dependency vulnerability check

3. **Results Processing**
   - Generate security score (0-100)
   - Classify risk level (low/medium/high/critical)
   - Create vulnerability report

4. **Publisher Notification**
   - Email notification with results
   - Dashboard shows vulnerabilities
   - Suggestions for fixes

5. **Consumer Warning**
   - Display security score in UI
   - Show vulnerability count
   - Warn before installing risky artifacts

### Access Control

Multi-level permission system:

1. **Public Artifacts**
   - Anyone can read/download
   - Only publisher can write/update

2. **Private Artifacts**
   - Only namespace members can access
   - Role-based permissions (owner/admin/write/read)

3. **Organization Artifacts**
   - Organization-level policies
   - Team-based access control
   - Audit logs for compliance

4. **Enterprise Features**
   - Private registry instances
   - Custom CA certificates
   - SSO integration
   - IP whitelisting

## Timescape Integration

### Version Graph Storage

The Registry stores complete version history:

```typescript
interface VersionGraph {
  artifact: string;
  versions: VersionNode[];
  edges: VersionEdge[];
}

interface VersionNode {
  version: string;
  timestamp: Date;
  gtypeHash: string;
  manifestHash: string;
  deprecated: boolean;
}

interface VersionEdge {
  from: string;
  to: string;
  type: 'patch' | 'minor' | 'major' | 'breaking';
  transformer?: string;
}
```

### Breaking Change Detection

When a new version is published:

1. **Compare GTypes**
   - Extract GTypes from new manifest
   - Compare with previous version
   - Detect breaking changes

2. **Update Version Graph**
   - Add new version node
   - Create edge to parent version
   - Mark edge type (patch/minor/major/breaking)

3. **Check for Transformers**
   - If breaking change detected
   - Check if transformer exists
   - Link transformer in metadata

4. **Notify Consumers**
   - Email users of dependent artifacts
   - Show migration guide
   - Suggest transformer if available

### Transformer Distribution

Transformers are stored as special artifacts:

```json
{
  "name": "user-auth-v1-to-v2",
  "version": "1.0.0",
  "namespace": "gati.dev/users/krishna",
  "type": "transformer",
  "manifest": {
    "fromArtifact": "user-auth",
    "fromVersion": "1.x",
    "toVersion": "2.x",
    "transformations": [
      {
        "type": "LoginRequest",
        "changes": {
          "added": ["rememberMe"],
          "removed": [],
          "renamed": {}
        }
      }
    ]
  }
}
```

## Marketplace & Monetization

### Pricing Models

1. **Free Tier**
   - Public artifacts
   - Community support
   - Basic analytics

2. **One-Time Purchase**
   - Pay once, use forever
   - Includes updates for major version
   - Example: Premium templates, specialized plugins

3. **Subscription**
   - Monthly or yearly billing
   - Continuous updates
   - Priority support
   - Example: Enterprise plugins, managed models

4. **Usage-Based**
   - Pay per download
   - Pay per inference time (models)
   - Pay per execution time (agents)
   - Example: AI models, compute-intensive agents

5. **Enterprise**
   - Custom pricing
   - Private registry
   - SLA guarantees
   - Dedicated support

### Revenue Split

Default revenue split: **70% Publisher / 30% Platform**

- Publisher receives 70% of revenue
- Platform takes 30% for infrastructure, support, and development
- Enterprise customers can negotiate custom splits

### Payment Processing

1. **Stripe Integration**
   - Handles all payment processing
   - Supports credit cards, ACH, wire transfers
   - International payments

2. **Publisher Payouts**
   - Monthly automatic payouts
   - Minimum threshold: $100
   - Multiple payout methods (bank transfer, PayPal)

3. **Usage Tracking**
   - Real-time usage metering
   - Detailed billing reports
   - Invoice generation

## Web UI Design

### Homepage

- Featured artifacts
- Popular downloads
- Recently updated
- Trending searches
- Publisher spotlight

### Artifact Page

- Installation instructions
- README/documentation
- Version selector
- Manifest viewer
- GType explorer
- Timescape diff viewer
- Download statistics
- Security score
- Vulnerability report
- Pricing information
- Publisher profile
- Related artifacts

### Search Page

- Search bar with autocomplete
- Faceted filters (type, language, capabilities, license)
- Sort options (relevance, downloads, stars, updated)
- Grid/list view toggle
- Pagination

### Publisher Dashboard

- Artifact management
- Analytics (downloads, stars, revenue)
- Billing settings
- API keys
- Namespace settings
- Security alerts

### Marketplace

- Browse paid artifacts
- Filter by price range
- Purchase history
- Subscription management
- Invoice downloads

## Performance Considerations

### Caching Strategy

1. **CDN for Artifacts**
   - Distribute artifacts globally
   - Edge caching for popular artifacts
   - Reduce latency for downloads

2. **Metadata Caching**
   - Redis cache for frequently accessed metadata
   - Cache search results
   - Cache version graphs

3. **Layer Deduplication**
   - Store common layers once
   - Reference layers across artifacts
   - Reduce storage costs

### Scalability

1. **Horizontal Scaling**
   - API gateway scales independently
   - Multiple blob storage nodes
   - Distributed search cluster

2. **Database Sharding**
   - Shard by namespace
   - Separate read replicas
   - Connection pooling

3. **Async Processing**
   - Queue-based vulnerability scanning
   - Background indexing
   - Deferred analytics updates

## Implementation Phases

### Phase 1: Core Registry (MVP)
- Artifact storage (OCI blobs)
- Metadata indexing
- Basic search
- Authentication
- Signature verification
- CLI integration (publish/install)

### Phase 2: Module & Plugin Support
- Full module type support (node, oci, wasm, binary, external)
- Plugin artifact type
- Dependency resolution
- Version management

### Phase 3: Security & Scanning
- Vulnerability scanning integration
- Security scoring
- Publisher verification
- Audit logs

### Phase 4: Marketplace
- Billing system integration
- Pricing models
- Payment processing
- Revenue split
- Purchase flow

### Phase 5: AI Models & Agents
- Model artifact type
- Agent artifact type
- Model cards
- Inference runtime integration

### Phase 6: Templates & Snapshots
- Template artifact type
- Environment snapshots
- Template variables
- Scaffolding integration

### Phase 7: Timescape Integration
- Version graph storage
- Breaking change detection
- Transformer distribution
- Migration guides

### Phase 8: Enterprise Features
- Private registries
- Organization policies
- SSO integration
- Compliance reports
- Offline mirrors

### Phase 9: Advanced Features
- Semantic search
- AI-powered recommendations
- Health badges
- Dependency analysis
- Security attestation

### Phase 10: Dev Cloud Integration
- Deployment automation
- Workspace provisioning
- Preview environments
- Hosted playgrounds



## Deployment Architecture

### Overview

The Gati Registry is deployed as a cloud-native, multi-region system designed for high availability, scalability, and global performance. It runs on Kubernetes with a microservices architecture, leveraging managed cloud services for storage, databases, and CDN.

### Deployment Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                         Global CDN Layer                         │
│              (CloudFlare / AWS CloudFront)                       │
│  - Artifact caching                                              │
│  - DDoS protection                                               │
│  - SSL termination                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │ Region  │     │ Region  │    │ Region  │
    │  US-E   │     │  EU-W   │    │  AP-SE  │
    └────┬────┘     └────┬────┘    └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
              ┌──────────▼──────────┐
              │  Global Metadata    │
              │  (Multi-region DB)  │
              └─────────────────────┘
```

### Regional Architecture

Each region contains:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer (ALB/NLB)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │   API   │     │  Search │    │  Web UI │
    │ Gateway │     │  Service│    │ Service │
    │  Pods   │     │  Pods   │    │  Pods   │
    └────┬────┘     └────┬────┘    └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │ Artifact│     │  Auth   │    │ Billing │
    │ Service │     │ Service │    │ Service │
    └────┬────┘     └────┬────┘    └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐     ┌────▼────┐    ┌────▼────┐
    │  Blob   │     │Postgres │    │  Redis  │
    │ Storage │     │   RDS   │    │ Cluster │
    │  (S3)   │     │         │    │         │
    └─────────┘     └─────────┘    └─────────┘
```

### Kubernetes Deployment

#### Namespace Structure

```yaml
# Registry namespaces
- gati-registry-api       # API Gateway and core services
- gati-registry-storage   # Artifact storage services
- gati-registry-search    # Search and indexing services
- gati-registry-security  # Signing, scanning, verification
- gati-registry-billing   # Marketplace and billing
- gati-registry-workers   # Background jobs and workers
- gati-registry-monitoring # Observability stack
```

#### Core Services

**1. API Gateway Service**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: gati-registry-api
spec:
  replicas: 5
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: registry.gati.dev/gati-registry/api-gateway:latest
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 8443
          name: https
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: gati-registry-api
spec:
  type: LoadBalancer
  selector:
    app: api-gateway
  ports:
  - port: 80
    targetPort: 8080
    name: http
  - port: 443
    targetPort: 8443
    name: https
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: gati-registry-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 5
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**2. Artifact Storage Service**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: artifact-storage
  namespace: gati-registry-storage
spec:
  replicas: 3
  selector:
    matchLabels:
      app: artifact-storage
  template:
    metadata:
      labels:
        app: artifact-storage
    spec:
      serviceAccountName: artifact-storage-sa
      containers:
      - name: artifact-storage
        image: registry.gati.dev/gati-registry/artifact-storage:latest
        ports:
        - containerPort: 8080
        env:
        - name: S3_BUCKET
          value: "gati-registry-artifacts"
        - name: S3_REGION
          value: "us-east-1"
        - name: AWS_ROLE_ARN
          value: "arn:aws:iam::123456789:role/gati-registry-storage"
        volumeMounts:
        - name: cache
          mountPath: /cache
        resources:
          requests:
            cpu: 1000m
            memory: 2Gi
          limits:
            cpu: 4000m
            memory: 8Gi
      volumes:
      - name: cache
        emptyDir:
          sizeLimit: 10Gi
```

**3. Search Service (Elasticsearch)**

```yaml
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: registry-search
  namespace: gati-registry-search
spec:
  version: 8.11.0
  nodeSets:
  - name: default
    count: 3
    config:
      node.store.allow_mmap: false
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          resources:
            requests:
              memory: 4Gi
              cpu: 2000m
            limits:
              memory: 8Gi
              cpu: 4000m
          env:
          - name: ES_JAVA_OPTS
            value: "-Xms2g -Xmx2g"
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 100Gi
        storageClassName: fast-ssd
```

**4. Vulnerability Scanner Worker**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vulnerability-scanner
  namespace: gati-registry-security
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vulnerability-scanner
  template:
    metadata:
      labels:
        app: vulnerability-scanner
    spec:
      containers:
      - name: scanner
        image: registry.gati.dev/gati-registry/vulnerability-scanner:latest
        env:
        - name: TRIVY_DB_REPOSITORY
          value: "ghcr.io/aquasecurity/trivy-db"
        - name: SCAN_QUEUE_URL
          valueFrom:
            secretKeyRef:
              name: queue-credentials
              key: url
        resources:
          requests:
            cpu: 2000m
            memory: 4Gi
          limits:
            cpu: 4000m
            memory: 8Gi
        volumeMounts:
        - name: trivy-cache
          mountPath: /root/.cache/trivy
      volumes:
      - name: trivy-cache
        persistentVolumeClaim:
          claimName: trivy-cache-pvc
```

### Database Architecture

#### PostgreSQL (Primary Metadata Store)

```yaml
# Using AWS RDS or Cloud SQL
Configuration:
  - Instance Type: db.r6g.2xlarge (8 vCPU, 64GB RAM)
  - Storage: 1TB SSD with auto-scaling to 5TB
  - Multi-AZ deployment for HA
  - Read replicas in each region (3 replicas)
  - Automated backups (daily, 30-day retention)
  - Point-in-time recovery enabled

Schema Design:
  - artifacts: Core artifact metadata
  - versions: Version history
  - namespaces: Publisher namespaces
  - publishers: Publisher accounts
  - signatures: Artifact signatures
  - vulnerabilities: Scan results
  - downloads: Download statistics
  - billing: Marketplace transactions
  - timescape_graphs: Version graphs
```

#### Redis (Caching Layer)

```yaml
# Using AWS ElastiCache or Google Memorystore
Configuration:
  - Node Type: cache.r6g.xlarge (4 vCPU, 26GB RAM)
  - Cluster Mode: Enabled (3 shards, 2 replicas per shard)
  - Total Capacity: ~150GB
  - Automatic failover enabled
  - Encryption at rest and in transit

Cache Strategy:
  - Artifact metadata: TTL 1 hour
  - Search results: TTL 15 minutes
  - Version graphs: TTL 6 hours
  - Publisher info: TTL 1 hour
  - Download counts: TTL 5 minutes
```

### Object Storage (Artifact Blobs)

```yaml
# Using AWS S3, Google Cloud Storage, or MinIO
Configuration:
  - Bucket: gati-registry-artifacts
  - Storage Class: Standard (hot data), Glacier (archives)
  - Versioning: Enabled
  - Lifecycle Policies:
      - Transition to Infrequent Access after 90 days
      - Transition to Glacier after 365 days
      - Delete old versions after 730 days
  - Replication: Cross-region replication to 2 additional regions
  - Encryption: AES-256 server-side encryption
  - Access: IAM roles with least privilege

Structure:
  /artifacts/{namespace}/{name}/{version}/
    - manifest.json
    - layers/
      - sha256-{hash}.tar.gz
    - signatures/
      - cosign.sig
    - metadata/
      - gtypes.json
      - provenance.json
```

### CDN Configuration

```yaml
# Using CloudFlare or AWS CloudFront
Configuration:
  - Global edge locations (200+ POPs)
  - Cache TTL:
      - Artifacts: 1 year (immutable)
      - Metadata: 1 hour
      - Search results: 5 minutes
  - Compression: Brotli + Gzip
  - HTTP/3 enabled
  - DDoS protection
  - WAF rules for API protection
  - Rate limiting per IP/API key

Cache Invalidation:
  - Automatic on new version publish
  - Manual via API
  - Purge by tag/pattern
```

### Message Queue (Background Jobs)

```yaml
# Using AWS SQS, Google Pub/Sub, or RabbitMQ
Queues:
  - artifact-upload: New artifact processing
  - vulnerability-scan: Security scanning jobs
  - search-index: Search indexing updates
  - notification: Email/webhook notifications
  - analytics: Usage tracking and metrics
  - billing: Payment processing

Configuration:
  - Visibility timeout: 5 minutes
  - Message retention: 14 days
  - Dead letter queue: Enabled (3 retries)
  - FIFO queues for ordering-sensitive tasks
```

### Monitoring & Observability

```yaml
# Prometheus + Grafana + Loki + Tempo
Components:
  - Prometheus: Metrics collection
  - Grafana: Dashboards and visualization
  - Loki: Log aggregation
  - Tempo: Distributed tracing
  - AlertManager: Alert routing

Metrics Tracked:
  - API request rate, latency, errors
  - Artifact upload/download throughput
  - Search query performance
  - Database connection pool usage
  - Cache hit/miss rates
  - Queue depth and processing time
  - Storage usage and growth
  - Vulnerability scan duration

Alerts:
  - API error rate > 1%
  - P95 latency > 500ms
  - Database CPU > 80%
  - Storage usage > 80%
  - Queue depth > 1000
  - Failed vulnerability scans
  - Payment processing failures
```

### Security & Compliance

```yaml
Network Security:
  - VPC with private subnets for databases
  - Security groups with least privilege
  - Network ACLs for additional layer
  - VPN/PrivateLink for admin access
  - No public database endpoints

Secrets Management:
  - AWS Secrets Manager or HashiCorp Vault
  - Automatic rotation for DB credentials
  - Encrypted at rest and in transit
  - IAM roles for service authentication

Compliance:
  - SOC 2 Type II certification
  - GDPR compliance (data residency, right to deletion)
  - HIPAA compliance (for healthcare customers)
  - Audit logs for all operations
  - Encryption at rest (AES-256)
  - Encryption in transit (TLS 1.3)

Backup & Disaster Recovery:
  - Database: Daily automated backups, 30-day retention
  - Object Storage: Cross-region replication
  - Configuration: GitOps with version control
  - RTO: 1 hour
  - RPO: 15 minutes
  - Regular disaster recovery drills
```

### CI/CD Pipeline

```yaml
Pipeline Stages:
  1. Build:
     - Docker image build
     - Multi-stage builds for optimization
     - Vulnerability scanning (Trivy)
     - SBOM generation

  2. Test:
     - Unit tests
     - Integration tests
     - Load tests (k6)
     - Security tests (OWASP ZAP)

  3. Deploy to Staging:
     - Deploy to staging cluster
     - Smoke tests
     - E2E tests
     - Performance benchmarks

  4. Deploy to Production:
     - Blue-green deployment
     - Canary rollout (10% → 50% → 100%)
     - Automated rollback on errors
     - Health checks at each stage

Tools:
  - GitHub Actions or GitLab CI
  - ArgoCD for GitOps
  - Helm for Kubernetes deployments
  - Terraform for infrastructure
```

### Cost Optimization

```yaml
Strategies:
  1. Auto-scaling:
     - Scale down during low traffic
     - Scheduled scaling for predictable patterns
     - Cluster autoscaler for nodes

  2. Storage Optimization:
     - Lifecycle policies for cold data
     - Compression for artifacts
     - Deduplication of layers

  3. Compute Optimization:
     - Spot instances for workers
     - Reserved instances for baseline
     - Right-sizing based on metrics

  4. CDN Optimization:
     - Aggressive caching for immutable artifacts
     - Compression at edge
     - Smart routing to nearest region

  5. Database Optimization:
     - Connection pooling
     - Query optimization
     - Read replicas for read-heavy workloads
     - Caching layer (Redis)

Estimated Monthly Costs (at scale):
  - Compute (Kubernetes): $15,000
  - Database (RDS): $5,000
  - Storage (S3): $10,000
  - CDN (CloudFlare): $3,000
  - Monitoring: $1,000
  - Other Services: $2,000
  Total: ~$36,000/month
```

### Deployment Environments

```yaml
1. Development:
   - Single region (US-East)
   - Minimal replicas (1-2)
   - Smaller instance types
   - Shared database
   - No CDN
   - Cost: ~$500/month

2. Staging:
   - Single region (US-East)
   - Production-like setup
   - Smaller scale (50% of prod)
   - Separate database
   - CDN enabled
   - Cost: ~$5,000/month

3. Production:
   - Multi-region (US, EU, APAC)
   - Full redundancy
   - Auto-scaling enabled
   - Multi-AZ databases
   - Global CDN
   - Cost: ~$36,000/month

4. Disaster Recovery:
   - Standby region
   - Database replicas
   - Automated failover
   - Regular testing
   - Cost: ~$8,000/month
```

### Deployment Checklist

```yaml
Pre-Launch:
  ☐ Infrastructure provisioned (Terraform)
  ☐ Kubernetes clusters configured
  ☐ Databases initialized and migrated
  ☐ Object storage buckets created
  ☐ CDN configured and tested
  ☐ Monitoring and alerting setup
  ☐ Secrets and credentials configured
  ☐ SSL certificates provisioned
  ☐ DNS records configured
  ☐ Load testing completed
  ☐ Security audit passed
  ☐ Disaster recovery tested
  ☐ Documentation complete
  ☐ Runbooks prepared

Launch Day:
  ☐ Deploy to production
  ☐ Verify health checks
  ☐ Test critical paths
  ☐ Monitor metrics closely
  ☐ Announce to community
  ☐ Support team on standby

Post-Launch:
  ☐ Monitor for 24 hours
  ☐ Review metrics and logs
  ☐ Gather user feedback
  ☐ Address issues promptly
  ☐ Optimize based on usage
  ☐ Plan next iteration
```

### Scaling Strategy

```yaml
Phase 1 (0-1K users):
  - Single region deployment
  - Minimal auto-scaling
  - Shared database
  - Cost: ~$2,000/month

Phase 2 (1K-10K users):
  - Add read replicas
  - Enable auto-scaling
  - Add CDN
  - Cost: ~$8,000/month

Phase 3 (10K-100K users):
  - Multi-region deployment
  - Database sharding
  - Dedicated search cluster
  - Cost: ~$25,000/month

Phase 4 (100K+ users):
  - Global CDN optimization
  - Advanced caching strategies
  - Dedicated security infrastructure
  - Enterprise features
  - Cost: ~$50,000+/month
```



## Building Gati Registry with Gati

### Overview

The Gati Registry will be built as a Gati application, serving as the ultimate validation of the framework's capabilities. This approach provides several benefits:

1. **Dogfooding**: Validates Gati's architecture for real-world, production-scale applications
2. **Showcase**: Demonstrates best practices and patterns for building with Gati
3. **Integration**: Native integration with Timescape, GTypes, and module system
4. **Consistency**: Uses the same patterns that third-party developers will use
5. **Evolution**: Registry evolves alongside the framework

### Module Architecture

The Registry will be composed of multiple Gati modules, each handling a specific domain:

```
gati-registry/
├── src/
│   ├── modules/
│   │   ├── artifacts/          # Artifact storage and retrieval
│   │   ├── metadata/           # Metadata indexing and querying
│   │   ├── search/             # Search and discovery
│   │   ├── auth/               # Authentication and authorization
│   │   ├── signing/            # Signature verification
│   │   ├── scanning/           # Vulnerability scanning
│   │   ├── billing/            # Marketplace and payments
│   │   ├── timescape/          # Version graph management
│   │   ├── notifications/      # Email and webhook notifications
│   │   └── analytics/          # Usage tracking and metrics
│   ├── shared/
│   │   ├── types/              # Shared GTypes
│   │   └── utils/              # Shared utilities
│   └── app.ts                  # Main application entry
├── gati.config.ts              # Gati configuration
└── package.json
```

### Module Definitions

#### 1. Artifacts Module

```typescript
// src/modules/artifacts/module.ts
import { defineModule, GatiTypes } from '@gati-framework/core';

export default defineModule({
  name: 'artifacts',
  version: '1.0.0',
  namespace: 'gati.registry.artifacts',
  description: 'Artifact storage and retrieval',
  
  dependencies: ['auth', 'metadata', 'signing'],
  
  exports: {
    services: ['ArtifactStorageService', 'ArtifactUploadService'],
    handlers: ['uploadArtifact', 'downloadArtifact', 'getArtifactLayers'],
    events: ['ArtifactUploaded', 'ArtifactDownloaded'],
  },
  
  configSchema: GatiTypes.object({
    storageBackend: GatiTypes.enum(['s3', 'gcs', 'minio']).default('s3'),
    bucketName: GatiTypes.string().required(),
    region: GatiTypes.string().default('us-east-1'),
    maxUploadSize: GatiTypes.number().default(5 * 1024 * 1024 * 1024), // 5GB
    chunkSize: GatiTypes.number().default(10 * 1024 * 1024), // 10MB
  }),
  
  capabilities: {
    requiresDB: true,
    requiresCache: true,
    usesBackgroundWorkers: true,
  },
  
  setup: async (ctx) => {
    ctx.logger.info('Initializing artifacts module');
    
    // Register services
    ctx.container.register('artifacts.ArtifactStorageService', 
      () => new ArtifactStorageService(ctx));
    ctx.container.register('artifacts.ArtifactUploadService', 
      () => new ArtifactUploadService(ctx));
    
    // Subscribe to events
    ctx.eventBus.on('signing.SignatureVerified', async (payload) => {
      await handleVerifiedArtifact(payload);
    });
  },
  
  healthCheck: async () => {
    // Check S3 connectivity
    return await checkStorageHealth();
  },
});
```

#### 2. Artifacts Module Handlers

```typescript
// src/modules/artifacts/handlers/upload-artifact.ts
import { defineHandler, GatiTypes } from '@gati-framework/core';

export const uploadArtifact = defineHandler({
  method: 'POST',
  path: '/v1/artifacts/:namespace/:name/:version',
  
  input: GatiTypes.object({
    params: GatiTypes.object({
      namespace: GatiTypes.string().pattern(/^[a-z0-9-]+$/),
      name: GatiTypes.string().pattern(/^[a-z0-9-]+$/),
      version: GatiTypes.string().semver(),
    }),
    headers: GatiTypes.object({
      'content-type': GatiTypes.string().equals('application/octet-stream'),
      'x-artifact-digest': GatiTypes.string().pattern(/^sha256:[a-f0-9]{64}$/),
      'x-signature': GatiTypes.string(),
    }),
    body: GatiTypes.buffer(),
  }),
  
  output: GatiTypes.object({
    uploadId: GatiTypes.string().uuid(),
    status: GatiTypes.enum(['pending', 'processing', 'completed']),
    location: GatiTypes.string().url(),
  }),
  
  rateLimit: {
    windowMs: 60 * 1000,
    max: 10, // 10 uploads per minute
  },
  
  security: {
    requireAuth: true,
    requireSignature: true,
  },
  
  handler: async (req, res, gctx, lctx) => {
    const { namespace, name, version } = req.params;
    const digest = req.headers['x-artifact-digest'];
    const signature = req.headers['x-signature'];
    
    // Verify user has permission to publish to namespace
    const authService = await gctx.modules['auth.AuthService'];
    const hasPermission = await authService.canPublish(lctx.user, namespace);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to publish to this namespace'
      });
    }
    
    // Verify signature
    const signingService = await gctx.modules['signing.SignatureService'];
    const isValid = await signingService.verify(req.body, signature, lctx.user.publicKey);
    
    if (!isValid) {
      return res.status(400).json({ 
        error: 'Invalid signature',
        message: 'Artifact signature verification failed'
      });
    }
    
    // Upload to storage
    const storageService = await gctx.modules['artifacts.ArtifactStorageService'];
    const uploadResult = await storageService.upload({
      namespace,
      name,
      version,
      data: req.body,
      digest,
      signature,
      uploader: lctx.user.id,
    });
    
    // Emit event for downstream processing
    gctx.eventBus.emit('ArtifactUploaded', {
      uploadId: uploadResult.id,
      namespace,
      name,
      version,
      digest,
      uploadedBy: lctx.user.id,
      timestamp: Date.now(),
    });
    
    res.status(202).json({
      uploadId: uploadResult.id,
      status: 'processing',
      location: `/v1/artifacts/${namespace}/${name}/${version}`,
    });
  },
});
```

#### 3. Search Module

```typescript
// src/modules/search/module.ts
import { defineModule, GatiTypes } from '@gati-framework/core';

export default defineModule({
  name: 'search',
  version: '1.0.0',
  namespace: 'gati.registry.search',
  description: 'Search and discovery for artifacts',
  
  dependencies: ['metadata'],
  
  exports: {
    services: ['SearchService', 'IndexingService'],
    handlers: ['searchArtifacts', 'suggestArtifacts'],
    events: ['ArtifactIndexed'],
  },
  
  configSchema: GatiTypes.object({
    elasticsearchUrl: GatiTypes.string().url().required(),
    indexName: GatiTypes.string().default('gati-registry'),
    maxResults: GatiTypes.number().default(100),
    enableSemanticSearch: GatiTypes.boolean().default(false),
  }),
  
  capabilities: {
    requiresDB: false,
    requiresCache: true,
  },
  
  setup: async (ctx) => {
    // Initialize Elasticsearch client
    const searchService = new SearchService(ctx.config);
    ctx.container.register('search.SearchService', () => searchService);
    
    // Subscribe to metadata events for indexing
    ctx.eventBus.on('metadata.ArtifactPublished', async (payload) => {
      const indexingService = await ctx.container.resolve('search.IndexingService');
      await indexingService.indexArtifact(payload);
    });
  },
});
```

#### 4. Search Handler with GTypes

```typescript
// src/modules/search/handlers/search-artifacts.ts
import { defineHandler, GatiTypes } from '@gati-framework/core';

// Define reusable GTypes
const ArtifactType = GatiTypes.enum([
  'module-node',
  'module-oci',
  'module-wasm',
  'module-binary',
  'module-external',
  'plugin',
  'model',
  'agent',
  'template',
  'snapshot',
]);

const SearchQuery = GatiTypes.object({
  query: GatiTypes.string().optional(),
  type: GatiTypes.array(ArtifactType).optional(),
  namespace: GatiTypes.array(GatiTypes.string()).optional(),
  capabilities: GatiTypes.array(GatiTypes.string()).optional(),
  language: GatiTypes.array(GatiTypes.string()).optional(),
  sortBy: GatiTypes.enum(['relevance', 'downloads', 'stars', 'updated']).default('relevance'),
  page: GatiTypes.number().min(1).default(1),
  pageSize: GatiTypes.number().min(1).max(100).default(20),
});

const ArtifactSearchResult = GatiTypes.object({
  name: GatiTypes.string(),
  version: GatiTypes.string(),
  namespace: GatiTypes.string(),
  type: ArtifactType,
  description: GatiTypes.string(),
  downloads: GatiTypes.number(),
  stars: GatiTypes.number(),
  updatedAt: GatiTypes.string().datetime(),
  publisher: GatiTypes.object({
    username: GatiTypes.string(),
    verified: GatiTypes.boolean(),
  }),
});

export const searchArtifacts = defineHandler({
  method: 'GET',
  path: '/v1/search',
  
  input: GatiTypes.object({
    query: SearchQuery,
  }),
  
  output: GatiTypes.object({
    results: GatiTypes.array(ArtifactSearchResult),
    total: GatiTypes.number(),
    page: GatiTypes.number(),
    pageSize: GatiTypes.number(),
    facets: GatiTypes.object({
      types: GatiTypes.array(GatiTypes.object({
        value: GatiTypes.string(),
        count: GatiTypes.number(),
      })),
      capabilities: GatiTypes.array(GatiTypes.object({
        value: GatiTypes.string(),
        count: GatiTypes.number(),
      })),
    }),
  }),
  
  handler: async (req, res, gctx, lctx) => {
    const searchService = await gctx.modules['search.SearchService'];
    const results = await searchService.search(req.query);
    
    res.json(results);
  },
});
```

#### 5. Scanning Module with Effects

```typescript
// src/modules/scanning/module.ts
import { defineModule, GatiTypes } from '@gati-framework/core';

export default defineModule({
  name: 'scanning',
  version: '1.0.0',
  namespace: 'gati.registry.scanning',
  description: 'Vulnerability scanning for artifacts',
  
  dependencies: ['artifacts', 'metadata'],
  
  exports: {
    services: ['VulnerabilityScannerService'],
    effects: ['scanQueue', 'rescanScheduler'],
    events: ['ScanCompleted', 'VulnerabilityDetected'],
  },
  
  configSchema: GatiTypes.object({
    scannerType: GatiTypes.enum(['trivy', 'clair']).default('trivy'),
    maxConcurrentScans: GatiTypes.number().default(5),
    rescanInterval: GatiTypes.string().default('7d'),
  }),
  
  capabilities: {
    requiresDB: true,
    usesBackgroundWorkers: true,
  },
  
  setup: async (ctx) => {
    // Subscribe to artifact upload events
    ctx.eventBus.on('artifacts.ArtifactUploaded', async (payload) => {
      // Queue scan job
      await queueScan(payload);
    });
  },
});
```

#### 6. Scanning Effect (Background Worker)

```typescript
// src/modules/scanning/effects/scan-queue.ts
import { defineEffect } from '@gati-framework/core';

export const scanQueue = defineEffect({
  name: 'ScanQueue',
  type: 'subscriber',
  
  handler: async (ctx) => {
    const scannerService = await ctx.services.resolve('scanning.VulnerabilityScannerService');
    
    // Process scan queue
    while (true) {
      const job = await scannerService.getNextScanJob();
      
      if (!job) {
        await sleep(5000); // Wait 5 seconds
        continue;
      }
      
      ctx.logger.info({ jobId: job.id }, 'Starting vulnerability scan');
      
      try {
        const results = await scannerService.scan(job.artifactPath);
        
        // Store results
        await scannerService.storeScanResults(job.id, results);
        
        // Emit event
        ctx.eventBus.emit('ScanCompleted', {
          jobId: job.id,
          artifactName: job.artifactName,
          vulnerabilities: results.vulnerabilities.length,
          securityScore: results.securityScore,
        });
        
        // Notify publisher if vulnerabilities found
        if (results.vulnerabilities.length > 0) {
          ctx.eventBus.emit('VulnerabilityDetected', {
            artifactName: job.artifactName,
            severity: results.maxSeverity,
            count: results.vulnerabilities.length,
          });
        }
      } catch (error) {
        ctx.logger.error({ error, jobId: job.id }, 'Scan failed');
        await scannerService.markScanFailed(job.id, error);
      }
    }
  },
});
```

#### 7. Timescape Integration Module

```typescript
// src/modules/timescape/module.ts
import { defineModule, GatiTypes } from '@gati-framework/core';

export default defineModule({
  name: 'timescape',
  version: '1.0.0',
  namespace: 'gati.registry.timescape',
  description: 'Version graph and compatibility management',
  
  dependencies: ['metadata'],
  
  exports: {
    services: ['VersionGraphService', 'CompatibilityService'],
    handlers: ['getVersionGraph', 'checkCompatibility'],
  },
  
  configSchema: GatiTypes.object({
    enableAutoDetection: GatiTypes.boolean().default(true),
    storeTransformers: GatiTypes.boolean().default(true),
  }),
  
  capabilities: {
    requiresDB: true,
  },
  
  setup: async (ctx) => {
    // Subscribe to new version events
    ctx.eventBus.on('metadata.VersionPublished', async (payload) => {
      const versionGraphService = await ctx.container.resolve('timescape.VersionGraphService');
      
      // Detect breaking changes
      const breakingChanges = await versionGraphService.detectBreakingChanges(
        payload.artifactName,
        payload.previousVersion,
        payload.newVersion
      );
      
      if (breakingChanges.length > 0) {
        ctx.logger.warn({ 
          artifact: payload.artifactName,
          changes: breakingChanges 
        }, 'Breaking changes detected');
        
        // Store in version graph
        await versionGraphService.recordBreakingChanges(
          payload.artifactName,
          payload.newVersion,
          breakingChanges
        );
      }
    });
  },
});
```

### Shared GTypes

```typescript
// src/shared/types/artifact.ts
import { GatiTypes } from '@gati-framework/core';

export const ArtifactManifest = GatiTypes.object({
  name: GatiTypes.string().pattern(/^[a-z0-9-]+$/),
  version: GatiTypes.string().semver(),
  namespace: GatiTypes.string(),
  type: GatiTypes.enum([
    'module-node',
    'module-oci',
    'module-wasm',
    'module-binary',
    'module-external',
    'plugin',
    'model',
    'agent',
    'template',
  ]),
  description: GatiTypes.string().optional(),
  author: GatiTypes.string().optional(),
  license: GatiTypes.string().optional(),
  keywords: GatiTypes.array(GatiTypes.string()).optional(),
  dependencies: GatiTypes.array(GatiTypes.object({
    name: GatiTypes.string(),
    version: GatiTypes.string(),
  })).optional(),
  gtypes: GatiTypes.array(GatiTypes.object({
    name: GatiTypes.string(),
    fields: GatiTypes.record(GatiTypes.string(), GatiTypes.string()),
  })).optional(),
});

export const Signature = GatiTypes.object({
  algorithm: GatiTypes.enum(['cosign', 'sigstore', 'pgp']),
  value: GatiTypes.string(),
  publicKey: GatiTypes.string(),
  timestamp: GatiTypes.string().datetime(),
});

export const Provenance = GatiTypes.object({
  repo: GatiTypes.string().url(),
  commit: GatiTypes.string().pattern(/^[a-f0-9]{40}$/),
  buildTimestamp: GatiTypes.string().datetime(),
  builder: GatiTypes.string(),
});
```

### Application Configuration

```typescript
// gati.config.ts
import { defineConfig } from '@gati-framework/core';

export default defineConfig({
  app: {
    name: 'gati-registry',
    version: '1.0.0',
    port: 8080,
  },
  
  modules: {
    discovery: {
      paths: ['./src/modules'],
    },
  },
  
  database: {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    pool: {
      min: 10,
      max: 50,
    },
  },
  
  cache: {
    type: 'redis',
    url: process.env.REDIS_URL,
    ttl: 3600,
  },
  
  storage: {
    type: 's3',
    bucket: process.env.S3_BUCKET,
    region: process.env.AWS_REGION,
  },
  
  security: {
    cors: {
      origin: ['https://registry.gati.dev', 'https://gati.dev'],
      credentials: true,
    },
    rateLimit: {
      windowMs: 60 * 1000,
      max: 100,
    },
  },
  
  observability: {
    logging: {
      level: 'info',
      format: 'json',
    },
    metrics: {
      enabled: true,
      port: 9090,
    },
    tracing: {
      enabled: true,
      endpoint: process.env.OTEL_ENDPOINT,
    },
  },
});
```

### Benefits of Building with Gati

1. **Type Safety**: GTypes provide end-to-end type safety from API to database
2. **Modularity**: Each domain is a separate module with clear boundaries
3. **Testability**: Modules can be tested in isolation
4. **Scalability**: Modules can be deployed independently
5. **Timescape Native**: Built-in version management for the registry itself
6. **Event-Driven**: Loose coupling through event bus
7. **Observable**: Built-in metrics, logging, and tracing
8. **Secure**: Built-in authentication, authorization, and rate limiting
9. **Maintainable**: Clear structure and conventions
10. **Dogfooding**: Validates Gati's architecture at scale

### Development Workflow

```bash
# Initialize project
gati init gati-registry --template registry

# Add modules
gati module create artifacts
gati module create search
gati module create scanning

# Develop locally
gati dev

# Run tests
gati test

# Build for production
gati build

# Deploy
gati deploy --env production
```

### Testing Strategy

```typescript
// src/modules/artifacts/tests/upload.test.ts
import { createTestContext, createMockModule } from '@gati-framework/testing';

describe('Artifact Upload', () => {
  it('should upload artifact with valid signature', async () => {
    const ctx = await createTestContext({
      modules: ['artifacts', 'auth', 'signing'],
    });
    
    const artifact = createMockArtifact();
    const signature = await signArtifact(artifact);
    
    const response = await ctx.request
      .post('/v1/artifacts/test/my-module/1.0.0')
      .set('x-signature', signature)
      .send(artifact);
    
    expect(response.status).toBe(202);
    expect(response.body.uploadId).toBeDefined();
  });
});
```

This approach makes the Gati Registry a living example of how to build production applications with Gati!

