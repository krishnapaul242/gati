-- Migration: Convert Price to Cents (V2)
-- Version: schema_v2
-- Created: 2025-11-21T10:00:00Z
-- Associated TSV: tsv:1732183200-products-002
-- BREAKING CHANGE: price (string) → priceInCents (integer)

-- Step 1: Add new column
ALTER TABLE products ADD COLUMN price_in_cents INTEGER;

-- Step 2: Migrate data (convert string price to cents)
-- "29.99" → 2999
-- "89.99" → 8999
-- "12.50" → 1250
UPDATE products SET price_in_cents = CAST(ROUND(CAST(price AS REAL) * 100) AS INTEGER);

-- Step 3: Make new column NOT NULL (after data migration)
-- Note: SQLite doesn't support ALTER COLUMN, so we need to recreate the table

-- Create new table with correct schema
CREATE TABLE products_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,  -- Integer in cents
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Copy data
INSERT INTO products_new (id, name, price_in_cents, description, created_at, updated_at)
SELECT id, name, price_in_cents, description, created_at, updated_at
FROM products;

-- Drop old table
DROP TABLE products;

-- Rename new table
ALTER TABLE products_new RENAME TO products;

-- Recreate index
CREATE INDEX idx_products_name ON products(name);

-- Create index on price for filtering
CREATE INDEX idx_products_price ON products(price_in_cents);
