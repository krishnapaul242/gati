# gatic

> Project scaffolding tool for Gati applications

[![npm version](https://img.shields.io/npm/v/gatic.svg)](https://www.npmjs.com/package/gatic)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Create new Gati applications instantly with pre-configured templates, handlers, modules, and deployment setup.

## Installation

No installation required! Use with `npx`:

```bash
npx gatic create my-app
```

Or install globally:

```bash
npm install -g gatic
gatic create my-app
```

## Quick Start

```bash
# Create new application
npx gatic create my-app

# Navigate to project
cd my-app

# Start development server
pnpm dev

# Your API is running at http://localhost:3000 🎉
```

## Usage

### Create Project

```bash
gatic create <project-name> [options]

Options:
  -t, --template <name>    Template to use (default: basic)
  --skip-install           Skip dependency installation
  --skip-git               Skip git initialization
```

### Available Templates

#### Basic (Default)

Minimal setup with hello world handler.

```bash
npx gatic create my-app
```

**Includes**:
- Hello world handler
- Basic configuration
- Development setup
- README with instructions

#### Full

Complete setup with handlers, modules, and examples.

```bash
npx gatic create my-app --template full
```

**Includes**:
- CRUD handlers
- Database module
- Logger module
- Middleware examples
- Testing setup
- Deployment configuration

#### API

RESTful API template with authentication.

```bash
npx gatic create my-app --template api
```

**Includes**:
- User authentication
- CRUD operations
- Database integration
- JWT middleware
- API documentation

#### Minimal

Bare-bones setup for advanced users.

```bash
npx gatic create my-app --template minimal
```

**Includes**:
- Basic configuration only
- No example handlers
- Minimal dependencies

## Project Structure

```
my-app/
├── src/
│   ├── handlers/          # API handlers
│   │   └── hello.ts
│   └── modules/           # Reusable modules
│       └── logger.ts
├── .gati/                 # Generated manifests
│   ├── manifests/
│   └── types.d.ts
├── gati.config.ts         # Configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Generated Files

### gati.config.ts

```typescript
import type { GatiConfig } from '@gati-framework/core';

export default {
  name: 'my-app',
  version: '1.0.0',
  dev: {
    port: 3000,
    hotReload: true
  }
} satisfies GatiConfig;
```

### src/handlers/hello.ts

```typescript
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res) => {
  res.json({ message: 'Hello, World!' });
};
```

### package.json

```json
{
  "name": "my-app",
  "scripts": {
    "dev": "gati dev",
    "build": "gati build",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@gati-framework/runtime": "^2.0.0"
  }
}
```

## Next Steps

After creating your project:

### 1. Start Development

```bash
cd my-app
pnpm dev
```

### 2. Create Handler

```bash
gati generate handler users/[id]
```

### 3. Create Module

```bash
gati generate module database
```

### 4. Deploy

```bash
# Local Kubernetes
gati deploy dev --local

# AWS EKS
gati deploy prod --cloud aws
```

## Templates in Detail

### Basic Template

Perfect for getting started quickly.

**Use case**: Learning Gati, prototyping, simple APIs

**What's included**:
- Single hello world handler
- Minimal configuration
- Development scripts
- Quick start guide

### Full Template

Production-ready setup with best practices.

**Use case**: Production applications, team projects

**What's included**:
- Multiple handler examples
- Database and logger modules
- Middleware patterns
- Testing setup
- Deployment configuration
- Comprehensive documentation

### API Template

RESTful API with authentication.

**Use case**: Backend APIs, microservices

**What's included**:
- User authentication (JWT)
- CRUD operations
- Database integration
- Error handling
- API documentation
- Postman collection

### Minimal Template

Bare-bones for advanced users.

**Use case**: Custom setups, experimentation

**What's included**:
- Configuration only
- No examples
- Maximum flexibility

## Configuration Options

### Skip Installation

Create project without installing dependencies:

```bash
gatic create my-app --skip-install
cd my-app
pnpm install
```

### Skip Git

Create project without git initialization:

```bash
gatic create my-app --skip-git
```

## Development

```bash
# Clone repository
git clone https://github.com/krishnapaul242/gati.git
cd gati/packages/gatic

# Install dependencies
pnpm install

# Test locally
node bin/gatic.mjs create test-app
```

## Troubleshooting

**Command not found**:
```bash
# Use npx
npx gatic create my-app

# Or install globally
npm install -g gatic
```

**Permission denied**:
```bash
# On Unix/Linux/macOS
sudo npm install -g gatic
```

**Template not found**:
```bash
# List available templates
gatic create my-app --help
```

## Related Packages

- [@gati-framework/cli](../cli) - CLI tools (used by gatic)
- [@gati-framework/runtime](../runtime) - Runtime engine
- [@gati-framework/core](../core) - Core types

## Documentation

- [Quick Start](https://krishnapaul242.github.io/gati/onboarding/quick-start)
- [Getting Started](https://krishnapaul242.github.io/gati/onboarding/getting-started)
- [GatiC Guide](https://krishnapaul242.github.io/gati/guides/gatic)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## Contributing

Contributions welcome! See [Contributing Guide](../../docs/contributing/README.md).

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
