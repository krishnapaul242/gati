/**
 * Products Handler - Version 1
 * 
 * Initial version with string-based pricing:
 * - id: unique identifier
 * - name: product name
 * - price: price as string (e.g., "19.99")
 * - description: product description
 * 
 * Created: 2025-11-20T10:00:00Z
 * TSV: tsv:1732104000-products-001
 * Tag: v1.0.0
 * DB Schema: schema_v1
 */

export interface ProductV1 {
  id: string;
  name: string;
  price: string; // String format: "19.99"
  description: string;
}

// Mock database
const products: ProductV1[] = [
  {
    id: '1',
    name: 'Wireless Mouse',
    price: '29.99',
    description: 'Ergonomic wireless mouse with USB receiver'
  },
  {
    id: '2',
    name: 'Mechanical Keyboard',
    price: '89.99',
    description: 'RGB mechanical keyboard with blue switches'
  },
  {
    id: '3',
    name: 'USB-C Cable',
    price: '12.50',
    description: '6ft USB-C to USB-C cable, fast charging'
  }
];

export async function getProducts(): Promise<ProductV1[]> {
  return products;
}

export async function getProductById(id: string): Promise<ProductV1 | null> {
  return products.find(p => p.id === id) || null;
}
