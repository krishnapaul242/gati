# Database Migrations

> 🚧 **Status**: Planned for M3 (Q1 2026)  
> This feature is currently in the planning phase.

## Overview

Database migrations in Gati will provide a seamless way to evolve your database schema alongside your API versions, with automatic migration generation and rollback support.

## Planned Features

### Automatic Migration Generation

Gati will analyze schema changes and automatically generate migration scripts:

```typescript
// Planned API (M3)
import { defineMigration } from '@gati-framework/migrations';

export default defineMigration({
  version: '2024-01-15T10:00:00Z',
  up: async (db) => {
    await db.schema.alterTable('users', (table) => {
      table.string('email').notNullable();
    });
  },
  down: async (db) => {
    await db.schema.alterTable('users', (table) => {
      table.dropColumn('email');
    });
  }
});
```

### Version-Aware Migrations

Migrations will be tied to Timescape versions:

- Automatic migration execution when deploying new versions
- Rollback support for version downgrades
- Migration history tracking
- Zero-downtime migrations with blue-green deployments

### Database Adapters

Support for multiple database systems:

- PostgreSQL
- MySQL
- MongoDB
- SQLite
- Custom adapters

## Integration with Timescape

Database migrations will work seamlessly with Timescape versioning:

```typescript
// Planned: Automatic migration on version change
// When API version changes from v1 to v2:
// 1. Gati detects schema changes
// 2. Generates migration script
// 3. Applies migration during deployment
// 4. Updates version metadata
```

## CLI Commands (Planned)

```bash
# Generate migration from schema changes
gati migrate:generate

# Apply pending migrations
gati migrate:up

# Rollback last migration
gati migrate:down

# Show migration status
gati migrate:status

# Create custom migration
gati migrate:create add-user-email
```

## Configuration (Planned)

```typescript
// gati.config.ts
export default {
  migrations: {
    directory: './migrations',
    tableName: 'gati_migrations',
    adapter: 'postgresql',
    connection: {
      // Database connection config
    }
  }
};
```

## Use Cases

### Adding a New Field

```typescript
// v1: User without email
interface User {
  id: string;
  name: string;
}

// v2: User with email (non-breaking)
interface User {
  id: string;
  name: string;
  email?: string; // Optional field
}

// Migration auto-generated:
// ALTER TABLE users ADD COLUMN email VARCHAR(255);
```

### Changing Field Type (Breaking)

```typescript
// v1: Age as string
interface User {
  age: string;
}

// v2: Age as number (breaking change)
interface User {
  age: number;
}

// Migration auto-generated with data transformation:
// ALTER TABLE users ADD COLUMN age_new INTEGER;
// UPDATE users SET age_new = CAST(age AS INTEGER);
// ALTER TABLE users DROP COLUMN age;
// ALTER TABLE users RENAME COLUMN age_new TO age;
```

## Related Documentation

- [Timescape Versioning](../architecture/timescape.md) - API versioning system
- [Timescape CLI](./timescape-cli.md) - CLI commands for versioning
- [Intermediate Example](../examples/timescape-intermediate.md) - E-commerce example with migrations

## Roadmap

| Feature | Status | Target |
|---------|--------|--------|
| Migration Generation | 📅 Planned | M3 (Q1 2026) |
| PostgreSQL Adapter | 📅 Planned | M3 (Q1 2026) |
| MySQL Adapter | 📅 Planned | M3 (Q1 2026) |
| MongoDB Adapter | 📅 Planned | M3 (Q1 2026) |
| Rollback Support | 📅 Planned | M3 (Q1 2026) |
| Zero-Downtime Migrations | 📅 Planned | M4 (Q2 2026) |

## Contributing

Interested in helping design or implement database migrations? Join the discussion:

- [GitHub Discussions](https://github.com/krishnapaul242/gati/discussions)
- [Issue Tracker](https://github.com/krishnapaul242/gati/issues)

---

**Status**: 🚧 In Development  
**Target Release**: M3 (Q1 2026)  
**Last Updated**: November 22, 2025
