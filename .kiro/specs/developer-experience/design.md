# Developer Experience & Code Patterns - Design

## Architecture Overview

The Gati DX is built on three pillars:
1. **Type-first development**: TypeScript types drive runtime behavior
2. **Explicit context**: Clear separation between request-local and global state
3. **Minimal abstraction**: Plain functions over decorators and magic

## Core Components

### 1. Context System

#### LocalContext (lctx)
**Purpose**: Manage per-request state, hooks, and lifecycle

**Properties**:
- `P1.1`: LocalContext provides type-safe key-value storage for request-scoped data
- `P1.2`: LocalContext supports before/after/catch hooks for request lifecycle
- `P1.3`: LocalContext enables event publishing within request scope
- `P1.4`: LocalContext provides snapshot/restore for debugging and replay
- `P1.5`: LocalContext includes structured logging with priority levels

**Interface**:
```typescript
export interface LocalContext {
  meta: { requestId: string; path: string; version?: string };
  get<T = any>(key: string): T | undefined;
  set<T = any>(key: string, value: T): void;
  delete(key: string): void;
  clean(): void;
  before(fn: HookFn): void;
  after(fn: HookFn): void;
  catch(fn: ErrorHookFn): void;
  publish(event: string, payload?: any): Promise<void>;
  snapshot(): unknown;
  restore(snapshot: unknown): void;
  log(msg: string, priority?: number): void;
}
```

#### GlobalContext (gctx)
**Purpose**: Provide access to global services and modules

**Properties**:
- `P2.1`: GlobalContext provides typed module clients via `modules` property
- `P2.2`: GlobalContext manages secrets access with async retrieval
- `P2.3`: GlobalContext exposes metrics collection API
- `P2.4`: GlobalContext integrates with Timescape for versioning
- `P2.5`: GlobalContext supports global pub/sub messaging

**Interface**:
```typescript
export interface GlobalContext {
  modules: { [name: string]: ModuleClient };
  secrets: { get(name: string): Promise<string | undefined> };
  metrics: { incr(name: string, labels?: Record<string,string>): void };
  timescape: {
    currentVersion(): string;
    listVersions(handlerId: string): Promise<string[]>;
  };
  publish(topic: string, payload: any): Promise<void>;
}
```

### 2. Handler Pattern

**Properties**:
- `P3.1`: Handlers use consistent signature: `async (req, res, lctx, gctx) => void`
- `P3.2`: Request/response types are exported and analyzed for validation
- `P3.3`: Handlers remain stateless and delegate side effects to modules
- `P3.4`: Handlers can register local hooks for lifecycle management
- `P3.5`: Automatic validation runs before handler execution

**Example Structure**:
```typescript
import type { Handler } from "@gati/runtime";
import type { CreateUserBody, CreateUserRes } from "../types/api";

export const createUser: Handler = async (req, res, lctx, gctx) => {
  const body = req.body as CreateUserBody;
  
  lctx.before(async () => {
    lctx.log("createUser.before");
  });
  
  const id = await gctx.modules.users.create({
    name: body.name,
    email: body.email
  });
  
  const out: CreateUserRes = {
    id,
    createdAt: new Date().toISOString()
  };
  res.json(out);
  
  lctx.after(() => {
    gctx.metrics.incr("user.created");
  });
};
```

### 3. Module Pattern

**Properties**:
- `P4.1`: Modules export simple async functions for business logic
- `P4.2`: Module manifests are auto-generated from TypeScript exports
- `P4.3`: Modules support multiple runtimes (Node, WASM, OCI)
- `P4.4`: Module clients are typed and available via `gctx.modules`
- `P4.5`: Module packaging follows runtime-specific conventions

**Node Module Example**:
```typescript
// src/modules/users/index.ts
export async function create(input: { name: string; email: string }) {
  const newId = `user_${Date.now()}`;
  // DB operations...
  return newId;
}

export async function getById(id: string) {
  // DB fetch...
  return { id, name: "K", email: "k@example.com" };
}
```

**Packaging**:
- Node: `package.json` or `gati.module.json`
- OCI: `gati.manifest.json` at `/etc/gati/manifest.json`
- WASM: Runtime-specific manifest

### 4. Plugin System

**Properties**:
- `P5.1`: Plugins use functional initialization pattern
- `P5.2`: Plugins extend capabilities (auth, validation, middleware)
- `P5.3`: Plugins register via bootstrap function
- `P5.4`: Plugin APIs are simple and explicit

**Example**:
```typescript
// src/plugins/auth-plugin/index.ts
export function initAuthPlugin(gctx) {
  return {
    id: "auth-plugin",
    async verifyToken(token) {
      return token === "dev-token" ? { sub: "dev" } : null;
    }
  };
}
```

### 5. Type System

**Properties**:
- `P6.1`: Branded primitives provide type safety without runtime overhead
- `P6.2`: Analyzer extracts types and generates GType JSON schemas
- `P6.3`: Types drive automatic validation and SDK generation
- `P6.4`: Type changes trigger Timescape diff analysis

**Example**:
```typescript
export type Email = string & { __brand?: "email" };
export type UUID = string & { __brand?: "uuid" };

export type CreateUserBody = {
  name: string;
  email: Email;
};

export type CreateUserRes = {
  id: UUID;
  createdAt: string;
};
```

### 6. Error Handling

**Properties**:
- `P7.1`: Thrown errors automatically map to HTTP responses
- `P7.2`: `lctx.catch` hooks enable custom error recovery
- `P7.3`: Error context includes request metadata
- `P7.4`: Structured error logging with priority levels

**Example**:
```typescript
lctx.catch(async (err, req) => {
  lctx.log("handler failed: " + String(err), 1);
  // Optional compensating action
});
```

### 7. Testing Strategy

**Properties**:
- `P8.1`: Pure business logic uses standard unit tests
- `P8.2`: Handler integration tests use `@gati/testing` harness
- `P8.3`: Module contract tests validate GType compliance
- `P8.4`: Test harness provides request/response mocking

**Unit Test**:
```typescript
import { computeFee } from "../lib/fees";

test("fee calc", () => {
  expect(computeFee(100)).toBe(3);
});
```

**Handler Test**:
```typescript
import { runHandler } from "@gati/testing";
import { createUser } from "../../src/handlers/createUser";

test("createUser happy path", async () => {
  const res = await runHandler(createUser)
    .withBody({ name: "A", email: "a@b.com" })
    .run();
  expect(res.status).toBe(200);
  expect(res.body.id).toBeDefined();
});
```

### 8. Development Workflow

**Properties**:
- `P9.1`: `gati dev` starts local server with hot reload
- `P9.2`: Analyzer watches files and regenerates artifacts
- `P9.3`: Playground UI provides interactive testing
- `P9.4`: CLI commands support module lifecycle (build/publish)
- `P9.5`: Deploy command targets multiple platforms

**CLI Commands**:
- `gati dev` - Local development server
- `gati module build` - Package module
- `gati module publish` - Push to registry
- `gati deploy` - Deploy to target platform

### 9. Project Structure

**Properties**:
- `P10.1`: Standard directory layout for handlers, modules, plugins, types
- `P10.2`: Configuration via `gati.config.ts`
- `P10.3`: Generated artifacts in `.gati/` directory
- `P10.4`: Clear separation of concerns by directory

**Layout**:
```
/gati-app
  /src
    /handlers       # HTTP handlers
    /modules        # Business logic modules
    /plugins        # Extension plugins
    /types          # Shared types
    main.ts         # Bootstrap
  gati.config.ts    # Configuration
  package.json
  tsconfig.json
```

### 10. IDE Integration

**Properties**:
- `P11.1`: VSCode workspace configuration for debugging
- `P11.2`: ESLint and Prettier configs for code quality
- `P11.3`: TypeScript strict mode for type safety
- `P11.4`: Autocompletion for branded types via `@gati/types`

### 11. Timescape Integration

**Properties**:
- `P12.1`: Schema diffs displayed in dev mode
- `P12.2`: Breaking changes generate transformer stubs
- `P12.3`: Old handler versions remain active during migration
- `P12.4`: Developer-friendly diff visualization

## Best Practices

### Do:
- Use `gctx.modules` for all side effects
- Keep handlers idempotent and small
- Extract business logic to pure functions
- Use `lctx` for request-scoped caching
- Rely on TypeScript types for schemas

### Don't:
- Use global mutable state
- Call external APIs directly in handlers
- Perform heavy synchronous CPU work in handlers
- Use runtime decorators or hidden magic
- Mix business logic with handler code

## Design Decisions

### D1: Why plain functions over decorators?
Decorators add complexity and hide behavior. Plain functions are explicit, testable, and familiar to all TypeScript developers.

### D2: Why separate lctx and gctx?
Clear separation prevents accidental state leakage and makes testing easier. Request-local state should never persist beyond the request.

### D3: Why modules instead of direct DB access?
Modules enable polyglot implementations, better testing, and clear boundaries. They also support Gati's distributed module system.

### D4: Why branded types?
Branded types provide compile-time safety without runtime overhead. They document intent and prevent type confusion (e.g., mixing user IDs with order IDs).

## Implementation Phases

### Phase 1: Core Runtime
- Implement LocalContext and GlobalContext
- Create handler execution pipeline
- Build module client system

### Phase 2: Developer Tools
- Implement analyzer for type extraction
- Build codegen for manifests and validators
- Create CLI commands (dev, build, deploy)

### Phase 3: Testing Infrastructure
- Implement `@gati/testing` harness
- Create contract test utilities
- Build Playground UI

### Phase 4: Documentation & Examples
- Write comprehensive guides
- Create example projects
- Build IDE integration templates
