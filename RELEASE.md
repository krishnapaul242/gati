# Release & Publishing Guide

This repository uses **Changesets** for versioning and publishing packages.

## Prerequisites

1. Ensure you have an npm account with 2FA (recommended).
2. Login before publishing:

```powershell
npm login
```

If you need OTP during publish, you will be prompted.

## Package Structure

Published packages:

- `@gati-framework/core` – core types and base config (tsconfig.base.json)

Planned future packages:

- `@gati/cli` – CLI entry point (create/dev/build)
- `@gati/runtime` – execution engine exports

## Versioning Flow

1. Make code changes.
1. Add a changeset:

```powershell
pnpm exec changeset add
```

Select bump type (patch/minor/major) and write summary.

1. Apply version updates:

```powershell
pnpm release:version
```

This updates package versions and generates CHANGELOG.md files.

1. Commit and push:

```powershell
git add -A
git commit -m "chore(release): version packages"
git push origin main
```

## Publishing

Build all packages then publish:

```powershell
pnpm -r build
pnpm release:publish
```

If you see an E404 error like:
```
E404 Not Found - PUT https://registry.npmjs.org/@gati%2fcore - Not found
```
Common causes:

- Not logged in (`npm login` required)
- Scoped package requires public access flag (Changesets sets `access: public` already)
- Network or registry proxy issues

Retry after login:

```powershell
npm login
pnpm release:publish
```

## Manual Fallback

If automated publish keeps failing, try manual publish:

```powershell
cd packages/core
npm publish --access public
```

## Adding New Packages

1. Create `packages/<name>/package.json` with `name`, `version`, `main`, `types`, `files`.
2. Add build script (e.g., `tsc -p tsconfig.build.json`).
3. Add an initial changeset with a minor bump.
4. Run version + publish steps.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| 404 on publish | Not logged in | `npm login` then retry |
| 403 forbidden | Missing access rights | Ensure you own scope or org |
| OTP errors | 2FA required | Provide OTP at prompt |
| Missing types | Build not run | `pnpm -r build` before publish |

## Scripts Summary

- `pnpm release:version` – Apply pending changesets
- `pnpm release:publish` – Publish updated packages
- `pnpm release` – Build then publish helper

## Next Steps

- Publish `@gati-framework/core` once npm login succeeds.
- Create `@gati/cli` package to remove example dependency on unreleased commands.
- Migrate runtime code into publishable packages.

---
Maintained by Krishna Paul (@krishnapaul242)
