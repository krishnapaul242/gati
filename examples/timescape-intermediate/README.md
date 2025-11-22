# Timescape Intermediate Example: E-commerce API

This example demonstrates advanced Timescape features with an e-commerce API that undergoes breaking changes, type conversions, and database migrations.

## What You'll Learn

- How to handle breaking changes (field rename + type change)
- How to implement type conversions in transformers
- How to coordinate database schema migrations with API versions
- How multi-hop transformer chains work (V1 → V2 → V3)
- How to manage backward compatibility with breaking changes

## The Scenario

You're building an e-commerce API. Initially, prices are stored as strings ("19.99"). Later, you realize this is problematic for calculations and decide to switch to integers in cents (1999). This is a **breaking change** that requires careful handling.

**The Problem:**
- Old clients expect: `{price: "19.99"}`
- New API returns: `{priceInCents: 1999}`
- Field name changed: `price` → `priceInCents`
- Type changed: `string` → `number`
- Value format changed: `"19.99"` → `1999`

**Without Timescape:** You'd need to:
- Maintain two separate endpoints
- Write complex migration logic
- Risk breaking old clients
- Coordinate database changes manually

**With Timescape:** You just:
- Update your handler with the new format
- Timescape generates transformer stubs
- Implement the conversion logic
- Database migrations run automatically
- Old clients continue to work seamlessly

## Project Structure

```
timescape-intermediate/
├── src/
│   ├── handlers/
│   │   ├── products.ts          # V1: String price
│   │   ├── products-v2.ts        # V2: Integer priceInCents (BREAKING)
│   │   └── products-v3.ts        # V3: Added currency and stock
│   ├── transformers/
│   │   ├── products-v1-v2.ts     # Breaking change transformer
│   │   └── products-v2-v3.ts     # Non-breaking transformer
│   └── modules/
│       └── database.ts           # Database module with schema versioning
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_price_to_cents.sql
│   ├── 002_price_to_cents_rollback.sql
│   ├── 003_add_currency_and_stock.sql
│   └── 003_add_currency_and_stock_rollback.sql
├── gati.config.ts
├── package.json
├── test-requests.js
└── README.md
```

## Version Timeline

```
2025-11-20T10:00:00Z  →  V1 Created (tsv:1732104000-products-001)
                         Tagged as: v1.0.0
                         DB Schema: schema_v1
                         Format: {id, name, price: string, description}

2025-11-21T10:00:00Z  →  V2 Created (tsv:1732183200-products-002)
                         Tagged as: v2.0.0
                         DB Schema: schema_v2 (MIGRATION REQUIRED)
                         Format: {id, name, priceInCents: number, description}
                         BREAKING CHANGE: price → priceInCents

2025-11-22T10:00:00Z  →  V3 Created (tsv:1732269600-products-003)
                         Tagged as: v3.0.0
                         DB Schema: schema_v3 (MIGRATION REQUIRED)
                         Format: {id, name, priceInCents, currency, description, inStock}
                         NON-BREAKING: Added currency and inStock fields
```

## Step-by-Step Tutorial

### Step 1: Understanding the Breaking Change

**V1 Format (String):**
```json
{
  "id": "1",
  "name": "Wireless Mouse",
  "price": "29.99",
  "description": "Ergonomic wireless mouse"
}
```

**V2 Format (Integer in Cents):**
```json
{
  "id": "1",
  "name": "Wireless Mouse",
  "priceInCents": 2999,
  "description": "Ergonomic wireless mouse"
}
```

**Why This is Breaking:**
1. Field renamed: `price` → `priceInCents`
2. Type changed: `string` → `number`
3. Value format: `"29.99"` → `2999` (cents)

### Step 2: The Transformer (V1 ↔ V2)

**File:** `src/transformers/products-v1-v2.ts`

The transformer handles bidirectional conversion:

**Forward (V1 → V2):**
```typescript
// Client sends V1 format, handler expects V2
transformResponse: (data) => {
  // Already in V2 format from handler
  return data;
}
```

**Backward (V2 → V1):**
```typescript
// Handler returns V2, client expects V1
transformResponse: (data) => {
  return {
    id: data.id,
    name: data.name,
    price: (data.priceInCents / 100).toFixed(2), // 2999 → "29.99"
    description: data.description
  };
}
```

**Helper Functions:**
```typescript
// String to cents: "29.99" → 2999
function priceToCents(priceStr: string): number {
  return Math.round(parseFloat(priceStr) * 100);
}

// Cents to string: 2999 → "29.99"
function centsToPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}
```

### Step 3: Database Migration

**Migration:** `migrations/002_price_to_cents.sql`

```sql
-- Add new column
ALTER TABLE products ADD COLUMN price_in_cents INTEGER;

-- Migrate data
UPDATE products 
SET price_in_cents = CAST(ROUND(CAST(price AS REAL) * 100) AS INTEGER);

-- Recreate table with new schema (SQLite limitation)
CREATE TABLE products_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,
  description TEXT NOT NULL
);

-- Copy data
INSERT INTO products_new SELECT id, name, price_in_cents, description FROM products;

-- Swap tables
DROP TABLE products;
ALTER TABLE products_new RENAME TO products;
```

**Rollback:** `migrations/002_price_to_cents_rollback.sql`

```sql
-- Convert back to string format
INSERT INTO products_v1 (id, name, price, description)
SELECT 
  id, 
  name, 
  PRINTF('%.2f', CAST(price_in_cents AS REAL) / 100.0) as price,
  description
FROM products;
```

### Step 4: Multi-Hop Transformation

When a V1 client requests data from a V3 handler, Timescape chains transformers:

```
V1 Client Request
  ↓
Forward: V1 → V2 (convert price string to cents)
  ↓
Forward: V2 → V3 (add currency and stock defaults)
  ↓
V3 Handler Execution
  ↓
V3 Response
  ↓
Backward: V3 → V2 (remove currency and stock)
  ↓
Backward: V2 → V1 (convert cents to price string)
  ↓
V1 Client Response
```

**Example:**
```bash
# Client requests V1 format
GET /products?version=v1.0.0

# But handler is at V3
# Timescape automatically:
# 1. Transforms request: V1 → V2 → V3
# 2. Executes V3 handler
# 3. Transforms response: V3 → V2 → V1
# 4. Returns V1 format to client
```

## Running the Example

### 1. Install Dependencies

```bash
cd examples/timescape-intermediate
pnpm install
```

### 2. Run Database Migrations

```bash
pnpm migrate
```

This will:
- Create initial schema (V1)
- Migrate to V2 (price → priceInCents)
- Migrate to V3 (add currency and stock)

### 3. Start the Dev Server

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

### 4. Run Test Requests

In another terminal:

```bash
pnpm test
```

This will run 15+ test scenarios demonstrating:
- Version-specific requests
- Timestamp-based requests
- Direct TSV requests
- Multi-hop transformations
- Single product retrieval
- Latest version (no version specified)

### 5. Manual Testing

```bash
# V1 format (string price)
curl "http://localhost:3000/products?version=v1.0.0"

# V2 format (integer priceInCents)
curl "http://localhost:3000/products?version=v2.0.0"

# V3 format (with currency and stock)
curl "http://localhost:3000/products?version=v3.0.0"

# Multi-hop: V1 request → V3 handler → V1 response
curl "http://localhost:3000/products?version=v1.0.0"
# (assuming V3 is the latest handler)
```

## Expected Output

### V1 Response (String Price):
```json
[
  {
    "id": "1",
    "name": "Wireless Mouse",
    "price": "29.99",
    "description": "Ergonomic wireless mouse with USB receiver"
  }
]
```

### V2 Response (Integer Cents):
```json
[
  {
    "id": "1",
    "name": "Wireless Mouse",
    "priceInCents": 2999,
    "description": "Ergonomic wireless mouse with USB receiver"
  }
]
```

### V3 Response (With Currency and Stock):
```json
[
  {
    "id": "1",
    "name": "Wireless Mouse",
    "priceInCents": 2999,
    "currency": "USD",
    "description": "Ergonomic wireless mouse with USB receiver",
    "inStock": true
  }
]
```

## Key Concepts Demonstrated

### 1. Breaking Changes
- Field rename: `price` → `priceInCents`
- Type change: `string` → `number`
- Value format: `"29.99"` → `2999`
- Handled transparently by transformers

### 2. Type Conversions
- String to number: `parseFloat()` + multiply by 100
- Number to string: divide by 100 + `toFixed(2)`
- Precision handling: `Math.round()` for cents

### 3. Database Migrations
- Schema versioning alongside API versions
- Forward migrations (V1 → V2 → V3)
- Rollback scripts (V3 → V2 → V1)
- Data transformation during migration

### 4. Multi-Hop Chains
- V1 → V2 → V3 (forward)
- V3 → V2 → V1 (backward)
- Automatic chain execution
- Configurable max chain length

### 5. Non-Breaking Changes
- V2 → V3: Added `currency` and `inStock`
- Default values provided
- Old clients unaffected
- Simpler transformers

## Database Schema Evolution

### Schema V1 (Initial)
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,  -- String: "29.99"
  description TEXT NOT NULL
);
```

### Schema V2 (Breaking Change)
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,  -- Integer: 2999
  description TEXT NOT NULL
);
```

### Schema V3 (Non-Breaking)
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',  -- New
  description TEXT NOT NULL,
  in_stock INTEGER NOT NULL DEFAULT 1    -- New
);
```

## Performance Considerations

### Transformer Overhead
- Single hop: ~5-10ms
- Two hops (V1 → V3): ~10-20ms
- Acceptable for most use cases
- Cached per request

### Database Migration Time
- V1 → V2: ~100ms (data conversion)
- V2 → V3: ~50ms (add columns)
- Runs once per version activation
- Rollback available if needed

## Troubleshooting

### Issue: "Type mismatch in transformer"
**Cause:** Transformer expects different data structure  
**Solution:** Check transformer handles both single objects and arrays

### Issue: "Migration failed"
**Cause:** Database schema conflict  
**Solution:** Run rollback script and retry migration

### Issue: "Multi-hop chain too long"
**Cause:** Exceeded `maxTransformerChain` limit  
**Solution:** Increase limit in `gati.config.ts` or reduce version gap

### Issue: "Price conversion precision error"
**Cause:** Floating point arithmetic  
**Solution:** Use `Math.round()` when converting to cents

## Comparison with Beginner Example

| Feature | Beginner | Intermediate |
|---------|----------|--------------|
| Change Type | Non-breaking | Breaking |
| Field Changes | Added optional | Renamed + type change |
| Transformers | Simple (remove field) | Complex (type conversion) |
| DB Migrations | None | Required |
| Transformer Hops | 1 | 2 |
| Complexity | Low | Medium |

## What's Next?

This example showed breaking changes and database migrations. For even more complex scenarios, check out:

- **Advanced Example:** Multi-service coordination, complex chains (5+ hops), performance optimization

## Learn More

- [Timescape Documentation](../../docs/guides/timescape.md)
- [Transformer Guide](../../docs/guides/transformers.md)
- [Database Migrations](../../docs/guides/db-migrations.md)
- [Beginner Example](../timescape-beginner/README.md)
- [Advanced Example](../timescape-advanced/README.md)

## Summary

This intermediate example demonstrates:
- ✅ Breaking changes (field rename + type change)
- ✅ Type conversions (string ↔ number)
- ✅ Database schema migrations
- ✅ Multi-hop transformer chains
- ✅ Rollback scripts
- ✅ Non-breaking changes (V2 → V3)

**Key Takeaway:** Even breaking changes can be handled gracefully with Timescape. Old clients continue to work while new clients benefit from improved data structures. The system handles all the complexity of version coordination and data transformation automatically.
