# Local Testing Scripts

These scripts help you test unpublished Gati packages locally before publishing to npm.

## Available Commands

### 1. `pnpm test:local` - Tarball Testing (Realistic)

Tests packages as if installed from npm using tarballs.

```powershell
pnpm test:local
```

**What it does:**
- ✅ Builds all packages
- ✅ Creates `.tgz` tarballs (exactly what npm publishes)
- ✅ Creates a fresh test project
- ✅ Installs packages from tarballs
- ✅ **Most realistic simulation of user experience**

**Use when:**
- Testing before publishing to npm
- Verifying package.json files are correct
- Ensuring all files are included in publish
- Final validation before release

**Output:** `C:\Users\HP\Projects\gati-test-workspace\local-test-tarball\tarball-app`

---

### 2. `pnpm test:local:symlink` - Symlink Testing (Fast Iteration)

Tests packages with live symlinks for rapid development.

```powershell
pnpm test:local:symlink
```

**What it does:**
- ✅ Builds all packages
- ✅ Creates test project with `file:` protocol dependencies
- ✅ Symlinks packages (changes reflect immediately after rebuild)
- ✅ **Fast iteration during development**

**Use when:**
- Actively developing features
- Testing changes quickly
- Debugging issues
- Don't need to test packaging

**Output:** `C:\Users\HP\Projects\gati-test-workspace\local-test-symlink\symlink-app`

**Workflow:**
```powershell
# Make changes to runtime
cd packages\runtime\src
# Edit files...

# Rebuild runtime
pnpm --filter @gati-framework/runtime build

# Test immediately (symlinks auto-update)
cd C:\Users\HP\Projects\gati-test-workspace\local-test-symlink\symlink-app
pnpm build
node dist\index.js
```

---

## Comparison

| Feature | `test:local` (Tarball) | `test:local:symlink` (Symlink) |
|---------|------------------------|--------------------------------|
| **Speed** | Slower (recreates each time) | Fast (reuses symlinks) |
| **Accuracy** | Exact npm experience | Different (uses symlinks) |
| **Use Case** | Pre-release validation | Active development |
| **Detects** | Packaging issues | Logic/code issues |
| **Updates** | Manual (rerun script) | Auto (rebuild package) |

---

## Custom Locations

Both scripts accept parameters:

```powershell
# Custom directory for tarball test
.\scripts\test-local.ps1 -TestDir "C:\temp\my-test" -ProjectName "my-app"

# Custom directory for symlink test
.\scripts\test-local-symlink.ps1 -TestDir "C:\temp\dev-test" -ProjectName "dev-app"
```

---

## Recommended Workflow

### During Development (Fast Iteration)
```powershell
# 1. Create symlinked test project once
pnpm test:local:symlink

# 2. Make changes, rebuild, test
# Repeat as needed...
```

### Before Publishing (Final Validation)
```powershell
# 1. Test with tarballs (exact npm experience)
pnpm test:local

# 2. Verify everything works
cd C:\Users\HP\Projects\gati-test-workspace\local-test-tarball\tarball-app
pnpm build
node dist\index.js

# 3. If good, publish
pnpm release:publish
```

---

## Troubleshooting

### "Cannot find module" errors
- Ensure packages are built: `pnpm build`
- Check symlinks exist: `ls node_modules/@gati-framework`

### Tarball not found
- Script creates tarballs in test directory
- Check: `ls C:\Users\HP\Projects\gati-test-workspace\local-test-tarball\*.tgz`

### Changes not reflected (symlink mode)
- Rebuild the package: `pnpm --filter @gati-framework/runtime build`
- Rebuild test project: `cd test-project && pnpm build`

### Permission errors
- Run PowerShell as Administrator
- Or use: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`

---

## Clean Up

Remove test directories:
```powershell
# Remove tarball test
Remove-Item C:\Users\HP\Projects\gati-test-workspace\local-test-tarball -Recurse -Force

# Remove symlink test
Remove-Item C:\Users\HP\Projects\gati-test-workspace\local-test-symlink -Recurse -Force

# Remove all test projects
Remove-Item C:\Users\HP\Projects\gati-test-workspace\local-* -Recurse -Force
```
