/**
 * Transformer: Posts V1 ↔ V2
 * 
 * Handles transformation between:
 * - V1: {id, title, content}
 * - V2: {id, title, content, author?}
 * 
 * This transformer is IMMUTABLE and was generated on 2025-11-21T14:00:00Z
 * DO NOT MODIFY - Create a new version instead
 */

import type { PostV1 } from '../handlers/posts';
import type { PostV2 } from '../handlers/posts-v2';
import type { TransformerPair } from '@gati-framework/runtime/timescape/types';

export const postsV1V2Transformer: TransformerPair = {
  fromVersion: 'tsv:1732104000-posts-001' as const,
  toVersion: 'tsv:1732197600-posts-002' as const,
  immutable: true,
  createdAt: Date.parse('2025-11-21T14:00:00Z'),
  createdBy: 'system',

  // Forward: V1 → V2
  forward: {
    // Request transformation (V1 request → V2 request)
    transformRequest: (data: any) => {
      // V1 and V2 have same request structure, no transformation needed
      return data;
    },

    // Response transformation (V2 response → V2 response, no-op)
    transformResponse: (data: PostV2 | PostV2[]) => {
      // Already in V2 format, return as-is
      return data;
    }
  },

  // Backward: V2 → V1
  backward: {
    // Request transformation (V2 request → V1 request)
    transformRequest: (data: any) => {
      // V1 and V2 have same request structure, no transformation needed
      return data;
    },

    // Response transformation (V2 response → V1 response)
    transformResponse: (data: PostV2 | PostV2[]) => {
      // Remove 'author' field to convert V2 → V1
      if (Array.isArray(data)) {
        return data.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content
          // author field is omitted
        })) as PostV1[];
      } else {
        return {
          id: data.id,
          title: data.title,
          content: data.content
          // author field is omitted
        } as PostV1;
      }
    }
  }
};
