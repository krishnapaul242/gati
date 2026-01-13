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
    return res.json({ todos });
  }
  
  if (req.method === 'POST') {
    // Runtime validation (current approach)
    // TODO: Replace with GType schema validation in M3
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    const body = req.body as Record<string, unknown>;
    const title = body.title;
    
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const todo: Todo = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    storage.set(`todo:${todo.id}`, todo);
    return res.status(201).json({ todo });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};
