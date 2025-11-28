# Gati Automation Guide

## Automated Publishing

### GitHub Actions (Recommended)

The repository includes automated workflows for publishing and version management.

#### Setup

1. **Add NPM Token to GitHub Secrets**
   - Go to GitHub repository → Settings → Secrets and variables → Actions
   - Add secret: `NPM_TOKEN` with your npm access token
   - Get token from: https://www.npmjs.com/settings/YOUR_USERNAME/tokens

2. **Workflows**

   - **`publish.yml`** - Publishes changed packages to npm
     - Triggers: Push to main (when package.json changes) or manual
     - Checks if version exists before publishing
     - Creates git tags for published versions
   
   - **`version-sync.yml`** - Syncs CLI template versions
     - Triggers: When core/runtime/cli package.json changes
     - Updates template versions automatically
     - Commits changes back to repository

#### Manual Trigger

```bash
# Trigger publish workflow
gh workflow run publish.yml

# Trigger version sync
gh workflow run version-sync.yml
```

### Local Publishing

#### Quick Publish

```bash
# Make script executable (first time only)
chmod +x scripts/publish.sh

# Run publisher
./scripts/publish.sh
```

#### Manual Steps

```bash
# 1. Build all packages
pnpm -r --filter './packages/*' run build

# 2. Publish each package
cd packages/contracts && npm publish --access public
cd packages/simulate && npm publish --access public
cd packages/runtime && npm publish --access public
cd packages/cli && npm publish --access public
```

## Version Management

### Sync Template Versions

When you update package versions, sync CLI templates:

```bash
node scripts/sync-versions.js
```

This updates `packages/cli/src/utils/file-generator.ts` with latest versions.

### Bump Versions

```bash
# Bump specific package
cd packages/contracts
npm version patch  # or minor, major

# Bump all packages (use with caution)
pnpm -r --filter './packages/*' exec npm version patch
```

## Workflow

### Standard Release Process

1. **Make changes** to packages
2. **Update version** in package.json
3. **Commit changes**
   ```bash
   git add .
   git commit -m "feat(contracts): add new feature"
   ```
4. **Push to main**
   ```bash
   git push origin main
   ```
5. **Automation handles**:
   - Syncs template versions (if needed)
   - Builds packages
   - Publishes to npm (if version is new)
   - Creates git tags

### Manual Release

If you prefer manual control:

```bash
# 1. Update versions
node scripts/sync-versions.js

# 2. Build
pnpm -r --filter './packages/*' run build

# 3. Publish
./scripts/publish.sh

# 4. Commit and push
git add .
git commit -m "chore: publish packages"
git push --follow-tags
```

## Troubleshooting

### "Version already published"

This is normal - the script skips already-published versions.

### "Permission denied"

```bash
chmod +x scripts/publish.sh
```

### "NPM_TOKEN not found"

Add your npm token to GitHub secrets or set locally:

```bash
export NPM_TOKEN=your_token_here
```

### Template versions out of sync

Run sync script:

```bash
node scripts/sync-versions.js
```

## Best Practices

1. **Always sync versions** before publishing CLI
2. **Test locally** before pushing to main
3. **Use semantic versioning** (major.minor.patch)
4. **Update CHANGELOG.md** for significant changes
5. **Tag releases** with package name and version

## CI/CD Status

Check workflow status:
- https://github.com/krishnapaul242/gati/actions

View published packages:
- https://www.npmjs.com/org/gati-framework
