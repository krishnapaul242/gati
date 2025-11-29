# Gati Runtime Examples

Practical examples demonstrating handlers, modules, hooks, and the complete runtime pipeline.

## Examples Included

1. **Database Module** (`modules/database.ts`) - In-memory user storage
2. **Email Module** (`modules/email.ts`) - Simulated email service
3. **User Handlers** (`handlers/users.ts`) - CRUD operations
4. **Notification Handler** (`handlers/notify.ts`) - With lifecycle hooks

## Quick Start

```bash
# Install dependencies
pnpm install

# Run examples
pnpm tsx index.ts
```

## API Endpoints

### Users
- `POST /users` - Create user
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `GET /users` - List all users

### Notifications
- `POST /notify` - Send email notification

## Example Requests

```bash
# Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Get user
curl http://localhost:3000/users/user_123

# Send notification
curl -X POST http://localhost:3000/notify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","subject":"Hello","message":"Test"}'
```

## Key Concepts Demonstrated

- **Handlers**: Request processing with (req, res, gctx, lctx)
- **Modules**: Reusable services accessed via gctx.modules
- **Lifecycle Hooks**: Cleanup handlers with lctx.lifecycle
- **Error Handling**: Proper HTTP status codes and error responses
- **Async Operations**: Module methods with async/await
