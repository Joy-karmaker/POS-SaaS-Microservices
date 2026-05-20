# Professional Full-Stack Auto-Review Script (DOCKER VERSION)
# This script scans your entire project for security, logic, and formatting issues.

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   🚀 STARTING FULL-STACK AUTO-REVIEW" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

# Check if Docker is running
$containerStatus = docker compose ps --format json
if (-not $containerStatus) {
    Write-Host "❌ ERROR: Containers are not running. Please run 'docker compose up -d' first." -ForegroundColor Red
    exit 1
}

# --- PART 1: FRONTEND REVIEW ---
Write-Host "--- [FRONTEND] REVIEWING ---" -ForegroundColor Magenta

# 1. Security
Write-Host "  🛡️  Running Security Audit..." -ForegroundColor Yellow
docker compose exec -T frontend npm audit --audit-level=high
if ($LASTEXITCODE -ne 0) { Write-Host "  ⚠️  Security warnings found." -ForegroundColor Red }

# 2. Linting
Write-Host "  🔍 Running ESLint..." -ForegroundColor Yellow
docker compose exec -T frontend npm run lint
if ($LASTEXITCODE -ne 0) { Write-Host "  ❌ Linting errors found." -ForegroundColor Red }

# 3. Formatting
Write-Host "  🎨 Checking Formatting..." -ForegroundColor Yellow
docker compose exec -T frontend npx prettier --check "src/**/*.{js,jsx,ts,tsx,css}"
if ($LASTEXITCODE -ne 0) { Write-Host "  ❌ Formatting issues found." -ForegroundColor Red }


# --- PART 2: BACKEND REVIEW (CATALOG SERVICE) ---
Write-Host "`n--- [BACKEND: CATALOG] REVIEWING ---" -ForegroundColor Magenta

# 1. Security
Write-Host "  🛡️  Running Security Audit..." -ForegroundColor Yellow
docker compose exec -T catalog-service npm audit --audit-level=high
if ($LASTEXITCODE -ne 0) { Write-Host "  ⚠️  Security warnings found." -ForegroundColor Red }

# 2. Linting (TypeScript checks)
Write-Host "  🔍 Running ESLint (TS)..." -ForegroundColor Yellow
docker compose exec -T catalog-service npm run lint
if ($LASTEXITCODE -ne 0) { Write-Host "  ❌ TypeScript/Linting errors found." -ForegroundColor Red }

# 3. Unit Tests
Write-Host "  🧪 Running Unit Tests..." -ForegroundColor Yellow
docker compose exec -T catalog-service npm run test -- --passWithNoTests
if ($LASTEXITCODE -ne 0) { Write-Host "  ❌ Backend tests failed." -ForegroundColor Red }


Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   ✅ AUTO-REVIEW COMPLETE" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan
