export default {
  server: {
    port: 3000,
    host: 'localhost'
  },
  
  handlers: {
    dir: './src/handlers',
    baseRoute: '/api'
  },
  
  modules: (gctx: any) => {
    const store = new Map();
    
    gctx.modules['storage'] = {
      get(key: string) {
        const item = store.get(key);
        if (!item) return null;
        if (item.expiresAt && item.expiresAt < Date.now()) {
          store.delete(key);
          return null;
        }
        return item.value;
      },
      set(key: string, value: any, ttl?: number) {
        const item: any = { value };
        if (ttl) item.expiresAt = Date.now() + ttl * 1000;
        store.set(key, item);
      },
      delete(key: string) {
        return store.delete(key);
      },
      has(key: string) {
        const item = store.get(key);
        if (!item) return false;
        if (item.expiresAt && item.expiresAt < Date.now()) {
          store.delete(key);
          return false;
        }
        return true;
      },
      clear() {
        store.clear();
      },
      keys() {
        return Array.from(store.keys());
      },
      size() {
        return store.size;
      }
    };
  }
};
