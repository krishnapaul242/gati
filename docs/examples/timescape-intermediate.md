# Timescape Intermediate Example: E-commerce API

> **Difficulty**: Intermediate  
> **Time**: 60 minutes  
> **Concepts**: Breaking changes, type conversions, database migrations, multi-hop chains

## Overview

This example demonstrates Timescape's handling of breaking changes through an e-commerce API that evolves from string prices to integer cents, with database migrations and multi-hop transformer chains.

**What you'll learn**:
- How to handle breaking changes safely
- How to implement type conversions in transformers
- How to coordinate database migrations with API versions
- How multi-hop transformer chains work
- How to write rollback scripts

## The Scenario

You're building an e-commerce API. Initially, prices are stored as strings (`"29.99"`). Later, you realize this causes precision issues and decide to switch to integer cents (`2999`). This is a **breaking change** that requires careful handling.

**Without Timescape**: You'd need to:
- Coordinate with all clients
- Schedule downtime for migration
- Risk data loss or corruption
- Maintain separate codebases

**With Timescape**: You:
- Create V2 with new format
- Write bidirectional transformers
- Run database migration
- Both versions coexist seamlessly

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

## Project Structure

```
examples/timescape-intermediate/
├── src/
│   ├── handlers/
│   │   ├── products.ts         # V1 handler
│   │   ├── products-v2.ts      # V2 handler (breaking)
│   │   └── products-v3.ts      # V3 handler
│   ├── transformers/
│   │   ├── products-v1-v2.ts   # Breaking change transformer
│   │   └── products-v2-v3.ts   # Non-breaking transformer
│   └── modules/
│       └── database.ts         # Database module
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_price_to_cents.sql
│   ├── 002_price_to_cents_rollback.sql
│   ├── 003_add_currency_and_stock.sql
│   └── 003_add_currency_and_stock_rollback.sql
├── gati.config.ts
├── run-migrations.js
├── test-requests.js
└── README.md
```

## Breaking Change: V1 → V2

### V1 Handler (String Price)

```typescript
// src/handlers/products.ts
export interface ProductV1 {
  id: string;
  name: string;
  price: string;  // "29.99"
  description: string;
}

const products: ProductV1[] = [
  { id: '1', name: 'Widget', price: '29.99', description: 'A useful widget' },
  { id: '2', name: 'Gadget', price: '49.99', description: 'An amazing gadget' },
];
```

### V2 Handler (Integer Cents)

```typescript
// src/handlers/products-v2.ts
export interface ProductV2 {
  id: string;
  name: string;
  priceInCents: number;  // 2999
  description: string;
}

const products: ProductV2[] = [
  { id: '1', name: 'Widget', priceInCents: 2999, description: 'A useful widget' },
  { id: '2', name: 'Gadget', priceInCents: 4999, description: 'An amazing gadget' },
];
```

### Bidirectional Transformer (Complex)

```typescript
// src/transformers/products-v1-v2.ts

// Forward: V1 → V2 (string to cents)
export const transformV1toV2: Transformer<ProductV1, ProductV2> = async (data) => {
  if (Array.isArray(data)) {
    return data.map(product => ({
      ...product,
      priceInCents: Math.round(parseFloat(product.price) * 100),
      price: undefined,
    }));
  }
  
  return {
    ...data,
    priceInCents: Math.round(parseFloat(data.price) * 100),
    price: undefined,
  };
};

// Backward: V2 → V1 (cents to string)
export const transformV2toV1: Transformer<ProductV2, ProductV1> = async (data) => {
  if (Array.isArray(data)) {
    return data.map(product => ({
      id: product.id,
      name: product.name,
      price: (product.priceInCents / 100).toFixed(2),
      description: product.description,
    }));
  }
  
  return {
    id: data.id,
    name: data.name,
    price: (data.priceInCents / 100).toFixed(2),
    description: data.description,
  };
};
```

## Database Migrations

### V1 Schema

```sql
-- migrations/001_initial_schema.sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,  -- "29.99"
  description TEXT NOT NULL
);

INSERT INTO products VALUES
  ('1', 'Widget', '29.99', 'A useful widget'),
  ('2', 'Gadget', '49.99', 'An amazing gadget');
```

### V2 Migration (Breaking)

```sql
-- migrations/002_price_to_cents.sql
-- Convert price (string) to price_in_cents (integer)

CREATE TABLE products_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,  -- 2999
  description TEXT NOT NULL
);

INSERT INTO products_new (id, name, price_in_cents, description)
SELECT 
  id,
  name,
  CAST(ROUND(CAST(price AS REAL) * 100) AS INTEGER),
  description
FROM products;

DROP TABLE products;
ALTER TABLE products_new RENAME TO products;
```

### V2 Rollback

```sql
-- migrations/002_price_to_cents_rollback.sql
-- Convert back to string format

CREATE TABLE products_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  description TEXT NOT NULL
);

INSERT INTO products_new (id, name, price, description)
SELECT 
  id,
  name,
  PRINTF('%.2f', CAST(price_in_cents AS REAL) / 100),
  description
FROM products;

DROP TABLE products;
ALTER TABLE products_new RENAME TO products;
```

## Multi-Hop Transformer Chains

When a client requests V1 but the handler is V3, Timescape automatically chains transformers:

```
V1 Request → V3 Handler
  ↓
V1 → V2 (string to cents)
  ↓
V2 → V3 (add currency, stock)
  ↓
V3 Handler executes
  ↓
V3 → V2 (remove currency, stock)
  ↓
V2 → V1 (cents to string)
  ↓
V1 Response
```

**Performance**: Each hop adds ~5-10ms. Max chain length is configurable (default: 10).

## Running the Example

### Installation

```bash
cd examples/timescape-intermediate
pnpm install
```

### Run Migrations

```bash
# Run all migrations
pnpm migrate

# Or manually:
node run-migrations.js
```

### Start Development Server

```bash
pnpm dev
```

### Test Requests

```bash
# Run all test scenarios
pnpm test

# Or manually test:

# V1 request (string price)
curl "http://localhost:3000/products?version=v1.0.0"
# {"products": [{"id": "1", "name": "Widget", "price": "29.99", ...}]}

# V2 request (integer cents)
curl "http://localhost:3000/products?version=v2.0.0"
# {"products": [{"id": "1", "name": "Widget", "priceInCents": 2999, ...}]}

# V3 request (with currency and stock)
curl "http://localhost:3000/products?version=v3.0.0"
# {"products": [{"id": "1", "name": "Widget", "priceInCents": 2999, "currency": "USD", "inStock": true, ...}]}
```

## Test Scenarios

The example includes 15+ comprehensive test scenarios:

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
| 10 | GET /products | v1.0.0 (V3 handler) | Multi-hop chain |
| 11 | GET /products/1 | v1.0.0 | Single product V1 |
| 12 | GET /products/1 | v2.0.0 | Single product V2 |
| 13 | GET /products/1 | v3.0.0 | Single product V3 |
| 14 | GET /products | (none) | Latest (V3) |
| 15 | Price comparison | All | Format differences |

## Key Concepts

### 1. Breaking Changes

A change is **breaking** if:
- Field is renamed (`price` → `priceInCents`)
- Type is changed (`string` → `number`)
- Required field is removed
- Constraint is tightened

### 2. Type Conversions

```typescript
// String to cents
const cents = Math.round(parseFloat("29.99") * 100); // 2999

// Cents to string
const price = (2999 / 100).toFixed(2); // "29.99"
```

**Precision**: Use `Math.round()` to avoid floating-point errors.

### 3. Database Migrations

- **Forward migration**: Transform data to new format
- **Rollback script**: Revert to old format
- **Schema versioning**: Track which version uses which schema

### 4. Multi-Hop Chains

- Timescape automatically chains transformers
- Max chain length prevents infinite loops
- Each hop adds latency (~5-10ms)
- Caching optimizes repeated transformations

### 5. Non-Breaking Changes (V2 → V3)

Adding optional fields with defaults is **non-breaking**:

```typescript
// V3 adds currency and inStock
export interface ProductV3 extends ProductV2 {
  currency: string;    // Default: "USD"
  inStock: boolean;    // Default: true
}
```

Old clients ignore new fields. New clients benefit from enhanced data.

## Troubleshooting

### Migration failed

**Error**: `SQLITE_ERROR: no such table: products_new`

**Solution**: Ensure migrations run in order. Check `run-migrations.js` execution.

### Transformer precision error

**Issue**: `29.99` becomes `29.98` after round-trip

**Solution**: Use `Math.round()` and `toFixed(2)`:

```typescript
const cents = Math.round(parseFloat(price) * 100);
const price = (cents / 100).toFixed(2);
```

### Multi-hop timeout

**Error**: `Transformer chain exceeded max length`

**Solution**: Increase `maxTransformerChain` in `gati.config.ts`:

```typescript
timescape: {
  maxTransformerChain: 20, // Default: 10
}
```

## Next Steps

After completing this example:

1. **Advanced Example**: Multi-service coordination, 5+ hop chains, performance optimization
2. **CLI Guide**: Master Timescape CLI commands
3. **Architecture**: Deep dive into transformer engine internals
4. **Production**: Deploy versioned APIs to production

## Related Documentation

- [Timescape Architecture](../architecture/timescape.md)
- [Beginner Example](./timescape-beginner.md)
- [CLI Reference](../guides/timescape-cli.md)
- [Database Migrations](../guides/database-migrations.md)

---

**Status**: 🚧 In Progress  
**Source**: `examples/timescape-intermediate/`  
**Estimated Time**: 60 minutes
