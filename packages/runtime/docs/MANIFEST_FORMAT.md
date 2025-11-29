# Manifest Format

## Handler Manifest

```json
{
  "handlerId": "users.getUser",
  "path": "/users/:id",
  "methods": ["GET"],
  "requestType": "GetUserRequest",
  "responseType": "GetUserResponse",
  "hooks": {
    "before": ["validateAuth"],
    "after": ["logRequest"]
  },
  "policies": {
    "rateLimit": { "requests": 100, "window": 60 },
    "auth": { "required": true, "roles": ["user"] }
  },
  "modules": ["db"],
  "version": "1.0.0",
  "fingerprint": "abc123"
}
```

## Module Manifest

```json
{
  "moduleId": "database",
  "version": "1.0.0",
  "runtime": "node",
  "capabilities": ["network", "storage"],
  "methods": {
    "getUser": {
      "input": "string",
      "output": "User | null"
    },
    "createUser": {
      "input": "CreateUserInput",
      "output": "User"
    }
  }
}
```

## GType Schema

```json
{
  "User": {
    "kind": "object",
    "properties": {
      "id": { "kind": "primitive", "type": "string" },
      "name": { "kind": "primitive", "type": "string" },
      "email": { "kind": "primitive", "type": "string" }
    },
    "required": ["id", "name", "email"]
  }
}
```
