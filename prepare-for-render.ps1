# Urban Referral Network - Render Deployment Preparation Script

Write-Host "🚀 Preparing Urban Referral Network for Render Deployment" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Yellow

# Check if git is initialized
Write-Host "1. Checking Git repository..." -NoNewline
if (Test-Path ".git") {
    Write-Host " ✓ Git repository found" -ForegroundColor Green
} else {
    Write-Host " ⚠️  Git repository not found. Initializing..." -ForegroundColor Yellow
    git init
    Write-Host "   ✓ Git repository initialized" -ForegroundColor Green
}

# Check if files are ready
Write-Host "2. Checking required files..." -NoNewline
$requiredFiles = @(
    "UrbanReferralNetwork.csproj",
    "Program.cs",
    "appsettings.json",
    "appsettings.Production.json",
    "appsettings.Render.json",
    "render.yaml",
    "Dockerfile"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        Write-Host " ✗ Missing: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if ($allFilesExist) {
    Write-Host " ✓ All required files present" -ForegroundColor Green
} else {
    Write-Host " ✗ Some files are missing" -ForegroundColor Red
    exit 1
}

# Build test
Write-Host "3. Testing build..." -NoNewline
try {
    $buildResult = dotnet build -c Release --verbosity quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✓ Build successful" -ForegroundColor Green
    } else {
        Write-Host " ✗ Build failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " ✗ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create .gitignore if it doesn't exist
Write-Host "4. Checking .gitignore..." -NoNewline
if (!(Test-Path ".gitignore")) {
    Write-Host " ⚠️  Creating .gitignore..." -ForegroundColor Yellow
    @"
# Build outputs
bin/
obj/
publish/
publish-production/

# User-specific files
*.suo
*.user
*.userosscache
*.sln.docstates

# Visual Studio files
.vs/
*.vspscc
*.vssscc

# Logs
logs/
*.log

# Environment files
.env
.env.local

# Database
*.db
*.sqlite

# Keys
keys/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Host " ✓ .gitignore created" -ForegroundColor Green
} else {
    Write-Host " ✓ .gitignore exists" -ForegroundColor Green
}

# Check git status
Write-Host "5. Checking git status..." -NoNewline
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host " ⚠️  Uncommitted changes found" -ForegroundColor Yellow
    Write-Host "   Modified files:" -ForegroundColor Cyan
    $gitStatus | ForEach-Object { Write-Host "   $_" -ForegroundColor Cyan }
} else {
    Write-Host " ✓ Working directory clean" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Commit your changes: git add . && git commit -m 'Prepare for Render deployment'" -ForegroundColor White
Write-Host "2. Push to your git repository: git push origin main" -ForegroundColor White
Write-Host "3. Go to https://render.com and create a new Web Service" -ForegroundColor White
Write-Host "4. Connect your repository and deploy!" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed instructions, see: RENDER-DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Your app will be available at: https://your-app-name.onrender.com" -ForegroundColor Green