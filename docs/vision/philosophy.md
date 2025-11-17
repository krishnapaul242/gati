# Core Philosophy

Gati is built on five foundational principles that guide every design decision and feature implementation.

---

## 1. Let Developers Write Business Logic

> **"The best code is the code you don't have to write."**

### The Problem

Traditional backend development forces developers to write:

- Infrastructure code (Docker, K8s manifests, CI/CD)
- Boilerplate (routing, middleware, validation)
- Configuration (YAML, env vars, feature flags)
- Deployment scripts (build, test, deploy pipelines)
- Monitoring setup (logging, metrics, alerting)

**Result:** 70% infrastructure, 30% business logic.

### The Gati Solution

Gati analyzes your code and auto-generates everything else:

```typescript
// You write ONLY this
type CreateUser = {
  email: EmailString;
  password: string & MinLen<8>;
};

export const createUserHandler: Handler = async (req, res, gctx, lctx) => {
  const { email, password } = req.body; // Auto-validated
  const user = await gctx.modules['database']?.createUser({ email, password });
  res.json({ user });
};

// Gati generates:
// - Runtime validator
// - OpenAPI spec
// - TypeScript/Python/Go SDKs
// - Docker + K8s manifests
// - Deployment pipeline
// - Monitoring config
// - Health checks
// - Timescape version metadata
```

**Result:** 95% business logic, 5% configuration.

---

## 2. APIs That Never Break

> **"Ship new versions without fear. Old clients work seamlessly."**

### The Problem

Every backend eventually becomes unmaintainable:

```
Timeline of Pain:
─────────────────────────────────────────────────────────
v1.0: Launches successfully
v1.5: Added new fields (non-breaking)
v2.0: Renamed field 'name' → 'firstName' + 'lastName' (BREAKING!)
      - Old mobile apps still use 'name'
      - Backend must support both formats
      - Manual transformation layer added
v3.0: Changed response structure (BREAKING!)
      - v1, v2, v3 all running in parallel
      - Spaghetti code trying to maintain compatibility
      - Fear of making any changes
v4.0: Complete rewrite required (months of work)
```

### The Gati Solution (Timescape)

**Automatic version management:**

```typescript
// Version 1 (2024-11-01)
type User = {
  name: string;
  email: EmailString;
};

// Version 2 (2024-11-15) - Breaking change detected
type User = {
  firstName: string;
  lastName: string;
  email: EmailString;
};

// Gati auto-generates transformer (AI-assisted)
export const transformV1toV2 = (v1: UserV1): UserV2 => ({
  firstName: v1.name.split(' ')[0],
  lastName: v1.name.split(' ')[1] || '',
  email: v1.email,
});

// Both versions run in parallel automatically
// Old clients: GET /users/123 → v1 response (via transformer)
// New clients: GET /users/123 → v2 response
// Zero manual work required
```

**Timescape features:**

- ✔ Automatic version creation on schema changes
- ✔ Parallel execution (v1, v2, v3 run simultaneously)
- ✔ Automatic schema diffing
- ✔ Auto-generated transformers (AI-assisted)
- ✔ Gradual rollout and deprecation
- ✔ Zero-downtime version switching

---

## 3. Modules Like NPM Packages

> **"Install modules the way frontend developers install packages."**

### The Problem

Backend dependencies are complex:

```bash
# Traditional approach (PostgreSQL example)
1. Install PostgreSQL server
2. Configure connection pooling
3. Set up environment variables
4. Write database module
5. Add health checks
6. Configure auto-scaling
7. Set up backups
8. Monitor connection pool
```

### The Gati Solution

**Install and configure in seconds:**

```bash
# Install module
pnpm add @gati-modules/postgresql

# Configure
# gati.config.ts
export default {
  modules: {
    database: {
      type: '@gati-modules/postgresql',
      config: {
        url: process.env.DATABASE_URL,
        poolMin: 2,
        poolMax: 10
      }
    }
  }
}

# Use in handlers
export const handler: Handler = async (req, res, gctx) => {
  const users = await gctx.modules['database']?.query('SELECT * FROM users');
  res.json({ users });
};
```

**Module types:**

- **Code modules** — TypeScript/JavaScript packages
- **NPM modules** — Published packages (e.g., `@gati-modules/redis`)
- **Docker modules** — Containerized services (Rust, Go, Python)
- **Binary modules** — Compiled executables (called via process spawn)

**Module benefits:**

- ✅ Isolated processes (independent scaling)
- ✅ Own manifests and contracts
- ✅ Automatic health checks
- ✅ Lifecycle hooks (init, shutdown, reload)
- ✅ Version compatibility metadata
- ✅ Marketplace distribution

---

## 4. TypeScript-Native Types

> **"Write types once, use everywhere."**

### The Problem (Other Frameworks)

Duplicate schemas across:

- TypeScript types (for compile-time checking)
- Runtime validators (Zod, Yup, class-validator)
- OpenAPI specs (for documentation)
- Client SDKs (manually written or codegen)
- Database schemas (Prisma, TypeORM)

**Example:**

```typescript
// 1. TypeScript type
type CreateUser = {
  email: string;
  password: string;
  age?: number;
};

// 2. Runtime validator (Zod)
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(18).max(100).optional(),
});

// 3. OpenAPI spec (manually maintained)
// components:
//   schemas:
//     CreateUser:
//       type: object
//       properties:
//         email: { type: string, format: email }
//         password: { type: string, minLength: 8 }
//         age: { type: number, minimum: 18, maximum: 100 }

// Must keep all three in sync manually!
```

### The Gati Solution

**Single definition with branded types:**

```typescript
// Write ONCE
type CreateUser = {
  email: EmailString;
  password: string & MinLen<8>;
  age?: number & Min<18> & Max<100>;
};

// Gati automatically generates:
// ✅ Runtime validator (Ajv-level performance)
// ✅ GType schema (manifest metadata)
// ✅ OpenAPI specification
// ✅ TypeScript/Python/Go SDKs
// ✅ Timescape version metadata
// ✅ Transformer generation hints
// ✅ Playground request template
// ✅ Test fixtures and mocks
```

**Branded types library:**

```typescript
// Strings
EmailString, URLString, PhoneString, UUIDString
PasswordString, JWTString, HexString, Base64String

// Numbers
PositiveNumber, NegativeNumber, IntegerNumber
Percentage, PortNumber, PriceInCents

// Constraint combinators
MinLen<N>, MaxLen<N>, Pattern<"regex">
Min<N>, Max<N>, MultipleOf<N>
Enum<T>, UniqueItems, NonEmpty
```

---

## 5. Zero-Ops Deployment

> **"One command to deploy anywhere. Gati handles the rest."**

### The Problem

Traditional deployment checklist:

```
☐ Write Dockerfile (multi-stage, optimized)
☐ Build Docker image
☐ Push to container registry
☐ Write Kubernetes manifests:
  ☐ Deployment
  ☐ Service
  ☐ ConfigMap
  ☐ Secret
  ☐ Ingress
  ☐ HPA (auto-scaling)
  ☐ PodDisruptionBudget
  ☐ ServiceAccount
  ☐ RBAC rules
☐ Set up CI/CD pipeline
☐ Configure load balancer
☐ Set up SSL certificates
☐ Configure DNS
☐ Set up monitoring/alerting
☐ Configure logging pipeline
☐ Test deployment
☐ Set up rollback mechanism
☐ Deploy and pray
```

**Time:** 2-4 weeks for first deployment, 1-2 days for subsequent deployments.

### The Gati Solution

```bash
# Deploy to local Kubernetes
gati deploy dev --local

# Deploy to AWS EKS
gati deploy production --provider aws --region us-east-1

# Deploy to GCP GKE (M2+)
gati deploy production --provider gcp --region us-central1

# Deploy to Azure AKS (M2+)
gati deploy production --provider azure --region eastus
```

**Time:** 5-10 minutes for first deployment, 2-3 minutes for updates.

**Gati handles:**

| Task | Traditional | Gati |
|------|-------------|------|
| Container registry | Manual setup | Automatic |
| K8s cluster | Manual provisioning | Auto-provision or use existing |
| Load balancer | Manual config | Automatic |
| SSL/TLS | Manual cert management | Auto-provision + renewal |
| DNS | Manual setup | Automatic |
| Secrets | Manual K8s secrets | Encrypted, auto-injected |
| Auto-scaling | Manual HPA/VPA | Automatic based on metrics |
| Monitoring | Manual setup | Built-in (/_control panel) |
| Logging | Manual pipeline | Structured, searchable |
| Rollback | Manual kubectl | `gati rollback` command |

---

## Design Principles

These five core philosophies translate into concrete design principles:

### Convention over Configuration

- **File-based routing**: `src/handlers/users/[id].ts` → `/users/:id`
- **Sensible defaults**: Port 3000, JSON responses, CORS enabled
- **Minimal config**: `gati.config.ts` only for customization

### Progressive Enhancement

- **Start simple**: Single handler file gets you started
- **Add complexity only when needed**: Modules, middleware, plugins
- **No premature abstraction**: Write code, refactor later

### Cloud-Native First

- **Built for Kubernetes**: Not bolted on, fundamentally designed for it
- **Stateless by default**: Handlers pure functions, state in modules
- **12-Factor compliant**: Config via env vars, logs to stdout, etc.

### Developer Experience First

- **Fast feedback**: Hot reload in 50-200ms
- **Clear errors**: Actionable error messages with context
- **Great tooling**: CLI, Playground, Control Panel
- **Comprehensive docs**: Examples, guides, API reference

### Open and Extensible

- **Plugin ecosystem**: Marketplace for modules and plugins
- **No vendor lock-in**: Deploy anywhere (AWS, GCP, Azure, on-prem)
- **MIT license**: Free to use, modify, distribute
- **Community-driven**: Open to contributions and feedback

---

## Philosophy in Action

### Example: Migrating from Express

**Before (Express.js):**

```typescript
// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from 'winston';
import { Pool } from 'pg';

const app = express();
const logger = createLogger({ /* config */ });
const db = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/users/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000);

// Separate files:
// - Dockerfile
// - docker-compose.yml
// - k8s/deployment.yaml
// - k8s/service.yaml
// - k8s/ingress.yaml
// - .github/workflows/deploy.yml
```

**After (Gati):**

```typescript
// src/handlers/users/[id].ts
import type { Handler } from '@gati-framework/runtime';
import { HandlerError } from '@gati-framework/runtime';

export const METHOD = 'GET';

export const getUserHandler: Handler = async (req, res, gctx, lctx) => {
  const userId = req.params.id;
  const user = await gctx.modules['database']?.findUser(userId);
  
  if (!user) {
    throw new HandlerError('User not found', 404, { userId });
  }
  
  res.json({ user });
};

// gati.config.ts (only configuration needed)
export default {
  modules: {
    database: {
      type: '@gati-modules/postgresql',
      config: { url: process.env.DATABASE_URL }
    }
  }
};

// Deploy:
// gati deploy production --provider aws
```

**Lines of code:**

- Express: ~100 lines (handler + config + Docker + K8s manifests + CI/CD)
- Gati: ~20 lines (handler + config)

**80% reduction in code. 100% of the functionality.**

---

## Next Steps

- 📖 [Why Gati?](/vision/why-gati) — Understand the problems Gati solves
- 🚀 [Feature Registry](/vision/features) — See all planned capabilities
- 🏗️ [Architecture Overview](/architecture/overview) — Deep dive into design
- ⚡ [Quick Start](/onboarding/quick-start) — Build your first Gati app

---

*Last Updated: November 18, 2025*
