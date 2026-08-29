# ============================================
# WH40k Colony Manager - Frontend Deployment Script
# ============================================
# 
# This script builds and prepares the frontend for production deployment
# Prerequisites:
#   - Node.js 18+ installed
#   - npm or pnpm installed
#   - .env.production configured in frontend/
#
# Usage: .\scripts\deploy_frontend.ps1
# ============================================

param(
    [switch]$SkipBuild,
    [switch]$DryRun,
    [switch]$Preview,
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host $args[0] -ForegroundColor Red }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }

# Header
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  WH40k Colony Manager - Frontend Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Change to frontend directory
$frontendDir = Join-Path $PSScriptRoot "..\frontend"
Set-Location $frontendDir
Write-Info "Working directory: $frontendDir"

# Check Node.js installation
Write-Info "Checking Node.js installation..."
try {
    $nodeVersion = node --version 2>&1
    $npmVersion = npm --version 2>&1
    Write-Success "  Node.js: $nodeVersion"
    Write-Success "  npm: $npmVersion"
} catch {
    Write-Error-Custom "ERROR: Node.js not found. Please install Node.js 18+"
    exit 1
}

# Check environment file
Write-Info "Checking environment configuration..."
if (Test-Path ".env.production") {
    Write-Success "  Production environment file found"
    
    # Check API URL
    $envContent = Get-Content ".env.production" -Raw
    if ($envContent -match "VITE_API_BASE_URL=http://localhost") {
        Write-Warning "  WARNING: VITE_API_BASE_URL still points to localhost!"
        Write-Warning "  Update to production API URL before deploying"
        if (-not $DryRun -and -not $Preview) {
            $continue = Read-Host "  Continue anyway? (y/n)"
            if ($continue -ne 'y') {
                Write-Info "Deployment cancelled"
                exit 0
            }
        }
    }
} elseif (Test-Path ".env.local") {
    Write-Warning "  Using .env.local instead of .env.production"
} elseif (Test-Path ".env") {
    Write-Warning "  Using .env instead of .env.production"
} else {
    Write-Warning "  No environment file found - using defaults"
}

# Install dependencies
Write-Info "Checking node_modules..."
if (-not (Test-Path "node_modules")) {
    Write-Info "  Installing dependencies..."
    if (-not $DryRun) {
        npm install
        Write-Success "  Dependencies installed"
    } else {
        Write-Info "  [DRY RUN] Would install dependencies"
    }
} else {
    Write-Success "  node_modules found"
}

# Run linting
Write-Info "Running linter..."
if (-not $DryRun) {
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.lint) {
            npm run lint
            Write-Success "  Linting completed"
        } else {
            Write-Info "  No lint script found in package.json"
        }
    }
} else {
    Write-Info "  [DRY RUN] Would run linter"
}

# Run tests
Write-Info "Running tests..."
if (-not $DryRun) {
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.test) {
            npm test -- --run
            if ($LASTEXITCODE -eq 0) {
                Write-Success "  All tests passed"
            } else {
                Write-Warning "  Some tests failed. Review output above."
                if (-not $Preview) {
                    $continue = Read-Host "  Continue deployment anyway? (y/n)"
                    if ($continue -ne 'y') {
                        Write-Info "Deployment cancelled"
                        exit 0
                    }
                }
            }
        } else {
            Write-Info "  No test script found in package.json"
        }
    }
} else {
    Write-Info "  [DRY RUN] Would run tests"
# Build for production
if (-not $SkipBuild) {
    Write-Host ""
    Write-Info "Building for production..."
    if (-not $DryRun) {
        if ($Preview) {
            Write-Info "Preview mode - building for development preview"
        }
        npm run build
        
        if (Test-Path "dist") {
            $distSize = (Get-ChildItem "dist" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Success "  Build completed: {0:N2} MB" -f $distSize
        } else {
            Write-Error-Custom "  ERROR: Build failed - dist/ directory not created"
            exit 1
        }
    } else {
        Write-Info "  [DRY RUN] Would build frontend"
    }
} else {
    Write-Info "Skipping build (--SkipBuild flag set)"
}

# Preview mode
if ($Preview -and -not $DryRun) {
    Write-Host ""
    Write-Info "Starting preview server..."
    Write-Info "Press Ctrl+C to stop"
    Write-Host ""
    npm run preview
}

# Return to original directory
Set-Location -Path $PSScriptRoot\..

# Summary
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deployment Preparation Complete" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (-not $SkipBuild -and -not $DryRun) {
    Write-Info "Production build created in: frontend/dist/"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "  1. Upload dist/ folder to your web server"
    Write-Host "  2. Configure web server for SPA routing"
    Write-Host "  3. Ensure API_BASE_URL points to production backend"
    Write-Host ""
    Write-Info "Example nginx configuration:"
    Write-Host @"
  location / {
    try_files `$uri `$uri/ /index.html;
  }
"@ -ForegroundColor Gray
}

if ($DryRun) {
    Write-Warning "DRY RUN COMPLETE - No changes were made"
} else {
    Write-Success "Frontend deployment preparation complete!"
}
}