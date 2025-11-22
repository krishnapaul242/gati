-- Rollback: Convert Cents back to Price String (V2 → V1)
-- This rollback converts price_in_cents back to price (string)

-- Create table with V1 schema
CREATE TABLE products_v1 (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,  -- String format
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Copy data and convert cents to string
-- 2999 → "29.99"
-- 8999 → "89.99"
-- 1250 → "12.50"
INSERT INTO products_v1 (id, name, price, description, created_at, updated_at)
SELECT 
  id, 
  name, 
  PRINTF('%.2f', CAST(price_in_cents AS REAL) / 100.0) as price,  -- Convert cents to string
  description, 
  created_at, 
  updated_at
FROM products;

-- Drop V2 table
DROP TABLE products;

-- Rename V1 table
ALTER TABLE products_v1 RENAME TO products;

-- Recreate V1 index
CREATE INDEX idx_products_name ON products(name);
