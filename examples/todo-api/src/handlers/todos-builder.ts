/**
 * Todo handler with builder pattern
 * Demonstrates: handler().auth().cache().validate().handle()
 */
import { handler } from '@gati-framework/runtime';
import type { Storage } from '../modules/storage';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

type CreateTodoInput = { title: string };
type TodoListOutput = { todos: Todo[] };

export const todosHandler = handler<CreateTodoInput, TodoListOutput>()
  .cache(60)
  .rateLimit(100)
  .cors()
  .validate({
    title: 'string'
  })
  .handle(async (req, res, gctx) => {
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
    }
  });
