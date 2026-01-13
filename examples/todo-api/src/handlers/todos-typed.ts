/**
 * Todo handler with explicit type annotations
 * Demonstrates: Handler<INPUT, OUTPUT, PARAMS, QUERY> signature
 */
import type { Handler } from '@gati-framework/runtime';
import type { Storage } from '../modules/storage';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

type CreateTodoInput = { title: string };
type TodoListOutput = { todos: Todo[] };
type TodoOutput = { todo: Todo };

export const handler: Handler<CreateTodoInput, TodoListOutput | TodoOutput> = async (req, res, gctx) => {
  const storage = gctx.modules['storage'] as Storage;
  
  if (req.method === 'GET') {
    const keys = storage.keys().filter(k => k.startsWith('todo:'));
    const todos = keys.map(k => storage.get<Todo>(k)).filter(Boolean);
    res.json({ todos });
  } else if (req.method === 'POST') {
    const { title } = req.body;
    
    const todo: Todo = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    storage.set(`todo:${todo.id}`, todo);
    res.status(201).json({ todo });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
