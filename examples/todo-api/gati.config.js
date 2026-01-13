module.exports = {
  server: {
    port: 3000,
    host: 'localhost'
  },
  
  handlers: {
    dir: './src/handlers',
    baseRoute: '/api'
  },
  
  modules: (gctx) => {
    const store = new Map();
    
    gctx.modules['storage'] = {
      get(key) {
        const item = store.get(key);
        if (!item) return null;
        if (item.expiresAt && item.expiresAt < Date.now()) {
          store.delete(key);
          return null;
        }
        return item.value;
      },
      set(key, value, ttl) {
        const item = { value };
        if (ttl) item.expiresAt = Date.now() + ttl * 1000;
        store.set(key, item);
      },
      delete(key) {
        return store.delete(key);
      },
      has(key) {
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
