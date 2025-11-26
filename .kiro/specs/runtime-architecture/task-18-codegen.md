# Task 18: Codegen for Validators and SDK Stubs

## Overview

Implement code generation capabilities to automatically create validator functions, TypeScript type definitions, SDK client stubs, and manifest bundles from GType schemas and handler manifests. This enables type-safe development and deployment automation.

## Requirements

- **Requirement 1.5**: Generate TypeScript type definitions from handler manifests for compile-time safety
- **Requirement 3.5**: Generate validator functions at build time from GType schemas
- **Requirement 11.2**: Produce runtime validator functions from GType schemas
- **Requirement 11.3**: Produce TypeScript SDK client stubs for type-safe API consumption

## Context Analysis

### Existing Infrastructure ✅
- GType schema system (`packages/runtime/src/gtype/`)
- Validator runtime (`packages/runtime/src/gtype/validator.ts`)
- Manifest generator (`packages/cli/src/analyzer/manifest-generator.ts`)
- Transformer generator (`packages/cli/src/codegen/transformer-generator.ts`)

### Missing Components ❌
- Validator function codegen
- TypeScript type definition generator
- SDK client stub generator
- Manifest bundle generator
- CLI integration for code generation

## Implementation Plan

### Phase 1: Core Generators (Steps 1-4)
1. **Validator Function Generator** - Convert GType schemas to optimized validator functions
2. **TypeScript Type Definition Generator** - Generate TypeScript interfaces from GType schemas
3. **SDK Client Stub Generator** - Generate type-safe API client from handler manifests
4. **Manifest Bundle Generator** - Create deployment bundles with all manifests

### Phase 2: Integration & Testing (Steps 5-7)
5. **Codegen Orchestrator** - Unified interface and CLI integration
6. **Property Test: TypeScript Definitions** - Validate type generation correctness
7. **Property Test: SDK Stubs** - Validate SDK generation correctness

### Phase 3: CLI & Documentation (Step 8)
8. **CLI Commands** - Add `gati generate` commands with watch mode

## File Structure

```
packages/cli/src/codegen/
├── index.ts                      # Orchestrator and exports
├── validator-generator.ts        # Validator function generator (NEW)
├── validator-generator.test.ts   # Unit tests (NEW)
├── typedef-generator.ts          # TypeScript type generator (NEW)
├── typedef-generator.test.ts     # Property tests - 18.1 (NEW)
├── sdk-generator.ts              # SDK client stub generator (NEW)
├── sdk-generator.test.ts         # Property tests - 18.2 (NEW)
├── bundle-generator.ts           # Manifest bundle generator (NEW)
├── bundle-generator.test.ts      # Unit tests (NEW)
└── transformer-generator.ts      # (Already exists ✅)

packages/cli/src/commands/
└── generate.ts                   # CLI commands (NEW)
```

## Success Criteria

- [ ] Validator functions generated from GType schemas compile and validate correctly
- [ ] TypeScript definitions generated from manifests are valid and type-safe
- [ ] SDK client stubs compile and provide correct method signatures
- [ ] Manifest bundles contain all required metadata for deployment
- [ ] Property tests pass with 100+ iterations
- [ ] CLI commands work with watch mode for development
- [ ] Generated code is formatted and includes helpful comments

## Dependencies

- **Existing**: TypeScript compiler API, fast-check (installed)
- **New**: prettier (for code formatting)

## Progress Tracking

- [x] Step 1: Validator Function Generator ✅ (26 tests passing)
- [x] Step 2: TypeScript Type Definition Generator ✅ (35 tests passing)
- [x] Step 3: SDK Client Stub Generator ✅ (35 tests passing)
- [x] Step 4: Manifest Bundle Generator ✅ (26 tests passing)
- [ ] Step 5: Codegen Orchestrator
- [ ] Step 6: Property Test - TypeScript Definitions (18.1)
- [ ] Step 7: Property Test - SDK Stubs (18.2)
- [ ] Step 8: CLI Integration

---

## Detailed Subtasks

### Step 1: Validator Function Generator

**File**: `packages/cli/src/codegen/validator-generator.ts`

**Purpose**: Generate optimized runtime validator functions from GType schemas

**Acceptance Criteria**:
- [ ] AC1.1: Generate validator for primitive types (string, number, boolean, null, undefined)
- [ ] AC1.2: Generate validator for object types with property validation
- [ ] AC1.3: Generate validator for array types with item validation
- [ ] AC1.4: Generate validator for union types (try each type until one succeeds)
- [ ] AC1.5: Generate validator for intersection types (all must succeed)
- [ ] AC1.6: Generate validator for enum types
- [ ] AC1.7: Generate validator for tuple types
- [ ] AC1.8: Generate validator for literal types
- [ ] AC1.9: Support optional and nullable modifiers
- [ ] AC1.10: Include custom validators (min, max, minLength, maxLength, pattern, email, url, uuid)
- [ ] AC1.11: Generate structured error messages with path information
- [ ] AC1.12: Export validators as named functions with TypeScript type guards
- [ ] AC1.13: Generated code compiles without errors
- [ ] AC1.14: Generated validators match runtime validator behavior

**Output Example**:
```typescript
export function validateUserRequest(value: unknown): ValidationResult {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, errors: [{ path: [], expected: 'object', actual: typeof value }] };
  }
  const obj = value as Record<string, unknown>;
  const errors: ValidationError[] = [];
  
  // Validate email
  if (typeof obj.email !== 'string') {
    errors.push({ path: ['email'], expected: 'string', actual: typeof obj.email });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email)) {
    errors.push({ path: ['email'], expected: 'valid email', actual: obj.email });
  }
  
  return errors.length === 0 ? { valid: true, errors: [] } : { valid: false, errors };
}
```

**Test Coverage**:
- Unit tests for each GType kind
- Edge cases: deeply nested objects, complex unions, recursive types
- Performance: generated validators should be fast (early returns)

---

### Step 2: TypeScript Type Definition Generator

**File**: `packages/cli/src/codegen/typedef-generator.ts`

**Purpose**: Generate TypeScript type definitions from GType schemas and handler manifests

**Acceptance Criteria**:
- [ ] AC2.1: Convert primitive GTypes to TypeScript primitive types
- [ ] AC2.2: Convert object GTypes to TypeScript interfaces
- [ ] AC2.3: Convert array GTypes to TypeScript array types
- [ ] AC2.4: Convert union GTypes to TypeScript union types (A | B)
- [ ] AC2.5: Convert intersection GTypes to TypeScript intersection types (A & B)
- [ ] AC2.6: Convert enum GTypes to TypeScript enum or union of literals
- [ ] AC2.7: Convert tuple GTypes to TypeScript tuple types
- [ ] AC2.8: Convert literal GTypes to TypeScript literal types
- [ ] AC2.9: Support optional properties with `?` modifier
- [ ] AC2.10: Support nullable types with `| null`
- [ ] AC2.11: Generate branded types using TypeScript's branded type pattern
- [ ] AC2.12: Include JSDoc comments with descriptions from GType metadata
- [ ] AC2.13: Generate request/response/params/headers types for handlers
- [ ] AC2.14: Export types with proper naming conventions
- [ ] AC2.15: Generated TypeScript compiles without errors
- [ ] AC2.16: Generated types are assignable to expected values

**Output Example**:
```typescript
/**
 * User request payload
 */
export interface UserRequest {
  /** User's email address */
  email: string & { __brand: 'Email' };
  /** User's full name */
  name: string;
  /** User's age (optional) */
  age?: number;
  /** User roles */
  roles: Array<'admin' | 'user' | 'guest'>;
}

/**
 * User response payload
 */
export interface UserResponse {
  id: string & { __brand: 'UserId' };
  email: string & { __brand: 'Email' };
  name: string;
  createdAt: string;
}
```

**Test Coverage**:
- Unit tests for each GType to TypeScript conversion
- Property test (18.1): Generated types match GType schemas
- Compilation test: Generated code compiles with TypeScript

---

### Step 3: SDK Client Stub Generator

**File**: `packages/cli/src/codegen/sdk-generator.ts`

**Purpose**: Generate type-safe SDK client stubs from handler manifests

**Acceptance Criteria**:
- [ ] AC3.1: Generate client class with methods for each handler
- [ ] AC3.2: Extract method name from handler path (e.g., `/users/:id` → `getUser`)
- [ ] AC3.3: Generate method signatures with path parameters as function arguments
- [ ] AC3.4: Generate method signatures with query parameters as optional object
- [ ] AC3.5: Include request body parameter for POST/PUT/PATCH methods
- [ ] AC3.6: Include response type annotation from handler manifest
- [ ] AC3.7: Generate path parameter interpolation (e.g., `/users/${id}`)
- [ ] AC3.8: Generate fetch-based implementation with error handling
- [ ] AC3.9: Support authentication headers (Bearer token, API key)
- [ ] AC3.10: Support custom request configuration (timeout, headers)
- [ ] AC3.11: Generate JSDoc comments for each method
- [ ] AC3.12: Export client class with constructor for base URL
- [ ] AC3.13: Generated SDK compiles without errors
- [ ] AC3.14: Generated SDK methods have correct type signatures

**Output Example**:
```typescript
/**
 * Auto-generated Gati API Client
 * Generated: 2025-01-15T10:30:00Z
 */
export class GatiClient {
  constructor(
    private baseUrl: string,
    private options?: { token?: string; timeout?: number }
  ) {}

  /**
   * Get user by ID
   * @param id - User ID
   * @returns User details
   */
  async getUser(id: string): Promise<UserResponse> {
    const response = await fetch(`${this.baseUrl}/users/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
      signal: this.getAbortSignal(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Create new user
   * @param body - User creation request
   * @returns Created user
   */
  async createUser(body: UserRequest): Promise<UserResponse> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: this.getAbortSignal(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.options?.token) {
      headers['Authorization'] = `Bearer ${this.options.token}`;
    }
    return headers;
  }

  private getAbortSignal(): AbortSignal | undefined {
    if (this.options?.timeout) {
      return AbortSignal.timeout(this.options.timeout);
    }
    return undefined;
  }
}
```

**Test Coverage**:
- Unit tests for path parameter extraction and interpolation
- Unit tests for method name generation
- Property test (18.2): Generated SDK matches handler manifests
- Compilation test: Generated SDK compiles with TypeScript

---

### Step 4: Manifest Bundle Generator

**File**: `packages/cli/src/codegen/bundle-generator.ts`

**Purpose**: Generate deployment bundles containing all manifests and schemas

**Acceptance Criteria**:
- [ ] AC4.1: Collect all handler manifests from project
- [ ] AC4.2: Collect all module manifests from project
- [ ] AC4.3: Collect all GType schemas with references resolved
- [ ] AC4.4: Include version graph for Timescape
- [ ] AC4.5: Include transformer metadata
- [ ] AC4.6: Generate deployment descriptor for Kubernetes Operator
- [ ] AC4.7: Create manifest index for fast lookup by handler ID
- [ ] AC4.8: Validate manifest completeness (all dependencies present)
- [ ] AC4.9: Validate GType references are resolvable
- [ ] AC4.10: Generate bundle metadata (timestamp, version, checksum)
- [ ] AC4.11: Export bundle as JSON file
- [ ] AC4.12: Bundle is valid JSON and can be parsed

**Output Example**:
```json
{
  "version": "1.0.0",
  "generated": "2025-01-15T10:30:00Z",
  "checksum": "sha256:abc123...",
  "handlers": [
    {
      "handlerId": "users.getUser",
      "path": "/users/:id",
      "method": "GET",
      "gtypes": { "request": "...", "response": "..." },
      "timescapeVersion": "tsv:1234567890-users-001"
    }
  ],
  "modules": [
    {
      "moduleId": "database",
      "runtime": "node",
      "capabilities": ["db:read", "db:write"]
    }
  ],
  "schemas": {
    "UserRequest": { "kind": "object", "properties": {} },
    "UserResponse": { "kind": "object", "properties": {} }
  },
  "versionGraph": {
    "nodes": [],
    "edges": []
  },
  "transformers": []
}
```

**Test Coverage**:
- Unit tests for manifest collection
- Unit tests for reference resolution
- Unit tests for validation
- Integration test: Generate bundle from example project

---

### Step 5: Codegen Orchestrator

**File**: `packages/cli/src/codegen/index.ts`

**Purpose**: Unified interface for all code generation with CLI integration

**Acceptance Criteria**:
- [ ] AC5.1: Export all generators with consistent API
- [ ] AC5.2: Provide `generateValidators()` function
- [ ] AC5.3: Provide `generateTypes()` function
- [ ] AC5.4: Provide `generateSDK()` function
- [ ] AC5.5: Provide `generateBundle()` function
- [ ] AC5.6: Provide `generateAll()` function for full project codegen
- [ ] AC5.7: Support incremental generation (only changed files)
- [ ] AC5.8: Add file watching for development mode
- [ ] AC5.9: Include progress reporting (console output)
- [ ] AC5.10: Include error handling with helpful messages
- [ ] AC5.11: Write generated files to output directory
- [ ] AC5.12: Format generated code with prettier

**Output Example**:
```typescript
export interface CodegenOptions {
  projectRoot: string;
  outputDir?: string;
  watch?: boolean;
  incremental?: boolean;
  format?: boolean;
}

export async function generateAll(options: CodegenOptions): Promise<void> {
  console.log('🔧 Generating validators...');
  await generateValidators(options);
  
  console.log('📝 Generating TypeScript definitions...');
  await generateTypes(options);
  
  console.log('🚀 Generating SDK client...');
  await generateSDK(options);
  
  console.log('📦 Generating manifest bundle...');
  await generateBundle(options);
  
  console.log('✅ Code generation complete!');
}
```

**Test Coverage**:
- Integration tests for full generation pipeline
- Test watch mode with file changes
- Test incremental generation

---

### Step 6: Property Test - TypeScript Definition Generation (18.1)

**File**: `packages/cli/src/codegen/typedef-generator.test.ts`

**Purpose**: Validate TypeScript type generation correctness with property-based testing

**Property 5**: Generated TypeScript definitions match GType schemas

**Acceptance Criteria**:
- [ ] AC6.1: Generate random GType schemas using fast-check
- [ ] AC6.2: Convert GType schemas to TypeScript definitions
- [ ] AC6.3: Parse generated TypeScript with TypeScript compiler
- [ ] AC6.4: Verify type structure matches original schema
- [ ] AC6.5: Test primitive types (string, number, boolean)
- [ ] AC6.6: Test object types with nested properties
- [ ] AC6.7: Test array types
- [ ] AC6.8: Test union types
- [ ] AC6.9: Test intersection types
- [ ] AC6.10: Test optional and nullable modifiers
- [ ] AC6.11: Test branded types
- [ ] AC6.12: Run 100+ iterations per test
- [ ] AC6.13: All property tests pass

**Test Example**:
```typescript
import * as fc from 'fast-check';

describe('TypeScript Definition Generation', () => {
  it('should generate valid TypeScript for any GType schema', () => {
    fc.assert(
      fc.property(arbitraryGType(), (gtype) => {
        const generator = new TypeDefGenerator();
        const typescript = generator.generate(gtype);
        
        // Parse with TypeScript compiler
        const result = ts.transpileModule(typescript, {});
        
        // Should compile without errors
        expect(result.diagnostics).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });
});
```

---

### Step 7: Property Test - SDK Client Stub Generation (18.2)

**File**: `packages/cli/src/codegen/sdk-generator.test.ts`

**Purpose**: Validate SDK generation correctness with property-based testing

**Property 38**: Generated SDK stubs match handler manifests

**Acceptance Criteria**:
- [ ] AC7.1: Generate random handler manifests using fast-check
- [ ] AC7.2: Generate SDK client stubs from manifests
- [ ] AC7.3: Verify method names match handler paths
- [ ] AC7.4: Verify method signatures include path parameters
- [ ] AC7.5: Verify request/response types are correctly applied
- [ ] AC7.6: Test GET, POST, PUT, PATCH, DELETE methods
- [ ] AC7.7: Test path parameter interpolation
- [ ] AC7.8: Test query parameter handling
- [ ] AC7.9: Compile generated SDK with TypeScript
- [ ] AC7.10: Verify no compilation errors
- [ ] AC7.11: Run 100+ iterations per test
- [ ] AC7.12: All property tests pass

**Test Example**:
```typescript
import * as fc from 'fast-check';

describe('SDK Client Stub Generation', () => {
  it('should generate valid SDK for any handler manifest', () => {
    fc.assert(
      fc.property(arbitraryHandlerManifest(), (manifest) => {
        const generator = new SDKGenerator();
        const sdk = generator.generate([manifest]);
        
        // Compile with TypeScript
        const result = ts.transpileModule(sdk, {});
        
        // Should compile without errors
        expect(result.diagnostics).toHaveLength(0);
        
        // Should contain method for handler
        expect(sdk).toContain(`async ${manifest.handlerId}`);
      }),
      { numRuns: 100 }
    );
  });
});
```

---

### Step 8: CLI Integration

**File**: `packages/cli/src/commands/generate.ts`

**Purpose**: Add CLI commands for code generation

**Acceptance Criteria**:
- [ ] AC8.1: Add `gati generate validators` command
- [ ] AC8.2: Add `gati generate types` command
- [ ] AC8.3: Add `gati generate sdk` command
- [ ] AC8.4: Add `gati generate bundle` command
- [ ] AC8.5: Add `gati generate all` command
- [ ] AC8.6: Support `--watch` flag for development mode
- [ ] AC8.7: Support `--output` flag for custom output directory
- [ ] AC8.8: Support `--incremental` flag for changed files only
- [ ] AC8.9: Support `--no-format` flag to skip code formatting
- [ ] AC8.10: Display progress and success messages
- [ ] AC8.11: Display helpful error messages on failure
- [ ] AC8.12: Commands work from any directory in project

**CLI Example**:
```bash
# Generate all code
gati generate all

# Generate only validators
gati generate validators --output ./generated

# Watch mode for development
gati generate all --watch

# Incremental generation
gati generate types --incremental
```

---

## Next Steps After Completion

1. **Task 19**: Handler Worker execution engine (uses generated validators)
2. **Task 24**: Kubernetes Operator (uses manifest bundles)
3. **M5 Milestone**: SDK Generation milestone completion

## Notes

- Keep implementations minimal and focused
- Prioritize correctness over optimization
- Generated code should be readable and well-commented
- All generators should handle edge cases gracefully
- Property tests are critical for validation
