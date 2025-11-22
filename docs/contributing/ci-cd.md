# CI/CD Pipeline

Gati uses GitHub Actions for continuous integration and automated npm publishing.

## Pipeline Overview

### CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main`:

```yaml
✅ Lint (non-blocking) - Shows warnings but doesn't fail
✅ Build - Builds core and types packages
✅ Test - Runs tests for stable packages
```

**Status**: [![CI](https://github.com/krishnapaul242/gati/actions/workflows/ci.yml/badge.svg)](https://github.com/krishnapaul242/gati/actions/workflows/ci.yml)

### Release Workflow (`.github/workflows/release.yml`)

Automatically publishes to npm when changesets are merged:

```yaml
✅ Build stable packages
✅ Run tests
✅ Create version PR or publish to npm
✅ Create GitHub releases
```

### Documentation Deployment (`.github/workflows/deploy-docs.yml`)

Deploys VitePress documentation to GitHub Pages:

```yaml
✅ Build VitePress site
✅ Deploy to https://krishnapaul.in/gati/
```

## Package Status

### ✅ Ready for Publishing

These packages are stable and ready for npm:

- **`@gati-framework/core`** - Core framework functionality
- **`@gati-framework/types`** - TypeScript type definitions

### 🚧 In Development

These packages have build issues and are excluded from CI:

- `@gati-framework/cli` - CLI tools (dependency issues)
- `@gati-framework/runtime` - Runtime with Timescape (TypeScript errors)
- `@gati-framework/cloud-*` - Cloud provider plugins (depend on runtime)
- `@gati-framework/playground` - Visual debugging tool

## Publishing Process

### 1. Create a Changeset

```bash
pnpm changeset
```

Select packages to publish, choose version bump (patch/minor/major), and write changelog.

### 2. Commit and Push

```bash
git add .
git commit -m "chore: prepare release"
git push origin main
```

### 3. Automated Publishing

The release workflow will:

1. Create a "Version Packages" PR
2. Update package versions and CHANGELOG.md
3. When merged, automatically publish to npm
4. Create GitHub releases with changelogs

## NPM Token Setup

For maintainers, the `NPM_TOKEN` secret is required:

```bash
# Generate token
npm login
npm token create --type=automation

# Add to GitHub
# Settings → Secrets and variables → Actions
# New secret: NPM_TOKEN
```

## Build Configuration

### Stable Packages Only

The CI/CD pipeline is configured to build only stable packages:

```json
{
  "scripts": {
    "release": "pnpm --filter @gati-framework/core --filter @gati-framework/types build && pnpm exec changeset publish"
  }
}
```

### Why Not All Packages?

Some packages have TypeScript compilation errors that need to be fixed:

- **CLI**: Cross-package import issues, missing runtime dependency
- **Runtime**: Timescape transformer type errors
- **Cloud Providers**: Depend on runtime package

These will be added back to CI once fixed.

## Lint Configuration

Lint runs on all packages but is **non-blocking**:

```yaml
lint:
  continue-on-error: true  # Don't fail CI on lint errors
```

Current lint issues (1660 errors, 403 warnings):
- TypeScript strict mode violations
- `any` type usage
- Unused variables
- Console statements

These can be fixed gradually without blocking releases.

## Testing Strategy

### Unit Tests

```bash
pnpm test --filter @gati-framework/core --filter @gati-framework/types
```

### E2E Tests

E2E tests require the CLI package to be built, so they're currently skipped in CI.

### Coverage

Coverage reports are uploaded to Codecov on Node 20 builds.

## Deployment Targets

### Documentation

- **URL**: https://krishnapaul.in/gati/
- **Trigger**: Push to `main` with changes in `docs/**`
- **Platform**: GitHub Pages

### NPM Packages

- **Registry**: https://registry.npmjs.org
- **Scope**: `@gati-framework`
- **Access**: Public

## Monitoring

### GitHub Actions

View workflow runs: https://github.com/krishnapaul242/gati/actions

### NPM Packages

Once published, packages will be available at:
- https://www.npmjs.com/package/@gati-framework/core
- https://www.npmjs.com/package/@gati-framework/types

## Troubleshooting

### Build Failures

If builds fail, check:
1. TypeScript compilation errors
2. Missing dependencies
3. Test failures

### Publish Failures

If publishing fails, verify:
1. `NPM_TOKEN` secret is set
2. Package versions are bumped
3. Changesets are committed

### Documentation Deployment

If docs fail to deploy:
1. Check VitePress build errors
2. Verify GitHub Pages is enabled
3. Check workflow permissions

## Future Improvements

### Planned Enhancements

- [ ] Add remaining packages to CI once fixed
- [ ] Enable E2E tests in CI
- [ ] Add performance benchmarks
- [ ] Set up automated security scanning
- [ ] Add bundle size tracking
- [ ] Implement canary releases

### Lint Improvements

- [ ] Fix TypeScript strict mode issues
- [ ] Remove `any` types
- [ ] Clean up unused variables
- [ ] Replace console statements with proper logging

## Contributing

See the [Contributing Guide](./README.md) for how to contribute to Gati's CI/CD infrastructure.

## Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [VitePress Documentation](https://vitepress.dev/)
- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
