-- Rollback: Remove Currency and Stock (V3 → V2)
-- This rollback removes the currency and in_stock columns

-- Drop indexes first
DROP INDEX IF EXISTS idx_products_stock;
DROP INDEX IF EXISTS idx_products_currency;

-- Create V2 table without currency and in_stock
CREATE TABLE products_v2 (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_in_cents INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Copy data (excluding currency and in_stock)
INSERT INTO products_v2 (id, name, price_in_cents, description, created_at, updated_at)
SELECT id, name, price_in_cents, description, created_at, updated_at
FROM products;

-- Drop V3 table
DROP TABLE products;

-- Rename V2 table
ALTER TABLE products_v2 RENAME TO products;

-- Recreate V2 indexes
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_price ON products(price_in_cents);
