# @gati-framework/cli

Command-line interface for the Gati framework — create, develop, build, and deploy cloud‑native TypeScript services.

## Features

- Project scaffolding: `gati create`
- Local development with file watching: `gati dev`
- Type-safe production builds: `gati build`
- Kubernetes-ready deployment manifests: `gati deploy`
- ESM-first, Windows/macOS/Linux friendly

## Install

Global:

```bash
npm i -g @gati-framework/cli
# or
pnpm add -g @gati-framework/cli
```

Per-project (recommended for CI):

```bash
pnpm add -D @gati-framework/cli
```

Invoke with npx/pnpm:

```bash
npx gati --help
# or
pnpm exec gati --help
```

## Usage

### Create a new project

```bash
gati create my-app
```

This scaffolds a minimal TypeScript project with:
- `@gati-framework/core` types
- `tsconfig` preconfigured
- Example handler(s)

### Develop (hot reload)

```bash
gati dev
```

- Loads environment variables
- Watches your project and restarts on changes

### Build for production

```bash
gati build
```

- Validates project structure
- Compiles TypeScript (`tsc`) to `dist/`
- Prints a concise build summary

### Deploy (generate manifests)

```bash
gati deploy dev --dry-run
```

- Generates:
  - Dockerfile (multi-stage, non-root user)
  - Kubernetes Deployment and Service YAML
  - Optional Helm scaffolding (templates included)
- `--dry-run` prints manifests without applying

Options:

- `-e, --env <environment>`: dev | staging | prod
- `--dry-run`: preview only
- `--skip-build`: skip Docker build step (future)
- `-p, --provider <provider>`: kubernetes | aws | gcp | azure (kubernetes default; cloud providers are WIP)

## Example

```bash
# Inside your app
pnpm exec gati deploy dev --dry-run
```

Sample output (truncated):

```text
✔ Loaded config for: my-app
📦 Deploying to: dev
🔍 DRY RUN MODE - No actual deployment will occur
✔ Manifests generated successfully
--- Dockerfile ---
FROM node:20-alpine AS builder
...
--- Deployment ---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
...
```

## Requirements

- Node.js >= 18
- pnpm >= 8 (recommended)
- Windows, macOS, Linux supported

## Notes

- CLI is ESM. Local imports in compiled output use explicit `.js` extensions.
- Deployment templates are bundled into the package automatically.
- Cloud provider integration (AWS/GCP/Azure) will arrive in later milestones.

## Contributing

Issues and PRs are welcome at:
https://github.com/krishnapaul242/gati

## License

MIT © Krishna Paul
