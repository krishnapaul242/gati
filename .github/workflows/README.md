# GitHub Actions Workflows

This directory contains CI/CD workflows for the Gati project.

## Workflows

### 1. CI (`ci.yml`)

**Trigger**: Pull requests and pushes to main

**Jobs**:
- **Lint**: Runs ESLint on all TypeScript files
- **Test**: Runs tests on Node.js 18 and 20
- **Build**: Builds all packages and verifies artifacts

**Purpose**: Ensures code quality before merging

### 2. Release (`release.yml`)

**Trigger**: Pushes to main branch

**Jobs**:
- **Release**: 
  - Builds all packages
  - Runs tests
  - Creates "Version Packages" PR (if changesets exist)
  - Publishes to npm (when Version Packages PR is merged)
  - Creates git tags

**Purpose**: Automates the release process

### 3. Deploy Docs (`deploy-docs.yml`)

**Trigger**: Pushes to main branch

**Purpose**: Deploys documentation to GitHub Pages

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Developer Workflow                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Create Feature  │
                    │     Branch       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Make Changes    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Create Changeset │
                    │ pnpm changeset   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Create PR       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   CI Workflow    │
                    │  (lint, test)    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Merge to Main  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Release Workflow │
                    │  Creates PR      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Merge Version PR │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Publish to npm  │
                    │  Create Git Tags │
                    └──────────────────┘
```

## Environment Variables

### Required Secrets

- `NPM_TOKEN`: npm automation token for publishing packages
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

### Setting Up Secrets

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Add `NPM_TOKEN` with your npm automation token

## Workflow Features

### CI Workflow Features

- ✅ Runs on multiple Node.js versions (18, 20)
- ✅ Caches pnpm store for faster builds
- ✅ Uploads test coverage to Codecov
- ✅ Verifies build artifacts

### Release Workflow Features

- ✅ Automatic version bumping via Changesets
- ✅ Automatic CHANGELOG generation
- ✅ Automatic npm publishing
- ✅ Automatic git tag creation
- ✅ Creates "Version Packages" PR for review
- ✅ Concurrent execution prevention

## Monitoring Workflows

### View Workflow Runs

Go to: https://github.com/krishnapaul242/gati/actions

### Check Workflow Status

```bash
# Using GitHub CLI
gh run list --workflow=ci.yml
gh run list --workflow=release.yml

# View specific run
gh run view <run-id>
```

## Debugging Workflows

### Enable Debug Logging

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Add secret: `ACTIONS_STEP_DEBUG` = `true`
3. Re-run workflow

### Common Issues

#### "npm ERR! 403 Forbidden"
- Check NPM_TOKEN is valid
- Verify package access permissions

#### "No changesets found"
- Create a changeset: `pnpm changeset`
- Commit and push

#### "Build failed"
- Check TypeScript errors locally: `pnpm build`
- Check test failures locally: `pnpm test`

## Workflow Permissions

The workflows require these permissions:

- `contents: write` - For creating tags and commits
- `pull-requests: write` - For creating Version Packages PR
- `id-token: write` - For npm provenance

## Customization

### Modify Node.js Versions

Edit `ci.yml`:
```yaml
strategy:
  matrix:
    node-version: [18, 20, 22]  # Add more versions
```

### Change Release Branch

Edit `release.yml`:
```yaml
on:
  push:
    branches:
      - main
      - next  # Add more branches
```

### Add Slack Notifications

Uncomment and configure the Slack notification step in `release.yml`.

## Best Practices

1. **Always run CI on PRs** - Don't merge without green checks
2. **Review Version Packages PR** - Check versions and CHANGELOG
3. **Monitor workflow runs** - Check Actions tab regularly
4. **Keep dependencies updated** - Update action versions periodically
5. **Test locally first** - Run `pnpm build && pnpm test` before pushing

## Workflow Badges

Add these to your README.md:

```markdown
[![CI](https://github.com/krishnapaul242/gati/actions/workflows/ci.yml/badge.svg)](https://github.com/krishnapaul242/gati/actions/workflows/ci.yml)
[![Release](https://github.com/krishnapaul242/gati/actions/workflows/release.yml/badge.svg)](https://github.com/krishnapaul242/gati/actions/workflows/release.yml)
```

## Support

For workflow issues:
- Check [GitHub Actions documentation](https://docs.github.com/en/actions)
- Open an issue: https://github.com/krishnapaul242/gati/issues
- Email: krishnapaulmailbox@gmail.com

---

**Last Updated**: 2025-11-22
