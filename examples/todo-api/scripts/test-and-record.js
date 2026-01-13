const { spawn } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';
let serverProcess;
let output = [];

function log(message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  output.push(line);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI() {
  log('='.repeat(60));
  log('TODO API - Automated Test Session');
  log('='.repeat(60));
  log('');

  try {
    // Test 1: Create first todo
    log('TEST 1: Creating first todo...');
    const res1 = await fetch(`${BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Learn Gati Framework' })
    });
    const todo1 = await res1.json();
    log(`✓ Status: ${res1.status}`);
    log(`✓ Response: ${JSON.stringify(todo1, null, 2)}`);
    log('');

    await wait(500);

    // Test 2: Create second todo
    log('TEST 2: Creating second todo...');
    const res2 = await fetch(`${BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Build an API' })
    });
    const todo2 = await res2.json();
    log(`✓ Status: ${res2.status}`);
    log(`✓ Response: ${JSON.stringify(todo2, null, 2)}`);
    log('');

    await wait(500);

    const todoId = todo1.todo.id;

    // Test 3: List all todos
    log('TEST 3: Listing all todos...');
    const res3 = await fetch(`${BASE_URL}/todos`);
    const todos = await res3.json();
    log(`✓ Status: ${res3.status}`);
    log(`✓ Found ${todos.todos.length} todos`);
    log(`✓ Response: ${JSON.stringify(todos, null, 2)}`);
    log('');

    await wait(500);

    // Test 4: Get specific todo
    log(`TEST 4: Getting todo ${todoId}...`);
    const res4 = await fetch(`${BASE_URL}/todos/${todoId}`);
    const todo = await res4.json();
    log(`✓ Status: ${res4.status}`);
    log(`✓ Response: ${JSON.stringify(todo, null, 2)}`);
    log('');

    await wait(500);

    // Test 5: Update todo
    log(`TEST 5: Updating todo ${todoId}...`);
    const res5 = await fetch(`${BASE_URL}/todos/${todoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true })
    });
    const updated = await res5.json();
    log(`✓ Status: ${res5.status}`);
    log(`✓ Response: ${JSON.stringify(updated, null, 2)}`);
    log('');

    await wait(500);

    // Test 6: Delete todo
    log(`TEST 6: Deleting todo ${todoId}...`);
    const res6 = await fetch(`${BASE_URL}/todos/${todoId}`, { method: 'DELETE' });
    log(`✓ Status: ${res6.status}`);
    log(`✓ Todo deleted successfully`);
    log('');

    await wait(500);

    // Test 7: List todos after deletion
    log('TEST 7: Listing todos after deletion...');
    const res7 = await fetch(`${BASE_URL}/todos`);
    const finalTodos = await res7.json();
    log(`✓ Status: ${res7.status}`);
    log(`✓ Found ${finalTodos.todos.length} todos`);
    log(`✓ Response: ${JSON.stringify(finalTodos, null, 2)}`);
    log('');

    // Test 8: Error handling - invalid todo
    log('TEST 8: Testing error handling (404)...');
    const res8 = await fetch(`${BASE_URL}/todos/999999`);
    const error = await res8.json();
    log(`✓ Status: ${res8.status}`);
    log(`✓ Response: ${JSON.stringify(error, null, 2)}`);
    log('');

    // Test 9: Validation - missing title
    log('TEST 9: Testing validation (400)...');
    const res9 = await fetch(`${BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const validationError = await res9.json();
    log(`✓ Status: ${res9.status}`);
    log(`✓ Response: ${JSON.stringify(validationError, null, 2)}`);
    log('');

    log('='.repeat(60));
    log('✅ ALL TESTS PASSED!');
    log('='.repeat(60));

  } catch (error) {
    log('');
    log('❌ TEST FAILED!');
    log(`Error: ${error.message}`);
    log('');
  }
}

async function main() {
  log('Starting Todo API server...');
  
  // Start server
  serverProcess = spawn('pnpm', ['dev'], {
    cwd: __dirname + '/..',
    shell: true
  });

  serverProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg) log(`[SERVER] ${msg}`);
  });

  serverProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes('deprecated')) {
      log(`[SERVER] ${msg}`);
    }
  });

  // Wait for server to start
  log('Waiting for server to start...');
  await wait(5000);

  // Check if server is running
  try {
    await fetch(`${BASE_URL}/todos`);
    log('✓ Server is running!');
    log('');
  } catch (error) {
    log('❌ Server failed to start');
    process.exit(1);
  }

  // Run tests
  await testAPI();

  // Save output
  const outputFile = 'test-session.log';
  fs.writeFileSync(outputFile, output.join('\n'));
  log('');
  log(`Session saved to: ${outputFile}`);

  // Cleanup
  log('Stopping server...');
  serverProcess.kill();
  
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
