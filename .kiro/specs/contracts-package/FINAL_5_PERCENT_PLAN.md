# Final 5% Implementation Plan

## Goal
Complete the contracts package from 95% to 100% by implementing:
1. Full Protobuf/MessagePack serialization (2%)
2. Advanced test coverage (1%)
3. Migration documentation (1%)
4. Optional enhancements (1%)

**Estimated Time:** 2-3 hours

---

## Phase 1: Protobuf/MessagePack Serialization (45 min)

### Task 1.1: Add Dependencies
```bash
cd packages/contracts
pnpm add protobufjs @msgpack/msgpack
pnpm add -D @types/protobufjs
```

### Task 1.2: Implement Protobuf Serialization
- Update `src/utils/serialization.ts`
- Use protobufjs to load `.proto` files
- Implement encode/decode for envelope, manifest, gtype
- Add error handling

### Task 1.3: Implement MessagePack Serialization
- Update `src/utils/serialization.ts`
- Use @msgpack/msgpack for binary serialization
- Support all contract types
- Add error handling

---

## Phase 2: Advanced Test Coverage (30 min)

### Task 2.1: Edge Case Tests
Create `test/edge-cases.test.ts`:
- Malformed JSON
- Missing required fields
- Invalid field types
- Boundary values (empty strings, max integers)
- Null vs undefined handling

### Task 2.2: Round-Trip Tests
Create `test/serialization.test.ts`:
- JSON → Protobuf → JSON
- JSON → MessagePack → JSON
- Verify data integrity
- Test all contract types

### Task 2.3: Performance Tests
Create `test/performance.test.ts`:
- Validation speed benchmarks
- Serialization speed benchmarks
- Memory usage tests
- Large payload handling

---

## Phase 3: Migration Documentation (20 min)

### Task 3.1: Create Migration Guide
Create `docs/MIGRATION.md`:
- From runtime types to contracts
- Breaking changes (if any)
- Code examples (before/after)
- Deprecation notices

### Task 3.2: Update README
Add migration section to `README.md`:
- Link to migration guide
- Quick migration examples
- Version compatibility matrix

---

## Phase 4: Optional Enhancements (25 min)

### Task 4.1: Validation Caching
Update `src/utils/validation.ts`:
- Cache compiled Ajv validators
- Improve performance for repeated validations
- Add cache statistics

### Task 4.2: Custom Error Messages
Update validators:
- User-friendly error messages
- Field path in errors
- Suggested fixes

### Task 4.3: Contract Versioning
Add `src/utils/versioning.ts`:
- Contract version metadata
- Compatibility checking
- Version migration helpers

---

## Phase 5: Final Polish (20 min)

### Task 5.1: Update Documentation
- Update all JSDoc comments
- Add more code examples
- Document new features

### Task 5.2: Run Full Test Suite
- Ensure all tests pass
- Check test coverage
- Fix any issues

### Task 5.3: Update Package Version
- Bump to v1.2.0 (minor - new features)
- Update CHANGELOG.md
- Commit changes

---

## Success Criteria

- [ ] Protobuf serialization works for all contracts
- [ ] MessagePack serialization works for all contracts
- [ ] 40+ tests passing (current 24 + new 16+)
- [ ] Migration guide complete
- [ ] Validation caching implemented
- [ ] Custom error messages added
- [ ] Contract versioning added
- [ ] All documentation updated
- [ ] Package builds without errors
- [ ] Ready for v1.2.0 release

---

## Implementation Order

1. **Phase 1** - Serialization (most complex, do first)
2. **Phase 2** - Tests (validate serialization works)
3. **Phase 4** - Enhancements (while fresh)
4. **Phase 3** - Documentation (last, when everything works)
5. **Phase 5** - Polish and release
