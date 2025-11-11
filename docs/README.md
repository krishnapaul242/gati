# 📚 Gati Documentation

**Welcome to the official Gati framework documentation!**

Gati is a next-generation TypeScript/Node.js framework for building cloud-native, versioned APIs with automatic scaling, deployment, and SDK generation.

---

## 🚀 Quick Links

### For New Users
- **[What is Gati?](./onboarding/what-is-gati.md)** - Introduction to the framework
- **[Quick Start](./onboarding/quick-start.md)** - Get started in 5 minutes
- **[Getting Started](./onboarding/getting-started.md)** - Comprehensive setup guide
- **[GatiC CLI](./onboarding/gatic.md)** - Project scaffolding tool

### For Developers
- **[Handlers Guide](./guides/handlers.md)** - Build API handlers
- **[Modules Guide](./guides/modules.md)** - Create reusable modules
- **[Middleware Guide](./guides/middleware.md)** - Implement middleware
- **[Context Guide](./guides/context.md)** - Work with global and local context
- **[Error Handling](./guides/error-handling.md)** - Handle errors effectively

### For Deployment
- **[Deployment Guide](./guides/deployment.md)** - Deploy your application
- **[Kubernetes Guide](./guides/kubernetes.md)** - Deploy to Kubernetes
- **[TypeScript Configuration](./guides/typescript-config.md)** - Configure TypeScript

### API Reference
- **[Handler API](./api-reference/handler.md)** - Handler function reference
- **[Request API](./api-reference/request.md)** - Request object API
- **[Response API](./api-reference/response.md)** - Response object API
- **[Context API](./api-reference/context.md)** - Context management API

### Examples
- **[Hello World](./examples/hello-world.md)** - Basic example
- **[Example Projects](../examples/)** - Full example applications

### Architecture & Design
- **[Architecture Overview](./architecture/overview.md)** - System architecture
- **[Design Decisions](./architecture/design-decisions.md)** - Design philosophy
- **[Milestones](./architecture/milestones.md)** - Development roadmap
- **[Roadmap](./architecture/roadmap.md)** - Feature roadmap
- **[MVP Roadmap](./architecture/mvp-roadmap.md)** - MVP planning

### Changelog & Updates
- **[Current State](./changelog/current-state.md)** - Latest status
- **[MVP Completion](./changelog/mvp-completion.md)** - MVP report
- **[Documentation Summary](./changelog/documentation-summary.md)** - Docs changelog
- **[Task Summary](./changelog/task-completion-summary.md)** - Completed tasks

### Contributing
- **[Contributing Guide](./contributing/README.md)** - How to contribute
- **[Agentic Development](./contributing/agentic-development.md)** - AI-assisted development
- **[Release Guide](./contributing/release-guide.md)** - Publishing releases
- **[Codebase Structure](./contributing/codebase-structure.md)** - Code organization

---

## 📦 Package Versions

| Package | Version | Status |
|---------|---------|--------|
| `@gati-framework/core` | 0.4.1 | ✅ Published |
| `@gati-framework/runtime` | 2.0.0 | ✅ Published |
| `@gati-framework/cli` | 1.0.0 | ✅ Published |
| `gatic` | 0.1.0 | ✅ Published |

---

## 🎯 Documentation Structure

```
docs/
├── README.md                    # This file
├── onboarding/                  # Getting started guides
│   ├── what-is-gati.md
│   ├── quick-start.md
│   ├── getting-started.md
│   └── gatic.md
├── guides/                      # Developer guides
│   ├── handlers.md
│   ├── modules.md
│   ├── middleware.md
│   ├── context.md
│   ├── error-handling.md
│   ├── deployment.md
│   ├── kubernetes.md
│   └── typescript-config.md
├── api-reference/               # API documentation
│   ├── handler.md
│   ├── request.md
│   ├── response.md
│   └── context.md
├── examples/                    # Code examples
│   └── hello-world.md
├── architecture/                # Design documents
│   ├── overview.md
│   ├── design-decisions.md
│   ├── milestones.md
│   ├── roadmap.md
│   └── mvp-roadmap.md
├── changelog/                   # Version history
│   ├── current-state.md
│   ├── mvp-completion.md
│   ├── documentation-summary.md
│   └── task-completion-summary.md
└── contributing/                # Contribution guides
    ├── README.md
    ├── agentic-development.md
    ├── release-guide.md
    └── codebase-structure.md
```

---

## 🔍 Finding What You Need

### I want to...

#### **Create my first Gati app**
→ Start with [Quick Start](./onboarding/quick-start.md)

#### **Understand Gati's architecture**
→ Read [What is Gati?](./onboarding/what-is-gati.md) and [Architecture Overview](./architecture/overview.md)

#### **Write API handlers**
→ Follow the [Handlers Guide](./guides/handlers.md)

#### **Deploy to production**
→ Check the [Deployment Guide](./guides/deployment.md)

#### **Contribute to Gati**
→ See [Contributing Guide](./contributing/README.md)

#### **Use the CLI**
→ Reference [GatiC CLI](./onboarding/gatic.md)

#### **Look up API details**
→ Browse [API Reference](./api-reference/)

---

## 💡 Core Concepts

### Handlers
Functions that process HTTP requests with signature `handler(req, res, gctx, lctx)`.

### Modules
Reusable business logic loaded with dependency injection.

### Context
- **Global (gctx)**: Shared resources across requests
- **Local (lctx)**: Request-scoped data

### Versioning
Timestamp-based routing for backward compatibility (coming in M3).

### Cloud-Native
Kubernetes deployment with multi-cloud support.

---

## 🌟 Features

- ✅ **Business-logic only** - Framework handles infrastructure
- ✅ **Cloud-pluggable** - AWS, GCP, Azure support
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Auto-scaling** - Kubernetes-native
- ⏳ **Versioned APIs** - Coming in M3
- ⏳ **SDK Generation** - Coming in M5
- ⏳ **Control Panel** - Coming in M4

---

## 📖 Learning Path

### Beginner
1. [What is Gati?](./onboarding/what-is-gati.md)
2. [Quick Start](./onboarding/quick-start.md)
3. [Hello World Example](./examples/hello-world.md)
4. [Handlers Guide](./guides/handlers.md)

### Intermediate
1. [Getting Started Guide](./onboarding/getting-started.md)
2. [Modules Guide](./guides/modules.md)
3. [Middleware Guide](./guides/middleware.md)
4. [Context Guide](./guides/context.md)
5. [Error Handling](./guides/error-handling.md)

### Advanced
1. [Deployment Guide](./guides/deployment.md)
2. [Kubernetes Guide](./guides/kubernetes.md)
3. [Architecture Overview](./architecture/overview.md)
4. [Design Decisions](./architecture/design-decisions.md)

### Contributor
1. [Contributing Guide](./contributing/README.md)
2. [Codebase Structure](./contributing/codebase-structure.md)
3. [Agentic Development](./contributing/agentic-development.md)
4. [Release Guide](./contributing/release-guide.md)

---

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/krishnapaul242/gati/issues)
- **Discussions**: [GitHub Discussions](https://github.com/krishnapaul242/gati/discussions)
- **Documentation**: You're here! 📍

---

## 🤝 Contributing to Docs

Found an error or want to improve the documentation?

1. Fork the repository
2. Edit the relevant markdown file
3. Submit a pull request

See [Contributing Guide](./contributing/README.md) for details.

---

## � Development

This documentation website is built with [VitePress](https://vitepress.dev/).

```bash
# Install dependencies
cd docs && npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

**Last Updated**: November 12, 2025  
**Maintained By**: Krishna Paul ([@krishnapaul242](https://github.com/krishnapaul242))

---

*"Gati is not just fast—it's forward."* ⚡
