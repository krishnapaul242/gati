# Package README Template

Use this template for all package READMEs. Adapt sections based on package type.

---

# @gati-framework/[package-name]

> Brief one-line description of what this package does

[![npm version](https://img.shields.io/npm/v/@gati-framework/[package-name].svg)](https://www.npmjs.com/package/@gati-framework/[package-name])
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE)

[2-3 sentence overview of the package's purpose and key features]

## Installation

```bash
# npm
npm install @gati-framework/[package-name]

# pnpm
pnpm add @gati-framework/[package-name]

# yarn
yarn add @gati-framework/[package-name]
```

## Quick Start

```typescript
// Minimal working example (5-10 lines)
import { MainExport } from '@gati-framework/[package-name]';

const example = new MainExport();
example.doSomething();
```

## Features

- ✅ **Feature 1** - Brief description
- ✅ **Feature 2** - Brief description
- ✅ **Feature 3** - Brief description
- 🚧 **Feature 4** - Coming soon

## Usage

### Basic Example

```typescript
// Common use case with explanation
```

### Advanced Example

```typescript
// More complex scenario
```

## API Reference

### Main Classes/Functions

#### `ClassName`

Brief description.

```typescript
class ClassName {
  constructor(options: Options);
  method(param: Type): ReturnType;
}
```

**Parameters**:
- `options` - Configuration options
  - `option1` (string) - Description
  - `option2` (number, optional) - Description

**Returns**: Description of return value

**Example**:
```typescript
const instance = new ClassName({ option1: 'value' });
```

## Configuration

```typescript
interface Config {
  option1: string;
  option2?: number;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `option1` | `string` | - | Required option |
| `option2` | `number` | `0` | Optional option |

## Examples

### Example 1: [Use Case]

```typescript
// Complete working example
```

### Example 2: [Use Case]

```typescript
// Complete working example
```

## Integration

### With Other Packages

```typescript
// How this package integrates with other Gati packages
```

### With External Tools

```typescript
// Integration with third-party tools
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Type check
pnpm typecheck
```

## Architecture

[Optional: Brief architecture overview for complex packages]

```
┌─────────────┐
│  Component  │
└─────────────┘
      │
      ▼
┌─────────────┐
│  Component  │
└─────────────┘
```

## Performance

[Optional: Performance characteristics, benchmarks]

## Troubleshooting

### Common Issues

**Issue 1**: Description
- **Solution**: How to fix

**Issue 2**: Description
- **Solution**: How to fix

## Related Packages

- [@gati-framework/related-package](../related-package) - Description
- [@gati-framework/another-package](../another-package) - Description

## Documentation

- [Full Documentation](https://krishnapaul242.github.io/gati/)
- [API Reference](https://krishnapaul242.github.io/gati/api-reference/)
- [Examples](https://krishnapaul242.github.io/gati/examples/)

## Contributing

Contributions welcome! See [Contributing Guide](../../docs/contributing/README.md).

## License

MIT © 2025 [Krishna Paul](https://github.com/krishnapaul242)

---

**Part of the [Gati Framework](https://github.com/krishnapaul242/gati)** ⚡
