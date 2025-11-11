# Local Testing with Symlinks (Fast Iteration)
param(
    [string]$TestDir = "C:\Users\HP\Projects\gati-test-workspace\local-test-symlink"
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ProjectPath = Join-Path $TestDir "symlink-app"

Write-Host "Building packages..." -ForegroundColor Cyan
Push-Location $RepoRoot
pnpm --filter @gati-framework/runtime build
pnpm --filter @gati-framework/cli build
Pop-Location

if (Test-Path $TestDir) {
    Write-Host "Cleaning old test directory..." -ForegroundColor Yellow
    Remove-Item $TestDir -Recurse -Force
}

Write-Host "Creating test project..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectPath\src\handlers" -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectPath\src\modules" -Force | Out-Null

# package.json
@'
{
  "name": "symlink-app",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "gati build",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@gati-framework/core": "^0.4.2",
    "@gati-framework/runtime": "file:../../../gati/packages/runtime"
  },
  "devDependencies": {
    "@gati-framework/cli": "file:../../../gati/packages/cli",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.2"
  }
}
'@ | Out-File -FilePath "$ProjectPath\package.json" -Encoding utf8

# tsconfig.json
@'
{
  "extends": "@gati-framework/core/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
'@ | Out-File -FilePath "$ProjectPath\tsconfig.json" -Encoding utf8

# gati.config.ts
@'
import { defineConfig } from '@gati-framework/core';

export default defineConfig({
  name: 'symlink-app',
  version: '0.1.0',
  handlers: { dir: './src/handlers' },
  modules: { dir: './src/modules' }
});
'@ | Out-File -FilePath "$ProjectPath\gati.config.ts" -Encoding utf8

# src/index.ts
@'
import { createApp } from '@gati-framework/runtime';
import config from '../gati.config.js';

const app = createApp(config);
app.start();
'@ | Out-File -FilePath "$ProjectPath\src\index.ts" -Encoding utf8

# src/handlers/health.ts
@'
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = async (req, res) => {
  res.json({ status: 'ok', message: 'Symlink test works!' });
};
'@ | Out-File -FilePath "$ProjectPath\src\handlers\health.ts" -Encoding utf8

Write-Host "Installing dependencies (creating symlinks)..." -ForegroundColor Cyan
Push-Location $ProjectPath
pnpm install
Pop-Location

Write-Host "`n=== Test project ready! ===" -ForegroundColor Green
Write-Host "Location: $ProjectPath" -ForegroundColor Cyan
Write-Host "`nSymlinked packages:" -ForegroundColor Yellow
Write-Host "  runtime -> ../../gati/packages/runtime"
Write-Host "  cli -> ../../gati/packages/cli"
Write-Host "`nTo test:" -ForegroundColor Yellow
Write-Host "  cd $ProjectPath"
Write-Host "  pnpm build"
Write-Host "  node dist\index.js"
