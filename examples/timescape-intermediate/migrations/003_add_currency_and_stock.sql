-- Migration: Add Currency and Stock (V3)
-- Version: schema_v3
-- Created: 2025-11-22T10:00:00Z
-- Associated TSV: tsv:1732269600-products-003
-- NON-BREAKING: Added currency and inStock columns with defaults

-- Add currency column with default
ALTER TABLE products ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

-- Add inStock column with default
ALTER TABLE products ADD COLUMN in_stock INTEGER NOT NULL DEFAULT 1;  -- SQLite uses INTEGER for boolean

-- Update existing products with appropriate values
UPDATE products SET in_stock = 1 WHERE id IN ('1', '2');  -- Mouse and Keyboard in stock
UPDATE products SET in_stock = 0 WHERE id = '3';  -- Cable out of stock

-- Create index on stock status for filtering
CREATE INDEX idx_products_stock ON products(in_stock);

-- Create index on currency for multi-currency support
CREATE INDEX idx_products_currency ON products(currency);
