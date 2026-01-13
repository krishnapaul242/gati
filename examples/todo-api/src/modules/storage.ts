interface StorageItem<T = any> {
  value: T;
  expiresAt?: number;
}

export interface Storage {
  get<T = any>(key: string): T | null;
  set<T = any>(key: string, value: T, ttl?: number): void;
  delete(key: string): boolean;
  has(key: string): boolean;
  clear(): void;
  keys(): string[];
  size(): number;
}

export function createStorageModule(): Storage {
  const store = new Map<string, StorageItem>();

  return {
    get<T = any>(key: string): T | null {
      const item = store.get(key);
      if (!item) return null;
      
      if (item.expiresAt && item.expiresAt < Date.now()) {
        store.delete(key);
        return null;
      }
      
      return item.value as T;
    },

    set<T = any>(key: string, value: T, ttl?: number): void {
      const item: StorageItem<T> = { value };
      if (ttl) {
        item.expiresAt = Date.now() + ttl * 1000;
      }
      store.set(key, item);
    },

    delete(key: string): boolean {
      return store.delete(key);
    },

    has(key: string): boolean {
      const item = store.get(key);
      if (!item) return false;
      
      if (item.expiresAt && item.expiresAt < Date.now()) {
        store.delete(key);
        return false;
      }
      
      return true;
    },

    clear(): void {
      store.clear();
    },

    keys(): string[] {
      return Array.from(store.keys());
    },

    size(): number {
      return store.size;
    }
  };
}
