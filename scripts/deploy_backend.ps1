# ============================================
# WH40k Colony Manager - Backend Deployment Script
# ============================================
# 
# This script deploys the backend to production
# Prerequisites:
#   - Python 3.11+ installed
#   - Virtual environment activated
#   - .env.production configured
#   - Database backup completed (if upgrading)
#
# Usage: .\scripts\deploy_backend.ps1
# ============================================

param(
    [switch]$SkipMigrations,
    [switch]$DryRun,
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
Write-Host "  WH40k Colony Manager - Backend Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Python installation
Write-Info "Checking Python installation..."
try {
    $pythonVersion = python --version 2>&1
    Write-Success "  Python: $pythonVersion"
} catch {
    Write-Error-Custom "ERROR: Python not found. Please install Python 3.11+"
    exit 1
}

# Check virtual environment
Write-Info "Checking virtual environment..."
if (Test-Path ".\.venv\Scripts\Activate.ps1") {
    Write-Success "  Virtual environment found"
    
    if (-not $DryRun) {
        & ".\.venv\Scripts\Activate.ps1"
        Write-Success "  Virtual environment activated"
    }
} else {
    Write-Warning "  Virtual environment not found at .\.venv"
    Write-Info "  Creating virtual environment..."
    if (-not $DryRun) {
        python -m venv .venv
        & ".\.venv\Scripts\Activate.ps1"
        Write-Success "  Virtual environment created and activated"
    }
}

# Check environment file
Write-Info "Checking environment configuration..."
if (Test-Path ".env.production") {
    Write-Success "  Production environment file found"
    
    # Warn about JWT secret
    $envContent = Get-Content ".env.production" -Raw
    if ($envContent -match "JWT_SECRET_KEY=CHANGE_THIS") {
        Write-Warning "  WARNING: JWT_SECRET_KEY still has placeholder value!"
        Write-Warning "  Please generate a secure key before deploying:"
        Write-Warning "  python -c `"import secrets; print(secrets.token_urlsafe(32))`""
        if (-not $DryRun) {
            $continue = Read-Host "  Continue anyway? (y/n)"
            if ($continue -ne 'y') {
                Write-Info "Deployment cancelled"
                exit 0
            }
        }
    }
} elseif (Test-Path ".env") {
    Write-Warning "  Using .env instead of .env.production"
} else {
    Write-Error-Custom "ERROR: No environment file found (.env.production or .env)"
    exit 1
}

# Install dependencies
Write-Info "Installing dependencies..."
if (-not $DryRun) {
    pip install --upgrade pip
    pip install -r requirements.txt
    Write-Success "  Dependencies installed"
} else {
    Write-Info "  [DRY RUN] Would install dependencies"
}

# Run database migrations
if (-not $SkipMigrations) {
    Write-Info "Running database migrations..."
    if (-not $DryRun) {
        python -m alembic upgrade head
        Write-Success "  Database migrations completed"
    } else {
        Write-Info "  [DRY RUN] Would run migrations"
    }
} else {
    Write-Info "Skipping database migrations (--SkipMigrations flag set)"
}

# Run tests (optional but recommended)
Write-Info "Running tests (recommended for production)..."
if (-not $DryRun) {
    $testResult = pytest tests/ -q --tb=short
    if ($LASTEXITCODE -eq 0) {
        Write-Success "  All tests passed"
    } else {
        Write-Warning "  Some tests failed. Review output above."
        $continue = Read-Host "  Continue deployment anyway? (y/n)"
        if ($continue -ne 'y') {
            Write-Info "Deployment cancelled"
            exit 0
        }
    }
} else {
    Write-Info "  [DRY RUN] Would run tests"
}

# Start production server
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deployment Preparation Complete" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Info "To start the production server, run:"
Write-Host ""
Write-Host "  uvicorn src.colony_manager.adapters.api.app:app `"
Write-Host "    --host 0.0.0.0 `"
Write-Host "    --port 8000 `"
Write-Host "    --workers 4 `"
Write-Host "    --env-file .env.production" -ForegroundColor White
Write-Host ""
Write-Info "Or for development/testing:"
Write-Host "  python -m uvicorn src.colony_manager.adapters.api.app:app --reload"
Write-Host ""

if ($DryRun) {
    Write-Warning "DRY RUN COMPLETE - No changes were made"
} else {
    Write-Success "Backend deployment preparation complete!"
}