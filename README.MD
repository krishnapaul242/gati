<div align="center"><div align="center">



# ⚡ Gati# ⚡ Gati



### _Motion in Code_### _Motion in Code_



**The next-generation TypeScript framework for building cloud-native, versioned APIs****The next-generation TypeScript framework for building cloud-native, versioned APIs**



[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/krishnapaul242/gati)[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/krishnapaul242/gati)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)## ✨ Core Features

[Documentation](https://krishnapaul242.github.io/gati/) • [Quick Start](#-quick-start) • [Examples](#-examples) • [Roadmap](#️-roadmap)

[![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

</div>

- 🧠 **Business-logic only** — Framework handles infra, routing, scaling, SSL.

---

Gati is a production-ready TypeScript/Node.js framework that **eliminates infrastructure complexity**. Write only business logic—Gati handles routing, scaling, deployment, and cloud infrastructure automatically.- 📦 **Cloud-pluggable** — AWS, GCP, Azure, or custom providers.

## 🎯 What is Gati?

- 🧬 **Versioned APIs with timestamp routing** — "I want the API as it was last Friday."

Gati eliminates infrastructure complexity so you can **focus on business logic**. Write handlers, deploy to Kubernetes, and let the framework handle routing, scaling, versioning, and cloud infrastructure automatically.

## ✨ Features- 🛠️ **Typed SDK for frontend/microservices** — Auto generated with `gati generate`.

```typescript

// That's it—just write your handler- 📊 **Live Control Panel** — Monitor apps, change config, inspect logs visually.

export const handler: Handler = async (req, res, gctx, lctx) => {

  const user = await gctx.modules.db.users.findById(req.params.id);- 🧠 **Business-logic only** — Framework handles infra, routing, scaling, SSL- ⚙️ **Modular architecture** — Handlers, modules, and effects.

  res.json({ user });

};- 📦 **Cloud-pluggable** — AWS, GCP, Azure, or custom providers- ☁️ **Multi-region deployment ready** — Auto CDN + failover support.

// ✅ Automatically available at /api/users/:id

// ✅ Auto-scales with Kubernetes- 🛠️ **Type-safe** — Full TypeScript support

// ✅ Type-safe with full IntelliSense

```- ⚙️ **Modular architecture** — Handlers, modules, and middleware## 🪜 Get Started



<br/>- ☁️ **Kubernetes-native** — Deploy anywhere



## ✨ Why Gati?- 🔥 **Hot reload** — Fast development cycle```bash



<table># Create a new Gati application

<tr>

<td width="33%">### Coming Soonnpx gatic create my-app



### 🧠 Business Logic Only

Write handlers, not infrastructure. Gati handles routing, scaling, SSL, and deployment automatically.

- 🧬 **Versioned APIs** (M3) — Timestamp-based routing# Navigate to your project

</td>

<td width="33%">- 🛠️ **SDK Generation** (M5) — Auto-generated typed clientscd my-app



### 📦 Cloud Agnostic- 📊 **Control Panel** (M4) — Live monitoring dashboard

Deploy to AWS, GCP, Azure, or any Kubernetes cluster. Switch providers without code changes.

- ☁️ **CDN + SSL** (M6) — Global distribution# Start development server with hot reload

</td>

<td width="33%">pnpm dev



### 🔒 Type-Safe## 🚀 Quick Start

Full TypeScript support with strict typing for handlers, context, modules, and generated SDKs.

# Deploy to local Kubernetes

</td>

</tr>```bashgati deploy dev --local

<tr>

<td width="33%"># Create a new Gati application



### ⚡ Fast Developmentnpx gatic create my-app# Build for production

Hot reload, auto-discovery, and instant feedback. Build APIs in minutes, not days.

pnpm build

</td>

<td width="33%"># Navigate to your project```



### 🧬 API Versioningcd my-app

*(Coming M3)* Timestamp-based routing keeps APIs backward-compatible forever.

**What is GatiC?**

</td>

<td width="33%"># Start development server with hot reload



### 🛠️ Auto SDK Generationpnpm dev`gatic` is the official Gati Command - a thin wrapper around `@gati-framework/cli` that provides the `npx gatic` command for project scaffolding. Once your project is created, you'll use the `gati` command (installed locally in your project) for development, deployment, and other operations.`

*(Coming M5)* Generate typed clients for frontend and microservices automatically.



</td>

</tr># Deploy to local Kubernetes## 📚 Documentation

</table>

gati deploy dev --local

<br/>

```� **Full documentation is available at [docs/](./docs/)**

## 🚀 Quick Start



```bash

# Create a new Gati project**That's it!** Your API is running at `http://localhost:3000`**Quick Links:**

npx gatic create my-app

- [Getting Started](./docs/getting-started.md) - Create your first Gati app

# Navigate to your project

cd my-app## 📚 Documentation- [Handler Guide](./docs/handlers.md) - Write API handlers



# Start development server- [Module Guide](./docs/modules.md) - Create reusable modules

pnpm dev

```**Full documentation:** [docs/](./docs/)- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Deploy to Kubernetes



Your API is now running at `http://localhost:3000` 🎉- [Architecture](./docs/architecture.md) - Understand Gati's design



**Try it:**### Getting Started

```bash

curl http://localhost:3000/api/hello**Package Versions:**

# {"message": "Hello from Gati!"}

```- **[What is Gati?](./docs/onboarding/what-is-gati.md)** - Introduction- `@gati-framework/core` - v0.4.1 (Types and base configuration)



<br/>- **[Quick Start](./docs/onboarding/quick-start.md)** - 5-minute guide- `@gati-framework/runtime` - v2.0.0 (Runtime execution engine)



## 📖 Examples- **[Getting Started](./docs/onboarding/getting-started.md)** - Complete tutorial- `@gati-framework/cli` - v1.0.0 (Development and deployment tools)



### Hello World Handler- **[GatiC CLI](./docs/onboarding/gatic.md)** - Scaffolding tool- `gatic` - v0.1.0 (Project scaffolding command)



```typescript

// src/handlers/hello.ts

import type { Handler } from '@gati-framework/runtime';### Guides## 🧱 Project Structure (Monorepo)



export const handler: Handler = (req, res) => {

  const name = req.query.name || 'World';

  res.json({ message: `Hello, ${name}!` });- **[Handlers](./docs/guides/handlers.md)** - Write API handlers```plaintext

};

// Automatically available at /api/hello- **[Modules](./docs/guides/modules.md)** - Reusable modules/gati

```

- **[Middleware](./docs/guides/middleware.md)** - Custom middleware├── /src

### Using Global Context (Modules)

- **[Deployment](./docs/guides/deployment.md)** - Deploy to production│   ├── cli/               # Source of CLI commands (build, deploy, generate)

```typescript

// src/handlers/users/[id].ts- **[Kubernetes](./docs/guides/kubernetes.md)** - K8s deployment│   ├── runtime/           # Core runtime: app core, handler engine, context manager

import type { Handler } from '@gati-framework/runtime';

│   ├── plugins/           # Cloud provider plugins (AWS, GCP, Azure)

export const handler: Handler = async (req, res, gctx) => {

  const userId = req.params.id;### API Reference│   ├── codegen/           # Analyzer and SDK generator

  

  // Access database module from global context│   ├── control-panel/     # Admin UI (Next.js + TRPC)

  const user = await gctx.modules.db.users.findById(userId);

  - **[Handler API](./docs/api-reference/handler.md)**│   └── playground/        # API testing interface

  if (!user) {

    return res.status(404).json({ error: 'User not found' });- **[Request API](./docs/api-reference/request.md)**├── examples/              # Example apps using Gati

  }

  - **[Response API](./docs/api-reference/response.md)**├── docs/                  # Developer and contributor documentation

  res.json({ user });

};- **[Context API](./docs/api-reference/context.md)**├── packages/              # Published packages (core, adapters, clients)

// Automatically available at /api/users/:id

```├── tests/                 # End-to-end and integration tests



### Creating a Module### More├── Gati_PRD.md            # Project Requirements Document



```typescript├── CONTRIBUTING.md        # Contribution guidelines

// src/modules/database.ts

import type { Module } from '@gati-framework/runtime';- **[Architecture](./docs/architecture/overview.md)** - System design├── LICENSE                # License file (MIT planned)



export const database: Module = {- **[Examples](./docs/examples/)** - Code examples└── README.md              # You're here!

  name: 'db',

  async init(gctx) {- **[Contributing](./docs/contributing/README.md)** - Contribution guide```

    // Initialize database connection

    const client = await connectToDatabase();- **[Changelog](./docs/changelog/README.md)** - Version history

    

    return {## 🚀 Roadmap

      users: {

        findById: (id: string) => client.query('SELECT * FROM users WHERE id = $1', [id]),## 📦 Packages

        create: (data: any) => client.query('INSERT INTO users ...', [data]),

      },| Milestone                               | Status        | Target |

    };

  },| Package | Version | Description || --------------------------------------- | ------------- | ------ |

};

```|---------|---------|-------------|| M1 — Basic handler runtime + CLI        | ✅ Complete   | Q1     |



**🎓 Learn more:** [Full documentation →](https://krishnapaul242.github.io/gati/)| [`@gati-framework/core`](./packages/core) | 0.4.1 | Core types and configuration || M2 — Kubernetes deployment + AWS plugin | 🚧 In Progress| Q2     |



<br/>| [`@gati-framework/runtime`](./packages/runtime) | 2.0.0 | Runtime execution engine || M3 — Versioned routing engine           | ⏳ Pending    | Q2     |



## 📦 Packages| [`@gati-framework/cli`](./packages/cli) | 1.0.0 | CLI tools || M4 — Control Panel (read-only)          | ⏳ Pending    | Q3     |



| Package | Version | Description || [`gatic`](./packages/gatic) | 0.1.0 | Project scaffolding || M5 — Codegen + SDK ship                 | ⏳ Pending    | Q3     |

|---------|---------|-------------|

| [`@gati-framework/runtime`](./packages/runtime) | ![npm](https://img.shields.io/npm/v/@gati-framework/runtime?color=blue) | Core runtime execution engine || M6 — CDN + SSL Support                  | ⏳ Pending    | Q4     |

| [`@gati-framework/cli`](./packages/cli) | ![npm](https://img.shields.io/npm/v/@gati-framework/cli?color=blue) | Development and deployment CLI |

| [`@gati-framework/core`](./packages/core) | ![npm](https://img.shields.io/npm/v/@gati-framework/core?color=blue) | Type definitions and core utilities |## 🏗️ Example| M7 — API Playground                     | ⏳ Pending    | Q4     |

| [`gatic`](./packages/gatic) | ![npm](https://img.shields.io/npm/v/gatic?color=blue) | Project scaffolding tool |



<br/>

```typescriptSee more in the [Product Roadmap](./Gati_PRD.md#7--technical-milestones).

## 🗺️ Roadmap

// src/handlers/users.ts

| Milestone | Status | Target | Description |

|-----------|--------|--------|-------------|import type { Handler } from '@gati-framework/runtime';## CLI deployment flags

| **M1** — Foundation & Core Runtime | ✅ Complete | Q4 2025 | Handler engine, CLI, Kubernetes deployment |

| **M2** — Cloud Infrastructure | 🚧 In Progress | Q1 2026 | AWS/GCP/Azure plugins, auto-scaling |

| **M3** — API Versioning | ⏳ Planned | Q1 2026 | Timestamp-based routing for backward compatibility |

| **M4** — Control Panel | ⏳ Planned | Q2 2026 | Live monitoring and configuration dashboard |export const handler: Handler = async (req, res) => {The CLI supports an enhanced local Kubernetes deployment flow with health checks, port-forward, configurable rollout timeout, and image auto-tagging.

| **M5** — SDK Generation | ⏳ Planned | Q2 2026 | Auto-generate typed clients for any platform |

| **M6** — CDN & SSL | ⏳ Planned | Q3 2026 | Global CDN, automatic SSL, multi-region support |  const userId = req.params.id;



**📋 Detailed roadmap:** [MILESTONES.md](./docs/architecture/milestones.md)  Quick examples:



<br/>  // Your business logic here



## 🎯 Core Concepts  const user = await database.users.findById(userId);- Dry run manifest generation:



### Handlers    - `gati deploy dev --dry-run`

Functions that process HTTP requests with the signature `handler(req, res, gctx, lctx)`.

  res.json({ user });- Local deploy with health probe and auto-tag:

### Modules

Reusable business logic loaded with dependency injection into the global context.};  - `gati deploy dev --local --auto-tag --health-check-path /health --timeout 240`



### Context```- Keep port-forward open after deploy:

- **Global Context (gctx)**: Shared resources like database connections and configuration

- **Local Context (lctx)**: Request-scoped data like request ID and logger  - `gati deploy dev --local --port-forward`



### Auto-DiscoveryAutomatically available at `/api/users/:id` 🎉

Place handlers in `src/handlers/` and they're automatically routed:

- `handlers/users.ts` → `/api/users`Flags overview (see the CLI README for full details):

- `handlers/users/[id].ts` → `/api/users/:id`

- `handlers/posts/[id]/comments.ts` → `/api/posts/:id/comments`## 🗺️ Roadmap



<br/>- `--local` — use a kind cluster locally



## 🛠️ Development| Milestone | Status | Target |- `--cluster-name <name>` — override kind cluster (default: gati-local)



```bash|-----------|--------|--------|- `--skip-cluster` — skip cluster creation

# Install dependencies

pnpm install| M1 — Foundation & Core Runtime | ✅ Complete | Q4 2025 |- `--health-check-path <path>` — run HTTP GET after rollout (e.g., /health)



# Run all tests| M2 — Cloud Infrastructure | 🚧 In Progress | Q1 2026 |- `--timeout <seconds>` — rollout timeout (default 120)

pnpm test

| M3 — API Versioning | ⏳ Planned | Q1 2026 |- `--port-forward` — keep a persistent kubectl port-forward session

# Build all packages

pnpm build| M4 — Control Panel | ⏳ Planned | Q2 2026 |- `--auto-tag` — tag image with YYYYMMDD-HHMMSS-`gitsha`



# Run development server| M5 — SDK Generation | ⏳ Planned | Q2 2026 |

pnpm dev

| M6 — CDN & SSL | ⏳ Planned | Q3 2026 |More at `packages/cli/README.md`.

# Deploy to local Kubernetes

gati deploy dev --local

```

See [complete roadmap](./docs/architecture/roadmap.md)## 📬 Community & Contributions

<br/>



## 📚 Documentation

## 🤝 ContributingContributions are welcome as issues, ideas, or PRs:

- **📖 [Full Documentation](https://krishnapaul242.github.io/gati/)** - Complete guides and API reference

- **🚀 [Quick Start Guide](./docs/onboarding/quick-start.md)** - Get started in 5 minutes

- **📘 [Handlers Guide](./docs/guides/handlers.md)** - Write API handlers

- **🔧 [Modules Guide](./docs/guides/modules.md)** - Create reusable modulesWe welcome contributions! See our [Contributing Guide](./docs/contributing/README.md).- 🐞 Found a bug? Open an issue!

- **☁️ [Deployment Guide](./docs/guides/deployment.md)** - Deploy to production

- **🏗️ [Architecture](./docs/architecture/overview.md)** - Understand Gati's design- 💡 Got a feature idea? Drop it in Discussions!

- **🤝 [Contributing](./docs/contributing/README.md)** - Join the development

- 🐞 **Found a bug?** [Open an issue](https://github.com/krishnapaul242/gati/issues)- 📘 Want to code? See `CONTRIBUTING.md` (coming soon)

<br/>

- 💡 **Have an idea?** [Start a discussion](https://github.com/krishnapaul242/gati/discussions)

## 🤝 Contributing

- 📝 **Improve docs?** Submit a PR```diff

We welcome contributions! Whether you're fixing bugs, improving docs, or proposing new features:

+ This project is just getting started — jump in and help shape the future of scalable backend apps!

- 🐞 **Found a bug?** [Open an issue](https://github.com/krishnapaul242/gati/issues/new)

- 💡 **Have an idea?** [Start a discussion](https://github.com/krishnapaul242/gati/discussions/new)## 📄 License```

- 📝 **Improve docs?** Submit a pull request

- 🚀 **Add a feature?** Check the [contributing guide](./docs/contributing/README.md)



<br/>MIT License © 2025 Krishna Paul## 🪪 License



## 📄 License



MIT License © 2025 [Krishna Paul](https://github.com/krishnapaul242)See [LICENSE](./LICENSE) for details.MIT License © 202X [Your Name]



See [LICENSE](./LICENSE) for details.



<br/>## 🙏 Acknowledgments---



---



<div align="center">Built with inspiration from Express.js, NestJS, and modern cloud-native architectures.💬 Join the journey: “Gati is not just fast—it’s forward.”



**"Gati is not just fast—it's forward."** ⚡



[⭐ Star us on GitHub](https://github.com/krishnapaul242/gati) • [📖 Read the Docs](https://krishnapaul242.github.io/gati/) • [💬 Join Discussions](https://github.com/krishnapaul242/gati/discussions)---````



Made with ❤️ by developers, for developers



</div>**"Gati is not just fast—it's forward."** ⚡---




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
