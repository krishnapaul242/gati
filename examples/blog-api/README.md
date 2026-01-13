# Blog API - Gati Authentication Example

A comprehensive blog API demonstrating Gati with authentication, role-based access control, and database operations.

## Features

- ✅ CRUD operations for posts and authors
- ✅ JWT-like authentication system
- ✅ Role-based access control (admin, author, reader)
- ✅ File-based routing
- ✅ Input validation and error handling
- ✅ In-memory database with relationships

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Server runs at http://localhost:3000
```

## API Endpoints

### Posts

#### List all posts
```bash
GET /api/posts
GET /api/posts?published=true  # Only published posts
```

#### Get single post
```bash
GET /api/posts/:id
```

#### Create post (requires author role)
```bash
POST /api/posts
Authorization: Bearer admin-token
Content-Type: application/json

{
  "title": "My First Post",
  "content": "This is the content...",
  "published": true
}
```

#### Update post (requires ownership or admin)
```bash
PUT /api/posts/:id
Authorization: Bearer admin-token
Content-Type: application/json

{
  "title": "Updated Title",
  "published": false
}
```

#### Delete post (requires ownership or admin)
```bash
DELETE /api/posts/:id
Authorization: Bearer admin-token
```

### Authors

#### List all authors
```bash
GET /api/authors
```

#### Create author (requires admin role)
```bash
POST /api/authors
Authorization: Bearer admin-token
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "bio": "Tech blogger"
}
```

## Authentication

The example uses a simple token-based auth system. In production, you'd use JWT or similar.

**Available tokens:**
- `admin-token` - Admin user (can do everything)

**Roles:**
- `admin` - Full access to all operations
- `author` - Can create/edit own posts
- `reader` - Read-only access

## Example Usage

```bash
# List all posts
curl http://localhost:3000/api/posts

# Create a post (requires auth)
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello World","content":"My first post","published":true}'

# Get specific post
curl http://localhost:3000/api/posts/1

# Update post
curl -X PUT http://localhost:3000/api/posts/1 \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}'

# List authors
curl http://localhost:3000/api/authors

# Create author (admin only)
curl -X POST http://localhost:3000/api/authors \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com"}'
```

## What You'll Learn

1. **Authentication patterns** - Token validation and role-based access
2. **Module composition** - Database and auth modules working together
3. **Error handling** - Proper HTTP status codes and error messages
4. **Data relationships** - Posts linked to authors
5. **Advanced routing** - Multiple handlers for the same resource
6. **Security patterns** - Authorization checks and ownership validation

## Project Structure

```
blog-api/
├── src/
│   ├── handlers/
│   │   ├── posts.ts          # GET/POST /api/posts
│   │   ├── posts/
│   │   │   └── [id].ts       # GET/PUT/DELETE /api/posts/:id
│   │   └── authors.ts        # GET/POST /api/authors
│   └── modules/
│       ├── database.ts       # In-memory database with posts/authors
│       └── auth.ts           # Authentication and authorization
├── gati.config.ts            # Gati configuration
└── package.json
```

## Next Steps

- Try the E-commerce example to see more complex business logic
- Explore the Todo API for simpler CRUD patterns
- Check out Timescape examples for API versioning