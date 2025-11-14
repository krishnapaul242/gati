# Local Testing with Tarballs (npm simulation)
param(
    [string]$TestDir = "C:\Users\HP\Projects\gati-test-workspace\local-test-tarball"
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
$ProjectPath = Join-Path $TestDir "tarball-app"

Write-Host "Building packages..." -ForegroundColor Cyan
Push-Location $RepoRoot
pnpm --filter @gati-framework/runtime build
pnpm --filter @gati-framework/cli build
Pop-Location

Write-Host "Creating tarballs..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $TestDir -Force | Out-Null

Push-Location "$RepoRoot\packages\runtime"
pnpm pack --pack-destination $TestDir | Out-Null
$runtimeTar = Get-ChildItem -Path $TestDir -Filter "gati-framework-runtime-*.tgz" | Select-Object -First 1 -ExpandProperty Name
Pop-Location

Push-Location "$RepoRoot\packages\cli"
pnpm pack --pack-destination $TestDir | Out-Null
$cliTar = Get-ChildItem -Path $TestDir -Filter "gati-framework-cli-*.tgz" | Select-Object -First 1 -ExpandProperty Name
Pop-Location

Write-Host "Tarballs created:" -ForegroundColor Green
Write-Host "  $runtimeTar"
Write-Host "  $cliTar"

if (Test-Path $ProjectPath) {
    Write-Host "Cleaning old project..." -ForegroundColor Yellow
    Remove-Item $ProjectPath -Recurse -Force
}

Write-Host "Creating test project..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectPath\src\handlers" -Force | Out-Null
New-Item -ItemType Directory -Path "$ProjectPath\src\modules" -Force | Out-Null

# package.json
@'
{
  "name": "tarball-app",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "build": "gati build",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@gati-framework/core": "^0.4.2"
  },
  "devDependencies": {
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
export default {
  name: 'tarball-app',
  version: '0.1.0',
  handlers: { dir: './src/handlers' },
  modules: { dir: './src/modules' }
};
'@ | Out-File -FilePath "$ProjectPath\gati.config.ts" -Encoding utf8

# src/index.ts
@'
import { createApp } from '@gati-framework/runtime';

const app = createApp({ port: 3000 });

// Load handler from file
import('./handlers/health.js').then(({ handler }) => {
  app.get('/health', handler);
  
  app.listen().then(() => {
    console.log('✅ Tarball test server running on http://localhost:3000');
    console.log('🧪 Test: curl http://localhost:3000/health');
  });
});
'@ | Out-File -FilePath "$ProjectPath\src\index.ts" -Encoding utf8

# src/handlers/health.ts
@'
import type { Handler } from '@gati-framework/runtime';

export const handler: Handler = (req, res) => {
  res.json({ status: 'ok', message: 'Tarball test works!' });
};
'@ | Out-File -FilePath "$ProjectPath\src\handlers\health.ts" -Encoding utf8

Write-Host "Installing dependencies..." -ForegroundColor Cyan
Push-Location $ProjectPath
pnpm install

Write-Host "Installing from tarballs..." -ForegroundColor Cyan
pnpm add "$TestDir\$runtimeTar"
pnpm add -D "$TestDir\$cliTar"
Pop-Location

Write-Host "`n=== Test project ready! ===" -ForegroundColor Green
Write-Host "Location: $ProjectPath" -ForegroundColor Cyan
Write-Host "`nInstalled from:" -ForegroundColor Yellow
Write-Host "  $TestDir\$runtimeTar"
Write-Host "  $TestDir\$cliTar"
Write-Host "`nTo test:" -ForegroundColor Yellow
Write-Host "  cd $ProjectPath"
Write-Host "  pnpm build"
Write-Host "  node dist\index.js"
