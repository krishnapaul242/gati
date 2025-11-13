/**
 * Gati configuration
 * Minimal config - routes auto-discovered from handlers
 */

import { initPlayground, servePlaygroundUI, getPortHandler, getRoutesHandler, getInstancesHandler } from '@gati-framework/playground';

export default {
  server: {
    port: 3000,
    host: 'localhost'
  },
  
  // Optional: Override or add custom routes
  routes: [
    // Playground API routes (must come before wildcard)
    { method: 'GET', path: '/playground/api/port', handler: getPortHandler },
    { method: 'GET', path: '/playground/api/routes', handler: getRoutesHandler },
    { method: 'GET', path: '/playground/api/instances', handler: getInstancesHandler },
    // Playground static files
    { method: 'GET', path: '/playground/app.js', handler: servePlaygroundUI },
    { method: 'GET', path: '/playground/index.html', handler: servePlaygroundUI },
    // Playground UI root
    { method: 'GET', path: '/playground', handler: servePlaygroundUI },
  ],
  
  // Optional: Initialize modules
  modules: async (gctx: any) => {
    // Initialize playground module
    await initPlayground(gctx, { enabled: true });
  }
};