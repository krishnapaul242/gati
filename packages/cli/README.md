# @gati-framework/cli

Command-line interface for the Gati framework — create, develop, build, and deploy cloud‑native TypeScript services.

## Features (v0.3.0)

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

### Deploy (generate manifests & local cluster)

```bash
gati deploy dev --dry-run
```

- Generates:
  - Dockerfile (multi-stage, non-root user)
  - Kubernetes Deployment and Service YAML
  - Optional Helm scaffolding (templates included)
- `--dry-run` prints manifests without applying

Options (new additions in 0.3.0 highlighted):

- `-e, --env <environment>`: dev | staging | prod
- `--dry-run`: preview only
- `--skip-build`: skip Docker build step (future)
 - `-p, --provider <provider>`: kubernetes | aws | gcp | azure (kubernetes default; cloud providers are WIP)
 - `--local` (0.3.0): force local kind cluster deployment flow
 - `--cluster-name <name>` (0.3.0): override kind cluster name (default: `gati-local`)
 - `--skip-cluster` (0.3.0): assume cluster already exists, skip creation
 - `--health-check-path <path>` (0.3.0): run an HTTP GET probe after rollout (e.g. `/health`)
 - `--timeout <seconds>` (0.3.0): rollout timeout (default 120)
 - `--port-forward` (0.3.0): start a persistent `kubectl port-forward` session (Ctrl+C to stop)
 - `--auto-tag` (0.3.0): tag image with `YYYYMMDD-HHMMSS-<gitsha>` for reproducible builds
- `-v, --verbose`: print helpful follow‑up commands

## Example

```bash
# Inside your app
pnpm exec gati deploy dev --dry-run
```

Sample (dry-run) output (truncated):

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

### Local cluster deployment with health probe & auto-tag

```bash
gati deploy dev --local --auto-tag --health-check-path /health --port-forward --timeout 240
```

Behaviors:

- Builds Docker image (auto-tagged) and loads it into kind
- Applies Deployment + Service manifests to namespace
- Waits for rollout (up to timeout seconds)
- Ephemeral port-forward for health probe (returns status) then optional persistent port-forward if `--port-forward` specified
- Prints endpoint and teardown hints when `-v/--verbose` is used

If the health check fails, deployment still completes; you can inspect logs with:

```bash
kubectl logs deployment/my-app -n <namespace>
```

### Image Auto-Tag Format

`<appName>:YYYYMMDD-HHMMSS-<gitSha>` (git SHA omitted if unavailable). Example: `my-app:20251109-143205-a1b2c3`.

### Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Missing tools error | docker/kubectl/kind not installed | Install from linked URLs in error message |
| Rollout timeout | Pods not ready within `--timeout` | Check `kubectl describe pod` and events |
| Health check failed | Endpoint not ready or wrong path | Verify handler route & service port mapping |
| Port-forward exits immediately | Process received signal / port conflict | Try a different local port or check for duplicates |


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
