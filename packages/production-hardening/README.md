# @gati-framework/production-hardening

> Production hardening utilities for Gati applications

[![npm version](https://img.shields.io/npm/v/@gati-framework/production-hardening.svg)](https://www.npmjs.com/package/@gati-framework/production-hardening)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Security, validation, secrets management, and production best practices for Gati applications.

## Installation

```bash
npm install @gati-framework/production-hardening
```

## Quick Start

```typescript
import { validateConfig, SecretManager } from '@gati-framework/production-hardening';

// Validate configuration
const config = validateConfig(gatiConfig);

// Manage secrets
const secrets = new SecretManager();
const dbPassword = await secrets.get('database-password');
```

## Features

- ✅ **Config Validation** - Zod/Ajv schema validation
- ✅ **Secret Management** - Secure secret handling
- ✅ **Security Headers** - CORS, CSP, HSTS
- ✅ **Rate Limiting** - Request throttling
- ✅ **Input Sanitization** - XSS prevention
- ✅ **Health Checks** - Readiness/liveness probes

## Config Validation

```typescript
import { validateConfig } from '@gati-framework/production-hardening';

const result = validateConfig({
  name: 'my-app',
  version: '1.0.0',
  cloud: { provider: 'aws', region: 'us-east-1' }
});

if (!result.valid) {
  console.error(result.errors);
}
```

## Secret Management

```typescript
import { SecretManager } from '@gati-framework/production-hardening';

const secrets = new SecretManager({
  provider: 'aws',
  region: 'us-east-1'
});

const dbPassword = await secrets.get('database-password');
```

## Security Headers

```typescript
import { securityHeaders } from '@gati-framework/production-hardening';

export const handler: Handler = async (req, res, gctx, lctx) => {
  securityHeaders(res);
  res.json({ message: 'Secure response' });
};
```

## Rate Limiting

```typescript
import { rateLimit } from '@gati-framework/production-hardening';

const limiter = rateLimit({
  windowMs: 60000,
  maxRequests: 100
});

export const handler: Handler = async (req, res, gctx, lctx) => {
  if (!limiter.check(req)) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  res.json({ message: 'OK' });
};
```

## Related Packages

- [@gati-framework/runtime](../runtime) - Runtime engine
- [@gati-framework/core](../core) - Core types

## Documentation

- [Production Guide](https://krishnapaul242.github.io/gati/guides/production)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
