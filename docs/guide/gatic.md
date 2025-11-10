# GatiC - Gati Command

**GatiC** (Gati Command) is the official project scaffolding tool for creating new Gati applications. It's a thin wrapper around `@gati-framework/cli` that provides a simple, consistent command for initializing projects.

## What is GatiC?

GatiC is designed to be used via `npx` without requiring global installation:

```bash
npx gatic create my-app
```

### Key Features

- ✅ **Zero Configuration** - Works out of the box with sensible defaults
- ✅ **No Global Install** - Run via `npx` for always up-to-date scaffolding
- ✅ **Interactive Prompts** - Guides you through project setup
- ✅ **Multiple Templates** - Choose between Default and Minimal templates
- ✅ **Production Ready** - Generated projects include Kubernetes manifests, Docker files, and health checks

## Installation

No installation required! Simply use `npx`:

```bash
npx gatic create my-app
```

This command:
1. Downloads the latest version of `gatic`
2. Creates your project structure
3. Installs dependencies automatically
4. Sets up everything you need to start developing

## Usage

### Basic Usage

```bash
npx gatic create <project-name>
```

The command will prompt you for:

- **Project description** - A brief description of your application
- **Author** - Your name or organization
- **Template** - Choose between:
  - **Default** - Includes example handlers, Docker support, and Kubernetes manifests
  - **Minimal** - Bare-bones setup with just the essentials

### Command Options

```bash
npx gatic create <project-name> [options]
```

**Options:**

- `-t, --template <template>` - Specify template (default or minimal)
- `--skip-prompts` - Skip interactive prompts and use defaults
- `--skip-install` - Skip automatic dependency installation

### Examples

**Create with default template:**
```bash
npx gatic create my-api
```

**Create minimal project:**
```bash
npx gatic create my-api --template minimal
```

**Create without interactive prompts:**
```bash
npx gatic create my-api --skip-prompts
```

**Create without installing dependencies:**
```bash
npx gatic create my-api --skip-install
cd my-api
pnpm install
```

## Generated Project Structure

### Default Template

The default template generates a production-ready project:

```
my-app/
├── src/
│   ├── index.ts              # Application entry point
│   ├── handlers/
│   │   ├── hello.ts          # Example handler
│   │   └── health.ts         # Health check endpoint
│   └── modules/              # Reusable modules directory
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── deploy/
│   └── kubernetes/           # Kubernetes manifests
│       ├── deployment.yaml
│       └── service.yaml
├── gati.config.ts            # Gati configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
├── Dockerfile                # Production Docker image
├── docker-compose.yml        # Local development with Docker
├── .env.example              # Environment variables template
├── .gitignore
├── .dockerignore
└── README.md                 # Project documentation
```

**Included Features:**

- ✅ Express.js-based HTTP server
- ✅ Handler auto-discovery
- ✅ Health check endpoint (`/health`)
- ✅ Docker containerization
- ✅ Kubernetes deployment manifests
- ✅ Development server with hot reload
- ✅ Production build configuration
- ✅ TypeScript setup
- ✅ Testing directories
- ✅ Comprehensive README

### Minimal Template

The minimal template provides just the essentials:

```
my-app/
├── src/
│   ├── index.ts              # Application entry point
│   └── handlers/
│       └── health.ts         # Health check endpoint
├── gati.config.ts            # Gati configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
├── Dockerfile                # Basic Docker image
├── .env.example              # Environment variables
├── .gitignore
└── README.md                 # Getting started guide
```

**Ideal For:**

- Proof of concepts
- Learning Gati
- Starting from scratch
- Minimal footprint

## After Creating Your Project

Once your project is created, you'll use the **`gati`** command (not `gatic`):

### Development

```bash
cd my-app
pnpm dev          # Start development server with hot reload
```

### Building

```bash
pnpm build        # Build for production
pnpm start        # Start production server
```

### Deployment

```bash
gati deploy dev --local              # Deploy to local Kubernetes
gati deploy dev --local --port-forward  # With port forwarding
```

### Testing

```bash
pnpm test         # Run tests
pnpm typecheck    # Type checking
```

## GatiC vs Gati Command

Understanding the difference:

### `gatic` (GatiC)

- **Purpose:** Project scaffolding
- **Usage:** `npx gatic create <name>`
- **When:** Creating new projects
- **Installed:** No (use via npx)
- **Package:** `gatic@0.1.0`

### `gati` (Gati CLI)

- **Purpose:** Development and deployment
- **Usage:** `gati dev`, `gati build`, `gati deploy`
- **When:** Working within a project
- **Installed:** Yes (in project dependencies)
- **Package:** `@gati-framework/cli@1.0.0`

**Workflow:**

```bash
# 1. Create project with GatiC
npx gatic create my-app
cd my-app

# 2. Use Gati CLI for development
pnpm dev              # Uses locally installed 'gati'
gati deploy dev       # Uses locally installed 'gati'
```

## Package Information

**GatiC Package:**
- **Name:** `gatic`
- **Version:** `0.1.0`
- **Repository:** [github.com/krishnapaul242/gati](https://github.com/krishnapaul242/gati)
- **License:** MIT

**Dependencies:**
- `@gati-framework/cli` - The actual CLI implementation
- Wrapper script that delegates to the CLI's create command

## Version Management

GatiC always uses the latest published version of `@gati-framework/cli` when run via `npx`. This ensures you always get:

- Latest bug fixes
- Newest features
- Updated templates
- Security patches

No need to worry about upgrading - `npx` handles it automatically!

## Troubleshooting

### Command Not Found

**Error:** `gatic: command not found`

**Solution:** You don't need to install `gatic` globally. Use `npx`:

```bash
npx gatic create my-app
```

### Permission Denied

**Error:** `EACCES: permission denied`

**Solution:** Check directory permissions or run from a directory where you have write access:

```bash
cd ~/projects
npx gatic create my-app
```

### Directory Already Exists

**Error:** `Directory "my-app" already exists`

**Solution:** Choose a different name or remove the existing directory:

```bash
npx gatic create my-app-v2
# or
rm -rf my-app
npx gatic create my-app
```

### Installation Fails

**Error:** Dependency installation fails during project creation

**Solution:** Skip auto-install and install manually:

```bash
npx gatic create my-app --skip-install
cd my-app
pnpm install
```

### Node Version Too Old

**Error:** `This package requires Node.js >= 18.0.0`

**Solution:** Upgrade Node.js:

```bash
# Check current version
node --version

# Upgrade using nvm (recommended)
nvm install 18
nvm use 18

# Or download from nodejs.org
```

## Advanced Usage

### Custom Registry

If you're using a private npm registry:

```bash
npm config set registry https://your-registry.com
npx gatic create my-app
```

### Offline Usage

Download `gatic` once, then use locally:

```bash
# Download once
npm pack gatic

# Use offline
npx gatic-0.1.0.tgz create my-app
```

### CI/CD Integration

Use `gatic` in automated workflows:

```yaml
# .github/workflows/scaffold.yml
name: Create New Service
on:
  workflow_dispatch:
    inputs:
      service_name:
        description: 'Service name'
        required: true

jobs:
  scaffold:
    runs-on: ubuntu-latest
    steps:
      - name: Create Gati project
        run: |
          npx gatic create ${{ github.event.inputs.service_name }} \
            --skip-prompts \
            --template default
      
      - name: Commit and push
        run: |
          git add .
          git commit -m "scaffold: create ${{ github.event.inputs.service_name }}"
          git push
```

## Examples

### Create a Microservice

```bash
npx gatic create user-service
cd user-service
pnpm dev
```

### Create Multiple Services

```bash
for service in auth users posts comments; do
  npx gatic create ${service}-service --skip-prompts
done
```

### Create for Team

```bash
npx gatic create team-api --skip-prompts
cd team-api

# Customize for team
echo "TEAM_NAME=Engineering" >> .env
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourteam/team-api.git
git push -u origin main
```

## Next Steps

After creating your project with GatiC:

1. **[Getting Started](./getting-started.md)** - Learn the basics
2. **[Handler Development](./handlers.md)** - Write API endpoints
3. **[Deployment Guide](./kubernetes.md)** - Deploy to production
4. **[Module System](./modules.md)** - Create reusable components

## Related Documentation

- [Getting Started](./getting-started.md)
- [Quick Start](./quick-start.md)
- [What is Gati](./what-is-gati.md)
- [CLI Reference](../cli-reference.md)

---

**Questions?** Open an issue on [GitHub](https://github.com/krishnapaul242/gati/issues)
