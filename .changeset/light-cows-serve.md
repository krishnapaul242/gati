---
'@gati-framework/runtime': major
---

# Initial Release of @gati-framework/runtime

**WHAT:** First major release (v1.0.0) of the runtime execution engine for Gati applications.

**WHY:** Extracted runtime from monorepo core to enable standalone deployments. Scaffolded projects can now use `@gati-framework/runtime` as a dependency to execute handlers.

**FEATURES:**
- ✅ GatiApp class for HTTP server management
- ✅ Automatic handler discovery from file system
- ✅ Convention-based routing (e.g., `/handlers/hello.ts` → `GET /hello`)
- ✅ Middleware pipeline support
- ✅ Global and local context management
- ✅ Module registry for dependency injection
- ✅ Full TypeScript support with type exports

**HOW TO USE:**
```typescript
import { createApp, loadHandlers } from '@gati-framework/runtime';

const app = createApp({ port: 3000 });
await loadHandlers(app, './src/handlers');
await app.listen();
```

**BREAKING CHANGES:** None (initial release)
