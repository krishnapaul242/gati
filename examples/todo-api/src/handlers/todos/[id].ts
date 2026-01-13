import type { Handler } from '@gati-framework/runtime';
import type { Storage } from '../../modules/storage';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export const handler: Handler = async (req, res, gctx) => {
  const storage = gctx.modules['storage'] as Storage;
  const { id } = req.params;
  const key = `todo:${id}`;
  
  if (req.method === 'GET') {
    const todo = storage.get<Todo>(key);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    return res.json({ todo });
  }
  
  if (req.method === 'PUT') {
    const todo = storage.get<Todo>(key);
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    // Runtime validation
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    const body = req.body as Record<string, unknown>;
    const title = body.title;
    const completed = body.completed;
    const updated: Todo = {
      ...todo,
      title: title !== undefined ? title : todo.title,
      completed: completed !== undefined ? completed : todo.completed
    };
    
    storage.set(key, updated);
    return res.json({ todo: updated });
  }
  
  if (req.method === 'DELETE') {
    const deleted = storage.delete(key);
    if (!deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    return res.status(204).send();
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};
