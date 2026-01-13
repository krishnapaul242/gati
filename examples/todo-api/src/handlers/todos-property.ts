/**
 * Todo handler with property-based middleware
 * Demonstrates: handler.auth, handler.cache, handler.rateLimit
 */
import type { Handler } from '@gati-framework/runtime';
import type { Storage } from '../modules/storage';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export const handler: Handler = async (req, res, gctx) => {
  const storage = gctx.modules['storage'] as Storage;
  
  if (req.method === 'GET') {
    const keys = storage.keys().filter(k => k.startsWith('todo:'));
    const todos = keys.map(k => storage.get<Todo>(k)).filter(Boolean);
    res.json({ todos });
  } else if (req.method === 'POST') {
    const { title } = req.body as { title: string };
    
    const todo: Todo = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    storage.set(`todo:${todo.id}`, todo);
    res.status(201).json({ todo });
  }
};

// Property-based middleware
handler.cache = 60;
handler.rateLimit = 100;
handler.cors = true;
