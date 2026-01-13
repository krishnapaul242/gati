# Todo API - Demo Script

## Setup (Before Recording)

1. Open 2 terminals side by side
2. Terminal 1: Server
3. Terminal 2: Testing

## Recording Script

### Terminal 1: Start Server
```bash
cd examples/todo-api
pnpm dev
```

Wait for: "Server running at http://localhost:3000"

---

### Terminal 2: Run Tests

```bash
# Test 1: Create first todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Learn Gati Framework\"}"

# Test 2: Create second todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Build an API\"}"

# Test 3: List all todos
curl http://localhost:3000/api/todos

# Test 4: Get specific todo (use ID from above)
curl http://localhost:3000/api/todos/1234567890

# Test 5: Update todo
curl -X PUT http://localhost:3000/api/todos/1234567890 \
  -H "Content-Type: application/json" \
  -d "{\"completed\":true}"

# Test 6: Delete todo
curl -X DELETE http://localhost:3000/api/todos/1234567890

# Test 7: List todos again
curl http://localhost:3000/api/todos

# Test 8: Error handling (404)
curl http://localhost:3000/api/todos/999999

# Test 9: Validation error (400)
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d "{}"
```

---

## Automated Recording

Run this for automated console recording:

```bash
pnpm test:record
```

This will:
- Start the server
- Run all 9 tests
- Save output to `test-session.log`
- Stop the server

---

## Browser Demo

1. Start server: `pnpm dev`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run:

```javascript
const BASE = 'http://localhost:3000/api';

// Create todo
await fetch(`${BASE}/todos`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({title: 'Learn Gati'})
}).then(r => r.json()).then(console.log);

// List todos
await fetch(`${BASE}/todos`)
  .then(r => r.json())
  .then(console.log);
```

---

## Recording Tools

### Console Recording
- **Windows Terminal**: Built-in recording (Ctrl+Shift+R)
- **asciinema**: `asciinema rec demo.cast`
- **Script above**: `pnpm test:record`

### Browser Recording
- **ScreenToGif**: Record browser window
- **OBS Studio**: Full screen recording
- **Browser DevTools**: Screenshot each step

---

## Expected Output

```
✓ POST /api/todos → 201 Created
✓ GET /api/todos → 200 OK (2 todos)
✓ GET /api/todos/:id → 200 OK
✓ PUT /api/todos/:id → 200 OK
✓ DELETE /api/todos/:id → 204 No Content
✓ GET /api/todos → 200 OK (1 todo)
✓ GET /api/todos/999 → 404 Not Found
✓ POST /api/todos (no title) → 400 Bad Request
```

---

## Tips

- Use `| jq` for pretty JSON (if installed)
- Pause 1-2 seconds between commands
- Show both request and response
- Highlight key features (routing, validation, errors)
