import { describe, it, expect, beforeEach } from 'vitest';
import { createStorageModule } from '../src/modules/storage';

describe('Todo API', () => {
  let storage: ReturnType<typeof createStorageModule>;

  beforeEach(() => {
    storage = createStorageModule();
  });

  describe('Storage Module', () => {
    it('should store and retrieve todos', () => {
      const todo = { id: '1', title: 'Test', completed: false };
      storage.set('todo:1', todo);
      
      const retrieved = storage.get('todo:1');
      expect(retrieved).toEqual(todo);
    });

    it('should return null for non-existent keys', () => {
      expect(storage.get('todo:999')).toBeNull();
    });

    it('should delete todos', () => {
      storage.set('todo:1', { id: '1', title: 'Test' });
      expect(storage.delete('todo:1')).toBe(true);
      expect(storage.get('todo:1')).toBeNull();
    });

    it('should list all keys', () => {
      storage.set('todo:1', { id: '1' });
      storage.set('todo:2', { id: '2' });
      
      const keys = storage.keys();
      expect(keys).toContain('todo:1');
      expect(keys).toContain('todo:2');
    });

    it('should check if key exists', () => {
      storage.set('todo:1', { id: '1' });
      expect(storage.has('todo:1')).toBe(true);
      expect(storage.has('todo:999')).toBe(false);
    });

    it('should clear all data', () => {
      storage.set('todo:1', { id: '1' });
      storage.set('todo:2', { id: '2' });
      storage.clear();
      
      expect(storage.size()).toBe(0);
    });
  });

  describe('Todo Operations', () => {
    it('should create a todo', () => {
      const todo = {
        id: Date.now().toString(),
        title: 'Learn Gati',
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      storage.set(`todo:${todo.id}`, todo);
      expect(storage.get(`todo:${todo.id}`)).toEqual(todo);
    });

    it('should update a todo', () => {
      const todo = {
        id: '1',
        title: 'Original',
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      storage.set('todo:1', todo);
      
      const updated = { ...todo, title: 'Updated', completed: true };
      storage.set('todo:1', updated);
      
      expect(storage.get('todo:1')).toEqual(updated);
    });

    it('should list all todos', () => {
      storage.set('todo:1', { id: '1', title: 'First' });
      storage.set('todo:2', { id: '2', title: 'Second' });
      
      const keys = storage.keys().filter(k => k.startsWith('todo:'));
      const todos = keys.map(k => storage.get(k));
      
      expect(todos).toHaveLength(2);
    });
  });
});
