# 🌐 Gati

> ⚡ Motion in Code — The next-gen framework for scalable, versioned, cloud-native Node.js applications.

Gati is an upcoming open-source JavaScript/TypeScript framework focused on **developer productivity** and **production-ready cloud infrastructure**. It removes all the boilerplate required for deploying performant and modular applications while keeping your APIs **backward-compatible forever**.

## ✨ Core Features

- 🧠 **Business-logic only** — Framework handles infra, routing, scaling, SSL.
- 📦 **Cloud-pluggable** — AWS, GCP, Azure, or custom providers.
- 🧬 **Versioned APIs with timestamp routing** — "I want the API as it was last Friday."
- 🛠️ **Typed SDK for frontend/microservices** — Auto generated with `gati generate`.
- 📊 **Live Control Panel** — Monitor apps, change config, inspect logs visually.
- ⚙️ **Modular architecture** — Handlers, modules, and effects.
- ☁️ **Multi-region deployment ready** — Auto CDN + failover support.

## 🪜 Get Started (Coming Soon)

```bash
npx gati create my-app
cd my-app
gati dev
# Make changes ...
gati generate
gati deploy prod
````

## 📚 Documentation

🚧 Docs are in progress. Stay tuned! Meanwhile, see the high-level [PRD](./Gati_PRD.md) for architecture and goals.

## 🧱 Project Structure (Monorepo)

```plaintext
/gati
├── /src
│   ├── cli/               # Source of CLI commands (build, deploy, generate)
│   ├── runtime/           # Core runtime: app core, handler engine, context manager
│   ├── plugins/           # Cloud provider plugins (AWS, GCP, Azure)
│   ├── codegen/           # Analyzer and SDK generator
│   ├── control-panel/     # Admin UI (Next.js + TRPC)
│   └── playground/        # API testing interface
├── examples/              # Example apps using Gati
├── docs/                  # Developer and contributor documentation
├── packages/              # Published packages (core, adapters, clients)
├── tests/                 # End-to-end and integration tests
├── Gati_PRD.md            # Project Requirements Document
├── CONTRIBUTING.md        # Contribution guidelines
├── LICENSE                # License file (MIT planned)
└── README.md              # You're here!
```

## 🚀 Roadmap

| Milestone                               | Status     | Target |
| --------------------------------------- | ---------- | ------ |
| M1 — Basic handler runtime + CLI        | 🚧 Started | Q1     |
| M2 — Kubernetes deployment + AWS plugin | ⏳ Pending  | Q2     |
| M3 — Versioned routing engine           | ⏳ Pending  | Q2     |
| M4 — Control Panel (read-only)          | ⏳ Pending  | Q3     |
| M5 — Codegen + SDK ship                 | ⏳ Pending  | Q3     |
| M6 — CDN + SSL Support                  | ⏳ Pending  | Q4     |
| M7 — API Playground                     | ⏳ Pending  | Q4     |

See more in the [Product Roadmap](./Gati_PRD.md#7--technical-milestones).

## 📬 Community & Contributions

Contributions are welcome as issues, ideas, or PRs:

* 🐞 Found a bug? Open an issue!
* 💡 Got a feature idea? Drop it in Discussions!
* 📘 Want to code? See `CONTRIBUTING.md` (coming soon)

```diff
+ This project is just getting started — jump in and help shape the future of scalable backend apps!
```

## 🪪 License

MIT License © 202X [Your Name]

---

💬 Join the journey: “Gati is not just fast—it’s forward.”

````

---

## 📁 Suggested Project Folder Structure

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
