/**
 * Test playground integration
 */

import { createApp } from './packages/runtime/src/index.js';
import { createPlaygroundIntegration } from './packages/playground/src/index.js';

async function testPlayground() {
  console.log('🎮 Testing Playground Integration...');

  // Create playground
  const playground = createPlaygroundIntegration({
    enabled: true,
    port: 3001
  });

  // Create app
  const app = createApp();
  
  // Initialize playground
  await playground.initialize(app.getGlobalContext());
  
  console.log('✅ Playground initialized');
  console.log('📡 WebSocket server running on port 3001');
  
  // Test handler wrapping
  const testHandler = async (req: any, res: any, gctx: any, lctx: any) => {
    console.log('Handler executed:', lctx.requestId);
    res.json({ success: true });
  };
  
  const wrappedHandler = playground.wrapHandler(testHandler, '/test');
  console.log('✅ Handler wrapped for playground');
  
  // Simulate playground request
  const mockReq = {
    headers: { 'x-playground-request': 'true' }
  };
  const mockRes = {
    json: (data: any) => console.log('Response:', data)
  };
  const mockLctx = {
    requestId: 'test-123'
  };
  
  console.log('🚀 Simulating playground request...');
  await wrappedHandler(mockReq, mockRes, {}, mockLctx);
  
  console.log('✅ Playground test completed');
}

testPlayground().catch(console.error);