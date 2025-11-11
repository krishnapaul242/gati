# TypeScript Configuration

This document explains the TypeScript configuration for the Gati project.

## Configuration Files

### `tsconfig.json` (Development)

Main TypeScript configuration with strict type checking and path aliases.

**Key Features:**

- ✅ **Strict Mode:** Full type safety enabled
- ✅ **Path Aliases:** `@/`, `@gati-framework/core`, `@gati/cli`, `@gati/types`
- ✅ **Modern ES2022:** Latest JavaScript features
- ✅ **Source Maps:** For debugging
- ✅ **Declaration Files:** `.d.ts` generation for types

### `tsconfig.build.json` (Production)

Optimized configuration for production builds.

**Differences from dev:**

- ❌ No source maps
- ❌ No declaration maps
- ✅ Remove comments
- ✅ Incremental builds
- ❌ Excludes tests and examples

## Path Aliases

```typescript
import { Handler } from '@/runtime/types/handler'; // Instead of ../../runtime/types/handler
import { Something } from '@gati-framework/core'; // Main runtime exports
import { Command } from '@gati/cli'; // CLI utilities
import type { Context } from '@gati/types'; // Type-only imports
```

### Configured Aliases

| Alias         | Resolves To                    | Usage                     |
| ------------- | ------------------------------ | ------------------------- |
| `@/*`         | `./src/*`                      | Any file in src directory |
| `@gati-framework/core`  | `./src/runtime/index.ts`       | Main runtime exports      |
| `@gati/cli`   | `./src/cli/index.ts`           | CLI exports               |
| `@gati/types` | `./src/runtime/types/index.ts` | Type definitions          |

## Compiler Options Explained

### Strict Type Checking (All Enabled)

```json
{
  "strict": true, // Enable all strict options
  "noImplicitAny": true, // No implicit 'any' types
  "strictNullChecks": true, // Null safety
  "noUnusedLocals": true, // Catch unused variables
  "noUnusedParameters": true, // Catch unused function params
  "noImplicitReturns": true, // All code paths must return
  "noUncheckedIndexedAccess": true // Array/object access safety
}
```

### Module System

```json
{
  "module": "ESNext", // Modern ES modules
  "moduleResolution": "bundler", // Bundler-aware resolution
  "esModuleInterop": true // CommonJS compatibility
}
```

### Output

```json
{
  "outDir": "./dist", // Compiled files go here
  "declaration": true, // Generate .d.ts files
  "sourceMap": true // Generate .map files
}
```

## Usage

### Type Checking (No Build)

```bash
# Check all types without compiling
pnpm typecheck

# Watch mode - recheck on file changes
pnpm typecheck:watch
```

### Building

```bash
# Production build (optimized)
pnpm build

# Development build with watch
pnpm build:watch
```

### IDE Integration

**VS Code** will automatically use `tsconfig.json` for:

- ✅ IntelliSense
- ✅ Type checking
- ✅ Auto-imports
- ✅ Refactoring

## ESLint Integration

TypeScript files are linted with:

- `@typescript-eslint/recommended`
- `@typescript-eslint/recommended-requiring-type-checking`

**Key Rules:**

- ❌ No `any` types allowed
- ✅ Prefer `type` imports: `import type { Foo }`
- ⚠️ Warnings for non-null assertions (`!`)

## Prettier Integration

All TypeScript files auto-formatted with:

- Single quotes
- Semicolons
- 2 space indentation
- 80 character line width

## Testing with Vitest

Vitest uses the same path aliases via `vitest.config.ts`:

```typescript
// In tests, same aliases work
import { Handler } from '@/runtime/types/handler';
import type { Context } from '@gati/types';
```

## Troubleshooting

### "Cannot find module '@/...'"

- Ensure your IDE has reloaded the TypeScript config
- In VS Code: `Cmd/Ctrl + Shift + P` → "TypeScript: Reload Project"

### "Implicit any" errors

- This is intentional! Add explicit types.
- Never use `any` - use `unknown` if truly needed

### Import errors in tests

- Check `vitest.config.ts` has matching path aliases
- Restart Vitest: `pnpm test:watch`

---

**Related Issues:**

- Issue #12: Monorepo Structure ✅
- Issue #13: TypeScript Config ✅
- Issue #7: Context Managers (Next)
- Issue #1: Handler Pipeline (Next)

**Last Updated:** 2025-11-09
