/**
 * Enhanced Gati config with route overrides
 */

export default {
  // Override specific auto-discovered routes
  overrides: {
    // Override the auto-discovered route from handlers/users/[id].ts
    'GET /users/:id': {
      middleware: [authMiddleware],
      rateLimit: { requests: 100, window: '1m' }
    },
    
    // Disable a specific auto-discovered route
    'DELETE /users/:id': false,
    
    // Add custom route not in handlers/
    'POST /webhook': webhookHandler
  },
  
  // Global middleware (applied to all routes)
  middleware: [
    corsMiddleware,
    loggerMiddleware
  ],
  
  // Module overrides
  modules: {
    // Override auto-discovered modules
    db: customDatabaseModule,
    
    // Add custom modules
    cache: redisModule
  }
};

// Example middleware and handlers
function authMiddleware(req, res, next) { /* ... */ }
function webhookHandler(req, res) { /* ... */ }
const corsMiddleware = /* ... */;
const loggerMiddleware = /* ... */;
const customDatabaseModule = /* ... */;
const redisModule = /* ... */;