# Type Safety Roadmap - Quick Reference

## Goal
**Zero type assertions with automatic validation**

## Current State
- ✅ GType foundation exists (`@gati-framework/contracts`)
- ✅ Validation utilities exist
- ❌ No type analyzer
- ❌ No validator generator
- ❌ No Handler<Schema> support

## 4 Phases (12 weeks)

### Phase 1: Type Analyzer (Weeks 1-3)
**Package:** `@gati-framework/analyzer@0.1.0`
- Extract TypeScript types
- Generate GType schemas
- Support branded types

### Phase 2: Validator Generator (Weeks 4-6)
**Package:** `@gati-framework/codegen@0.1.0`
- Generate runtime validators
- Type guard functions
- Error messages

### Phase 3: Handler Types (Weeks 7-9)
**Package:** `@gati-framework/runtime@3.0.0`
- `Handler<Schema>` generic
- Type inference
- Validation middleware

### Phase 4: CLI Integration (Weeks 10-12)
**Package:** `@gati-framework/cli@2.0.0`
- Auto-generate schemas
- Dev server integration
- Hot reload with validation

## End Result

```typescript
// Developer writes
interface CreateTodoRequest {
  title: string;
}

export const handler: Handler = async (req, res) => {
  const { title } = req.body; // ✅ Typed & validated automatically
};
```

## Related Specs
- `.kiro/specs/developer-experience/` - DX requirements
- `.kiro/specs/code-generation/` - Codegen requirements
- `.kiro/specs/TYPE_SAFETY_ROADMAP.md` - Full roadmap

## Next Action
Start Phase 1: Create `packages/analyzer`
