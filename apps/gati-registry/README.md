# Gati Registry

The official artifact registry for the Gati ecosystem, built with Gati itself.

## Overview

The Gati Registry is a unified, secure, multi-artifact registry that serves as the distribution hub for:
- Gati Modules (JS/TS, OCI images, WASM, binaries, external adapters)
- Plugins
- AI Models
- AI Agents
- Templates
- Environment Snapshots

This application demonstrates building a production-scale service with Gati, showcasing:
- Modular architecture with 10+ specialized modules
- Type-safe APIs with GTypes
- Event-driven communication
- Background workers for async processing
- Timescape integration for versioning
- Security with signature verification and vulnerability scanning
- Marketplace with billing integration

## Architecture

The Registry is composed of the following Gati modules:

- **artifacts** - Artifact storage and retrieval (S3/OCI)
- **metadata** - Metadata indexing and querying (PostgreSQL)
- **search** - Search and discovery (Elasticsearch)
- **auth** - Authentication and authorization (JWT/OAuth)
- **signing** - Signature verification (Cosign/Sigstore)
- **scanning** - Vulnerability scanning (Trivy/Clair)
- **billing** - Marketplace and payments (Stripe)
- **timescape** - Version graph management
- **notifications** - Email and webhook notifications
- **analytics** - Usage tracking and metrics

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Elasticsearch 8+
- AWS S3 or MinIO

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Configuration

See `gati.config.ts` for configuration options.

## Development

```bash
# Run in development mode
pnpm dev

# Run tests
pnpm test

# Run specific module tests
pnpm test:module artifacts

# Build for production
pnpm build

# Start production server
pnpm start
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## Documentation

- [Architecture](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Module Guide](./docs/modules.md)
- [Contributing](./CONTRIBUTING.md)

## License

Apache-2.0
