-- Migration: Initial Schema (V1)
-- Version: schema_v1
-- Created: 2025-11-20T10:00:00Z
-- Associated TSV: tsv:1732104000-products-001

-- Create products table with string-based price
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price TEXT NOT NULL,  -- String format: "19.99"
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Insert sample data
INSERT INTO products (id, name, price, description) VALUES
  ('1', 'Wireless Mouse', '29.99', 'Ergonomic wireless mouse with USB receiver'),
  ('2', 'Mechanical Keyboard', '89.99', 'RGB mechanical keyboard with blue switches'),
  ('3', 'USB-C Cable', '12.50', '6ft USB-C to USB-C cable, fast charging');
