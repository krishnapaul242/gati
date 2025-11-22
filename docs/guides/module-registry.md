# Module Registry & Marketplace

> 🚧 **Status**: Planned for M4 (February 2026)  
> This feature is currently in the design and planning phase.

## Overview

The Gati Module Registry is a public npm-like registry for discovering, sharing, and installing Gati modules. Think of it as npm for Gati modules - a centralized place where developers can publish and discover reusable modules.

## What is the Module Registry?

The Module Registry provides:

- **Public Registry** - npm-like package registry for Gati modules
- **Marketplace** - Browse, search, and discover modules
- **Versioning** - Semantic versioning for modules
- **Dependencies** - Automatic dependency resolution
- **Discovery** - Search and filter modules by category, popularity, etc.
- **Revenue Sharing** - Earn from your modules (70/30 split)

## Module Types

### Database Connectors

```bash
gati module install @gati-modules/postgres
gati module install @gati-modules/mongodb
gati module install @gati-modules/mysql
gati module install @gati-modules/redis
```

### Authentication Providers

```bash
gati module install @gati-modules/oauth
gati module install @gati-modules/jwt
gati module install @gati-modules/saml
gati module install @gati-modules/auth0
```

### Queue Systems

```bash
gati module install @gati-modules/rabbitmq
gati module install @gati-modules/kafka
gati module install @gati-modules/sqs
gati module install @gati-modules/redis-queue
```

### AI/ML Integrations

```bash
gati module install @gati-modules/openai
gati module install @gati-modules/anthropic
gati module install @gati-modules/huggingface
```

### Cache Systems

```bash
gati module install @gati-modules/redis-cache
gati module install @gati-modules/memcached
gati module install @gati-modules/dragonfly
```

## Using Modules

### Installing Modules

```bash
# Install a module
gati module install @gati-modules/postgres

# Install specific version
gati module install @gati-modules/postgres@2.1.0

# Install multiple modules
gati module install @gati-modules/postgres @gati-modules/redis
```

### Using in Your App

```typescript
// src/handlers/users/[id].ts
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  // Module automatically available in gctx.modules
  const user = await gctx.modules['postgres'].users.findById(req.params.id);
  
  // Cache the result
  await gctx.modules['redis'].set(`user:${req.params.id}`, user, 3600);
  
  res.json({ user });
};
```

### Module Configuration

```typescript
// gati.config.ts
export default {
  modules: {
    postgres: {
      host: process.env.DB_HOST,
      port: 5432,
      database: 'myapp',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: 6379
    }
  }
};
```

## Publishing Modules

### Creating a Module

```bash
# Create a new module
gati module create my-awesome-module

# Module structure
my-awesome-module/
├── src/
│   ├── index.ts          # Module entry point
│   ├── types.ts          # TypeScript types
│   └── config.ts         # Configuration schema
├── tests/
│   └── index.test.ts
├── package.json
├── gati-module.json      # Module manifest
└── README.md
```

### Module Manifest

```json
{
  "name": "@myorg/my-awesome-module",
  "version": "1.0.0",
  "description": "An awesome Gati module",
  "author": "Your Name",
  "license": "MIT",
  "gati": {
    "type": "database",
    "contracts": ["@gati-framework/database-contract"],
    "dependencies": {
      "@gati-modules/connection-pool": "^2.0.0"
    }
  },
  "keywords": ["database", "sql", "postgres"],
  "repository": "https://github.com/myorg/my-awesome-module"
}
```

### Publishing

```bash
# Login to registry
gati registry login

# Publish module
gati module publish

# Module is now available in the marketplace!
```

## Marketplace Features

### Discovery

- **Search** - Find modules by name, description, keywords
- **Categories** - Browse by type (database, auth, queue, etc.)
- **Popularity** - Sort by downloads, stars, ratings
- **Trending** - See what's popular this week/month
- **Recommendations** - Get suggestions based on your stack

### Module Pages

Each module has a dedicated page with:

- **README** - Full documentation
- **Installation** - Quick install command
- **Usage Examples** - Code samples
- **API Reference** - Complete API docs
- **Versions** - Version history and changelog
- **Dependencies** - Required modules
- **Stats** - Downloads, stars, ratings
- **Reviews** - User feedback

### Revenue Sharing

Module authors can earn from the marketplace:

- **70/30 Split** - Authors get 70%, Gati gets 30%
- **Paid Modules** - Charge for premium modules
- **Sponsorships** - Accept sponsorships
- **Support Tiers** - Offer paid support

## Module Contracts

Modules implement contracts to ensure compatibility:

```typescript
// @gati-framework/database-contract
export interface DatabaseContract {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>;
}
```

### Implementing a Contract

```typescript
// src/index.ts
import type { Module } from '@gati-framework/runtime';
import type { DatabaseContract } from '@gati-framework/database-contract';

export const myDatabaseModule: Module<DatabaseContract> = {
  name: 'my-database',
  version: '1.0.0',
  
  async init(config) {
    const client = await createClient(config);
    
    return {
      async connect() {
        await client.connect();
      },
      
      async disconnect() {
        await client.disconnect();
      },
      
      async query(sql, params) {
        return client.query(sql, params);
      },
      
      async transaction(fn) {
        return client.transaction(fn);
      }
    };
  }
};
```

## Registry API

The registry provides a REST API for programmatic access:

```bash
# Search modules
GET https://registry.gati.dev/api/search?q=postgres

# Get module info
GET https://registry.gati.dev/api/modules/@gati-modules/postgres

# Get module versions
GET https://registry.gati.dev/api/modules/@gati-modules/postgres/versions

# Download module
GET https://registry.gati.dev/api/modules/@gati-modules/postgres/1.0.0/download
```

## CLI Commands

```bash
# Search for modules
gati module search postgres

# Show module info
gati module info @gati-modules/postgres

# List installed modules
gati module list

# Update modules
gati module update

# Remove module
gati module remove @gati-modules/postgres

# Login to registry
gati registry login

# Publish module
gati module publish

# Unpublish module
gati module unpublish @myorg/my-module@1.0.0
```

## Security

### Module Verification

- **Code Scanning** - Automated security scanning
- **Dependency Audit** - Check for vulnerable dependencies
- **Signature Verification** - Cryptographic signatures
- **Sandboxing** - Modules run in isolated environments

### Trust Levels

- **Verified** - Official Gati modules
- **Trusted** - Community-verified modules
- **Community** - User-contributed modules

## Roadmap

### Phase 1 (February 2026)

- ✅ Basic registry infrastructure
- ✅ Module publishing and discovery
- ✅ CLI commands
- ✅ Web interface

### Phase 2 (Q1 2026)

- ⏳ Marketplace with ratings and reviews
- ⏳ Revenue sharing system
- ⏳ Advanced search and filtering
- ⏳ Module recommendations

### Phase 3 (Q2 2026)

- ⏳ Private registries for enterprises
- ⏳ Module analytics and insights
- ⏳ Automated testing and CI/CD
- ⏳ Module certification program

## Related Documentation

- [Module System](./modules.md) - How modules work in Gati
- [Module Contracts](../architecture/module-contracts.md) - Contract specifications
- [Registry Specs](https://github.com/krishnapaul242/gati/tree/main/apps/gati-registry) - Technical specifications
- [Contributing](../contributing/README.md) - Help build the registry

## Contributing

Want to help build the Module Registry?

- 🏗️ **Backend** - Registry API and infrastructure
- 🎨 **Frontend** - Marketplace UI/UX
- 📦 **Modules** - Create and publish modules
- 📖 **Documentation** - Write guides and tutorials
- 🧪 **Testing** - Test the registry and modules

[Join the discussion](https://github.com/krishnapaul242/gati/discussions)

---

**Status**: 🚧 In Planning  
**Target Release**: M4 (February 2026)  
**Registry Specs**: [apps/gati-registry](https://github.com/krishnapaul242/gati/tree/main/apps/gati-registry)  
**Last Updated**: November 22, 2025
