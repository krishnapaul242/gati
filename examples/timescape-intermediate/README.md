# Timescape Intermediate Example: E-commerce API

> 🚧 **Status**: Planned for M3 (Q1 2026)  
> This example will be created once Timescape versioning is implemented.

## Overview

This example demonstrates advanced Timescape features with an e-commerce API, including breaking changes, type conversions, and database migrations.

## What You'll Learn

- Handling breaking changes with transformers
- Type conversions (string → number, etc.)
- Database schema migrations
- Backward and forward compatibility
- Testing version transformations
- Rollback strategies

## Planned Structure

```
examples/timescape-intermediate/
├── src/
│   ├── handlers/
│   │   ├── products/
│   │   │   ├── index.ts          # GET /api/products
│   │   │   ├── [id].ts           # GET /api/products/:id
│   │   │   └── create.ts         # POST /api/products
│   │   ├── orders/
│   │   │   ├── index.ts          # GET /api/orders
│   │   │   ├── [id].ts           # GET /api/orders/:id
│   │   │   └── create.ts         # POST /api/orders
│   │   └── health.ts
│   ├── transformers/
│   │   ├── product-v1-to-v2.ts   # Price string → number
│   │   └── order-v2-to-v3.ts     # Status enum change
│   ├── migrations/
│   │   ├── 001-add-product-price.ts
│   │   └── 002-change-order-status.ts
│   └── index.ts
├── versions/
│   ├── v1-2024-01-01.json        # Initial version
│   ├── v2-2024-02-01.json        # Price type change (breaking)
│   └── v3-2024-03-01.json        # Order status enum change (breaking)
├── package.json
├── gati.config.ts
└── README.md
```

## Example Scenarios

### Version 1 (2024-01-01) - Initial Release

Basic e-commerce API:

```typescript
interface Product {
  id: string;
  name: string;
  price: string;        // Price as string (e.g., "19.99")
  stock: number;
}

interface Order {
  id: string;
  productId: string;
  quantity: number;
  status: 'pending' | 'shipped' | 'delivered';
}
```

### Version 2 (2024-02-01) - Price Type Change (Breaking)

Changed price from string to number:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;        // Changed: string → number (BREAKING)
  stock: number;
  currency: string;     // Added: currency code
}

// Transformer required for v1 → v2
export const transformProductV1toV2 = (product: ProductV1): ProductV2 => ({
  ...product,
  price: parseFloat(product.price),
  currency: 'USD'
});
```

### Version 3 (2024-03-01) - Order Status Change (Breaking)

Changed order status enum:

```typescript
interface Order {
  id: string;
  productId: string;
  quantity: number;
  status: 'created' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  // Changed: More granular status values (BREAKING)
}

// Transformer required for v2 → v3
export const transformOrderV2toV3 = (order: OrderV2): OrderV3 => ({
  ...order,
  status: mapOldStatusToNew(order.status)
});
```

## Planned Commands

```bash
# Create the example project
npx gatic create ecommerce-api --template timescape-intermediate

# Start development server
cd ecommerce-api
pnpm dev

# Create a new version with breaking changes
gati version:create "Changed price to number" --breaking

# Generate transformer stub
gati transformer:generate product v1 v2

# Run migrations
gati migrate:up

# Test transformations
gati version:test v1 v2

# View breaking changes
gati version:diff v1 v2 --breaking-only

# Rollback to previous version
gati version:rollback v2
```

## Key Concepts Demonstrated

### 1. Breaking Changes with Transformers

Automatic data transformation between versions:

```typescript
// v1 client requesting v2 data
const product = await fetch('/api/products/1?version=2024-01-01');
// Timescape automatically transforms v2 → v1:
// { price: 19.99 } → { price: "19.99" }

// v2 client requesting v1 data
const product = await fetch('/api/products/1?version=2024-02-01');
// Timescape automatically transforms v1 → v2:
// { price: "19.99" } → { price: 19.99, currency: "USD" }
```

### 2. Database Migrations

Schema changes with data transformations:

```typescript
// Migration: Change price column type
export default defineMigration({
  version: '2024-02-01',
  up: async (db) => {
    // Add new column
    await db.schema.alterTable('products', (table) => {
      table.decimal('price_new', 10, 2);
    });
    
    // Transform data
    await db.raw(`
      UPDATE products 
      SET price_new = CAST(price AS DECIMAL(10,2))
    `);
    
    // Drop old column, rename new
    await db.schema.alterTable('products', (table) => {
      table.dropColumn('price');
      table.renameColumn('price_new', 'price');
    });
  },
  down: async (db) => {
    // Rollback logic
  }
});
```

### 3. Bidirectional Transformers

Support both forward and backward transformations:

```typescript
// Forward: v1 → v2
export const forward = (data: V1): V2 => ({
  ...data,
  price: parseFloat(data.price),
  currency: 'USD'
});

// Backward: v2 → v1
export const backward = (data: V2): V1 => ({
  ...data,
  price: data.price.toFixed(2)
  // currency is dropped
});
```

### 4. Version Testing

Automated testing of transformations:

```typescript
// Test transformer correctness
describe('Product v1 → v2 transformer', () => {
  it('should convert price string to number', () => {
    const v1Product = { id: '1', name: 'Widget', price: '19.99' };
    const v2Product = transformV1toV2(v1Product);
    
    expect(v2Product.price).toBe(19.99);
    expect(v2Product.currency).toBe('USD');
  });
  
  it('should be reversible', () => {
    const original = { id: '1', name: 'Widget', price: '19.99' };
    const transformed = transformV1toV2(original);
    const reversed = transformV2toV1(transformed);
    
    expect(reversed).toEqual(original);
  });
});
```

## Expected Learning Outcomes

After completing this example, you'll understand:

- ✅ How to handle breaking changes safely
- ✅ How to write bidirectional transformers
- ✅ How to manage database migrations with versions
- ✅ How to test version transformations
- ✅ How to rollback breaking changes
- ✅ Best practices for API evolution

## Prerequisites

- Completed [Beginner Example](../timescape-beginner/README.md)
- Understanding of TypeScript generics
- Basic database knowledge (SQL)
- Familiarity with API versioning concepts

## Estimated Time

**60 minutes** to complete the tutorial

## Challenges

Try these additional challenges:

1. **Add a new breaking change**: Change `quantity` from number to object with `value` and `unit`
2. **Complex transformation**: Merge two fields into one
3. **Conditional migration**: Apply different transformations based on data
4. **Performance optimization**: Batch transform large datasets

## Related Examples

- [Beginner Example](../timescape-beginner/README.md) - Simple blog API
- [Advanced Example](../timescape-advanced/README.md) - Complex versioning scenarios

## Documentation

- [Timescape Architecture](../../docs/architecture/timescape.md)
- [Database Migrations](../../docs/guides/database-migrations.md)
- [Transformer Guide](../../docs/guides/transformers.md)
- [Timescape CLI](../../docs/guides/timescape-cli.md)

## Troubleshooting

### Common Issues

**Transformer not applied:**
- Check transformer is registered in `gati.config.ts`
- Verify version numbers match exactly
- Check transformer function signature

**Migration fails:**
- Ensure database connection is configured
- Check migration order (dependencies)
- Verify data transformation logic

**Version routing incorrect:**
- Clear version cache: `gati cache:clear`
- Rebuild manifests: `gati build`
- Check version timestamps

## Contributing

Want to help create this example? Check out:

- [Contributing Guide](../../docs/contributing/README.md)
- [GitHub Issues](https://github.com/krishnapaul242/gati/issues)

---

**Status**: 🚧 Planned  
**Target Release**: M3 (Q1 2026)  
**Difficulty**: Intermediate  
**Duration**: 60 minutes  
**Last Updated**: November 22, 2025
