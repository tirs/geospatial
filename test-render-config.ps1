# Test Render Configuration
Write-Host "🔧 Testing Render Configuration..." -ForegroundColor Green

# Test 1: Check if appsettings.Render.json exists
Write-Host "`n📋 Checking Configuration Files..." -ForegroundColor Yellow
if (Test-Path "appsettings.Render.json") {
    Write-Host "✅ appsettings.Render.json found" -ForegroundColor Green
    
    # Check connection string
    $renderConfig = Get-Content "appsettings.Render.json" | ConvertFrom-Json
    if ($renderConfig.ConnectionStrings.DefaultConnection) {
        Write-Host "✅ Connection string configured in Render settings" -ForegroundColor Green
    } else {
        Write-Host "❌ No connection string in Render settings" -ForegroundColor Red
    }
} else {
    Write-Host "❌ appsettings.Render.json not found" -ForegroundColor Red
}

# Test 2: Check render.yaml
Write-Host "`n🚀 Checking render.yaml..." -ForegroundColor Yellow
if (Test-Path "render.yaml") {
    Write-Host "✅ render.yaml found" -ForegroundColor Green
    
    $renderYaml = Get-Content "render.yaml" -Raw
    if ($renderYaml -match "ASPNETCORE_ENVIRONMENT.*Render") {
        Write-Host "✅ Environment set to 'Render'" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Environment not set to 'Render'" -ForegroundColor Yellow
    }
    
    if ($renderYaml -match "ConnectionStrings__DefaultConnection") {
        Write-Host "✅ Connection string environment variable configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Connection string environment variable missing" -ForegroundColor Red
    }
} else {
    Write-Host "❌ render.yaml not found" -ForegroundColor Red
}

# Test 3: Build and check output
Write-Host "`n📦 Testing Build..." -ForegroundColor Yellow
try {
    dotnet publish -c Release -o ./test-render-build --verbosity quiet
    
    if (Test-Path "./test-render-build/appsettings.Render.json") {
        Write-Host "✅ appsettings.Render.json included in build" -ForegroundColor Green
    } else {
        Write-Host "❌ appsettings.Render.json missing from build" -ForegroundColor Red
    }
    
    # Cleanup
    Remove-Item "./test-render-build" -Recurse -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
}

Write-Host "`n🎯 Summary:" -ForegroundColor Cyan
Write-Host "   • Environment changed from 'Production' to 'Render'" -ForegroundColor White
Write-Host "   • This will use appsettings.Render.json configuration" -ForegroundColor White
Write-Host "   • Added enhanced database connection testing" -ForegroundColor White
Write-Host "   • Added debug endpoints for troubleshooting" -ForegroundColor White

Write-Host "`n🚀 Ready to deploy to Render!" -ForegroundColor Green
Write-Host "After deployment, test these URLs:" -ForegroundColor Yellow
Write-Host "   • https://your-app.onrender.com/api/referral/test-db-connection" -ForegroundColor White
Write-Host "   • https://your-app.onrender.com/api/referral/debug-zip/90210" -ForegroundColor White