# End-to-End Type Safety Roadmap
## GType & Gati Types Integration

**Goal:** Achieve zero type assertions with automatic validation  
**Theme:** Developer Experience - Core Goal of Gati  
**Target:** M3 - Timescape & Type System

---

## Current State Analysis

### ✅ What Exists
1. **GType Foundation** (`packages/contracts/src/types/gtype.ts`)
   - Type definitions (GPrimitiveType, GObjectType, GArrayType, GRefType)
   - Brand support for nominal typing
   - Validation constraints (min, max, pattern, etc.)

2. **Validation Utilities** (`packages/contracts/src/utils/validation.ts`)
   - AJV-based schema validation
   - Envelope validation
   - Error formatting

3. **Runtime Types** (`packages/runtime/src/types/`)
   - Handler, Request, Response interfaces
   - `req.body: unknown` (intentional for safety)

4. **Contracts Package** (Published)
   - `@gati-framework/contracts@1.2.0`
   - Foundation ready for type system

### ❌ What's Missing
1. **Type Analyzer** - Extract TypeScript types → GType schemas
2. **Validator Generator** - Generate runtime validators from GType
3. **Handler Type Inference** - `Handler<Schema>` generic support
4. **CLI Integration** - Automatic schema generation
5. **Dev Server Integration** - Schema validation in hot reload

---

## Roadmap: 4 Phases

### Phase 1: Type Analyzer & Schema Generation
**Duration:** 2-3 weeks  
**Priority:** Critical  
**Dependencies:** None

#### Deliverables
1. **`@gati-framework/analyzer` Package**
   ```
   packages/analyzer/
   ├── src/
   │   ├── TypeAnalyzer.ts      # Extract TS types
   │   ├── GTypeGenerator.ts    # Convert to GType
   │   ├── SchemaExtractor.ts   # Find handler schemas
   │   └── index.ts
   ├── test/
   │   └── analyzer.test.ts
   └── package.json
   ```

2. **Features**
   - Extract TypeScript interfaces/types
   - Convert to GType schemas
   - Support branded types (Email, UUID, etc.)
   - Handle nested objects and arrays
   - Detect required vs optional fields

3. **Example Output**
   ```typescript
   // Input: TypeScript interface
   interface CreateTodoRequest {
     title: string;
     description?: string;
   }
   
   // Output: GType schema
   {
     kind: 'object',
     properties: {
       title: { kind: 'string' },
       description: { kind: 'string', nullable: true }
     },
     required: ['title']
   }
   ```

#### Tasks
- [ ] Create analyzer package structure
- [ ] Implement TypeScript AST traversal
- [ ] Build GType schema generator
- [ ] Add branded type support
- [ ] Write comprehensive tests
- [ ] Publish `@gati-framework/analyzer@0.1.0`

---

### Phase 2: Validator Generator & Runtime
**Duration:** 2-3 weeks  
**Priority:** Critical  
**Dependencies:** Phase 1

#### Deliverables
1. **`@gati-framework/codegen` Package**
   ```
   packages/codegen/
   ├── src/
   │   ├── ValidatorGenerator.ts    # Generate validators
   │   ├── TypeInference.ts         # Type inference helpers
   │   ├── templates/
   │   │   └── validator.template.ts
   │   └── index.ts
   ├── test/
   │   └── codegen.test.ts
   └── package.json
   ```

2. **Features**
   - Generate optimized validators from GType
   - Type guard functions
   - Error messages with field paths
   - Support for nested validation
   - Branded type validation

3. **Example Output**
   ```typescript
   // Generated validator
   export function validateCreateTodo(data: unknown): data is CreateTodoRequest {
     if (typeof data !== 'object' || data === null) return false;
     if (!('title' in data)) return false;
     if (typeof data.title !== 'string') return false;
     if ('description' in data && typeof data.description !== 'string') return false;
     return true;
   }
   
   // Generated error function
   export function validateCreateTodoWithErrors(data: unknown): ValidationResult {
     const errors: ValidationError[] = [];
     if (typeof data !== 'object' || data === null) {
       errors.push({ path: '/', message: 'Must be an object' });
       return { valid: false, errors };
     }
     // ... detailed validation
     return { valid: errors.length === 0, errors };
   }
   ```

#### Tasks
- [ ] Create codegen package structure
- [ ] Implement validator template system
- [ ] Build type inference utilities
- [ ] Add error message generation
- [ ] Write comprehensive tests
- [ ] Publish `@gati-framework/codegen@0.1.0`

---

### Phase 3: Handler Type System Integration
**Duration:** 2-3 weeks  
**Priority:** Critical  
**Dependencies:** Phase 1, Phase 2

#### Deliverables
1. **Enhanced Runtime Types**
   ```typescript
   // packages/runtime/src/types/handler.ts
   
   // Type inference from GType schema
   type InferGType<T extends GType> = 
     T extends GObjectType ? InferObject<T> :
     T extends GPrimitiveType ? InferPrimitive<T> :
     T extends GArrayType ? InferArray<T> :
     never;
   
   // Handler with schema
   export type Handler<TSchema extends GType = never> = (
     req: [TSchema] extends [never] 
       ? Request 
       : Request & { body: InferGType<TSchema> },
     res: Response,
     gctx: GlobalContext,
     lctx: LocalContext
   ) => unknown | Promise<unknown>;
   ```

2. **Automatic Validation Middleware**
   ```typescript
   // packages/runtime/src/validation/middleware.ts
   export function createValidationMiddleware<T extends GType>(
     schema: T,
     validator: (data: unknown) => data is InferGType<T>
   ): Middleware {
     return async (req, res, next) => {
       if (!validator(req.body)) {
         return res.status(400).json({ 
           error: 'Validation failed',
           details: getValidationErrors(req.body, schema)
         });
       }
       next();
     };
   }
   ```

3. **Usage Example**
   ```typescript
   // Define schema
   export const CreateTodoSchema = {
     kind: 'object',
     properties: {
       title: { kind: 'string', minLength: 1, maxLength: 100 }
     },
     required: ['title']
   } as const;
   
   // Handler automatically typed
   export const handler: Handler<typeof CreateTodoSchema> = async (req, res) => {
     // req.body is typed as { title: string }
     const { title } = req.body; // ✅ No 'as' needed!
     
     const todo = { id: '1', title, completed: false };
     res.json({ todo });
   };
   ```

#### Tasks
- [ ] Implement type inference utilities
- [ ] Create Handler<Schema> generic
- [ ] Build validation middleware
- [ ] Add error formatting
- [ ] Update runtime package
- [ ] Write comprehensive tests
- [ ] Publish `@gati-framework/runtime@3.0.0`

---

### Phase 4: CLI & Dev Server Integration
**Duration:** 2-3 weeks  
**Priority:** High  
**Dependencies:** Phase 1, Phase 2, Phase 3

#### Deliverables
1. **CLI Schema Commands**
   ```bash
   # Generate schemas from handlers
   gati schema generate
   
   # Validate schemas
   gati schema validate
   
   # Show schema diff
   gati schema diff
   ```

2. **Dev Server Auto-Generation**
   - Watch handler files for changes
   - Extract schemas automatically
   - Generate validators on save
   - Hot reload with validation

3. **Schema Files**
   ```
   src/handlers/
   ├── todos.ts
   ├── todos.schema.ts          # Auto-generated
   └── todos.validator.ts       # Auto-generated
   ```

4. **Dev Experience**
   ```typescript
   // Developer writes this
   interface CreateTodoRequest {
     title: string;
   }
   
   export const handler: Handler = async (req, res) => {
     // ...
   };
   
   // CLI auto-generates:
   // 1. todos.schema.ts - GType schema
   // 2. todos.validator.ts - Runtime validator
   // 3. Handler type is automatically inferred
   ```

#### Tasks
- [ ] Add schema generation to CLI
- [ ] Integrate with file watcher
- [ ] Build schema diff viewer
- [ ] Add validation to dev server
- [ ] Update hot reload logic
- [ ] Write comprehensive tests
- [ ] Publish `@gati-framework/cli@2.0.0`

---

## Implementation Priority

### Week 1-3: Phase 1 (Type Analyzer)
**Focus:** Extract TypeScript types → GType schemas

**Critical Path:**
1. TypeScript AST traversal
2. GType schema generation
3. Branded type support
4. Test coverage

**Deliverable:** `@gati-framework/analyzer@0.1.0`

### Week 4-6: Phase 2 (Validator Generator)
**Focus:** GType schemas → Runtime validators

**Critical Path:**
1. Validator code generation
2. Type guard functions
3. Error message formatting
4. Test coverage

**Deliverable:** `@gati-framework/codegen@0.1.0`

### Week 7-9: Phase 3 (Handler Types)
**Focus:** Handler<Schema> integration

**Critical Path:**
1. Type inference utilities
2. Handler generic implementation
3. Validation middleware
4. Runtime integration

**Deliverable:** `@gati-framework/runtime@3.0.0`

### Week 10-12: Phase 4 (CLI Integration)
**Focus:** Automatic schema generation in dev workflow

**Critical Path:**
1. CLI schema commands
2. File watcher integration
3. Dev server validation
4. Hot reload updates

**Deliverable:** `@gati-framework/cli@2.0.0`

---

## Success Metrics

### Developer Experience
- ✅ Zero type assertions in handlers
- ✅ Automatic validation before handler runs
- ✅ Clear error messages with field paths
- ✅ Single source of truth (TypeScript types)
- ✅ Hot reload with schema updates

### Type Safety
- ✅ Compile-time type checking
- ✅ Runtime validation matches types
- ✅ No `as` or `any` in handler code
- ✅ Branded type support

### Performance
- ✅ Fast schema generation (<100ms)
- ✅ Optimized validators (no heavy deps)
- ✅ Minimal runtime overhead

---

## Migration Path

### Current (Pre-M3)
```typescript
const body = req.body as Record<string, unknown>;
if (!body.title || typeof body.title !== 'string') {
  return res.status(400).json({ error: 'Title required' });
}
```

### Phase 1-2 (Schema Definition)
```typescript
// Define schema
export const CreateTodoSchema = { ... };

// Still manual validation
const body = req.body as Record<string, unknown>;
// TODO: Use generated validator
```

### Phase 3 (Type Integration)
```typescript
// Handler typed with schema
export const handler: Handler<typeof CreateTodoSchema> = async (req, res) => {
  // req.body typed, but still need manual validation
  const { title } = req.body;
};
```

### Phase 4 (Full Automation)
```typescript
// Just write TypeScript
interface CreateTodoRequest {
  title: string;
}

// Handler automatically typed and validated
export const handler: Handler = async (req, res) => {
  const { title } = req.body; // ✅ Fully typed, auto-validated
};
```

---

## Dependencies & Packages

### New Packages
1. `@gati-framework/analyzer@0.1.0` - Type extraction
2. `@gati-framework/codegen@0.1.0` - Code generation

### Updated Packages
3. `@gati-framework/runtime@3.0.0` - Handler<Schema> support
4. `@gati-framework/cli@2.0.0` - Schema commands

### Existing (No Changes)
5. `@gati-framework/contracts@1.2.0` - GType foundation ✅
6. `@gati-framework/core@0.4.5` - Core types ✅

---

## Technical Decisions

### 1. TypeScript Compiler API
**Decision:** Use TypeScript Compiler API for type extraction  
**Rationale:** Official, accurate, supports all TS features  
**Alternative:** ts-morph (higher-level API)

### 2. Validator Generation Strategy
**Decision:** Generate optimized type guards  
**Rationale:** Fast, no runtime deps, tree-shakeable  
**Alternative:** Use AJV (heavier, more features)

### 3. Schema Storage
**Decision:** Co-locate schemas with handlers  
**Rationale:** Easy to find, clear ownership  
**Alternative:** Central schema directory

### 4. Validation Timing
**Decision:** Validate before handler execution  
**Rationale:** Consistent, automatic, fail-fast  
**Alternative:** Manual validation in handler

---

## Risks & Mitigation

### Risk 1: Complex Type Inference
**Impact:** High  
**Mitigation:** Start with simple types, iterate  
**Fallback:** Manual schema definition

### Risk 2: Performance Overhead
**Impact:** Medium  
**Mitigation:** Optimize validators, benchmark  
**Fallback:** Optional validation

### Risk 3: Breaking Changes
**Impact:** High  
**Mitigation:** Major version bump, migration guide  
**Fallback:** Support both patterns temporarily

---

## Next Steps

### Immediate (This Week)
1. Create `packages/analyzer` structure
2. Implement basic TypeScript AST traversal
3. Build simple GType generator
4. Write initial tests

### Short Term (Next Month)
1. Complete Phase 1 (Analyzer)
2. Start Phase 2 (Codegen)
3. Publish alpha versions for testing

### Medium Term (Next Quarter)
1. Complete all 4 phases
2. Update all examples
3. Write migration guide
4. Publish stable M3 release

---

## Summary

**Vision:** Zero type assertions, automatic validation, single source of truth

**Approach:** 4-phase rollout over 12 weeks

**Key Packages:**
- `@gati-framework/analyzer` - Type extraction
- `@gati-framework/codegen` - Validator generation
- `@gati-framework/runtime@3.0.0` - Handler<Schema>
- `@gati-framework/cli@2.0.0` - Auto-generation

**Developer Experience:**
```typescript
// Just write TypeScript
interface CreateTodoRequest {
  title: string;
}

// Everything else is automatic
export const handler: Handler = async (req, res) => {
  const { title } = req.body; // ✅ Typed & validated
};
```

**This is the Gati way.** 🚀
