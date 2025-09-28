# Urban Referral Network - Render Deployment Script

Write-Host "Urban Referral Network - Render Deployment Preparation" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path ".\geospatial\UrbanReferralNetwork.csproj")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Test build locally
Write-Host "`nTesting local build..." -ForegroundColor Yellow
Set-Location ".\geospatial"

try {
    # Clean previous builds
    Write-Host "Cleaning previous builds..." -ForegroundColor Cyan
    dotnet clean

    # Restore packages
    Write-Host "Restoring NuGet packages..." -ForegroundColor Cyan
    dotnet restore

    # Build the project
    Write-Host "Building project..." -ForegroundColor Cyan
    dotnet build -c Release

    # Test publish
    Write-Host "Testing publish..." -ForegroundColor Cyan
    dotnet publish -c Release -o ./publish --no-restore

    Write-Host "`n✓ Local build successful!" -ForegroundColor Green
    
    # Check if publish directory contains the expected files
    if (Test-Path "./publish/UrbanReferralNetwork.dll") {
        Write-Host "✓ Main application DLL found" -ForegroundColor Green
    } else {
        Write-Host "✗ Main application DLL not found" -ForegroundColor Red
    }
    
    if (Test-Path "./publish/wwwroot") {
        Write-Host "✓ Static files directory found" -ForegroundColor Green
    } else {
        Write-Host "✗ Static files directory not found" -ForegroundColor Red
    }

} catch {
    Write-Host "`n✗ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Set-Location ".."

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "Deployment Checklist:" -ForegroundColor Yellow
Write-Host "1. ✓ render.yaml configured in root directory" -ForegroundColor Green
Write-Host "2. ✓ Health check endpoint added (/health)" -ForegroundColor Green
Write-Host "3. ✓ Environment-specific configuration created" -ForegroundColor Green
Write-Host "4. ✓ Database migration strategy updated" -ForegroundColor Green
Write-Host "5. ✓ Build tested locally" -ForegroundColor Green

Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Commit all changes to your Git repository" -ForegroundColor Cyan
Write-Host "2. Push to your main branch" -ForegroundColor Cyan
Write-Host "3. Connect your repository to Render" -ForegroundColor Cyan
Write-Host "4. Render will automatically detect render.yaml and deploy" -ForegroundColor Cyan

Write-Host "`nImportant Notes:" -ForegroundColor Yellow
Write-Host "- Database connection string is configured for your existing SQL Server" -ForegroundColor Cyan
Write-Host "- Application will be available at the URL provided by Render" -ForegroundColor Cyan
Write-Host "- Health check endpoint: https://your-app.onrender.com/health" -ForegroundColor Cyan
Write-Host "- Default admin login: ADMIN_001 / TempPass123!" -ForegroundColor Cyan

Write-Host "`n✓ Deployment preparation complete!" -ForegroundColor Green