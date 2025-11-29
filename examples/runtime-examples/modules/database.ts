/**
 * Example database module - In-memory user storage
 */

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

const users = new Map<string, User>();

export const databaseModule = {
  async createUser(data: { name: string; email: string }): Promise<User> {
    const user: User = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      createdAt: Date.now(),
    };
    users.set(user.id, user);
    return user;
  },

  async getUser(id: string): Promise<User | null> {
    return users.get(id) || null;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const user = users.get(id);
    if (!user) return null;
    const updated = { ...user, ...data };
    users.set(id, updated);
    return updated;
  },

  async deleteUser(id: string): Promise<boolean> {
    return users.delete(id);
  },

  async listUsers(): Promise<User[]> {
    return Array.from(users.values());
  },
};
