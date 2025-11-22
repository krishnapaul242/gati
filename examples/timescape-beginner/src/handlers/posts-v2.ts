/**
 * Blog Posts Handler - Version 2
 * 
 * Enhanced version with author information:
 * - id: unique identifier
 * - title: post title
 * - content: post content
 * - author: post author (NEW - optional for backward compatibility)
 * 
 * This version was created on 2025-11-21T14:00:00Z
 * TSV: tsv:1732197600-posts-002
 */

export interface PostV2 {
  id: string;
  title: string;
  content: string;
  author?: string; // New optional field
}

// Mock database with author information
const posts: PostV2[] = [
  {
    id: '1',
    title: 'Introduction to Timescape',
    content: 'Timescape is a revolutionary API versioning system...',
    author: 'Alice Johnson'
  },
  {
    id: '2',
    title: 'Getting Started with Gati',
    content: 'Gati is a modern TypeScript framework...',
    author: 'Bob Smith'
  }
];

export async function getPosts(): Promise<PostV2[]> {
  return posts;
}

export async function getPostById(id: string): Promise<PostV2 | null> {
  return posts.find(p => p.id === id) || null;
}
