/**
 * Runtime examples - Complete application
 */

import { createE2EIntegration } from '@gati-framework/runtime';
import { databaseModule } from './modules/database.js';
import { emailModule } from './modules/email.js';
import * as userHandlers from './handlers/users.js';
import * as notifyHandlers from './handlers/notify.js';
import { createServer } from 'http';

// Create integration
const integration = createE2EIntegration();

// Register modules
const gctx = integration.getGlobalContext();
gctx.modules['db'] = databaseModule;
gctx.modules['email'] = emailModule;

// Register user handlers
integration.registerHandler('POST', '/users', userHandlers.createUser);
integration.registerHandler('GET', '/users/:id', userHandlers.getUser);
integration.registerHandler('PUT', '/users/:id', userHandlers.updateUser);
integration.registerHandler('DELETE', '/users/:id', userHandlers.deleteUser);
integration.registerHandler('GET', '/users', userHandlers.listUsers);

// Register notification handler
integration.registerHandler('POST', '/notify', notifyHandlers.sendNotification);

// Create HTTP server
const server = createServer((req, res) => {
  integration.handleRequest(req, res);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Examples running on http://localhost:${PORT}`);
  console.log('\nTry:');
  console.log('  POST /users - Create user');
  console.log('  GET /users/:id - Get user');
  console.log('  PUT /users/:id - Update user');
  console.log('  DELETE /users/:id - Delete user');
  console.log('  GET /users - List users');
  console.log('  POST /notify - Send notification');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  server.close();
  await integration.shutdown();
  process.exit(0);
});
