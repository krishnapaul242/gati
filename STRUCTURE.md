# Gati Project Structure

This document describes the monorepo structure for the Gati framework.

## Directory Layout

```
gati/
├── .github/              # GitHub configuration (workflows, templates)
│   ├── copilot-instructions.md
│   ├── M1_PRIORITY_REVIEW.md
│   └── workflows/
│
├── docs/                 # Documentation
│   ├── getting-started.md     (Coming in Issue #15)
│   ├── handlers.md            (Coming in Issue #16)
│   ├── modules.md             (Coming in Issue #17)
│   └── architecture.md        (Coming in Issue #18)
│
├── examples/            # Example applications
│   └── hello-world/           (Coming in Issue #14)
│
├── packages/            # Published npm packages
│   ├── @gati/core/            (Future)
│   ├── @gati/aws/             (M2)
│   ├── @gati/sdk/             (M5)
│   └── ...
│
├── src/                 # Main framework source code
│   ├── cli/                   # CLI tools (gati create, dev, build)
│   │   ├── index.ts           (Issue #9, #10, #11)
│   │   ├── commands/
│   │   └── utils/
│   │
│   ├── runtime/               # Core runtime engine
│   │   ├── app-core.ts        (Issue #8)
│   │   ├── handler-engine.ts  (Issue #1)
│   │   ├── route-manager.ts   (Issue #6)
│   │   ├── module-loader.ts   (Issue #5)
│   │   ├── context-manager.ts (Issue #7)
│   │   └── types/
│   │       ├── request.ts     (Issue #1)
│   │       ├── response.ts    (Issue #1)
│   │       ├── context.ts     (Issue #7)
│   │       ├── handler.ts     (Issue #1)
│   │       ├── module.ts      (Issue #5)
│   │       └── route.ts       (Issue #6)
│   │
│   └── plugins/               # Cloud provider plugins
│       ├── aws/               (M2)
│       ├── gcp/               (Future)
│       └── azure/             (Future)
│
├── tests/               # Test suites
│   ├── unit/                  # Unit tests (isolated functions)
│   ├── integration/           # Integration tests (multiple components)
│   └── e2e/                   # End-to-end tests (full request flow)
│
├── .gitignore           # Git ignore configuration
├── .npmignore           # NPM ignore configuration
├── package.json         # Root package configuration
├── pnpm-workspace.yaml  # PNPM workspace configuration
├── tsconfig.json        # TypeScript configuration (Issue #13)
├── vitest.config.ts     # Vitest test configuration (Future)
├── AGENTIC_DEVELOPMENT.md    # Agentic workflow guide
├── MILESTONES.md        # Project milestones
├── README.MD            # Project overview
└── ROADMAP.MD           # Development roadmap
```

## Purpose of Each Directory

### `/src`

Main framework source code organized by functional area:

- **`/cli`**: Command-line tools for developers (`gati create`, `gati dev`, etc.)
- **`/runtime`**: Core runtime engine (handlers, modules, routing, contexts)
- **`/plugins`**: Cloud provider integrations (AWS, GCP, Azure)

### `/packages`

Published npm packages that will be distributed:

- `@gati/core`: Main framework package
- `@gati/aws`: AWS deployment plugin
- `@gati/gcp`: GCP deployment plugin
- `@gati/sdk`: Generated SDK client utilities

### `/examples`

Example applications demonstrating Gati usage:

- `hello-world`: Basic example with handlers and modules
- (Future): More complex examples for different use cases

### `/tests`

Test suites organized by test type:

- `unit/`: Fast, isolated tests for individual functions
- `integration/`: Tests for multiple components working together
- `e2e/`: Full end-to-end request flow tests

### `/docs`

User and developer documentation:

- Getting started guides
- API references
- Tutorials
- Architecture documentation

### `/.github`

GitHub-specific configuration:

- Workflows (CI/CD)
- Issue templates
- PR templates
- Copilot instructions

## Workspace Configuration

This is a **pnpm monorepo** with workspace support:

- Root `package.json` manages shared dependencies and scripts
- `pnpm-workspace.yaml` defines workspace packages
- Each package in `/packages` has its own `package.json`
- Examples in `/examples` can be run independently

## Development Workflow

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## Issue Tracking

Each file/directory references the GitHub issue where it will be implemented:

- See inline comments for issue numbers
- Check [MILESTONES.md](../MILESTONES.md) for detailed breakdown
- Check [M1_PRIORITY_REVIEW.md](./.github/M1_PRIORITY_REVIEW.md) for priorities

## Next Steps

1. **Issue #13**: Configure TypeScript (tsconfig.json)
2. **Issue #7**: Implement Context Managers
3. **Issue #1**: Implement Handler Execution Pipeline
4. Continue with M1 issues according to priority review

---

**Last Updated:** 2025-11-09  
**Status:** ✅ Monorepo structure complete (Issue #12)
