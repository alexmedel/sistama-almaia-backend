# Script de prueba para endpoints ChatGPT
# Ejecutar: .\test-chatgpt-endpoints.ps1

$BASE_URL = "http://localhost:3000/api/v1/chatgpt"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Probando Endpoints ChatGPT Apps SDK" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Triage de síntomas
Write-Host "1. Probando /triage_symptom..." -ForegroundColor Yellow
$body1 = @{
    symptom = "dolor de cabeza"
    age = 25
    duration = "6h"
    fever_c = 37.8
    red_flags = @()
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$BASE_URL/triage_symptom" -Method Post -Body $body1 -ContentType "application/json"
    Write-Host "✓ Respuesta recibida:" -ForegroundColor Green
    Write-Host "  - Título: $($response1.data.title)" -ForegroundColor White
    Write-Host "  - Peligro: $($response1.data.danger)" -ForegroundColor White
    Write-Host "  - Acciones: $($response1.data.actions.Count) items" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Plan de hidratación
Write-Host "2. Probando /hydration_plan..." -ForegroundColor Yellow
$body2 = @{
    weightKg = 72
    activityLevel = "moderate"
    climate = "hot"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$BASE_URL/hydration_plan" -Method Post -Body $body2 -ContentType "application/json"
    Write-Host "✓ Respuesta recibida:" -ForegroundColor Green
    Write-Host "  - Total ml: $($response2.data.total_ml)" -ForegroundColor White
    Write-Host "  - Horarios: $($response2.data.schedule.Count) items" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Pausas de postura
Write-Host "3. Probando /posture_breaks..." -ForegroundColor Yellow
$body3 = @{
    workPattern = "desk8h"
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "$BASE_URL/posture_breaks" -Method Post -Body $body3 -ContentType "application/json"
    Write-Host "✓ Respuesta recibida:" -ForegroundColor Green
    Write-Host "  - Checklist: $($response3.data.checklist.Count) items" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 4: Estiramientos 5 minutos
Write-Host "4. Probando /stretches_5min..." -ForegroundColor Yellow
$body4 = @{
    target = "neck"
} | ConvertTo-Json

try {
    $response4 = Invoke-RestMethod -Uri "$BASE_URL/stretches_5min" -Method Post -Body $body4 -ContentType "application/json"
    Write-Host "✓ Respuesta recibida:" -ForegroundColor Green
    Write-Host "  - Total segundos: $($response4.data.total_seconds)" -ForegroundColor White
    Write-Host "  - Pasos: $($response4.data.steps.Count) items" -ForegroundColor White
    
    if ($response4.data.total_seconds -eq 300) {
        Write-Host "  ✓ Verificación: total_seconds = 300 ✓" -ForegroundColor Green
    } else {
        Write-Host "  ✗ ERROR: total_seconds debería ser 300, es $($response4.data.total_seconds)" -ForegroundColor Red
    }
    Write-Host ""
} catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Pruebas completadas" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
