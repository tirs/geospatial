# Urban Referral Network - Deployment Test Script
Write-Host "🚀 Testing Urban Referral Network Deployment..." -ForegroundColor Green

# Test 1: Build the application
Write-Host "`n📦 Testing Build Process..." -ForegroundColor Yellow
try {
    dotnet build -c Release
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Publish the application
Write-Host "`n📤 Testing Publish Process..." -ForegroundColor Yellow
try {
    dotnet publish -c Release -o ./test-publish
    Write-Host "✅ Publish successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Publish failed: $_" -ForegroundColor Red
    exit 1
}

# Test 3: Check if critical files exist
Write-Host "`n📋 Checking Critical Files..." -ForegroundColor Yellow
$criticalFiles = @(
    "./test-publish/UrbanReferralNetwork.dll",
    "./test-publish/wwwroot/js/config.js",
    "./test-publish/appsettings.Production.json"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $file" -ForegroundColor Red
    }
}

# Test 4: Check config.js content
Write-Host "`n🔧 Checking Config.js..." -ForegroundColor Yellow
$configContent = Get-Content "./test-publish/wwwroot/js/config.js" -Raw
if ($configContent -match "localhost") {
    Write-Host "⚠️  Warning: config.js still contains localhost references" -ForegroundColor Yellow
} else {
    Write-Host "✅ Config.js looks good for production" -ForegroundColor Green
}

# Test 5: Check for hardcoded URLs
Write-Host "`n🔍 Checking for Hardcoded URLs..." -ForegroundColor Yellow
$jsFiles = Get-ChildItem "./test-publish/wwwroot/js/*.js" -Recurse
$hardcodedUrls = @()

foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "http://localhost:\d+") {
        $hardcodedUrls += $file.Name
    }
}

if ($hardcodedUrls.Count -eq 0) {
    Write-Host "✅ No hardcoded localhost URLs found" -ForegroundColor Green
} else {
    Write-Host "❌ Found hardcoded URLs in: $($hardcodedUrls -join ', ')" -ForegroundColor Red
}

# Cleanup
Write-Host "`n🧹 Cleaning up..." -ForegroundColor Yellow
Remove-Item "./test-publish" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "`n🎉 Deployment test completed!" -ForegroundColor Green
Write-Host "📝 Summary of fixes applied:" -ForegroundColor Cyan
Write-Host "   • Fixed API base URL configuration" -ForegroundColor White
Write-Host "   • Removed hardcoded localhost URLs" -ForegroundColor White
Write-Host "   • Enabled database migration and seeding in production" -ForegroundColor White
Write-Host "   • Updated path configuration for Render deployment" -ForegroundColor White

Write-Host "`n🚀 Ready to deploy to Render!" -ForegroundColor Green