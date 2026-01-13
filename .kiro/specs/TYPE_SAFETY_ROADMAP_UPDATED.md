# End-to-End Type Safety Roadmap (UPDATED)
## GType & Gati Types Integration

**Goal:** Achieve zero type assertions with automatic validation  
**Theme:** Developer Experience - Core Goal of Gati  
**Target:** M3 - Timescape & Type System  
**Status:** 🎉 **70% Foundation Already Exists in CLI!**

---

## Current State Analysis

### ✅ What Exists (CLI Package Has Extensive Foundation!)

**`@gati-framework/cli` already includes:**

1. **Type Analyzer** (`src/analyzer/`)
   - `handler-analyzer.ts` - Analyzes handlers using ts-morph, extracts routes/methods/dependencies
   - `manifest-generator.ts` - Generates handler/module manifests
   - `file-watcher.ts` - Watches for file changes

2. **Type Extractor** (`src/extractor/`)
   - `type-extractor.ts` - Extracts TypeScript types → GType schemas with caching
   - `constraint-extractor.ts` - Extracts Brand<>, MinLen<>, MaxLen<>, Min<>, Max<>, Pattern<>
   - `extraction-cache.ts` - Incremental extraction with file hash caching
   - Supports: primitives, objects, arrays, tuples, unions, intersections, literals, branded types

3. **Code Generator** (`src/codegen/`)
   - `validator-generator.ts` - Generates optimized validator functions from GType schemas
   - `typedef-generator.ts` - Generates TypeScript type definitions from GType
   - `sdk-generator.ts` - Generates SDK clients from handler manifests
   - `bundle-generator.ts` - Generates manifest bundles for deployment
   - `index.ts` - Orchestrates all code generation

4. **CLI Commands** (`src/commands/`)
   - `generate.ts` - Commands for `gati generate validators|types|sdk|bundle|all`
   - `dev.ts` - Development server with hot reload
   - Watch mode support for continuous generation

5. **GType Foundation** (`@gati-framework/types`)
   - Brand<>, Min<>, Max<>, MinLen<>, MaxLen<>, Pattern<> combinators
   - Type definitions (GPrimitive, GObject, GArray, GUnion, etc.)

6. **Runtime Validation** (`@gati-framework/runtime`)
   - Basic validation utilities (validateGType, createValidator)

### ❌ What's Missing (Only 30% of Work Remaining!)

1. **Handler Schema Extraction** - Connect type-extractor to handler-analyzer (extract req.body/res.json types)
2. **Handler<Schema> Generic** - Type-safe handler signature with schema parameter
3. **Dev Mode Auto-Generation** - Wire validator-generator into `gati dev` watch mode
4. **Runtime Auto-Validation** - Auto-validate requests using generated validators

---

## Updated Roadmap: 9 Weeks (Reduced from 12!)

### Phase 1: Handler Schema Extraction (Weeks 1-2)
**Goal:** Connect existing type-extractor to handler analysis

**Status:** ✅ Foundation exists, just need integration!

#### Tasks
- [ ] Update `handler-analyzer.ts` to extract handler type signatures
- [ ] Extract `req.body` type from handler parameters using ts-morph
- [ ] Extract `res.json()` return type from handler body
- [ ] Use existing `type-extractor.ts` to convert TS types → GType
- [ ] Store schemas in handler manifest
- [ ] Validate extracted schemas (no circular refs, size limits)
- [ ] Use existing `extraction-cache.ts` for incremental extraction
- [ ] Add schema diffing (detect breaking changes)
- [ ] Write integration tests

**Deliverable:** Handler manifests now include request/response schemas

---

### Phase 2: Dev Mode Integration (Weeks 3-4)
**Goal:** Wire existing validator-generator into `gati dev`

**Status:** ✅ Codegen exists, just need to wire it up!

#### Tasks
- [ ] Update `commands/dev.ts` to run schema extraction on startup
- [ ] Generate validators automatically when handlers change
- [ ] Use existing `validator-generator.ts` to create validator files
- [ ] Store generated validators in `.gati/generated/validators/`
- [ ] Add watch mode for handler file changes
- [ ] Show generation progress in dev server logs
- [ ] Integrate validator generation into hot reload pipeline
- [ ] Only regenerate changed validators (incremental)
- [ ] Cache generated validators for fast restarts
- [ ] Add validation error reporting in dev mode
- [ ] Performance optimization (generation <100ms)

**Deliverable:** `gati dev` auto-generates validators on file changes

---

### Phase 3: Runtime Integration (Weeks 5-7)
**Goal:** Add Handler<Schema> generic and auto-validation

**Status:** 🔨 New work required

#### Week 5: Handler<Schema> Generic
```typescript
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

**Tasks:**
- [ ] Design Handler<Schema> type signature
- [ ] Create TypedRequest<S> interface with typed `body` property
- [ ] Create TypedResponse<S> interface with typed `json()` method
- [ ] Backward compatibility: Handler without schema = Handler<any>
- [ ] Write type tests

#### Week 6: Auto-Validation Middleware
```typescript
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

**Tasks:**
- [ ] Create validation middleware that runs before handlers
- [ ] Load generated validators from `.gati/generated/validators/`
- [ ] Validate req.body against schema before handler execution
- [ ] Return 400 with detailed errors if validation fails
- [ ] Add validation bypass for development (optional)
- [ ] Write middleware tests

#### Week 7: Response Validation & Error Handling
**Tasks:**
- [ ] Validate res.json() responses against schema (dev mode only)
- [ ] Add schema mismatch warnings in dev mode
- [ ] Improve error messages (show path, expected, actual)
- [ ] Add validation performance metrics
- [ ] Integration tests with real handlers
- [ ] Documentation and migration guide

**Deliverable:** `@gati-framework/runtime@3.0.0` with Handler<Schema>

---

### Phase 4: Documentation & Polish (Weeks 8-9)
**Goal:** Document and migrate examples

#### Week 8: Documentation
- [ ] Write comprehensive type safety guide
- [ ] Create migration guide from manual validation → automatic
- [ ] Document Handler<Schema> API
- [ ] Document GType schema format
- [ ] Document validator generation process
- [ ] Create troubleshooting guide

#### Week 9: Examples & Migration
- [ ] Update Todo API example to use Handler<Schema>
- [ ] Create type safety example app
- [ ] Migrate all example apps to Handler<Schema>
- [ ] Create video tutorial
- [ ] Update README with type safety features
- [ ] Announce M3 type safety completion 🎉

**Deliverable:** Complete documentation and migrated examples

---

## Timeline Summary

| Phase | Duration | Deliverable | Status |
|-------|----------|-------------|--------|
| Phase 1: Handler Schema Extraction | Weeks 1-2 | Extract req/res types from handlers | ✅ Foundation exists |
| Phase 2: Dev Mode Integration | Weeks 3-4 | Auto-generate validators in dev mode | ✅ Codegen exists |
| Phase 3: Runtime Integration | Weeks 5-7 | Handler<Schema> + auto-validation | 🔨 New work |
| Phase 4: Documentation & Polish | Weeks 8-9 | Docs, examples, migration guide | 🔨 New work |

**Total Duration:** 9 weeks (2 months) - **Reduced from 12 weeks!**

**Key Insight:** CLI already has 70% of the infrastructure! Just need to:
1. Connect handler-analyzer → type-extractor (extract handler schemas)
2. Wire validator-generator into `gati dev` watch mode
3. Add Handler<Schema> generic to runtime
4. Create auto-validation middleware

---

## What CLI Already Has (Detailed)

### 1. Type Extraction (`src/extractor/type-extractor.ts`)
```typescript
class TypeExtractor {
  extractType(filePath: string, typeName: string): ExtractionResult
  // Supports: primitives, objects, arrays, tuples, unions, intersections, literals
  // Has: caching, depth limits, size limits, warnings, errors
}
```

### 2. Constraint Extraction (`src/extractor/constraint-extractor.ts`)
```typescript
class ConstraintExtractor {
  extractBrand(type: Type): BrandInfo | null
  extractStringConstraints(type: Type): StringConstraints
  extractNumberConstraints(type: Type): NumberConstraints
  // Detects: Brand<>, MinLen<>, MaxLen<>, Pattern<>, Min<>, Max<>, MultipleOf<>
}
```

### 3. Validator Generation (`src/codegen/validator-generator.ts`)
```typescript
class ValidatorGenerator {
  generate(schema: GType, options): GeneratedValidator
  // Generates optimized validator functions with error messages
}
```

### 4. Handler Analysis (`src/analyzer/handler-analyzer.ts`)
```typescript
function analyzeProject(projectRoot: string): ProjectManifest
// Extracts: handlers, modules, routes, dependencies
// Missing: req.body/res.json type extraction
```

### 5. Code Generation Orchestration (`src/codegen/index.ts`)
```typescript
async function generateValidators(schemas, options): Promise<CodegenResult>
async function generateTypes(schemas, options): Promise<CodegenResult>
async function generateSDK(manifests, options): Promise<CodegenResult>
async function generateAll(...): Promise<CodegenResult>
```

---

## Migration Path

### Current (Pre-M3)
```typescript
const body = req.body as Record<string, unknown>;
if (!body.title || typeof body.title !== 'string') {
  return res.status(400).json({ error: 'Title required' });
}
```

### Phase 1-2 (Schema Extraction + Generation)
```typescript
// CLI auto-generates:
// - todos.schema.ts (GType schema)
// - todos.validator.ts (Runtime validator)

// Still manual validation in handler
const body = req.body as Record<string, unknown>;
// TODO: Use generated validator
```

### Phase 3 (Handler<Schema> + Auto-Validation)
```typescript
// Define schema
export const CreateTodoSchema = { ... };

// Handler typed with schema
export const handler: Handler<typeof CreateTodoSchema> = async (req, res) => {
  const { title } = req.body; // ✅ Fully typed, auto-validated!
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
  const { title } = req.body; // ✅ Fully typed, auto-validated!
};
```

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

## Next Steps

### Immediate (This Week)
1. Read `handler-analyzer.ts` and understand handler extraction
2. Design schema extraction integration
3. Prototype req.body type extraction using ts-morph
4. Test with Todo API example

### Short Term (Next 2 Weeks)
1. Complete Phase 1 (Handler Schema Extraction)
2. Test with multiple handler patterns
3. Validate schema extraction accuracy

### Medium Term (Next 2 Months)
1. Complete all 4 phases
2. Update all examples
3. Write migration guide
4. Publish stable M3 release

---

## Summary

**Vision:** Zero type assertions, automatic validation, single source of truth

**Key Discovery:** CLI already has 70% of the infrastructure!

**Existing Assets:**
- ✅ Type extractor with constraint support
- ✅ Validator generator
- ✅ Handler analyzer
- ✅ Code generation orchestration
- ✅ Watch mode and caching

**Remaining Work:**
1. Connect handler-analyzer → type-extractor (2 weeks)
2. Wire into `gati dev` watch mode (2 weeks)
3. Add Handler<Schema> generic (3 weeks)
4. Documentation and examples (2 weeks)

**Total:** 9 weeks instead of 12 weeks!

**This is the Gati way.** 🚀
