# Quick Start Guide

Get your first Gati application running in under 5 minutes!

## Prerequisites

- **Node.js** 20 or higher
- **pnpm** (recommended) or npm
- **Docker** (for local Kubernetes deployment)

```bash
# Check your versions
node --version  # Should be v20.0.0 or higher
pnpm --version  # Should be 8.0.0 or higher
```

## Step 1: Create Your Project

Use `gatic` to create a new Gati application:

```bash
npx gatic create my-first-app
```

You'll see:

```plaintext
🚀 Creating Gati project: my-first-app

✓ Copying template files...
✓ Initializing package.json...
✓ Installing dependencies...

✨ Project created successfully!

Next steps:
  cd my-first-app
  pnpm dev
```

This creates a complete project structure:

```plaintext
my-first-app/
├── src/
│   ├── index.ts              # App entry point
│   ├── handlers/
│   │   └── hello.ts          # Example handler
│   └── modules/              # Reusable modules
├── gati.config.ts            # Gati configuration
├── package.json
├── tsconfig.json
└── README.md
```

## Step 2: Start Development Server

```bash
cd my-first-app
pnpm dev
```

Output:

```plaintext
🚀 Gati development server starting...
✓ Loaded 1 handler
✓ Server running at http://localhost:3000
✓ Hot reload enabled

Press Ctrl+C to stop
```

## Step 3: Test Your First Handler

Open your browser or use `curl`:

```bash
curl http://localhost:3000/api/hello
```

Response:

```json
{
  "message": "Hello from Gati!",
  "timestamp": "2025-11-12T10:30:00.000Z"
}
```

## Step 4: Create a New Handler

Create `src/handlers/users/[id].ts`:

```typescript
import type { Handler } from '@gati-framework/runtime';

// HTTP method (optional, defaults to GET)
export const METHOD = 'GET';

// Handler function
export const handler: Handler = (req, res) => {
  const userId = req.params.id;
  
  // Example: fetch user from database
  const user = {
    id: userId,
    name: 'John Doe',
    email: 'john@example.com'
  };
  
  res.json({ user });
};
```

The handler is automatically discovered and available at `/api/users/:id` with hot reloading enabled.

Test it:

```bash
curl http://localhost:3000/api/users/123
```

Response:

```json
{
  "user": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Step 5: Add Query Parameters

Update `src/handlers/users/[id].ts`:

```typescript
export const METHOD = 'GET';

export const handler: Handler = (req, res) => {
  const userId = req.params.id;
  const includeOrders = req.query.includeOrders === 'true';
  
  const user = {
    id: userId,
    name: 'John Doe',
    email: 'john@example.com',
    ...(includeOrders && {
      orders: [
        { id: 1, total: 99.99 },
        { id: 2, total: 149.99 }
      ]
    })
  };
  
  res.json({ user });
};
```

Notice how the file automatically reloads when you save - no server restart needed!

Test with query params:

```bash
curl http://localhost:3000/api/users/123?includeOrders=true
```

## Step 6: Build for Production

```bash
pnpm build
```

This creates an optimized production build in `dist/`:

```plaintext
✓ TypeScript compiled successfully
✓ Build output: dist/
```

## Step 7: Deploy to Local Kubernetes

Ensure Docker is running, then:

```bash
gati deploy dev --local
```

Gati will:

1. ✅ Create a local Kubernetes cluster (kind)
2. ✅ Build Docker image
3. ✅ Deploy your application
4. ✅ Wait for rollout to complete
5. ✅ Run health checks

Output:

```plaintext
🚀 Deploying to local Kubernetes...

✓ kind cluster created
✓ Docker image built: my-first-app:latest
✓ Image loaded into cluster
✓ Namespace created: my-first-app-dev
✓ Deployment created
✓ Waiting for rollout...
✓ Deployment ready (1/1 pods)
✓ Health check passed

🎉 Deployment successful!

Access your app:
  kubectl port-forward -n my-first-app-dev svc/my-first-app 8080:3000
  
Then visit: http://localhost:8080
```

## Step 8: Access Your Deployed App

```bash
kubectl port-forward -n my-first-app-dev svc/my-first-app 8080:3000
```

Now test:

```bash
curl http://localhost:8080/api/hello
```

## Quick Reference

### Common Commands

```bash
# Development
pnpm dev                    # Start dev server with hot reload
pnpm build                  # Build for production
pnpm start                  # Start production server

# Deployment
gati deploy dev --local                    # Deploy to local K8s
gati deploy dev --local --port-forward     # Deploy with auto port-forward
gati deploy dev --dry-run                  # Generate manifests only

# Testing
pnpm test                   # Run tests
pnpm typecheck              # Type checking
```

### File Structure

```plaintext
src/
├── index.ts                # App initialization
├── handlers/               # API handlers (auto-discovered)
│   ├── hello.ts           # GET /api/hello
│   └── users.ts           # GET /api/users/:id
├── modules/                # Reusable modules
│   └── database.ts        # Example: database module
└── middleware/             # Custom middleware (optional)
    └── auth.ts            # Example: auth middleware
```

### Handler Conventions

Handlers are automatically mapped to routes based on their filename:

| File | Route |
|------|-------|
| `handlers/hello.ts` | `/api/hello` |
| `handlers/users/[id].ts` | `/api/users/:id` |
| `handlers/posts/create.ts` | `/api/posts/create` |
| `handlers/posts/[id]/comments.ts` | `/api/posts/:id/comments` |

**New Features:**
- 🔥 **Hot Reloading**: Changes appear instantly (50-200ms)
- 📦 **Manifest System**: Individual file manifests for fast updates
- 🚀 **Auto Port Detection**: Finds available ports automatically
- 📊 **Built-in Health Checks**: `/health` endpoint included

## Next Steps

### Learn More

- **[Getting Started Guide](./getting-started.md)** - Comprehensive tutorial
- **[Handlers Guide](../guides/handlers.md)** - Deep dive into handlers
- **[Modules Guide](../guides/modules.md)** - Create reusable modules
- **[Deployment Guide](../guides/deployment.md)** - Advanced deployment options

### Explore Examples

- **[Hello World](../examples/hello-world.md)** - Basic example
- **[REST API](../examples/hello-world.md)** - Full REST API example

### Join the Community

- **[GitHub](https://github.com/krishnapaul242/gati)** - Source code
- **[Issues](https://github.com/krishnapaul242/gati/issues)** - Report bugs
- **[Discussions](https://github.com/krishnapaul242/gati/discussions)** - Ask questions

## Troubleshooting

### Port 3000 Already in Use

```bash
# Change port in gati.config.ts
export default {
  port: 3001
};
```

### Docker Not Running

```bash
# Start Docker Desktop or Docker daemon
# On Windows: Start Docker Desktop
# On Mac: Start Docker Desktop  
# On Linux: sudo systemctl start docker
```

### Build Errors

```bash
# Clean and reinstall dependencies
rm -rf node_modules dist
pnpm install
pnpm build
```

## Summary

You've successfully:

- ✅ Created a Gati project
- ✅ Started the development server
- ✅ Created API handlers
- ✅ Built for production
- ✅ Deployed to Kubernetes

**Total time**: ~5 minutes ⚡

Ready to build something awesome? Head to the [Getting Started Guide](./getting-started.md) for more advanced features!

---

*Last Updated: November 12, 2025*
