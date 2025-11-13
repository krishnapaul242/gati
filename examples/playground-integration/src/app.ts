/**
 * Example: Gati app with playground integration
 */

import { createApp } from '@gati-framework/runtime';
import { createPlaygroundIntegration } from '@gati-framework/playground';

// Create playground integration
const playground = createPlaygroundIntegration({
  enabled: process.env.NODE_ENV === 'development',
  port: 3001,
  priority: 1000 // High priority for playground requests
});

// Create app
const app = createApp({
  playground: true // Enable playground mode
});

// Initialize playground after app startup
app.onStartup('playground', async () => {
  await playground.initialize(app.getGlobalContext());
});

export { app, playground };