# @gati-framework/simulate

> Runtime simulation for testing Gati applications

[![npm version](https://img.shields.io/npm/v/@gati-framework/simulate.svg)](https://www.npmjs.com/package/@gati-framework/simulate)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

In-process simulation of Gati runtime for fast integration testing without full deployment.

## Installation

```bash
npm install --save-dev @gati-framework/simulate
```

## Quick Start

```typescript
import { createSimulation } from '@gati-framework/simulate';

const sim = createSimulation({
  handlers: [{ route: '/users/:id', method: 'GET', handler }],
  modules: [{ name: 'database', module: mockDb }]
});

const result = await sim.request('GET', '/users/123');
expect(result.status).toBe(200);
```

## Features

- ✅ **In-Process Testing** - No external dependencies
- ✅ **Fast Execution** - Millisecond test runs
- ✅ **Full Pipeline** - Route matching, context, modules
- ✅ **Mock Modules** - Easy module mocking
- ✅ **Lifecycle Hooks** - Test hook execution

## Usage

```typescript
import { createSimulation } from '@gati-framework/simulate';

describe('User API', () => {
  const sim = createSimulation({
    handlers: [
      { route: '/users/:id', method: 'GET', handler: getUserHandler }
    ],
    modules: [
      { name: 'database', module: mockDatabase }
    ]
  });

  it('fetches user', async () => {
    const result = await sim.request('GET', '/users/123');
    expect(result.status).toBe(200);
    expect(result.body.id).toBe('123');
  });
});
```

## Related Packages

- [@gati-framework/runtime](../runtime) - Production runtime
- [@gati-framework/testing](../testing) - Test utilities

## Documentation

- [Testing Guide](https://krishnapaul242.github.io/gati/guides/testing)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
