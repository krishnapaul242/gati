Perfect — I’ll now regenerate the **complete `.github/copilot-instructions.md`** for **developing the Gati Framework itself**, using:

### ✅ **Your actual folder names from the uploaded structure** (core, runtime, cli, playground, examples, etc.)

### +

### ✅ **All planned architecture packages** (types, validation, analyzer, codegen, operator, plugins, timescape, cloud, testing, etc.)

This will ensure Copilot writes correct code for:

* existing source folders
* upcoming packages
* future monorepo layout
* correct naming conventions based on *your real repository*

---

# ✅ **Generated `.github/copilot-instructions.md` (Final)**

**Tailored for Gati Framework development
Using real folder names + planned architecture**

---

# **Gati Framework — Copilot Instructions**

### **For developing the Gati Framework (not applications built on it)**

### Updated to match the real folder names found under:

* `@gati-framework/core` 
* `@gati-framework/runtime` 
* `@gati-framework/cli` (via /gatic) 
* `@gati-framework/playground` 
* example environments with `.gati/manifests` 

This spec also integrates planned future packages (types, analyzer, timescape, operator, codegen, validation, cloud).

---

# 🟩 **1. Monorepo Structure for Gati (Required for Copilot)**

Copilot must assume the **monorepo** contains these packages:

```
/packages
  /core                  # Exists today
  /runtime               # Exists today
  /cli                   # Exists today (inside gatic)
  /playground            # Exists today
  /types                 # Planned
  /validation            # Planned
  /analyzer              # Planned
  /codegen               # Planned
  /timescape             # Planned
  /plugins               # Planned ecosystem
  /operator              # Planned Kubernetes operator
  /testing               # Planned testing toolkit
  /cloud                 # Planned multi-cloud deployer
/examples
  /hello-world           # Exists today
  … more examples
/.gati                   # manifests in examples
/docs                    # developer documentation
```

Copilot must generate all new packages using the naming conventions visible in the existing packages — **lowercase, hyphen-separated**, no camelCase folders.

---

# 🟦 **2. Core Architectural Rules**

### 2.1 Core execution primitives live in:

```
/packages/runtime
/packages/core
```

Copilot must implement:

* handler runtime
* LocalContext (lctx)
* GlobalContext (gctx)
* middleware pipeline
* coordinators (as seen in runtime folder structure) 
* type-safe handler descriptors
* plugin resolver interfaces
* request execution lifecycle

### 2.2 Deterministic, stateless handlers

Handlers must be pure functions:

```ts
export const getUser = handler({
  input: G.Struct({ id: G.String.UUID }),
  output: G.User,
  async run(lctx) { ... }
});
```

### 2.3 No Express / Nest / Koa semantics

Copilot must **never** autogenerate frameworks or patterns from other ecosystems.

---

# 🟨 **3. Type System & Validation Engine**

### 3.1 Location (planned):

```
/packages/types
/packages/validation
```

### 3.2 Gati-Type rules

Copilot must implement:

* extended TS primitives (EmailString, UUIDString, TimestampString)
* combinators: `Min`, `Max`, `Pattern`, `Enum`, etc.
* G.Struct, G.Union, G.Array

### 3.3 Validation

Runtime validation must be generated under `validation`.

---

# 🟥 **4. Timescape Versioning System**

### Location (planned):

```
/packages/timescape
```

Copilot must implement:

* version registry
* transformer chains
* schema diff engine
* compatibility checker
* version-aware runtime routing
* transformer stubs

---

# 🟧 **5. Analyzer & Codegen**

### 5.1 Analyzer

Planned location:

```
/packages/analyzer
```

Responsibilities:

* file watching
* AST extraction
* manifest generation
* handler/module/plugin metadata extraction

### 5.2 Codegen

Planned location:

```
/packages/codegen
```

Generates:

* SDKs
* OpenAPI
* Kubernetes manifests
* playground configuration

Copilot must generate idempotent output.

---

# 🟫 **6. Plugin System**

### 6.1 Plugin contract lives in:

```
/packages/plugins
```

Copilot must implement:

```ts
export const MyPlugin = gatiPlugin({
  name: "postgres",
  provides: ["db"],
  config: G.Struct({ url: G.String.URL }),
  async setup(gctx, cfg) { ... }
});
```

### 6.2 Rules

* Plugins must be sandboxed
* Plugins must declare `provides[]`
* Plugins must be safe (no direct access to internal modules)

---

# 🟪 **7. Playground**

Real folder found:

```
/packages/playground
```

Playground includes:

* API Mode
* Network Mode
* Tracking Mode
* debugging visualizer

Copilot should add features using UI + backend separation.

---

# 🟫 **8. CLI (Exists today)**

Real folder:

```
/gatic
  /node_modules/@gati-framework/cli
```

Copilot must ensure:

* commands: `init`, `dev`, `build`, `playground`, `deploy`
* calls into analyzer, codegen, playground, cloud, manifest operations

CLI must remain thin and delegate work to packages.

---

# 🟦 **9. Operator (future)**

Folder planned:

```
/packages/operator
```

Responsibilities:

* Kubernetes CRDs
* version rollouts
* manifest sync
* blue-green, canary
* plugin deployments

---

# 🟩 **10. Testing Infrastructure**

Real example handlers under:

```
/examples/hello-world/src/handlers/users
```

Testing package planned:

```
/packages/testing
```

Copilot must generate:

* unit test harness (simulate runtime)
* integration tests
* timescape evolution tests
* performance benchmarks

---

# 🟥 **11. Cloud Runtime (future)**

Planned:

```
/packages/cloud
```

Implements:

* provisioning
* multi-cloud deployer
* zero-ops flows

---

# 🟧 **12. Development Standards**

### Naming:

* packages use lowercase-kebab-case
* folder names match real project: `runtime`, `core`, `cli`, `playground`
* types in PascalCase
* handlers in camelCase

### Coding Pattern:

* pure functions
* no global state
* use DI via gctx
* all artifacts version-aware

### Tests:

Must be generated under:

```
/packages/*/tests
```

or inside each package’s `/test` folder.

---

# 🟦 **13. What Copilot MUST NOT do**

* ❌ Generate any Express.js or NestJS code
* ❌ Add random folder names not matching repo conventions
* ❌ Modify dist/ or node_modules folders
* ❌ Generate example application code inside core packages
* ❌ Introduce global mutable state
* ❌ Ignore Timescape versioning semantics

---

# 🟩 **14. What Copilot MUST ALWAYS do**

* Generate type-safe code
* Add tests for every new feature
* Respect folder structure extracted from the repo
* Keep runtime deterministic
* Add observability (trace, metric hooks)
* Generate manifests via analyzer, not manual user code
* Preserve handler/version isolation
* Follow plugin sandbox rules

---

# 🟪 **15. Example Scaffolding Copilot Should Produce**

### Handler (framework)

```ts
import { handler } from "@gati-framework/runtime";
import { G } from "@gati-framework/types";

export const ping = handler({
  description: "Ping the runtime",
  input: G.Void(),
  output: G.Struct({ ok: G.Boolean }),
  async run() {
    return { ok: true };
  }
});
```

### Plugin

```ts
import { gatiPlugin } from "@gati-framework/core";

export const LoggerPlugin = gatiPlugin({
  name: "logger",
  provides: ["log"],
  setup(gctx) {
    return {
      provides: {
        log: (msg) => console.log("[Gati]", msg)
      }
    };
  }
});
```

### Analyzer Manifest Output

```ts
{
  "handlers": [{ "name": "ping", "path": "/ping", "version": "2025-01-01" }],
  "modules": [],
  "plugins": []
}
```
