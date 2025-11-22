/**
 * Products Handler - Version 3
 * 
 * Added currency support:
 * - id: unique identifier
 * - name: product name
 * - priceInCents: price as integer in cents
 * - currency: ISO currency code (NEW)
 * - description: product description
 * - inStock: availability status (NEW)
 * 
 * Changes from V2:
 * - Added currency field (non-breaking, has default)
 * - Added inStock field (non-breaking, has default)
 * 
 * Created: 2025-11-22T10:00:00Z
 * TSV: tsv:1732269600-products-003
 * Tag: v3.0.0
 * DB Schema: schema_v3 (migration required)
 */

export interface ProductV3 {
  id: string;
  name: string;
  priceInCents: number;
  currency: string; // ISO currency code: "USD", "EUR", etc.
  description: string;
  inStock: boolean; // Availability status
}

// Mock database with currency and stock info
const products: ProductV3[] = [
  {
    id: '1',
    name: 'Wireless Mouse',
    priceInCents: 2999,
    currency: 'USD',
    description: 'Ergonomic wireless mouse with USB receiver',
    inStock: true
  },
  {
    id: '2',
    name: 'Mechanical Keyboard',
    priceInCents: 8999,
    currency: 'USD',
    description: 'RGB mechanical keyboard with blue switches',
    inStock: true
  },
  {
    id: '3',
    name: 'USB-C Cable',
    priceInCents: 1250,
    currency: 'USD',
    description: '6ft USB-C to USB-C cable, fast charging',
    inStock: false
  }
];

export async function getProducts(): Promise<ProductV3[]> {
  return products;
}

export async function getProductById(id: string): Promise<ProductV3 | null> {
  return products.find(p => p.id === id) || null;
}
