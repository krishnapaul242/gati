# @gati-framework/core

Core types & base configuration for the Gati framework.

This package is intentionally minimal right now (Milestone M1). It provides:

- Canonical TypeScript types used by handlers & contexts
- A sharable `tsconfig.base.json` for scaffolding new services
- Stable public package for downstream tooling & the CLI

Future milestones will move the runtime (execution engine, router, module system) into its own publishable package (e.g. `@gati-framework/runtime`).

## Install

```bash
pnpm add @gati-framework/core
# or
npm i @gati-framework/core
```

## Exports

Currently exported types (subject to expansion):

```ts
import type {
  Handler,
  Request,
  Response,
  GlobalContext,
  LocalContext,
  AppConfig,
  GatiApp // interface form (runtime class will live in runtime package later)
} from '@gati-framework/core';
```

### Tsconfig Base

Reference it in your project `tsconfig.json`:

```json
{
  "extends": "@gati-framework/core/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

## Handler Type (Preview)

```ts
import type { Handler } from '@gati-framework/core';

export const handler: Handler = (req, res, gctx, lctx) => {
  res.json({ ok: true });
};
```

## Versioning Policy

- Minor versions: additive, non-breaking exports
- Patch versions: internal / doc changes
- Major versions: (not expected until runtime lands)

## Roadmap Alignment

| Milestone | Relevance |
|-----------|-----------|
| M1        | Types & base config (this package) |
| M2        | Deployment engines (separate packages) |
| M3        | Versioned routing (runtime package) |

## Contributing

Open an issue or PR at https://github.com/krishnapaul242/gati

## License

MIT © Krishna Paul
