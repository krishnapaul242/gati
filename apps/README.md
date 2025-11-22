# Gati Applications

This directory contains production applications built with the Gati framework.

## Directory Structure

```
apps/
├── gati-registry/          # Official Gati Registry
└── [future apps]/          # Other production applications
```

## Purpose

The `apps/` directory is for **production-ready applications** built with Gati, as opposed to:

- **`packages/`** - Framework libraries and tools
- **`examples/`** - Educational examples and demos
- **`docs/`** - Documentation

## Applications

### Gati Registry

The official artifact registry for the Gati ecosystem. Serves as:
- Production service for distributing modules, plugins, models, agents, and templates
- Reference implementation demonstrating Gati best practices
- Validation of Gati's architecture at production scale
- Living documentation of building complex applications with Gati

See [gati-registry/README.md](./gati-registry/README.md) for details.

## Adding New Applications

To add a new production application:

1. Create a new directory: `apps/your-app-name/`
2. Initialize with Gati: `gati init your-app-name`
3. Add to workspace: Already configured in `pnpm-workspace.yaml`
4. Document in this README

## Development

All applications in this directory:
- Use the Gati framework from `packages/`
- Follow Gati conventions and best practices
- Include comprehensive tests
- Are production-ready or production-bound
- Serve as reference implementations

## Deployment

Each application has its own deployment configuration and documentation.
See individual app directories for deployment instructions.
