# Urban Referral Network - Production Deployment Verification Script
# Run this script AFTER uploading to production to verify deployment

$baseUrl = "https://urbanreferralnetwork.com/core"

Write-Host "Verifying Urban Referral Network deployment..." -ForegroundColor Green
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# Test main page
Write-Host "1. Testing main page..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " ✓ SUCCESS" -ForegroundColor Green
    } else {
        Write-Host " ✗ FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host " ✗ FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
}

# Test health endpoint
Write-Host "2. Testing health endpoint..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " ✓ SUCCESS" -ForegroundColor Green
        $healthData = $response.Content | ConvertFrom-Json
        Write-Host "   Status: $($healthData.status)" -ForegroundColor Cyan
    } else {
        Write-Host " ✗ FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host " ✗ FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
}

# Test API endpoint
Write-Host "3. Testing API endpoint..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/v1/contractors/search?zipCode=90210" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 401) {
        Write-Host " ✓ SUCCESS (API responding)" -ForegroundColor Green
    } else {
        Write-Host " ✗ FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host " ✗ FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
}

# Test static files
Write-Host "4. Testing static files..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/css/global.css" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host " ✓ SUCCESS" -ForegroundColor Green
    } else {
        Write-Host " ✗ FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host " ✗ FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
}

Write-Host ""
Write-Host "Verification complete!" -ForegroundColor Green
Write-Host "If all tests passed, your deployment is successful!" -ForegroundColor Yellow