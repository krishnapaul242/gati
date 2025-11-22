/**
 * Transformer: Products V2 ↔ V3
 * 
 * NON-BREAKING CHANGE TRANSFORMATION
 * 
 * Handles transformation between:
 * - V2: {id, name, priceInCents, description}
 * - V3: {id, name, priceInCents, currency, description, inStock}
 * 
 * Changes:
 * 1. Added currency field (default: "USD")
 * 2. Added inStock field (default: true)
 * 
 * This transformer is IMMUTABLE and was generated on 2025-11-22T10:00:00Z
 * DO NOT MODIFY - Create a new version instead
 */

import type { ProductV2 } from '../handlers/products-v2';
import type { ProductV3 } from '../handlers/products-v3';
import type { TransformerPair } from '@gati-framework/runtime/timescape/types';

export const productsV2V3Transformer: TransformerPair = {
  fromVersion: 'tsv:1732183200-products-002' as const,
  toVersion: 'tsv:1732269600-products-003' as const,
  immutable: true,
  createdAt: Date.parse('2025-11-22T10:00:00Z'),
  createdBy: 'system',

  // Forward: V2 → V3
  forward: {
    // Request transformation (V2 request → V3 request)
    transformRequest: (data: any) => {
      // V2 and V3 have compatible request structures
      return data;
    },

    // Response transformation (V3 response → V3 response, no-op)
    transformResponse: (data: ProductV3 | ProductV3[]) => {
      // Already in V3 format, return as-is
      return data;
    }
  },

  // Backward: V3 → V2
  backward: {
    // Request transformation (V3 request → V2 request)
    transformRequest: (data: any) => {
      // Remove V3-specific fields from request
      if (data) {
        const { currency, inStock, ...v2Data } = data;
        return v2Data;
      }
      return data;
    },

    // Response transformation (V3 response → V2 response)
    transformResponse: (data: ProductV3 | ProductV3[]) => {
      // Remove currency and inStock fields for V2 clients
      if (Array.isArray(data)) {
        return data.map(product => ({
          id: product.id,
          name: product.name,
          priceInCents: product.priceInCents,
          description: product.description
          // currency and inStock are omitted
        })) as ProductV2[];
      } else {
        return {
          id: data.id,
          name: data.name,
          priceInCents: data.priceInCents,
          description: data.description
          // currency and inStock are omitted
        } as ProductV2;
      }
    }
  }
};
