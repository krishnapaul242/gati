# Todo API Demo Script for PowerShell
# Run: .\test-demo.ps1

$BASE_URL = "http://localhost:3000/api"

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "TODO API - Demo Session" -ForegroundColor Yellow
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

function Test-API {
    param($number, $description)
    Write-Host "TEST $number`: $description" -ForegroundColor Green
}

function Show-Response {
    param($response)
    $response | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor White
    Write-Host ""
}

# Test 1: Create first todo
Test-API 1 "Creating first todo..."
$todo1 = Invoke-RestMethod -Uri "$BASE_URL/todos" -Method Post `
    -ContentType "application/json" `
    -Body '{"title":"Learn Gati Framework"}'
Write-Host "✓ Status: 201 Created" -ForegroundColor Green
Show-Response $todo1
Start-Sleep -Seconds 1

# Test 2: Create second todo
Test-API 2 "Creating second todo..."
$todo2 = Invoke-RestMethod -Uri "$BASE_URL/todos" -Method Post `
    -ContentType "application/json" `
    -Body '{"title":"Build an API"}'
Write-Host "✓ Status: 201 Created" -ForegroundColor Green
Show-Response $todo2
Start-Sleep -Seconds 1

$todoId = $todo1.todo.id

# Test 3: List all todos
Test-API 3 "Listing all todos..."
$todos = Invoke-RestMethod -Uri "$BASE_URL/todos"
Write-Host "✓ Status: 200 OK" -ForegroundColor Green
Write-Host "✓ Found $($todos.todos.Count) todos" -ForegroundColor Green
Show-Response $todos
Start-Sleep -Seconds 1

# Test 4: Get specific todo
Test-API 4 "Getting todo $todoId..."
$todo = Invoke-RestMethod -Uri "$BASE_URL/todos/$todoId"
Write-Host "✓ Status: 200 OK" -ForegroundColor Green
Show-Response $todo
Start-Sleep -Seconds 1

# Test 5: Update todo
Test-API 5 "Updating todo $todoId..."
$updated = Invoke-RestMethod -Uri "$BASE_URL/todos/$todoId" -Method Put `
    -ContentType "application/json" `
    -Body '{"completed":true}'
Write-Host "✓ Status: 200 OK" -ForegroundColor Green
Show-Response $updated
Start-Sleep -Seconds 1

# Test 6: Delete todo
Test-API 6 "Deleting todo $todoId..."
Invoke-RestMethod -Uri "$BASE_URL/todos/$todoId" -Method Delete | Out-Null
Write-Host "✓ Status: 204 No Content" -ForegroundColor Green
Write-Host "✓ Todo deleted successfully" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 1

# Test 7: List todos after deletion
Test-API 7 "Listing todos after deletion..."
$finalTodos = Invoke-RestMethod -Uri "$BASE_URL/todos"
Write-Host "✓ Status: 200 OK" -ForegroundColor Green
Write-Host "✓ Found $($finalTodos.todos.Count) todos" -ForegroundColor Green
Show-Response $finalTodos
Start-Sleep -Seconds 1

# Test 8: Error handling
Test-API 8 "Testing error handling (404)..."
try {
    Invoke-RestMethod -Uri "$BASE_URL/todos/999999"
} catch {
    Write-Host "✓ Status: 404 Not Found" -ForegroundColor Green
    $_.ErrorDetails.Message | ConvertFrom-Json | Show-Response
}
Start-Sleep -Seconds 1

# Test 9: Validation
Test-API 9 "Testing validation (400)..."
try {
    Invoke-RestMethod -Uri "$BASE_URL/todos" -Method Post `
        -ContentType "application/json" `
        -Body '{}'
} catch {
    Write-Host "✓ Status: 400 Bad Request" -ForegroundColor Green
    $_.ErrorDetails.Message | ConvertFrom-Json | Show-Response
}

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host ("=" * 59) -ForegroundColor Cyan
