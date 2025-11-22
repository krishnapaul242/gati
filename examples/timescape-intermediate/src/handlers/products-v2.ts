/**
 * Products Handler - Version 2
 * 
 * BREAKING CHANGE: Price changed from string to number (cents):
 * - id: unique identifier
 * - name: product name
 * - priceInCents: price as integer in cents (e.g., 1999 for $19.99)
 * - description: product description
 * 
 * This is a breaking change because:
 * 1. Field renamed: price → priceInCents
 * 2. Type changed: string → number
 * 3. Value format changed: "19.99" → 1999
 * 
 * Created: 2025-11-21T10:00:00Z
 * TSV: tsv:1732183200-products-002
 * Tag: v2.0.0
 * DB Schema: schema_v2 (migration required)
 */

export interface ProductV2 {
  id: string;
  name: string;
  priceInCents: number; // Integer in cents: 1999 = $19.99
  description: string;
}

// Mock database with new format
const products: ProductV2[] = [
  {
    id: '1',
    name: 'Wireless Mouse',
    priceInCents: 2999, // $29.99
    description: 'Ergonomic wireless mouse with USB receiver'
  },
  {
    id: '2',
    name: 'Mechanical Keyboard',
    priceInCents: 8999, // $89.99
    description: 'RGB mechanical keyboard with blue switches'
  },
  {
    id: '3',
    name: 'USB-C Cable',
    priceInCents: 1250, // $12.50
    description: '6ft USB-C to USB-C cable, fast charging'
  }
];

export async function getProducts(): Promise<ProductV2[]> {
  return products;
}

export async function getProductById(id: string): Promise<ProductV2 | null> {
  return products.find(p => p.id === id) || null;
}
