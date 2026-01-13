import type { Module } from '@gati-framework/runtime';

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  published: boolean;
}

export interface Author {
  id: string;
  name: string;
  email: string;
  bio?: string;
  createdAt: Date;
}

class DatabaseModule implements Module {
  private posts: Map<string, Post> = new Map();
  private authors: Map<string, Author> = new Map();
  private nextId = 1;

  async init() {
    // Seed with sample data
    const author1: Author = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Tech blogger and developer',
      createdAt: new Date()
    };
    
    const author2: Author = {
      id: '2', 
      name: 'Jane Smith',
      email: 'jane@example.com',
      bio: 'Frontend developer and UI/UX enthusiast',
      createdAt: new Date()
    };

    this.authors.set('1', author1);
    this.authors.set('2', author2);

    const post1: Post = {
      id: '1',
      title: 'Getting Started with Gati',
      content: 'Gati is a next-generation TypeScript framework...',
      authorId: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      published: true
    };

    this.posts.set('1', post1);
    this.nextId = 2;
  }

  // Posts
  async getAllPosts(published?: boolean): Promise<Post[]> {
    const posts = Array.from(this.posts.values());
    return published !== undefined 
      ? posts.filter(p => p.published === published)
      : posts;
  }

  async getPostById(id: string): Promise<Post | null> {
    return this.posts.get(id) || null;
  }

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    const post: Post = {
      ...data,
      id: String(this.nextId++),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.posts.set(post.id, post);
    return post;
  }

  async updatePost(id: string, data: Partial<Omit<Post, 'id' | 'createdAt'>>): Promise<Post | null> {
    const post = this.posts.get(id);
    if (!post) return null;

    const updated = { ...post, ...data, updatedAt: new Date() };
    this.posts.set(id, updated);
    return updated;
  }

  async deletePost(id: string): Promise<boolean> {
    return this.posts.delete(id);
  }

  // Authors
  async getAllAuthors(): Promise<Author[]> {
    return Array.from(this.authors.values());
  }

  async getAuthorById(id: string): Promise<Author | null> {
    return this.authors.get(id) || null;
  }

  async createAuthor(data: Omit<Author, 'id' | 'createdAt'>): Promise<Author> {
    const author: Author = {
      ...data,
      id: String(this.nextId++),
      createdAt: new Date()
    };
    this.authors.set(author.id, author);
    return author;
  }
}

export default new DatabaseModule();