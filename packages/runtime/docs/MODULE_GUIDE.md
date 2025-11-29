# Module Development Guide

## Module Structure

```typescript
export const myModule = {
  async method1(arg: string): Promise<Result> {
    // Implementation
  },
  
  async method2(arg: number): Promise<void> {
    // Implementation
  },
};
```

## Registering Modules

```typescript
import { createGlobalContext } from '@gati-framework/runtime';

const gctx = createGlobalContext();
gctx.modules['myModule'] = myModule;
```

## Database Module Example

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

export const databaseModule = {
  async getUser(id: string): Promise<User | null> {
    // Database query
  },
  
  async createUser(data: Omit<User, 'id'>): Promise<User> {
    // Create user
  },
};
```

## Module with State

```typescript
const cache = new Map();

export const cacheModule = {
  async get(key: string): Promise<any> {
    return cache.get(key);
  },
  
  async set(key: string, value: any): Promise<void> {
    cache.set(key, value);
  },
};
```

## Best Practices

1. **Export plain objects** - Modules are simple objects with methods
2. **Use async methods** - All module methods should be async
3. **Handle errors** - Throw meaningful errors
4. **Keep state internal** - Don't expose internal state
5. **Type everything** - Use TypeScript interfaces
