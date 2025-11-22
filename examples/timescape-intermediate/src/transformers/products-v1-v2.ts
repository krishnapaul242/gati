/**
 * Transformer: Products V1 ↔ V2
 * 
 * BREAKING CHANGE TRANSFORMATION
 * 
 * Handles transformation between:
 * - V1: {id, name, price: string, description}
 * - V2: {id, name, priceInCents: number, description}
 * 
 * Changes:
 * 1. Field renamed: price → priceInCents
 * 2. Type changed: string → number
 * 3. Value format: "19.99" → 1999 (cents)
 * 
 * This transformer is IMMUTABLE and was generated on 2025-11-21T10:00:00Z
 * DO NOT MODIFY - Create a new version instead
 */

import type { ProductV1 } from '../handlers/products';
import type { ProductV2 } from '../handlers/products-v2';
import type { TransformerPair } from '@gati-framework/runtime/timescape/types';

/**
 * Convert string price to cents
 * "19.99" → 1999
 * "12.50" → 1250
 */
function priceToCents(priceStr: string): number {
  const price = parseFloat(priceStr);
  return Math.round(price * 100);
}

/**
 * Convert cents to string price
 * 1999 → "19.99"
 * 1250 → "12.50"
 */
function centsToPrice(cents: number): string {
  return (cents / 100).toFixed(2);
}

export const productsV1V2Transformer: TransformerPair = {
  fromVersion: 'tsv:1732104000-products-001' as const,
  toVersion: 'tsv:1732183200-products-002' as const,
  immutable: true,
  createdAt: Date.parse('2025-11-21T10:00:00Z'),
  createdBy: 'system',

  // Forward: V1 → V2
  forward: {
    // Request transformation (V1 request → V2 request)
    transformRequest: (data: any) => {
      // If request contains price filter, convert it
      if (data && typeof data.price === 'string') {
        return {
          ...data,
          priceInCents: priceToCents(data.price),
          price: undefined // Remove old field
        };
      }
      return data;
    },

    // Response transformation (V2 response → V2 response, no-op)
    transformResponse: (data: ProductV2 | ProductV2[]) => {
      // Already in V2 format, return as-is
      return data;
    }
  },

  // Backward: V2 → V1
  backward: {
    // Request transformation (V2 request → V1 request)
    transformRequest: (data: any) => {
      // If request contains priceInCents filter, convert it
      if (data && typeof data.priceInCents === 'number') {
        return {
          ...data,
          price: centsToPrice(data.priceInCents),
          priceInCents: undefined // Remove new field
        };
      }
      return data;
    },

    // Response transformation (V2 response → V1 response)
    transformResponse: (data: ProductV2 | ProductV2[]) => {
      // Convert priceInCents → price (string)
      if (Array.isArray(data)) {
        return data.map(product => ({
          id: product.id,
          name: product.name,
          price: centsToPrice(product.priceInCents), // Convert to string
          description: product.description
        })) as ProductV1[];
      } else {
        return {
          id: data.id,
          name: data.name,
          price: centsToPrice(data.priceInCents), // Convert to string
          description: data.description
        } as ProductV1;
      }
    }
  }
};
