# Timescape Intermediate Example - Summary

## Status: ✅ COMPLETE

## Overview
An e-commerce API demonstrating breaking changes, type conversions, database migrations, and multi-hop transformer chains.

## Files Created

### Handlers (3 files)
1. **`src/handlers/products.ts`** - V1 handler
   - Interface: `ProductV1 {id, name, price: string, description}`
   - TSV: `tsv:1732104000-products-001`
   - Tag: `v1.0.0`
   - DB Schema: `schema_v1`

2. **`src/handlers/products-v2.ts`** - V2 handler (BREAKING CHANGE)
   - Interface: `ProductV2 {id, name, priceInCents: number, description}`
   - TSV: `tsv:1732183200-products-002`
   - Tag: `v2.0.0`
   - DB Schema: `schema_v2`
   - Breaking: Field renamed + type changed

3. **`src/handlers/products-v3.ts`** - V3 handler
   - Interface: `ProductV3 {id, name, priceInCents, currency, description, inStock}`
   - TSV: `tsv:1732269600-products-003`
   - Tag: `v3.0.0`
   - DB Schema: `schema_v3`
   - Non-breaking: Added fields with defaults

### Transformers (2 files)
4. **`src/transformers/products-v1-v2.ts`** - Breaking change transformer
   - Forward: V1 → V2 (string to cents conversion)
   - Backward: V2 → V1 (cents to string conversion)
   - Type conversion: `"29.99"` ↔ `2999`
   - Field mapping: `price` ↔ `priceInCents`

5. **`src/transformers/products-v2-v3.ts`** - Non-breaking transformer
   - Forward: V2 → V3 (add defaults)
   - Backward: V3 → V2 (remove new fields)
   - Simpler than V1↔V2

### Database Migrations (5 files)
6. **`migrations/001_initial_schema.sql`** - V1 schema
   - Creates products table with string price
   - Inserts sample data

7. **`migrations/002_price_to_cents.sql`** - V2 migration
   - Converts price (string) to price_in_cents (integer)
   - Data transformation: `"29.99"` → `2999`
   - Table recreation (SQLite limitation)

8. **`migrations/002_price_to_cents_rollback.sql`** - V2 rollback
   - Converts back to string format
   - Data transformation: `2999` → `"29.99"`

9. **`migrations/003_add_currency_and_stock.sql`** - V3 migration
   - Adds currency column (default: "USD")
   - Adds in_stock column (default: 1)

10. **`migrations/003_add_currency_and_stock_rollback.sql`** - V3 rollback
    - Removes currency and in_stock columns

### Modules (1 file)
11. **`src/modules/database.ts`** - Database module
    - Mock database client
    - Schema version awareness
    - CRUD operations

### Configuration (3 files)
12. **`package.json`** - Package configuration
    - Scripts: `dev`, `build`, `test`, `migrate`

13. **`gati.config.ts`** - Timescape configuration
    - Max chain: 10 hops
    - DB schema versioning enabled

14. **`tsconfig.json`** - TypeScript configuration

### Documentation (2 files)
15. **`README.md`** - Comprehensive tutorial (400+ lines)
    - Breaking change explanation
    - Transformer implementation
    - Database migration guide
    - Multi-hop chain explanation
    - Running instructions
    - Troubleshooting

16. **`EXAMPLE_SUMMARY.md`** - This file

### Testing & Utilities (2 files)
17. **`test-requests.js`** - Test script
    - 15+ test scenarios
    - Version-specific requests
    - Timestamp requests
    - Multi-hop demonstrations

18. **`run-migrations.js`** - Migration runner
    - Executes migrations in order
    - Shows SQL preview
    - Error handling

## Key Concepts Demonstrated

### 1. Breaking Changes ✅
- Field rename: `price` → `priceInCents`
- Type change: `string` → `number`
- Value format: `"29.99"` → `2999`
- Handled transparently

### 2. Type Conversions ✅
- String to cents: `parseFloat()` + `* 100`
- Cents to string: `/ 100` + `toFixed(2)`
- Precision handling with `Math.round()`

### 3. Database Migrations ✅
- Forward migrations (V1 → V2 → V3)
- Rollback scripts (V3 → V2 → V1)
- Data transformation during migration
- Schema versioning

### 4. Multi-Hop Chains ✅
- V1 → V2 → V3 (forward)
- V3 → V2 → V1 (backward)
- Automatic chain execution
- 2-hop demonstration

### 5. Non-Breaking Changes ✅
- V2 → V3: Added fields with defaults
- Simpler transformers
- Old clients unaffected

## Version Timeline

```
V1 (2025-11-20T10:00:00Z)
├─ TSV: tsv:1732104000-products-001
├─ Tag: v1.0.0
├─ Schema: schema_v1
└─ Format: {id, name, price: string, description}

V2 (2025-11-21T10:00:00Z) ← BREAKING CHANGE
├─ TSV: tsv:1732183200-products-002
├─ Tag: v2.0.0
├─ Schema: schema_v2 (migration required)
├─ Format: {id, name, priceInCents: number, description}
└─ Changes: price → priceInCents, string → number

V3 (2025-11-22T10:00:00Z)
├─ TSV: tsv:1732269600-products-003
├─ Tag: v3.0.0
├─ Schema: schema_v3 (migration required)
├─ Format: {id, name, priceInCents, currency, description, inStock}
└─ Changes: Added currency and inStock (non-breaking)
```

## Test Scenarios

| # | Test | Version | Expected Result |
|---|------|---------|-----------------|
| 1 | GET /products | v1.0.0 | String price format |
| 2 | GET /products | v2.0.0 | Integer priceInCents |
| 3 | GET /products | v3.0.0 | With currency and stock |
| 4 | GET /products | 2025-11-20T12:00:00Z | V1 era response |
| 5 | GET /products | 2025-11-21T12:00:00Z | V2 era response |
| 6 | GET /products | 2025-11-22T12:00:00Z | V3 era response |
| 7 | GET /products | tsv:...-001 | Direct V1 TSV |
| 8 | GET /products | tsv:...-002 | Direct V2 TSV |
| 9 | GET /products | tsv:...-003 | Direct V3 TSV |
| 10 | GET /products | v1.0.0 (V3 handler) | Multi-hop: V1→V2→V3→V2→V1 |
| 11 | GET /products/1 | v1.0.0 | Single product V1 |
| 12 | GET /products/1 | v2.0.0 | Single product V2 |
| 13 | GET /products/1 | v3.0.0 | Single product V3 |
| 14 | GET /products | (none) | Latest (V3) |
| 15 | Price comparison | All | Format differences |

## Transformer Logic

### V1 ↔ V2 (Breaking Change)

**Forward (V1 → V2):**
```typescript
// Request: Convert price filter
if (data.price) {
  data.priceInCents = Math.round(parseFloat(data.price) * 100);
  delete data.price;
}

// Response: Already V2 format
return data;
```

**Backward (V2 → V1):**
```typescript
// Request: Convert priceInCents filter
if (data.priceInCents) {
  data.price = (data.priceInCents / 100).toFixed(2);
  delete data.priceInCents;
}

// Response: Convert to V1 format
return {
  id: data.id,
  name: data.name,
  price: (data.priceInCents / 100).toFixed(2),
  description: data.description
};
```

### V2 ↔ V3 (Non-Breaking)

**Forward (V2 → V3):**
```typescript
// Request: No changes needed
return data;

// Response: Already V3 format
return data;
```

**Backward (V3 → V2):**
```typescript
// Request: Remove V3 fields
const { currency, inStock, ...v2Data } = data;
return v2Data;

// Response: Remove V3 fields
return {
  id: data.id,
  name: data.name,
  priceInCents: data.priceInCents,
  description: data.description
};
```

## Database Schema Evolution

### V1 Schema
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,  -- "29.99"
  description TEXT NOT NULL
);
```

### V2 Schema (Breaking)
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,  -- 2999
  description TEXT NOT NULL
);
```

### V3 Schema (Non-Breaking)
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT NOT NULL,
  in_stock INTEGER NOT NULL DEFAULT 1
);
```

## Learning Outcomes

After completing this example, developers will understand:
- ✅ How to handle breaking changes safely
- ✅ How to implement type conversions in transformers
- ✅ How to coordinate database migrations with API versions
- ✅ How multi-hop transformer chains work
- ✅ How to write rollback scripts
- ✅ The difference between breaking and non-breaking changes
- ✅ How to test versioned APIs comprehensively

## Comparison with Beginner Example

| Feature | Beginner | Intermediate |
|---------|----------|--------------|
| Versions | 2 | 3 |
| Breaking Changes | 0 | 1 (V1→V2) |
| Type Conversions | None | String ↔ Number |
| DB Migrations | None | 2 migrations + rollbacks |
| Transformer Complexity | Simple | Complex |
| Max Hops | 1 | 2 |
| Files | 9 | 18 |
| LOC | ~500 | ~1,200 |
| Difficulty | Easy | Medium |

## Next Steps

Developers should proceed to:
1. **Advanced Example** - Multi-service coordination, 5+ hop chains, performance optimization

## Metrics

- **Files Created:** 18
- **Lines of Code:** ~1,200
- **Documentation:** ~500 lines
- **Test Scenarios:** 15
- **Concepts Covered:** 5
- **Migrations:** 3 forward + 2 rollback
- **Estimated Learning Time:** 60 minutes
- **Actual Implementation Time:** 2 days

## Status

**Completion Date:** 2025-11-22  
**Status:** ✅ COMPLETE  
**Ready for:** User testing and feedback  
**Next:** Task 8.3 (Advanced Example)
