# Gati Registry - Quick Start Guide

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **pnpm** package manager
- **Docker** and **Docker Compose** (for local services)
- **PostgreSQL 14+** (or use Docker)
- **Redis 7+** (or use Docker)
- **Elasticsearch 8+** (or use Docker)
- **AWS Account** (for S3) or **MinIO** (for local development)

## Local Development Setup

### 1. Clone and Install

```bash
# Navigate to the registry directory
cd apps/gati-registry

# Install dependencies
pnpm install
```

### 2. Start Local Services

Using Docker Compose:

```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: gati_registry
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  es_data:
  minio_data:
EOF

# Start services
docker-compose up -d
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your local settings
# For local development, the defaults should work with Docker Compose
```

### 4. Initialize Database

```bash
# Run database migrations
pnpm db:migrate

# (Optional) Seed with sample data
pnpm db:seed
```

### 5. Start Development Server

```bash
# Start in development mode with hot reload
pnpm dev
```

The Registry API will be available at `http://localhost:8080`

## Project Structure

```
apps/gati-registry/
├── src/
│   ├── modules/              # Gati modules
│   │   ├── artifacts/        # Artifact storage
│   │   ├── metadata/         # Metadata indexing
│   │   ├── search/           # Search & discovery
│   │   ├── auth/             # Authentication
│   │   ├── signing/          # Signature verification
│   │   ├── scanning/         # Vulnerability scanning
│   │   ├── billing/          # Marketplace
│   │   ├── timescape/        # Version management
│   │   ├── notifications/    # Notifications
│   │   └── analytics/        # Analytics
│   ├── shared/               # Shared code
│   │   ├── types/            # Shared GTypes
│   │   └── utils/            # Utilities
│   └── app.ts                # Application entry
├── tests/                    # Tests
│   ├── unit/
│   ├── property/
│   ├── integration/
│   └── e2e/
├── docs/                     # Documentation
├── k8s/                      # Kubernetes manifests
├── .env.example              # Environment template
├── gati.config.ts            # Gati configuration
├── docker-compose.yml        # Local services
├── Dockerfile                # Container image
└── package.json              # Dependencies
```

## Development Workflow

### Creating a New Module

```bash
# Use Gati CLI to create a module
gati module create my-module

# This creates:
# src/modules/my-module/
#   ├── module.ts           # Module manifest
#   ├── handlers/           # HTTP handlers
#   ├── services/           # Business logic
#   ├── events/             # Event definitions
#   └── tests/              # Module tests
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific module tests
pnpm test:module artifacts

# Run with coverage
pnpm test:coverage

# Run property-based tests
pnpm test:property

# Run integration tests
pnpm test:integration

# Run e2e tests
pnpm test:e2e
```

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Database Migrations

```bash
# Create a new migration
pnpm db:migration:create add_new_table

# Run migrations
pnpm db:migrate

# Rollback last migration
pnpm db:migrate:rollback

# Reset database (WARNING: destroys data)
pnpm db:reset
```

## API Examples

### Upload an Artifact

```bash
# Sign the artifact
cosign sign-blob --key cosign.key artifact.tar.gz > signature.sig

# Upload
curl -X POST http://localhost:8080/v1/artifacts/my-namespace/my-module/1.0.0 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/octet-stream" \
  -H "X-Artifact-Digest: sha256:abc123..." \
  -H "X-Signature: $(cat signature.sig)" \
  --data-binary @artifact.tar.gz
```

### Search for Artifacts

```bash
curl "http://localhost:8080/v1/search?query=authentication&type=module&page=1&pageSize=20"
```

### Download an Artifact

```bash
curl -O http://localhost:8080/v1/artifacts/my-namespace/my-module/1.0.0
```

### Get Artifact Metadata

```bash
curl http://localhost:8080/v1/artifacts/my-namespace/my-module/1.0.0/metadata
```

## Common Tasks

### Add a New Handler

1. Create handler file in `src/modules/{module}/handlers/`
2. Define GTypes for input/output
3. Implement handler logic
4. Export from module manifest
5. Write tests

Example:

```typescript
// src/modules/artifacts/handlers/list-artifacts.ts
import { defineHandler, GatiTypes } from '@gati-framework/core';

export const listArtifacts = defineHandler({
  method: 'GET',
  path: '/v1/artifacts/:namespace',
  
  input: GatiTypes.object({
    params: GatiTypes.object({
      namespace: GatiTypes.string(),
    }),
    query: GatiTypes.object({
      page: GatiTypes.number().default(1),
      pageSize: GatiTypes.number().default(20),
    }),
  }),
  
  output: GatiTypes.object({
    artifacts: GatiTypes.array(GatiTypes.object({
      name: GatiTypes.string(),
      version: GatiTypes.string(),
      description: GatiTypes.string(),
    })),
    total: GatiTypes.number(),
  }),
  
  handler: async (req, res, gctx, lctx) => {
    const metadataService = await gctx.modules['metadata.MetadataService'];
    const result = await metadataService.listArtifacts(
      req.params.namespace,
      req.query.page,
      req.query.pageSize
    );
    
    res.json(result);
  },
});
```

### Add a Background Worker

1. Create effect file in `src/modules/{module}/effects/`
2. Define effect type (cron, subscriber, etc.)
3. Implement handler logic
4. Export from module manifest

Example:

```typescript
// src/modules/scanning/effects/scan-queue.ts
import { defineEffect } from '@gati-framework/core';

export const scanQueue = defineEffect({
  name: 'ScanQueue',
  type: 'subscriber',
  
  handler: async (ctx) => {
    const scannerService = await ctx.services.resolve('scanning.ScannerService');
    
    while (true) {
      const job = await scannerService.getNextJob();
      if (!job) {
        await sleep(5000);
        continue;
      }
      
      await scannerService.processJob(job);
    }
  },
});
```

### Add Event Handlers

1. Define event in `src/modules/{module}/events/definitions/`
2. Create handler in `src/modules/{module}/events/handlers/`
3. Subscribe in module setup

Example:

```typescript
// src/modules/notifications/module.ts
setup: async (ctx) => {
  ctx.eventBus.on('artifacts.ArtifactUploaded', async (payload) => {
    const notificationService = await ctx.container.resolve('notifications.NotificationService');
    await notificationService.sendUploadNotification(payload);
  });
}
```

## Debugging

### Enable Debug Logging

```bash
# Set log level in .env
LOG_LEVEL=debug

# Or via environment variable
LOG_LEVEL=debug pnpm dev
```

### Inspect Database

```bash
# Connect to PostgreSQL
psql postgresql://postgres:password@localhost:5432/gati_registry

# Common queries
SELECT * FROM artifacts LIMIT 10;
SELECT * FROM versions WHERE artifact_id = 'xxx';
SELECT * FROM namespaces;
```

### Inspect Redis Cache

```bash
# Connect to Redis
redis-cli

# Common commands
KEYS *
GET artifact:metadata:xxx
TTL artifact:metadata:xxx
```

### Inspect Elasticsearch

```bash
# Check indices
curl http://localhost:9200/_cat/indices

# Search artifacts
curl http://localhost:9200/gati-registry/_search?q=authentication

# Get mapping
curl http://localhost:9200/gati-registry/_mapping
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Elasticsearch Not Starting

```bash
# Increase Docker memory (Mac/Windows)
# Docker Desktop > Settings > Resources > Memory: 4GB+

# Check logs
docker-compose logs elasticsearch
```

## Resources

- [Full Specification](.kiro/specs/gati-registry/)
- [Requirements](.kiro/specs/gati-registry/requirements.md)
- [Design](.kiro/specs/gati-registry/design.md)
- [Tasks](.kiro/specs/gati-registry/tasks.md)
- [Gati Framework Documentation](../../docs/)

## Getting Help

- Check the [Design Document](.kiro/specs/gati-registry/design.md) for architecture details
- Review [Tasks](.kiro/specs/gati-registry/tasks.md) for implementation guidance
- Consult Gati framework documentation for module development

## Next Steps

1. **Review the specification** in `.kiro/specs/gati-registry/`
2. **Start with Phase 1** tasks (Core Infrastructure)
3. **Implement artifacts module** first
4. **Add tests** as you go
5. **Follow the task list** in `tasks.md`

Happy coding! 🚀
