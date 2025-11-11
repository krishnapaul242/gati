# Local Testing Script for Gati Framework
# Tests unpublished changes as if installed from npm

param(
    [string]$TestDir = "C:\Users\HP\Projects\gati-test-workspace\local-test-tarball",
    [string]$ProjectName = "tarball-app"
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ProjectPath = Join-Path $TestDir $ProjectName

Write-Host "🔧 Building all packages..." -ForegroundColor Cyan

# Build packages
Push-Location $RepoRoot
pnpm --filter @gati-framework/runtime build
pnpm --filter @gati-framework/cli build
Pop-Location

Write-Host "`n📦 Creating package tarballs..." -ForegroundColor Cyan

# Create tarballs
Push-Location (Join-Path $RepoRoot "packages\runtime")
$runtimeTarball = (pnpm pack --pack-destination $TestDir 2>&1 | Select-String -Pattern "\.tgz$").ToString().Trim()
Pop-Location

Push-Location (Join-Path $RepoRoot "packages\cli")
$cliTarball = (pnpm pack --pack-destination $TestDir 2>&1 | Select-String -Pattern "\.tgz$").ToString().Trim()
Pop-Location

Write-Host "`n✅ Tarballs created in $TestDir" -ForegroundColor Green
Write-Host "  Runtime: $runtimeTarball"
Write-Host "  CLI: $cliTarball"

# Clean up old test project
if (Test-Path $ProjectPath) {
    Write-Host "`n🧹 Cleaning old test project..." -ForegroundColor Yellow
    Remove-Item $ProjectPath -Recurse -Force
}

# Create test project structure
Write-Host "`n🚀 Creating test project..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null

# Create package.json
$packageJson = @{
    name = $ProjectName
    version = "0.1.0"
    type = "module"
    description = "Local test project with tarball dependencies"
    scripts = @{
        dev = "gati dev"
        build = "gati build"
        start = "node dist/index.js"
        typecheck = "tsc --noEmit"
    }
    dependencies = @{
        "@gati-framework/core" = "^0.4.2"
    }
    devDependencies = @{
        "@types/node" = "^20.10.0"
        typescript = "^5.3.2"
    }
    engines = @{
        node = ">=18.0.0"
    }
}

$packageJsonPath = Join-Path $ProjectPath "package.json"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath

# Create tsconfig.json
$tsconfigJson = @{
    extends = "@gati-framework/core/tsconfig.base.json"
    compilerOptions = @{
        outDir = "./dist"
        rootDir = "./src"
    }
    include = @("src/**/*")
    exclude = @("node_modules", "dist")
}

$tsconfigPath = Join-Path $ProjectPath "tsconfig.json"
$tsconfigJson | ConvertTo-Json -Depth 10 | Set-Content $tsconfigPath

# Create gati.config.ts
$gaticConfigContent = @"
import { defineConfig } from '@gati-framework/core';

export default defineConfig({
  name: '$ProjectName',
  version: '0.1.0',
  handlers: {
    dir: './src/handlers'
  },
  modules: {
    dir: './src/modules'
  }
});
"@

$gaticConfigPath = Join-Path $ProjectPath "gati.config.ts"
Set-Content -Path $gaticConfigPath -Value $gaticConfigContent

# Create src directories
New-Item -ItemType Directory -Path (Join-Path $ProjectPath "src/handlers") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $ProjectPath "src/modules") -Force | Out-Null

# Create src/index.ts
$indexTsContent = @"
import { createApp } from '@gati-framework/runtime';
import config from '../gati.config.js';

const app = createApp(config);

app.start();
"@

$indexTsPath = Join-Path $ProjectPath "src/index.ts"
Set-Content -Path $indexTsPath -Value $indexTsContent

# Create sample handler
$healthHandlerContent = @"
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res) => {
  res.json({ status: 'ok', message: 'Health check passed' });
};
"@

$healthHandlerPath = Join-Path $ProjectPath "src/handlers/health.ts"
Set-Content -Path $healthHandlerPath -Value $healthHandlerContent

# Install core dependencies first
Write-Host "`n� Installing dependencies..." -ForegroundColor Cyan
Push-Location $ProjectPath
pnpm install

# Now add local tarballs
Write-Host "`n🔗 Installing local packages from tarballs..." -ForegroundColor Cyan
$runtimeTarballPath = Join-Path $TestDir $runtimeTarball
$cliTarballPath = Join-Path $TestDir $cliTarball

pnpm add $runtimeTarballPath
pnpm add -D $cliTarballPath

Pop-Location

Write-Host "`n✅ Test project ready!" -ForegroundColor Green
Write-Host "Location: $ProjectPath" -ForegroundColor Cyan
Write-Host "`nInstalled from tarballs:" -ForegroundColor Yellow
Write-Host "  $runtimeTarballPath"
Write-Host "  $cliTarballPath"
Write-Host "`n💡 This simulates exactly what users get from npm!" -ForegroundColor Magenta
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  cd $ProjectPath"
Write-Host "  pnpm build"
Write-Host "  node dist\index.js"
Write-Host "`nTo test new changes, run:" -ForegroundColor Yellow
Write-Host "  pnpm test:local"

