import type { Module } from '@gati-framework/runtime';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'author' | 'reader';
}

class AuthModule implements Module {
  private sessions: Map<string, User> = new Map();

  async init() {
    // Mock admin user session
    this.sessions.set('admin-token', {
      id: '1',
      email: 'admin@example.com', 
      name: 'Admin User',
      role: 'admin'
    });
  }

  async validateToken(token: string): Promise<User | null> {
    return this.sessions.get(token) || null;
  }

  async requireAuth(token?: string): Promise<User> {
    if (!token) {
      throw new Error('Authentication required');
    }

    const user = await this.validateToken(token);
    if (!user) {
      throw new Error('Invalid token');
    }

    return user;
  }

  async requireRole(token: string, role: User['role']): Promise<User> {
    const user = await this.requireAuth(token);
    
    if (user.role !== role && user.role !== 'admin') {
      throw new Error(`Role '${role}' required`);
    }

    return user;
  }
}

export default new AuthModule();