<div align="center">

# ⚡ Gati

### _Motion in Code_

**The next-generation TypeScript framework for building cloud-native, versioned APIs**

[![Version](https://img.shields.io/badge/version-0.4.5-blue.svg)](https://github.com/krishnapaul242/gati)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![CI](https://github.com/krishnapaul242/gati/actions/workflows/ci.yml/badge.svg)](https://github.com/krishnapaul242/gati/actions/workflows/ci.yml)

[Documentation](https://krishnapaul242.github.io/gati/) • [Quick Start](#-quick-start) • [Examples](#-examples) • [Roadmap](#-roadmap)

</div>

---

## 🎯 What is Gati?

Gati eliminates infrastructure complexity so you can **focus on business logic**. Write handlers, deploy to Kubernetes, and let the framework handle routing, scaling, versioning, and cloud infrastructure automatically.

```typescript
// That's it—just write your handler
export const handler: Handler = async (req, res, gctx, lctx) => {
  const user = await gctx.modules['db'].users.findById(req.params.id);
  res.json({ user });
};

// ✅ Automatically available at /api/users/:id
// ✅ Auto-scales with Kubernetes
// ✅ Type-safe with full IntelliSense
```

## ✨ Core Features

- 🧠 **Business-logic only** — Framework handles infra, routing, scaling, SSL
- 📦 **Cloud-pluggable** — AWS, GCP, Azure, or custom providers
- 🧬 **Versioned APIs** (M3) — Timestamp-based routing: "I want the API as it was last Friday"
- 🛠️ **Typed SDK generation** (M5) — Auto-generated with `gati generate`
- 📊 **Live Control Panel** (M4) — Monitor apps, change config, inspect logs visually
- ⚙️ **Modular architecture** — Handlers, modules, and middleware
- ☁️ **Multi-region ready** — Auto CDN + failover support

## 🚀 Quick Start

### Installation

```bash
# Create a new Gati application
npx gatic create my-app

# Navigate to your project
cd my-app

# Start development server with hot reload
pnpm dev

# Deploy to local Kubernetes
gati deploy dev --local

# Build for production
pnpm build
```

**That's it!** Your API is running at `http://localhost:3000` 🎉

### Your First Handler

```typescript
// src/handlers/users/[id].ts
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  const userId = req.params.id;
  
  // Your business logic here
  const user = await gctx.modules['db'].users.findById(userId);
  
  res.json({ user });
};

// Automatically available at /api/users/:id 🎉
```

## 📦 Published Packages

| Package | Version | Status | Description |
|---------|---------|--------|-------------|
| [`@gati-framework/core`](https://www.npmjs.com/package/@gati-framework/core) | ![npm](https://img.shields.io/npm/v/@gati-framework/core) | ✅ Stable | Core types and configuration |
| [`@gati-framework/runtime`](https://www.npmjs.com/package/@gati-framework/runtime) | ![npm](https://img.shields.io/npm/v/@gati-framework/runtime) | ✅ Stable | Runtime execution engine |
| [`@gati-framework/cli`](https://www.npmjs.com/package/@gati-framework/cli) | ![npm](https://img.shields.io/npm/v/@gati-framework/cli) | ✅ Stable | Development and deployment tools |
| [`gatic`](https://www.npmjs.com/package/gatic) | ![npm](https://img.shields.io/npm/v/gatic) | ✅ Stable | Project scaffolding command |
| [`@gati-framework/cloud-aws`](https://www.npmjs.com/package/@gati-framework/cloud-aws) | ![npm](https://img.shields.io/npm/v/@gati-framework/cloud-aws) | ✅ Stable | AWS EKS deployment |
| [`@gati-framework/cloud-gcp`](https://www.npmjs.com/package/@gati-framework/cloud-gcp) | ![npm](https://img.shields.io/npm/v/@gati-framework/cloud-gcp) | ✅ Stable | GCP GKE deployment |
| [`@gati-framework/cloud-azure`](https://www.npmjs.com/package/@gati-framework/cloud-azure) | ![npm](https://img.shields.io/npm/v/@gati-framework/cloud-azure) | ✅ Stable | Azure AKS deployment |
| [`@gati-framework/playground`](https://www.npmjs.com/package/@gati-framework/playground) | ![npm](https://img.shields.io/npm/v/@gati-framework/playground) | ✅ Stable | Visual debugging interface |

## 🗺️ Roadmap

| Milestone | Status | Target | Description |
|-----------|--------|--------|-------------|
| **M1** — Foundation & Core Runtime | ✅ Complete | Q4 2025 | Handler engine, CLI, Kubernetes deployment |
| **M2** — Cloud Infrastructure | ✅ Complete | Q4 2025 | AWS/GCP/Azure plugins, auto-scaling, CI/CD |
| **M3** — Timescape & Type System | 🚧 In Progress | Nov 2025 | API versioning, module system, type system, contracts |
| **M4** — Control Panel | ⏳ Planned | Q1 2026 | Live monitoring and configuration dashboard |
| **M5** — SDK Generation | ⏳ Planned | Q1 2026 | Auto-generate typed clients for any platform |
| **M6** — CDN & SSL | ⏳ Planned | Q2 2026 | Global CDN, automatic SSL, multi-region support |

**📋 Detailed roadmap:** [docs/architecture/milestones.md](./docs/architecture/milestones.md)

## 🎓 Documentation

### Getting Started

- **[What is Gati?](./docs/onboarding/what-is-gati.md)** - Introduction and philosophy
- **[Quick Start](./docs/onboarding/quick-start.md)** - 5-minute guide
- **[Getting Started](./docs/onboarding/getting-started.md)** - Complete tutorial
- **[GatiC CLI](./docs/guides/gatic.md)** - Scaffolding tool

### Core Guides

- **[Handlers](./docs/guides/handlers.md)** - Write API handlers
- **[Modules](./docs/guides/modules.md)** - Create reusable modules
- **[Middleware](./docs/guides/middleware.md)** - Custom middleware
- **[Context (gctx/lctx)](./docs/guides/context.md)** - Global and local context
- **[Error Handling](./docs/guides/error-handling.md)** - Error management

### Deployment

- **[Deployment Overview](./docs/guides/deployment.md)** - Deploy to production
- **[Local Kubernetes](./docs/guides/kubernetes.md)** - Deploy with kind
- **[AWS EKS](./docs/guides/aws-eks-deployment.md)** - Deploy to AWS
- **[HPA & Ingress](./docs/guides/hpa-ingress.md)** - Auto-scaling and load balancing

### Architecture

- **[Overview](./docs/architecture/overview.md)** - System design
- **[Timescape Versioning](./docs/architecture/timescape.md)** - API versioning (M3)
- **[Type System](./docs/architecture/type-system.md)** - Branded types (M3)
- **[Design Decisions](./docs/architecture/design-decisions.md)** - Why we built it this way

### API Reference

- **[Handler API](./docs/api-reference/handler.md)** - Handler function signature
- **[Request API](./docs/api-reference/request.md)** - Request object
- **[Response API](./docs/api-reference/response.md)** - Response object
- **[Context API](./docs/api-reference/context.md)** - Global and local context

**📖 Full documentation:** [https://krishnapaul242.github.io/gati/](https://krishnapaul242.github.io/gati/)

## 📖 Examples

### Hello World

```typescript
// src/handlers/hello.ts
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = (req, res, gctx, lctx) => {
  const name = req.query.name || 'World';
  res.json({ message: `Hello, ${name}!` });
};

// Available at: GET /api/hello?name=Gati
```

### Using Modules

```typescript
// src/handlers/users/[id].ts
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res, gctx, lctx) => {
  const userId = req.params.id;
  
  // Access database module from global context
  const user = await gctx.modules['db'].users.findById(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({ user });
};
```

**More examples:** [docs/examples/](./docs/examples/)

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker (for local Kubernetes)
- kubectl (for deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/krishnapaul242/gati.git
cd gati

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Project Structure

```
gati/
├── packages/
│   ├── core/              # Core types and configuration
│   ├── runtime/           # Runtime execution engine
│   ├── cli/               # CLI tools
│   ├── gatic/             # Project scaffolding
│   ├── cloud-aws/         # AWS deployment plugin
│   ├── cloud-gcp/         # GCP deployment plugin
│   ├── cloud-azure/       # Azure deployment plugin
│   └── playground/        # Visual debugging tool
├── examples/              # Example applications
├── docs/                  # Documentation (VitePress)
├── tests/                 # Test suites
└── .github/               # CI/CD workflows
```

## 📊 Current Status

### ✅ Production Ready (M1 & M2 Complete)

- **Core Runtime** — Handler engine, modules, middleware, contexts
- **Development** — Hot reload (50-200ms), manifest system, file-based routing
- **Deployment** — Local K8s (kind), AWS EKS, GCP GKE, Azure AKS
- **Observability** — Structured logging (Pino), request tracing, health checks
- **Debugging** — Playground with API/Network/Tracking visualization modes
- **CI/CD** — Automated testing, building, and npm publishing
- **Project Scaffolding** — GatiC CLI for instant project creation

### 🚧 In Development (M3 - Q1 2026)

- **Timescape Versioning** — Timestamp-based API versioning
- **Type System** — Branded types with constraint combinators
- **Schema Diffing** — Automatic breaking change detection
- **Transformers** — Bidirectional data transformations

### 📅 Planned

- **M4 (Q2 2026)** — Control Panel for monitoring and configuration
- **M5 (Q2 2026)** — SDK generation from handler signatures
- **M6 (Q3 2026)** — CDN integration and SSL automation

## 📝 Recent Updates

### November 22, 2025 - CI/CD Complete 🎉

- ✅ Automated CI/CD pipeline operational
- ✅ Published 9 packages to npm
- ✅ Comprehensive documentation updates
- ✅ Timescape planning documentation added

**Full changelog:** [docs/changelog/2025-11-22-ci-cd-complete.md](./docs/changelog/2025-11-22-ci-cd-complete.md)

### Package Versions

- `@gati-framework/core` — v0.4.5
- `@gati-framework/types` — v1.0.1
- `@gati-framework/runtime` — v2.0.3
- `@gati-framework/cli` — v1.0.14
- `gatic` — v0.1.11

**Current state:** [docs/changelog/current-state.md](./docs/changelog/current-state.md)

## 🤝 Contributing

Gati is currently a **solo project** by Krishna Paul, and I'm actively looking for **contributors and testers**!

Whether you're interested in:
- 🐞 **Testing** - Try Gati and report bugs
- 💡 **Ideas** - Share your thoughts and suggestions
- 📝 **Documentation** - Help improve the docs
- 🚀 **Features** - Contribute code and new capabilities
- 🎨 **Design** - Help with UI/UX for the Control Panel

**Your contributions are welcome!**

### How to Get Involved

1. ⭐ **Star the repo** to show support
2. 💬 **Join discussions** - Share your ideas
3. 🐛 **Report bugs** - Help me improve quality
4. 📖 **Improve docs** - Make Gati easier to use
5. 🔧 **Submit PRs** - Add features or fix issues

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes and add tests
4. Run tests: `pnpm test`
5. Commit using [conventional commits](https://www.conventionalcommits.org/)
6. Push and create a pull request

**Contributing guide:** [docs/contributing/README.md](./docs/contributing/README.md)

### Looking For

- 🧪 **Beta Testers** - Try Gati in real projects
- 👨‍💻 **Contributors** - Help build features
- 📚 **Technical Writers** - Improve documentation
- 🎨 **Designers** - UI/UX for Control Panel
- 🌍 **Community Builders** - Help grow the community

## 🌟 Why Gati?

### Traditional Backend Development

```
❌ Manually configure routing, middleware, CORS
❌ Write Dockerfile, K8s manifests, CI/CD pipelines
❌ Manually version APIs, maintain backward compatibility
❌ Set up logging, metrics, tracing infrastructure
❌ Write client SDKs manually or use brittle codegen
❌ Deploy/scale/monitor requires DevOps expertise
```

### With Gati

```
✅ Write handlers — routing, middleware auto-configured
✅ gati deploy dev --local — automatic containerization
✅ Timescape handles versioning transparently (M3)
✅ Built-in observability with structured logging
✅ gati generate — type-safe SDKs auto-generated (M5)
✅ Zero-ops deployment to AWS/GCP/Azure/K8s
```

## 🎯 Vision

My goal is to build the **backend framework that builds, scales, and evolves itself**:

1. **Let Developers Write Business Logic** — Framework handles everything else
2. **APIs That Never Break** — Timescape enables fearless shipping
3. **Modules Like NPM Packages** — Install databases, caches, auth like frontend deps
4. **TypeScript-Native Types** — Single definition → validator, OpenAPI, SDK, metadata
5. **Zero-Ops Deployment** — One command to deploy anywhere

**Read more:** [docs/vision/why-gati.md](./docs/vision/why-gati.md)

### Current Focus (November 2025)

I'm currently working on **M3 - Timescape & Type System**:
- 🔄 Timescape API versioning
- 📦 Enhanced module system
- 🏷️ Type system with contracts
- 🔌 Module registry and marketplace

**Want to help?** These are great areas for contributors!

## 📄 License

MIT License © 2025 [Krishna Paul](https://github.com/krishnapaul242)

See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

Built with inspiration from Express.js, NestJS, and modern cloud-native architectures.

Special thanks to all [contributors](https://github.com/krishnapaul242/gati/graphs/contributors) who help make Gati better!

---

<div align="center">

**"Gati is not just fast—it's forward."** ⚡

[⭐ Star us on GitHub](https://github.com/krishnapaul242/gati) • [📖 Read the Docs](https://krishnapaul242.github.io/gati/) • [💬 Join Discussions](https://github.com/krishnapaul242/gati/discussions)

Made with ❤️ by developers, for developers

</div>
