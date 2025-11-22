# NPM Publishing Setup

Quick guide to set up automated npm publishing for Gati.

## Step 1: Generate npm Access Token

1. **Log in to npm**:
   ```bash
   npm login
   ```

2. **Generate token via CLI** (recommended):
   ```bash
   npm token create --type=automation
   ```
   
   Or via web:
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation"
   - Copy the token (starts with `npm_...`)

## Step 2: Add Token to GitHub

1. Go to: https://github.com/krishnapaul242/gati/settings/secrets/actions

2. Click "New repository secret"

3. Add secret:
   - **Name**: `NPM_TOKEN`
   - **Value**: Your npm token from Step 1
   - Click "Add secret"

## Step 3: Verify Package Access

Make sure you have publish access to the packages:

```bash
# Check if you're logged in
npm whoami

# Check package access
npm access list packages

# If packages don't exist yet, they'll be created on first publish
# Make sure your npm username matches the scope or you have access
```

## Step 4: Test Locally (Optional)

Before pushing, test the release process locally:

```bash
# Build packages
pnpm build

# Create a test changeset
pnpm changeset

# Version packages (dry run)
pnpm changeset version

# Check what would be published
pnpm changeset publish --dry-run
```

## Step 5: Make Your First Release

1. **Create a changeset**:
   ```bash
   pnpm changeset
   ```

2. **Commit and push**:
   ```bash
   git add .
   git commit -m "chore: prepare first release"
   git push origin main
   ```

3. **Wait for CI**:
   - GitHub Actions will create a "Version Packages" PR
   - Review the PR (check versions and CHANGELOG)
   - Merge the PR
   - Packages will be automatically published to npm!

## Verification

After the first release, verify:

1. **Check GitHub Actions**:
   - Go to: https://github.com/krishnapaul242/gati/actions
   - Look for "Release" workflow
   - Should show green checkmark

2. **Check npm**:
   ```bash
   npm view @gati-framework/runtime
   npm view @gati-framework/cli
   ```

3. **Install and test**:
   ```bash
   npm install -g @gati-framework/cli
   gati --version
   ```

## Package Scopes

Your packages are scoped under `@gati-framework`:
- `@gati-framework/runtime`
- `@gati-framework/cli`
- `@gati-framework/core`

Make sure you have access to publish under this scope on npm.

## Troubleshooting

### "You do not have permission to publish"

**Solution**: 
1. Make sure you're logged in: `npm whoami`
2. Check scope access: `npm access list packages`
3. If scope doesn't exist, create it on npm website
4. Add yourself as maintainer

### "Package name too similar to existing package"

**Solution**: 
- npm might flag similar names
- Contact npm support or choose a different name

### "Invalid token"

**Solution**:
1. Generate a new token: `npm token create --type=automation`
2. Update GitHub secret
3. Re-run workflow

## Security Notes

- ✅ Use "Automation" token type (not "Publish")
- ✅ Store token in GitHub Secrets (never commit)
- ✅ Rotate tokens periodically
- ✅ Use `--provenance` flag for supply chain security (already configured)

## Next Steps

After setup:
1. Read [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) for release process
2. Create your first changeset
3. Push to main and watch the magic happen! ✨

---

**Need Help?**
- GitHub Issues: https://github.com/krishnapaul242/gati/issues
- Email: krishnapaulmailbox@gmail.com
