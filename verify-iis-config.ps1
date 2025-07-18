# PowerShell script to verify IIS configuration for Geospatial sub-application
# Run as Administrator

Write-Host "🔍 Verifying IIS Configuration for Geospatial Sub-Application" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Import WebAdministration module
Import-Module WebAdministration -ErrorAction SilentlyContinue
if (-not (Get-Module WebAdministration)) {
    Write-Host "❌ WebAdministration module not available. Installing IIS Management Tools..." -ForegroundColor Red
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole, IIS-WebServer, IIS-CommonHttpFeatures, IIS-HttpErrors, IIS-HttpLogging, IIS-RequestFiltering, IIS-StaticContent, IIS-DefaultDocument, IIS-DirectoryBrowsing, IIS-ASPNET45, IIS-NetFxExtensibility45, IIS-ISAPIExtensions, IIS-ISAPIFilter, IIS-HttpCompressionStatic, IIS-ManagementConsole
    Import-Module WebAdministration
}

Write-Host "1. 🔍 Checking ASP.NET Core Hosting Bundle..." -ForegroundColor Yellow
$hostingBundle = Get-ChildItem "HKLM:SOFTWARE\WOW6432Node\Microsoft\Updates" -ErrorAction SilentlyContinue | Where-Object {$_.name -like "*ASP.NET Core*"}
if ($hostingBundle) {
    Write-Host "   ✅ ASP.NET Core Hosting Bundle is installed" -ForegroundColor Green
    $hostingBundle | ForEach-Object { Write-Host "      - $($_.PSChildName)" -ForegroundColor Gray }
} else {
    Write-Host "   ❌ ASP.NET Core Hosting Bundle NOT found!" -ForegroundColor Red
    Write-Host "      Download from: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
}

Write-Host "`n2. 🔍 Checking Application Pools..." -ForegroundColor Yellow
$appPools = Get-IISAppPool | Where-Object { $_.Name -like "*geospatial*" -or $_.Name -like "*Geospatial*" }
if ($appPools) {
    foreach ($pool in $appPools) {
        Write-Host "   📋 Found App Pool: $($pool.Name)" -ForegroundColor Green
        Write-Host "      - .NET CLR Version: $($pool.ManagedRuntimeVersion)" -ForegroundColor Gray
        Write-Host "      - Pipeline Mode: $($pool.ProcessModel.PipelineMode)" -ForegroundColor Gray
        Write-Host "      - State: $($pool.State)" -ForegroundColor Gray
        
        if ($pool.ManagedRuntimeVersion -ne "") {
            Write-Host "      ❌ WARNING: .NET CLR Version should be 'No Managed Code' (empty)" -ForegroundColor Red
        } else {
            Write-Host "      ✅ .NET CLR Version correctly set to 'No Managed Code'" -ForegroundColor Green
        }
    }
} else {
    Write-Host "   ❌ No geospatial application pools found!" -ForegroundColor Red
    Write-Host "      Create a new app pool with 'No Managed Code'" -ForegroundColor Yellow
}

Write-Host "`n3. 🔍 Checking Sites and Applications..." -ForegroundColor Yellow
$sites = Get-IISSite
foreach ($site in $sites) {
    if ($site.Name -like "*urban*" -or $site.Name -like "*referral*") {
        Write-Host "   🌐 Site: $($site.Name)" -ForegroundColor Green
        Write-Host "      - State: $($site.State)" -ForegroundColor Gray
        Write-Host "      - Physical Path: $($site.Applications['/'].VirtualDirectories['/'].PhysicalPath)" -ForegroundColor Gray
        
        # Check for geospatial application
        $geospatialApp = $site.Applications | Where-Object { $_.Path -eq "/geospatial" }
        if ($geospatialApp) {
            Write-Host "      ✅ /geospatial application found" -ForegroundColor Green
            Write-Host "         - App Pool: $($geospatialApp.ApplicationPoolName)" -ForegroundColor Gray
            Write-Host "         - Physical Path: $($geospatialApp.VirtualDirectories['/'].PhysicalPath)" -ForegroundColor Gray
        } else {
            Write-Host "      ❌ /geospatial application NOT found!" -ForegroundColor Red
            Write-Host "         Create sub-application in IIS Manager" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n4. 🔍 Checking File Permissions..." -ForegroundColor Yellow
# This would need the actual path - placeholder for now
Write-Host "   ℹ️  Manually verify that IIS_IUSRS has read access to geospatial folder" -ForegroundColor Cyan

Write-Host "`n5. 🔧 Recommended Actions:" -ForegroundColor Yellow
Write-Host "   1. Ensure ASP.NET Core Hosting Bundle is installed" -ForegroundColor White
Write-Host "   2. Create application pool with 'No Managed Code'" -ForegroundColor White
Write-Host "   3. Create /geospatial sub-application pointing to correct folder" -ForegroundColor White
Write-Host "   4. Assign the .NET Core app pool to the sub-application" -ForegroundColor White
Write-Host "   5. Restart IIS: iisreset" -ForegroundColor White

Write-Host "`n6. 🧪 Test URLs:" -ForegroundColor Yellow
Write-Host "   - Health Check: https://urbanreferralnetwork.com/geospatial/health" -ForegroundColor Cyan
Write-Host "   - Login Page: https://urbanreferralnetwork.com/geospatial/unified-login.html" -ForegroundColor Cyan
Write-Host "   - Dashboard: https://urbanreferralnetwork.com/geospatial/pages/dashboard.html" -ForegroundColor Cyan

Write-Host "`n✅ Configuration check complete!" -ForegroundColor Green
Write-Host "If issues persist, check IIS logs and Event Viewer" -ForegroundColor Yellow