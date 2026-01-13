# Todo API - Gati Beginner Example

A simple Todo API demonstrating Gati fundamentals: CRUD operations, file-based routing, and module usage.

## Features

- ✅ Create, read, update, delete todos
- ✅ In-memory storage
- ✅ File-based routing
- ✅ Input validation
- ✅ Error handling

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Server runs at http://localhost:3000
```

## API Endpoints

### List all todos
```bash
GET /api/todos
```

### Create a todo
```bash
POST /api/todos
Content-Type: application/json

{
  "title": "Learn Gati"
}
```

### Get a single todo
```bash
GET /api/todos/:id
```

### Update a todo
```bash
PUT /api/todos/:id
Content-Type: application/json

{
  "title": "Learn Gati Framework",
  "completed": true
}
```

### Delete a todo
```bash
DELETE /api/todos/:id
```

## Example Usage

```bash
# Create a todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries"}'

# List todos
curl http://localhost:3000/api/todos

# Update todo
curl -X PUT http://localhost:3000/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete todo
curl -X DELETE http://localhost:3000/api/todos/1
```

## What You'll Learn

1. **File-based routing** - Handlers map to URL paths automatically
2. **Module usage** - Access shared storage via `gctx.modules`
3. **Request handling** - Parse body, params, query strings
4. **Response methods** - Send JSON, set status codes
5. **Error handling** - Return appropriate error responses
6. **Type safety** - Runtime validation patterns (see `TYPE_SAFETY_VISION.md`)

## Project Structure

```
todo-api/
├── src/
│   ├── handlers/
│   │   ├── todos.ts          # GET /api/todos, POST /api/todos
│   │   └── todos/
│   │       └── [id].ts       # GET/PUT/DELETE /api/todos/:id
│   └── modules/
│       └── storage.ts        # In-memory storage module
├── gati.config.ts            # Gati configuration
└── package.json
```

## Recording & Demo

### Automated Console Test
```bash
pnpm test:record
```
Runs all tests and saves output to `test-session.log`

### PowerShell Demo
```powershell
.\test-demo.ps1
```
Colored, formatted demo with all 9 tests

### Manual Testing
See `DEMO_SCRIPT.md` for step-by-step commands

## Next Steps

- Try the Weather API example to learn external API integration
- Explore the URL Shortener to see redirects and analytics
- Check out the Blog Platform for database and authentication
