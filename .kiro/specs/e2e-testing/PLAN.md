# End-to-End Framework Testing Plan

## Objective
Test the complete Gati framework as if packages were published to npm, using `gatic` to scaffold a new project in `examples/` and verify all core functionality works correctly.

## Test Strategy
1. Use `npm pack` to create local tarballs simulating npm packages
2. Scaffold new project with `gatic` in examples directory
3. Install local packages instead of npm registry versions
4. Test all core features: handlers, modules, middleware, contexts
5. Test development workflow: hot reload, build, validation
6. Test deployment: Docker build, Kubernetes manifests
7. Verify CLI commands work correctly

---

## Phase 1: Package Preparation (15 min)

### Task 1.1: Build all packages
- Run `pnpm build` from workspace root
- Verify all packages compile without errors
- Check dist folders contain expected files

### Task 1.2: Create local package tarballs
- Run `npm pack` in each package directory:
  - `packages/core`
  - `packages/runtime`
  - `packages/cli`
  - `packages/gatic`
  - `packages/contracts`
  - `packages/cloud-aws`
  - `packages/cloud-gcp`
  - `packages/cloud-azure`
  - `packages/playground`
- Move all `.tgz` files to `.kiro/local-packages/`
- Document tarball names and versions

### Task 1.3: Verify package contents
- Extract one tarball and inspect contents
- Verify package.json, dist/, README.md included
- Check exports field matches built files

---

## Phase 2: Project Scaffolding (10 min)

### Task 2.1: Create test project with gatic
- Navigate to `examples/`
- Run `npx gatic create e2e-test-app`
- Select TypeScript template
- Verify project structure created correctly

### Task 2.2: Replace npm dependencies with local packages
- Modify `examples/e2e-test-app/package.json`
- Replace all `@gati-framework/*` dependencies with local tarball paths
- Example: `"@gati-framework/core": "file:../../.kiro/local-packages/gati-framework-core-0.4.5.tgz"`

### Task 2.3: Install dependencies
- Run `pnpm install` in test project
- Verify all local packages installed correctly
- Check `node_modules/@gati-framework/` contains expected packages

---

## Phase 3: Handler Testing (20 min)

### Task 3.1: Test basic handler
- Create `src/handlers/hello.ts` with simple GET handler
- Start dev server: `pnpm dev`
- Test endpoint: `curl http://localhost:3000/api/hello`
- Verify response and hot reload works

### Task 3.2: Test dynamic routes
- Create `src/handlers/users/[id].ts` with path params
- Test: `curl http://localhost:3000/api/users/123`
- Verify params extracted correctly

### Task 3.3: Test HTTP methods
- Create handlers for POST, PUT, DELETE
- Test each method with appropriate payloads
- Verify request body parsing works

### Task 3.4: Test query parameters
- Create handler using `req.query`
- Test: `curl http://localhost:3000/api/search?q=test&limit=10`
- Verify query params parsed correctly

### Task 3.5: Test error handling
- Create handler that throws error
- Verify error caught and formatted correctly
- Test custom error responses with status codes

---

## Phase 4: Context Testing (15 min)

### Task 4.1: Test local context (lctx)
- Use `lctx.set()` and `lctx.get()` in handler
- Test data persists within request lifecycle
- Verify isolation between concurrent requests

### Task 4.2: Test global context (gctx)
- Access `gctx.appId` and `gctx.env`
- Verify values match configuration
- Test `gctx.modules` object exists

### Task 4.3: Test context hooks
- Register `lctx.before()` and `lctx.after()` hooks
- Verify hooks execute in correct order
- Test `lctx.catch()` for error handling

---

## Phase 5: Module Testing (20 min)

### Task 5.1: Create simple module
- Create `src/modules/logger/index.ts`
- Implement basic logging module
- Export module interface

### Task 5.2: Configure module in gati.config.ts
- Add module to configuration
- Specify module path and initialization

### Task 5.3: Use module in handler
- Access module via `gctx.modules['logger']`
- Call module methods
- Verify module works correctly

### Task 5.4: Test module lifecycle
- Verify module initializes on startup
- Test module cleanup on shutdown
- Check module health endpoint

---

## Phase 6: Middleware Testing (15 min)

### Task 6.1: Create custom middleware
- Create `src/middleware/auth.ts`
- Implement authentication logic
- Export middleware function

### Task 6.2: Configure middleware
- Add middleware to `gati.config.ts`
- Specify execution order

### Task 6.3: Test middleware execution
- Verify middleware runs before handlers
- Test middleware can modify request/response
- Test middleware can short-circuit request

---

## Phase 7: Build & Deployment Testing (25 min)

### Task 7.1: Test production build
- Run `pnpm build`
- Verify manifest.json generated
- Check handler metadata correct

### Task 7.2: Test Docker build
- Verify Dockerfile exists
- Run `docker build -t e2e-test-app .`
- Verify image builds successfully
- Test running container locally

### Task 7.3: Test Kubernetes manifests
- Run `gati deploy dev --local --dry-run`
- Verify K8s manifests generated
- Check deployment.yaml, service.yaml, ingress.yaml
- Validate manifest syntax

### Task 7.4: Test local Kubernetes deployment (optional)
- Requires kind/minikube installed
- Run `gati deploy dev --local`
- Verify pods start successfully
- Test accessing service via ingress

---

## Phase 8: CLI Testing (15 min)

### Task 8.1: Test gati CLI commands
- `gati --version` - verify version displayed
- `gati --help` - verify help text
- `gati dev` - verify dev server starts
- `gati build` - verify build completes
- `gati validate` - verify validation works

### Task 8.2: Test contracts CLI
- Create test envelope JSON file
- Run `gati-contracts-validate envelope.json`
- Verify validation passes/fails correctly

### Task 8.3: Test playground
- Start playground: `gati playground`
- Verify UI accessible at http://localhost:4000
- Test API visualization mode
- Test network tracking mode

---

## Phase 9: Hot Reload Testing (10 min)

### Task 9.1: Test handler hot reload
- Start dev server
- Modify handler code
- Verify changes reflected without restart
- Check reload time < 200ms

### Task 9.2: Test config hot reload
- Modify `gati.config.ts`
- Verify server restarts automatically
- Check new config applied

### Task 9.3: Test module hot reload
- Modify module code
- Verify module reloads
- Test handlers using module still work

---

## Phase 10: Integration Testing (20 min)

### Task 10.1: Create realistic API
- Create multiple related handlers (CRUD operations)
- Use modules for database simulation
- Implement middleware for auth/logging
- Add error handling

### Task 10.2: Test complete user flow
- Create user (POST /api/users)
- Get user (GET /api/users/:id)
- Update user (PUT /api/users/:id)
- Delete user (DELETE /api/users/:id)
- Verify all operations work end-to-end

### Task 10.3: Test concurrent requests
- Send multiple simultaneous requests
- Verify no race conditions
- Check context isolation maintained

### Task 10.4: Test error scenarios
- Invalid input validation
- 404 for missing resources
- 500 for server errors
- Verify error format consistent

---

## Phase 11: Documentation Verification (10 min)

### Task 11.1: Verify generated project docs
- Check README.md exists and is helpful
- Verify example handlers documented
- Check configuration examples present

### Task 11.2: Test TypeScript types
- Verify IntelliSense works in IDE
- Check type errors caught at compile time
- Test handler signature type checking

### Task 11.3: Verify JSDoc comments
- Check hover tooltips in IDE
- Verify parameter descriptions present
- Test type inference from JSDoc

---

## Phase 12: Performance Testing (15 min)

### Task 12.1: Benchmark handler execution
- Use `ab` or `wrk` for load testing
- Test simple handler throughput
- Measure response times (p50, p95, p99)

### Task 12.2: Test hot reload performance
- Measure time from file save to reload
- Verify < 200ms as documented
- Test with multiple handlers

### Task 12.3: Test build performance
- Measure production build time
- Check manifest generation time
- Verify incremental builds work

---

## Phase 13: Cleanup & Documentation (10 min)

### Task 13.1: Document test results
- Create `examples/e2e-test-app/TEST_RESULTS.md`
- Document all test outcomes
- Note any issues or bugs found
- Record performance metrics

### Task 13.2: Create test checklist
- Create checklist for future testing
- Document manual test steps
- Note automated test opportunities

### Task 13.3: Archive test artifacts
- Save logs, screenshots, metrics
- Keep tarball versions used
- Document environment details

---

## Success Criteria

### Must Pass
- ✅ All packages build without errors
- ✅ Gatic scaffolds project successfully
- ✅ Dev server starts and serves handlers
- ✅ Hot reload works < 200ms
- ✅ Production build completes
- ✅ Docker image builds successfully
- ✅ All CLI commands work
- ✅ TypeScript types work correctly
- ✅ Handlers can access contexts
- ✅ Modules load and function

### Should Pass
- ✅ Kubernetes manifests generate correctly
- ✅ Middleware executes in order
- ✅ Error handling works consistently
- ✅ Playground UI accessible
- ✅ Concurrent requests handled correctly
- ✅ Performance meets expectations

### Nice to Have
- ✅ Local K8s deployment works
- ✅ All cloud provider plugins tested
- ✅ Load testing shows good throughput
- ✅ Documentation complete and accurate

---

## Estimated Time
- **Total**: ~3-4 hours
- **Core functionality**: ~2 hours
- **Deployment & advanced**: ~1-2 hours

## Next Steps After Testing
1. Fix any bugs discovered
2. Update documentation based on findings
3. Create automated test suite
4. Prepare for actual npm publishing
5. Create release checklist
