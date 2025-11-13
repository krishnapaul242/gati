/**
 * Database module
 */

export const database = {
  users: {
    findById: async (id: string) => {
      return { id, name: 'John Doe', email: 'john@example.com' };
    },
    
    create: async (data: any) => {
      return { id: 'new-id', ...data };
    },
    
    update: async (id: string, data: any) => {
      return { id, ...data };
    },
    
    delete: async (_id: string) => {
      return { success: true };
    }
  },
  
  posts: {
    findByUserId: async (userId: string) => {
      return [{ id: '1', title: 'Hello World', userId }];
    }
  }
};