const BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('Testing Todo API...\n');

  try {
    // 1. Create first todo
    console.log('1. Creating first todo...');
    const res1 = await fetch(`${BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Learn Gati Framework' })
    });
    const todo1 = await res1.json();
    console.log(JSON.stringify(todo1, null, 2));

    // 2. Create second todo
    console.log('\n2. Creating second todo...');
    const res2 = await fetch(`${BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Build an API' })
    });
    const todo2 = await res2.json();
    console.log(JSON.stringify(todo2, null, 2));

    const todoId = todo1.todo.id;

    // 3. List all todos
    console.log('\n3. Listing all todos...');
    const res3 = await fetch(`${BASE_URL}/todos`);
    const todos = await res3.json();
    console.log(JSON.stringify(todos, null, 2));

    // 4. Get specific todo
    console.log(`\n4. Getting todo ${todoId}...`);
    const res4 = await fetch(`${BASE_URL}/todos/${todoId}`);
    const todo = await res4.json();
    console.log(JSON.stringify(todo, null, 2));

    // 5. Update todo
    console.log(`\n5. Updating todo ${todoId}...`);
    const res5 = await fetch(`${BASE_URL}/todos/${todoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true })
    });
    const updated = await res5.json();
    console.log(JSON.stringify(updated, null, 2));

    // 6. Delete todo
    console.log(`\n6. Deleting todo ${todoId}...`);
    await fetch(`${BASE_URL}/todos/${todoId}`, { method: 'DELETE' });
    console.log('Deleted successfully');

    // 7. List todos again
    console.log('\n7. Listing todos after deletion...');
    const res7 = await fetch(`${BASE_URL}/todos`);
    const finalTodos = await res7.json();
    console.log(JSON.stringify(finalTodos, null, 2));

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAPI();
