# 🌐 Gati# 🌐 Gati



> ⚡ Motion in Code — The next-gen framework for scalable, versioned, cloud-native Node.js applications.> ⚡ Motion in Code — The next-gen framework for scalable, versioned, cloud-native Node.js applications.



[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/krishnapaul242/gati)Gati is an upcoming open-source JavaScript/TypeScript framework focused on **developer productivity** and **production-ready cloud infrastructure**. It removes all the boilerplate required for deploying performant and modular applications while keeping your APIs **backward-compatible forever**.

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)## ✨ Core Features

[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

- 🧠 **Business-logic only** — Framework handles infra, routing, scaling, SSL.

Gati is a production-ready TypeScript/Node.js framework that **eliminates infrastructure complexity**. Write only business logic—Gati handles routing, scaling, deployment, and cloud infrastructure automatically.- 📦 **Cloud-pluggable** — AWS, GCP, Azure, or custom providers.

- 🧬 **Versioned APIs with timestamp routing** — "I want the API as it was last Friday."

## ✨ Features- 🛠️ **Typed SDK for frontend/microservices** — Auto generated with `gati generate`.

- 📊 **Live Control Panel** — Monitor apps, change config, inspect logs visually.

- 🧠 **Business-logic only** — Framework handles infra, routing, scaling, SSL- ⚙️ **Modular architecture** — Handlers, modules, and effects.

- 📦 **Cloud-pluggable** — AWS, GCP, Azure, or custom providers- ☁️ **Multi-region deployment ready** — Auto CDN + failover support.

- 🛠️ **Type-safe** — Full TypeScript support

- ⚙️ **Modular architecture** — Handlers, modules, and middleware## 🪜 Get Started

- ☁️ **Kubernetes-native** — Deploy anywhere

- 🔥 **Hot reload** — Fast development cycle```bash

# Create a new Gati application

### Coming Soonnpx gatic create my-app



- 🧬 **Versioned APIs** (M3) — Timestamp-based routing# Navigate to your project

- 🛠️ **SDK Generation** (M5) — Auto-generated typed clientscd my-app

- 📊 **Control Panel** (M4) — Live monitoring dashboard

- ☁️ **CDN + SSL** (M6) — Global distribution# Start development server with hot reload

pnpm dev

## 🚀 Quick Start

# Deploy to local Kubernetes

```bashgati deploy dev --local

# Create a new Gati application

npx gatic create my-app# Build for production

pnpm build

# Navigate to your project```

cd my-app

**What is GatiC?**

# Start development server with hot reload

pnpm dev`gatic` is the official Gati Command - a thin wrapper around `@gati-framework/cli` that provides the `npx gatic` command for project scaffolding. Once your project is created, you'll use the `gati` command (installed locally in your project) for development, deployment, and other operations.`



# Deploy to local Kubernetes## 📚 Documentation

gati deploy dev --local

```� **Full documentation is available at [docs/](./docs/)**



**That's it!** Your API is running at `http://localhost:3000`**Quick Links:**

- [Getting Started](./docs/getting-started.md) - Create your first Gati app

## 📚 Documentation- [Handler Guide](./docs/handlers.md) - Write API handlers

- [Module Guide](./docs/modules.md) - Create reusable modules

**Full documentation:** [docs/](./docs/)- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Deploy to Kubernetes

- [Architecture](./docs/architecture.md) - Understand Gati's design

### Getting Started

**Package Versions:**

- **[What is Gati?](./docs/onboarding/what-is-gati.md)** - Introduction- `@gati-framework/core` - v0.4.1 (Types and base configuration)

- **[Quick Start](./docs/onboarding/quick-start.md)** - 5-minute guide- `@gati-framework/runtime` - v2.0.0 (Runtime execution engine)

- **[Getting Started](./docs/onboarding/getting-started.md)** - Complete tutorial- `@gati-framework/cli` - v1.0.0 (Development and deployment tools)

- **[GatiC CLI](./docs/onboarding/gatic.md)** - Scaffolding tool- `gatic` - v0.1.0 (Project scaffolding command)



### Guides## 🧱 Project Structure (Monorepo)



- **[Handlers](./docs/guides/handlers.md)** - Write API handlers```plaintext

- **[Modules](./docs/guides/modules.md)** - Reusable modules/gati

- **[Middleware](./docs/guides/middleware.md)** - Custom middleware├── /src

- **[Deployment](./docs/guides/deployment.md)** - Deploy to production│   ├── cli/               # Source of CLI commands (build, deploy, generate)

- **[Kubernetes](./docs/guides/kubernetes.md)** - K8s deployment│   ├── runtime/           # Core runtime: app core, handler engine, context manager

│   ├── plugins/           # Cloud provider plugins (AWS, GCP, Azure)

### API Reference│   ├── codegen/           # Analyzer and SDK generator

│   ├── control-panel/     # Admin UI (Next.js + TRPC)

- **[Handler API](./docs/api-reference/handler.md)**│   └── playground/        # API testing interface

- **[Request API](./docs/api-reference/request.md)**├── examples/              # Example apps using Gati

- **[Response API](./docs/api-reference/response.md)**├── docs/                  # Developer and contributor documentation

- **[Context API](./docs/api-reference/context.md)**├── packages/              # Published packages (core, adapters, clients)

├── tests/                 # End-to-end and integration tests

### More├── Gati_PRD.md            # Project Requirements Document

├── CONTRIBUTING.md        # Contribution guidelines

- **[Architecture](./docs/architecture/overview.md)** - System design├── LICENSE                # License file (MIT planned)

- **[Examples](./docs/examples/)** - Code examples└── README.md              # You're here!

- **[Contributing](./docs/contributing/README.md)** - Contribution guide```

- **[Changelog](./docs/changelog/README.md)** - Version history

## 🚀 Roadmap

## 📦 Packages

| Milestone                               | Status        | Target |

| Package | Version | Description || --------------------------------------- | ------------- | ------ |

|---------|---------|-------------|| M1 — Basic handler runtime + CLI        | ✅ Complete   | Q1     |

| [`@gati-framework/core`](./packages/core) | 0.4.1 | Core types and configuration || M2 — Kubernetes deployment + AWS plugin | 🚧 In Progress| Q2     |

| [`@gati-framework/runtime`](./packages/runtime) | 2.0.0 | Runtime execution engine || M3 — Versioned routing engine           | ⏳ Pending    | Q2     |

| [`@gati-framework/cli`](./packages/cli) | 1.0.0 | CLI tools || M4 — Control Panel (read-only)          | ⏳ Pending    | Q3     |

| [`gatic`](./packages/gatic) | 0.1.0 | Project scaffolding || M5 — Codegen + SDK ship                 | ⏳ Pending    | Q3     |

| M6 — CDN + SSL Support                  | ⏳ Pending    | Q4     |

## 🏗️ Example| M7 — API Playground                     | ⏳ Pending    | Q4     |



```typescriptSee more in the [Product Roadmap](./Gati_PRD.md#7--technical-milestones).

// src/handlers/users.ts

import type { Handler } from '@gati-framework/runtime';## CLI deployment flags



export const handler: Handler = async (req, res) => {The CLI supports an enhanced local Kubernetes deployment flow with health checks, port-forward, configurable rollout timeout, and image auto-tagging.

  const userId = req.params.id;

  Quick examples:

  // Your business logic here

  const user = await database.users.findById(userId);- Dry run manifest generation:

    - `gati deploy dev --dry-run`

  res.json({ user });- Local deploy with health probe and auto-tag:

};  - `gati deploy dev --local --auto-tag --health-check-path /health --timeout 240`

```- Keep port-forward open after deploy:

  - `gati deploy dev --local --port-forward`

Automatically available at `/api/users/:id` 🎉

Flags overview (see the CLI README for full details):

## 🗺️ Roadmap

- `--local` — use a kind cluster locally

| Milestone | Status | Target |- `--cluster-name <name>` — override kind cluster (default: gati-local)

|-----------|--------|--------|- `--skip-cluster` — skip cluster creation

| M1 — Foundation & Core Runtime | ✅ Complete | Q4 2025 |- `--health-check-path <path>` — run HTTP GET after rollout (e.g., /health)

| M2 — Cloud Infrastructure | 🚧 In Progress | Q1 2026 |- `--timeout <seconds>` — rollout timeout (default 120)

| M3 — API Versioning | ⏳ Planned | Q1 2026 |- `--port-forward` — keep a persistent kubectl port-forward session

| M4 — Control Panel | ⏳ Planned | Q2 2026 |- `--auto-tag` — tag image with YYYYMMDD-HHMMSS-`gitsha`

| M5 — SDK Generation | ⏳ Planned | Q2 2026 |

| M6 — CDN & SSL | ⏳ Planned | Q3 2026 |More at `packages/cli/README.md`.



See [complete roadmap](./docs/architecture/roadmap.md)## 📬 Community & Contributions



## 🤝 ContributingContributions are welcome as issues, ideas, or PRs:



We welcome contributions! See our [Contributing Guide](./docs/contributing/README.md).- 🐞 Found a bug? Open an issue!

- 💡 Got a feature idea? Drop it in Discussions!

- 🐞 **Found a bug?** [Open an issue](https://github.com/krishnapaul242/gati/issues)- 📘 Want to code? See `CONTRIBUTING.md` (coming soon)

- 💡 **Have an idea?** [Start a discussion](https://github.com/krishnapaul242/gati/discussions)

- 📝 **Improve docs?** Submit a PR```diff

+ This project is just getting started — jump in and help shape the future of scalable backend apps!

## 📄 License```



MIT License © 2025 Krishna Paul## 🪪 License



See [LICENSE](./LICENSE) for details.MIT License © 202X [Your Name]



## 🙏 Acknowledgments---



Built with inspiration from Express.js, NestJS, and modern cloud-native architectures.💬 Join the journey: “Gati is not just fast—it’s forward.”



---````



**"Gati is not just fast—it's forward."** ⚡---



[Documentation](./docs/) · [GitHub](https://github.com/krishnapaul242/gati) · [npm](https://www.npmjs.com/org/gati-framework)## 📁 Suggested Project Folder Structure


```plaintext
/gati
├── src/
│   ├── cli/                     # Core CLI tool
│   │   └── index.ts
│   ├── runtime/                 # Runtime engine
│   │   ├── app-core.ts          # Main router
│   │   ├── route-manager.ts     # Handler orchestrator
│   │   ├── handler-engine.ts    # Flow of handlers
│   │   ├── module-loader.ts     # Isolated module registry
│   │   └── effect-worker.ts     # Async task engine
│   ├── plugins/                 # Deployment plugins
│   │   ├── aws/
│   │   │   └── index.ts
│   │   ├── gcp/
│   │   ├── azure/
│   │   └── custom/              # Template for custom providers
│   ├── control-panel/           # Admin UI (Next.js)
│   ├── playground/              # Interactive API tester
│   ├── codegen/                 # Analyzer + SDK generator
│   │   ├── analyzer.ts
│   │   ├── generator.ts
│   │   └── schema-utils.ts
│   └── common/                  # Shared utilities, types
├── examples/
│   └── hello-world/
│       └── src/
├── packages/
│   ├── @gati-framework/core/    # Main framework package
│   ├── @gati/aws/               # AWS plugin (published to npm)
│   ├── @gati/sdk/               # Generated SDK client core
│   └── ...
├── tests/
│   └── e2e/
├── docs/
│   ├── getting-started.md
│   ├── architecture.md
│   └── plugins.md
├── CONTRIBUTING.md
├── LICENSE
├── Gati_PRD.md
└── README.md
