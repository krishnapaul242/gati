# @gati-framework/contracts

> Type-safe contracts for Gati framework with JSON schemas and Protobuf definitions

[![npm version](https://img.shields.io/npm/v/@gati-framework/contracts.svg)](https://www.npmjs.com/package/@gati-framework/contracts)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

Core runtime contracts, observability interfaces, and deployment schemas for the Gati ecosystem.

## Installation

```bash
npm install @gati-framework/contracts
```

## Quick Start

```typescript
import type { ILogger, IMetricsProvider } from '@gati-framework/contracts';

class MyLogger implements ILogger {
  info(message: string, meta?: any) { /* ... */ }
  error(message: string, meta?: any) { /* ... */ }
  warn(message: string, meta?: any) { /* ... */ }
  debug(message: string, meta?: any) { /* ... */ }
}
```

## Features

- ✅ **Type-safe Contracts** - TypeScript interfaces
- ✅ **JSON Schemas** - Runtime validation
- ✅ **Protobuf Definitions** - Efficient serialization
- ✅ **Observability Contracts** - Logger, metrics, tracing
- ✅ **Deployment Contracts** - Kubernetes, cloud providers
- ✅ **Validation Utilities** - Schema validation

## Contracts

### Observability

```typescript
import type { 
  ILogger, 
  IMetricsProvider, 
  ITracingProvider 
} from '@gati-framework/contracts/observability';
```

### Deployment

```typescript
import type { 
  DeploymentConfig, 
  KubernetesManifest 
} from '@gati-framework/contracts/deployment';
```

### Runtime

```typescript
import type { 
  HandlerContract, 
  ModuleContract 
} from '@gati-framework/contracts';
```

## Validation

```typescript
import { validateSchema } from '@gati-framework/contracts/utils';

const result = validateSchema('handler', handlerData);
if (!result.valid) {
  console.error(result.errors);
}
```

## Related Packages

- [@gati-framework/runtime](../runtime) - Runtime engine
- [@gati-framework/observability](../observability) - Observability stack
- [@gati-framework/operator](../operator) - Kubernetes operator

## Documentation

- [Contracts Guide](https://krishnapaul242.github.io/gati/guides/contracts)
- [Full Documentation](https://krishnapaul242.github.io/gati/)

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
