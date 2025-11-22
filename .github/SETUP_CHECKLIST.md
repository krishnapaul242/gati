# CI/CD Setup Checklist

Complete these steps to enable automated npm publishing.

## ✅ Setup Steps

### 1. Generate npm Token

```bash
# Log in to npm
npm login

# Generate automation token
npm token create --type=automation
```

**Copy the token** (starts with `npm_...`)

### 2. Add Token to GitHub

1. Go to: https://github.com/krishnapaul242/gati/settings/secrets/actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click "Add secret"

### 3. Verify Package Access

```bash
# Check you're logged in
npm whoami

# Verify you can publish to @gati-framework scope
npm access list packages
```

### 4. Test the Workflow

```bash
# Create a test changeset
pnpm changeset

# Select packages and version type
# Write a summary

# Commit and push
git add .
git commit -m "chore: test release workflow"
git push origin main
```

### 5. Monitor the Release

1. Go to: https://github.com/krishnapaul242/gati/actions
2. Watch the "Release" workflow
3. It will create a "Version Packages" PR
4. Review and merge the PR
5. Packages will be published automatically!

## 📋 Verification Checklist

- [ ] npm token generated
- [ ] NPM_TOKEN added to GitHub secrets
- [ ] Package access verified
- [ ] First changeset created
- [ ] Pushed to main
- [ ] CI workflow passed
- [ ] "Version Packages" PR created
- [ ] PR reviewed and merged
- [ ] Packages published to npm
- [ ] Git tags created

## 🎯 Quick Commands

```bash
# Create a changeset
pnpm changeset

# Build locally
pnpm build

# Test locally
pnpm test

# Check what would be published
pnpm changeset publish --dry-run

# View workflow status
gh run list --workflow=release.yml
```

## 📚 Documentation

- **Setup Guide**: [NPM_SETUP.md](./NPM_SETUP.md)
- **Release Process**: [RELEASE_GUIDE.md](./RELEASE_GUIDE.md)
- **Workflow Details**: [workflows/README.md](./workflows/README.md)

## 🆘 Need Help?

If you encounter issues:

1. Check [NPM_SETUP.md](./NPM_SETUP.md) troubleshooting section
2. Review workflow logs in GitHub Actions
3. Open an issue: https://github.com/krishnapaul242/gati/issues

---

**Status**: ⏳ Pending Setup  
**Next Step**: Generate npm token and add to GitHub secrets
