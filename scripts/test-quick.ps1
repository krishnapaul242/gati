# Quick Local Test - Creates project with CLI then installs local builds
param(
    [string]$Mode = "symlink"  # "symlink" or "tarball"
)

$testBase = "C:\Users\HP\Projects\gati-test-workspace"
$projectName = "quick-test-$Mode"
$projectPath = Join-Path $testBase $projectName

Write-Host "`n=== Gati Local Test ($Mode mode) ===" -ForegroundColor Cyan

# Clean old project
if (Test-Path $projectPath) {
    Write-Host "Removing old test project..." -ForegroundColor Yellow
    Remove-Item $projectPath -Recurse -Force
}

# Create fresh project using published CLI
Write-Host "Creating project with gati CLI..." -ForegroundColor Cyan
Push-Location $testBase
npx gatic@latest create $projectName --template minimal --skip-prompts
Pop-Location

# Build local packages
Write-Host "`nBuilding local packages..." -ForegroundColor Cyan
pnpm --filter @gati-framework/runtime build
pnpm --filter @gati-framework/cli build

# Install based on mode
Push-Location $projectPath

if ($Mode -eq "symlink") {
    Write-Host "`nLinking local packages (symlink mode)..." -ForegroundColor Cyan
    
    # Update package.json to use file: protocol
    $pkg = Get-Content package.json | ConvertFrom-Json
    $pkg.dependencies.'@gati-framework/runtime' = "file:../../gati/packages/runtime"
    $pkg.devDependencies.'@gati-framework/cli' = "file:../../gati/packages/cli"
    $pkg | ConvertTo-Json -Depth 10 | Set-Content package.json
    
    pnpm install
    
    Write-Host "`n✅ Symlinked to local packages" -ForegroundColor Green
    Write-Host "Changes to runtime/CLI will reflect after rebuild" -ForegroundColor Yellow
    
} else {
    Write-Host "`nInstalling from local tarballs..." -ForegroundColor Cyan
    
    # Create tarballs
    $runtimeTar = pnpm --filter @gati-framework/runtime pack --pack-destination $testBase
    $cliTar = pnpm --filter @gati-framework/cli pack --pack-destination $testBase
    
    # Install from tarballs  
    pnpm add "$testBase\$runtimeTar"
    pnpm add -D "$testBase\$cliTar"
    
    Write-Host "`n✅ Installed from tarballs" -ForegroundColor Green
    Write-Host "This matches what npm users will get" -ForegroundColor Yellow
}

Pop-Location

# Test it
Write-Host "`n=== Testing ===" -ForegroundColor Cyan
Push-Location $projectPath
pnpm build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build successful!" -ForegroundColor Green
    Write-Host "`nTo run:" -ForegroundColor Yellow
    Write-Host "  cd $projectPath"
    Write-Host "  node dist\index.js"
} else {
    Write-Host "`n❌ Build failed" -ForegroundColor Red
}

Pop-Location
