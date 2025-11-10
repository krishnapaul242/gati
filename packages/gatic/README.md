# gatic

A thin executable wrapper that runs `@gati-framework/cli`. Installed so you can simply type:

```bash
npx gatic create my-app
```

or globally:

```bash
npm i -g gatic
# then
gatic dev
```

## Why does this exist?

The original CLI binary name `gati` conflicted with another published package. The framework's canonical command is now `gatic`. To ease migration, the scoped package `@gati-framework/cli` still ships both `gati` and `gatic` bins temporarily, and this wrapper provides an unscoped `gatic` entry point for `npx` convenience.

## Deprecation Notice

The `gati` binary will be removed in a future minor release (target: >=0.6.0). Please update scripts to use `gatic`.

## Versioning

`gatic` uses its own version (`0.x`) independent from the underlying CLI to allow lightweight wrapper updates. It depends on a compatible `@gati-framework/cli` semver range.

## License

MIT © Krishna Paul
