import { createApp } from '@gati-framework/runtime';
import { createPlaygroundIntegration } from '../../dist/index.js';
import { createTraceCollector, createTraceStorage, createDebugGateManager } from '@gati-framework/runtime';

const collector = createTraceCollector({ enabled: true });
const storage = createTraceStorage();
const gateManager = createDebugGateManager({ enabled: true });

const app = createApp({
  port: 3000,
  handlersDir: './e2e/fixtures/handlers',
});

const playground = createPlaygroundIntegration({
  port: 3002,
  traceCollector: collector,
  traceStorage: storage,
  gateManager,
});

await app.start();
await playground.start();

console.log('Test server running on http://localhost:3002');

process.on('SIGTERM', async () => {
  await playground.stop();
  await app.stop();
  process.exit(0);
});
