# Developer Experience & Code Patterns - Requirements

## Overview
Define and document the developer experience patterns for Gati, focusing on TypeScript-first, minimal boilerplate, and clear separation of concerns.

## Acceptance Criteria

### AC1: Core DX Principles
- [ ] Type-first development with TypeScript types that generate runtime schemas
- [ ] Simple, consistent handler signatures: `handler(req, res, lctx, gctx)`
- [ ] Stateless handlers that delegate to modules via `gctx.modules`
- [ ] Explicit context separation (local vs global)
- [ ] Zero boilerplate through analyzer and codegen
- [ ] Composable, testable pure functions for business logic

### AC2: Project Structure
- [ ] Standard project layout with `/handlers`, `/modules`, `/plugins`, `/types`
- [ ] Clear separation between handler logic, module implementations, and plugins
- [ ] Support for polyglot modules (Node, WASM, OCI)
- [ ] Configuration via `gati.config.ts`

### AC3: Context APIs
- [ ] LocalContext (lctx) provides per-request state, hooks (before/after/catch), events, and logging
- [ ] GlobalContext (gctx) provides modules, secrets, metrics, timescape, and pub/sub
- [ ] Type-safe context interfaces exported from `@gati/runtime`

### AC4: Handler Pattern
- [ ] Simple async function signature with typed request/response
- [ ] Automatic validation from exported types
- [ ] Access to modules via `gctx.modules`
- [ ] Support for local hooks (before/after/catch)

### AC5: Module Pattern
- [ ] Modules export simple async functions
- [ ] Auto-generated manifests from TypeScript exports
- [ ] Support for Node, Docker/OCI, and WASM packaging
- [ ] Typed RPC stubs in `gctx.modules`

### AC6: Plugin System
- [ ] Simple functional plugin initialization
- [ ] Plugins extend capabilities (auth, validation, etc.)
- [ ] Registration via bootstrap function

### AC7: Type System
- [ ] Support for branded primitives (Email, UUID, etc.)
- [ ] Analyzer extracts types and generates GType JSON
- [ ] Type-driven validation and schema generation

### AC8: Error Handling
- [ ] Throw errors in handlers for automatic HTTP mapping
- [ ] Custom error recovery via `lctx.catch` hooks
- [ ] Structured error logging

### AC9: Testing Patterns
- [ ] Unit tests for pure business logic
- [ ] Integration tests with `@gati/testing` harness
- [ ] Module contract tests for GType validation

### AC10: Development Workflow
- [ ] `gati dev` for local development with hot reload
- [ ] `gati module build/publish` for module packaging
- [ ] `gati deploy` for deployment
- [ ] Playground UI at `/__playground` for testing

### AC11: Documentation & Examples
- [ ] Complete code examples for handlers, modules, and plugins
- [ ] Best practices and anti-patterns guide
- [ ] Full small app example
- [ ] IDE setup recommendations (VSCode, ESLint, Prettier)

### AC12: Timescape Integration
- [ ] Schema diff visualization in dev mode
- [ ] Auto-generated transformer stubs for breaking changes
- [ ] Developer-friendly migration workflow

## Non-Functional Requirements

### NFR1: Developer Productivity
- Minimal cognitive load with simple, consistent patterns
- Fast feedback loop with hot reload
- Clear error messages and debugging support

### NFR2: Type Safety
- Strict TypeScript configuration
- Runtime validation matches compile-time types
- Type-safe module RPC calls

### NFR3: Maintainability
- Small, focused handlers and modules
- Clear separation of concerns
- Testable pure functions

### NFR4: Extensibility
- Plugin system for custom capabilities
- Support for multiple module runtimes
- Flexible configuration options

## Out of Scope
- Production deployment infrastructure details
- Cloud provider-specific configurations
- Advanced monitoring and observability (covered in separate specs)
- Performance optimization patterns (covered in separate specs)
