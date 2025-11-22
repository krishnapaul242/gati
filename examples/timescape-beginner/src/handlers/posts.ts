/**
 * Blog Posts Handler - Version 1
 * 
 * Initial version with basic post structure:
 * - id: unique identifier
 * - title: post title
 * - content: post content
 * 
 * This is the baseline version created on 2025-11-20T10:00:00Z
 */

export interface PostV1 {
  id: string;
  title: string;
  content: string;
}

// Mock database
const posts: PostV1[] = [
  {
    id: '1',
    title: 'Introduction to Timescape',
    content: 'Timescape is a revolutionary API versioning system...'
  },
  {
    id: '2',
    title: 'Getting Started with Gati',
    content: 'Gati is a modern TypeScript framework...'
  }
];

export async function getPosts(): Promise<PostV1[]> {
  return posts;
}

export async function getPostById(id: string): Promise<PostV1 | null> {
  return posts.find(p => p.id === id) || null;
}
