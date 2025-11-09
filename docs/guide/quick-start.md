# Quick Start

Build a complete REST API with Gati in under 10 minutes.

## What We'll Build

A simple **Task API** with:

- ✅ Create tasks
- ✅ List all tasks
- ✅ Get task by ID
- ✅ Update task status
- ✅ Delete tasks

## Prerequisites

- Node.js >= 18.0.0
- npm or pnpm

## Step 1: Create Project (30 seconds)

```bash
# Install Gati CLI globally
npm install -g @gati-framework/cli

# Create new project
gati create task-api

# Navigate to project
cd task-api
```

You'll see interactive prompts:

```
🚀 Gati Project Creator

✔ Project name: task-api
✔ Project description: A simple task management API
✔ Author: Your Name
✔ Select a template: Default
```

Gati generates:

```
task-api/
├── src/
│   ├── handlers/      # Your API handlers
│   │   └── hello.ts   # Example handler
│   └── modules/       # Reusable modules
├── gati.config.ts     # Config (optional)
├── package.json
└── tsconfig.json
```

## Step 2: Install Dependencies (1 minute)

```bash
npm install
# or
pnpm install
```

## Step 3: Create Task Handlers (5 minutes)

### Create Task Model

Create `src/types/task.ts`:

```typescript
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}
```

### In-Memory Storage Module

Create `src/modules/task-store.ts`:

```typescript
import type { Task } from '../types/task';
import { randomUUID } from 'crypto';

export class TaskStore {
  private tasks: Map<string, Task> = new Map();

  create(data: { title: string; description?: string }): Task {
    const task: Task = {
      id: randomUUID(),
      title: data.title,
      description: data.description,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    this.tasks.set(task.id, task);
    return task;
  }

  findAll(): Task[] {
    return Array.from(this.tasks.values());
  }

  findById(id: string): Task | null {
    return this.tasks.get(id) || null;
  }

  update(id: string, updates: Partial<Task>): Task | null {
    const task = this.tasks.get(id);
    if (!task) return null;

    const updated = {
      ...task,
      ...updates,
      id: task.id, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }
}

// Export singleton instance
export const taskStore = new TaskStore();
```

### Create Handlers

#### 1. Create Task Handler

Create `src/handlers/tasks/create.ts`:

```typescript
import type { Handler } from '@gati-framework/core';
import { taskStore } from '../../modules/task-store';

export const handler: Handler = (req, res) => {
  const { title, description } = req.body;

  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const task = taskStore.create({ title, description });
  res.status(201).json({ task });
};
```

#### 2. List Tasks Handler

Create `src/handlers/tasks/list.ts`:

```typescript
import type { Handler } from '@gati-framework/core';
import { taskStore } from '../../modules/task-store';

export const handler: Handler = (req, res) => {
  const tasks = taskStore.findAll();
  res.json({ tasks, total: tasks.length });
};
```

#### 3. Get Task Handler

Create `src/handlers/tasks/get.ts`:

```typescript
import type { Handler } from '@gati-framework/core';
import { taskStore } from '../../modules/task-store';

export const handler: Handler = (req, res) => {
  const { id } = req.params;

  const task = taskStore.findById(id);
  
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({ task });
};
```

#### 4. Update Task Handler

Create `src/handlers/tasks/update.ts`:

```typescript
import type { Handler } from '@gati-framework/core';
import { taskStore } from '../../modules/task-store';

export const handler: Handler = (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const task = taskStore.update(id, updates);
  
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({ task });
};
```

#### 5. Delete Task Handler

Create `src/handlers/tasks/delete.ts`:

```typescript
import type { Handler } from '@gati-framework/core';
import { taskStore } from '../../modules/task-store';

export const handler: Handler = (req, res) => {
  const { id } = req.params;

  const deleted = taskStore.delete(id);
  
  if (!deleted) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.status(204).send();
};
```

## Step 4: Configure Routes (1 minute)

Update `gati.config.ts`:

```typescript
export default {
  port: 3000,
  handlers: './src/handlers',
  modules: './src/modules',
  
  routes: {
    // Task routes
    'POST /tasks': './tasks/create',
    'GET /tasks': './tasks/list',
    'GET /tasks/:id': './tasks/get',
    'PATCH /tasks/:id': './tasks/update',
    'DELETE /tasks/:id': './tasks/delete',
  }
};
```

## Step 5: Start Development Server

```bash
npm run dev
# or
gati dev
```

You'll see:

```
🚀 Gati Development Server

✓ Loaded 5 handlers
✓ Server running at http://localhost:3000
👁 Watching for file changes...
```

## Step 6: Test Your API (2 minutes)

### Create a Task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Gati","description":"Read the docs"}'
```

Response:

```json
{
  "task": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Learn Gati",
    "description": "Read the docs",
    "status": "pending",
    "createdAt": "2025-11-10T12:00:00.000Z",
    "updatedAt": "2025-11-10T12:00:00.000Z"
  }
}
```

### List All Tasks

```bash
curl http://localhost:3000/tasks
```

### Get Specific Task

```bash
curl http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000
```

### Update Task

```bash
curl -X PATCH http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
```

### Delete Task

```bash
curl -X DELETE http://localhost:3000/tasks/123e4567-e89b-12d3-a456-426614174000
```

## Step 7: Add Logging (Bonus)

Update any handler to include logging:

```typescript
import type { Handler } from '@gati-framework/core';
import { taskStore } from '../../modules/task-store';

export const handler: Handler = (req, res, gctx, lctx) => {
  lctx.logger.info('Creating new task', { body: req.body });
  
  const { title, description } = req.body;

  if (!title) {
    lctx.logger.warn('Task creation failed: missing title');
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const task = taskStore.create({ title, description });
  
  lctx.logger.info('Task created successfully', { taskId: task.id });
  res.status(201).json({ task });
};
```

## Step 8: Production Build

```bash
npm run build
# or
gati build
```

Gati validates your project and compiles TypeScript:

```
✓ Type checking...
✓ Building project...
✓ Build complete → dist/
```

## What's Next?

### Add Validation

Use Zod for request validation:

```typescript
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export const handler: Handler = (req, res) => {
  const result = CreateTaskSchema.safeParse(req.body);
  
  if (!result.success) {
    res.status(400).json({ error: result.error.errors });
    return;
  }

  const task = taskStore.create(result.data);
  res.status(201).json({ task });
};
```

### Add Database

Replace in-memory storage with a real database:

```typescript
// src/modules/database.ts
import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();

// src/handlers/tasks/create.ts
export const handler: Handler = async (req, res, gctx) => {
  const task = await gctx.modules.db.task.create({
    data: req.body,
  });
  
  res.status(201).json({ task });
};
```

### Add Authentication

```typescript
// src/middleware/auth.ts
export const requireAuth: Middleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Verify token...
  next();
};

// Use in handler
export const handler: Handler = [requireAuth, async (req, res) => {
  // Only authenticated users reach here
}];
```

### Deploy to Production

```bash
gati deploy prod
```

See the [Deployment Guide](/guide/kubernetes) for details.

## Summary

In 10 minutes, you:

- ✅ Created a Gati project
- ✅ Built 5 REST API endpoints
- ✅ Implemented CRUD operations
- ✅ Added structured logging
- ✅ Built for production

**No infrastructure code. No boilerplate. Just business logic.**

## Learn More

- [Handlers Guide](/guide/handlers) — Deep dive into handler patterns
- [Modules Guide](/guide/modules) — Organize business logic
- [Context (gctx & lctx)](/guide/context) — Understand global and local context
- [Error Handling](/guide/error-handling) — Production-ready error patterns

---

Ready to deploy? Check out the [Kubernetes Guide](/guide/kubernetes) 🚀
