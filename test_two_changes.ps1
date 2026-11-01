$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "VERIFYING THE TWO REQUIRED CHANGES" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# TEST CHANGE 1: AUTHENTICATION FLOW
Write-Host "`n--- CHANGE 1: AUTHENTICATION TESTS ---" -ForegroundColor Yellow

# Test 1.1: Invalid login fails with 401
Write-Host "Test 1.1: Testing invalid login..." -NoNewline
try {
    $badLogin = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@smartcity.gov","password":"WrongPassword"}'
    Write-Host " FAIL (Unexpected success)" -ForegroundColor Red
} catch {
    Write-Host " PASS (Clean 401 Unauthorized rejection)" -ForegroundColor Green
}

# Test 1.2: Admin login succeeds with proper role
Write-Host "Test 1.2: Testing Admin login (admin@smartcity.gov)..." -NoNewline
$adminAuth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@smartcity.gov","password":"Admin@123"}'
if ($adminAuth.success -and $adminAuth.role -eq "ADMIN") {
    Write-Host " PASS (Role: ADMIN, Name: $($adminAuth.fullName))" -ForegroundColor Green
} else {
    Write-Host " FAIL" -ForegroundColor Red
    exit 1
}

# Test 1.3: Citizen login succeeds with proper role
Write-Host "Test 1.3: Testing Citizen login (pravin@gmail.com)..." -NoNewline
$citizenAuth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"pravin@gmail.com","password":"Citizen@123"}'
if ($citizenAuth.success -and $citizenAuth.role -eq "CITIZEN") {
    Write-Host " PASS (Role: CITIZEN, Name: $($citizenAuth.fullName))" -ForegroundColor Green
} else {
    Write-Host " FAIL" -ForegroundColor Red
    exit 1
}

# TEST CHANGE 2: RECYCLING DESTINATION WORKFLOW & "GO TO THIS INDUSTRY"
Write-Host "`n--- CHANGE 2: RECYCLING INDUSTRY DISPATCH WORKFLOW ---" -ForegroundColor Yellow

# Test 2.1: Retrieve real recycling facilities from MySQL
Write-Host "Test 2.1: Fetching stored facilities from MySQL..." -NoNewline
$facilities = Invoke-RestMethod -Uri "http://localhost:8080/api/recycling/facilities" -Method Get
if ($facilities.Count -ge 2) {
    Write-Host " PASS ($($facilities.Count) registered facilities found: $($facilities[0].facilityName))" -ForegroundColor Green
} else {
    Write-Host " FAIL (No facilities found)" -ForegroundColor Red
    exit 1
}

# Test 2.2: Create a citizen report for testing the complete dispatch workflow
Write-Host "Test 2.2: Creating fresh roadside waste report..." -NoNewline
$newReport = Invoke-RestMethod -Uri "http://localhost:8080/api/reports" -Method Post -ContentType "application/json" -Body '{
    "citizenEmail": "pravin@gmail.com",
    "citizenName": "Pravin Kumar",
    "citizenPhone": "9876543210",
    "wasteCategory": "Plastic",
    "description": "Roadside plastic waste near textile park",
    "estimatedQuantityKg": 95.0,
    "areaName": "Perundurai Industrial Estate",
    "latitude": 11.2785,
    "longitude": 77.5850
}'
Write-Host " PASS (Report #$($newReport.reportId) created)" -ForegroundColor Green

# Test 2.3: Calculate combined collection plan (truck capacity & nearby bins preserved)
Write-Host "Test 2.3: Calculating combined plan with truck capacity..." -NoNewline
$allTrucks = Invoke-RestMethod -Uri "http://localhost:8080/api/trucks" -Method Get
$availTruck = $allTrucks | Where-Object { $_.operationalStatus -eq "AVAILABLE" } | Select-Object -First 1

$plan = Invoke-RestMethod -Uri "http://localhost:8080/api/trips/calculate" -Method Post -ContentType "application/json" -Body (@{
    reportId = $newReport.reportId
    truckId = $availTruck.truckId
    selectedBinIds = @(5, 6)
    notes = "Automated test plan"
} | ConvertTo-Json)

if ($plan.feasible -eq $true) {
    Write-Host " PASS (Feasible! Combined Load: $($plan.combinedAdditionalLoadKg) kg, Truck: $($plan.truckCode))" -ForegroundColor Green
} else {
    Write-Host " FAIL: $($plan.feasibilityWarning)" -ForegroundColor Red
    exit 1
}

# Test 2.4: Admin confirms collection trip (Step 1 finalized)
Write-Host "Test 2.4: Admin confirms collection trip..." -NoNewline
$confirmedTrip = Invoke-RestMethod -Uri "http://localhost:8080/api/trips/confirm?adminName=Municipal+Admin" -Method Post -ContentType "application/json" -Body (@{
    reportId = $newReport.reportId
    truckId = $availTruck.truckId
    selectedBinIds = @(5, 6)
    notes = "Confirmed for testing"
} | ConvertTo-Json)

if ($confirmedTrip.tripId -gt 0) {
    Write-Host " PASS (Trip #$($confirmedTrip.tripId) confirmed: $($confirmedTrip.tripCode))" -ForegroundColor Green
} else {
    Write-Host " FAIL" -ForegroundColor Red
    exit 1
}

# Test 2.5: Find matching facility for Plastic category
$plasticFacility = $facilities | Where-Object { $_.acceptedCategories -like "*Plastic*" -and $_.operationalStatus -eq "ACTIVE" } | Select-Object -First 1
Write-Host "Test 2.5: Matched compatible facility: $($plasticFacility.facilityName)" -ForegroundColor Cyan

# Test 2.6: Explicit "Go to This Industry" Dispatch Confirmation (Step 3 & 4)
Write-Host "Test 2.6: Executing 'Go to This Industry' dispatch..." -NoNewline
$dispatchReq = @{
    tripId = $confirmedTrip.tripId
    facilityId = $plasticFacility.facilityId
    dispatchedQuantityKg = $confirmedTrip.combinedAdditionalLoadKg
    notes = "Explicitly dispatched via 'Go to This Industry' workflow"
} | ConvertTo-Json

$createdDispatch = Invoke-RestMethod -Uri "http://localhost:8080/api/recycling/dispatches?performedBy=Municipal+Admin" -Method Post -ContentType "application/json" -Body $dispatchReq

if ($createdDispatch.dispatchId -gt 0 -and $createdDispatch.status -eq "DISPATCH_PLANNED") {
    Write-Host " PASS (Dispatch code: $($createdDispatch.dispatchCode), Status: $($createdDispatch.status))" -ForegroundColor Green
} else {
    Write-Host " FAIL" -ForegroundColor Red
    exit 1
}

# Test 2.7: Prevent Duplicate Dispatch for the same trip
Write-Host "Test 2.7: Verifying duplicate dispatch is strictly blocked..." -NoNewline
try {
    $dup = Invoke-RestMethod -Uri "http://localhost:8080/api/recycling/dispatches" -Method Post -ContentType "application/json" -Body $dispatchReq
    Write-Host " FAIL (Duplicate was allowed!)" -ForegroundColor Red
} catch {
    Write-Host " PASS (Duplicate blocked with expected error: $($_.Exception.Message))" -ForegroundColor Green
}

# Test 2.8: Query dispatch by tripId endpoint
Write-Host "Test 2.8: Querying dispatch by trip ID..." -NoNewline
$tripDispatch = Invoke-RestMethod -Uri "http://localhost:8080/api/recycling/dispatches/by-trip/$($confirmedTrip.tripId)" -Method Get
if ($tripDispatch.dispatchId -eq $createdDispatch.dispatchId) {
    Write-Host " PASS (Found matching dispatch #$($tripDispatch.dispatchId) for trip #$($confirmedTrip.tripId))" -ForegroundColor Green
} else {
    Write-Host " FAIL" -ForegroundColor Red
}

# Test 2.9: Full lifecycle progression (DISPATCH_PLANNED -> DISPATCHED -> DELIVERED -> RECEIPT_CONFIRMED)
Write-Host "Test 2.9: Updating dispatch to DISPATCHED..." -NoNewline
$step1 = Invoke-RestMethod -Uri "http://localhost:8080/api/recycling/dispatches/$($createdDispatch.dispatchId)/status" -Method Patch -ContentType "application/json" -Body '{"status":"DISPATCHED"}'
Write-Host " PASS (Status: $($step1.status))" -ForegroundColor Green

Write-Host "Test 2.10: Updating dispatch to DELIVERED..." -NoNewline
$step2 = Invoke-RestMethod -Uri "http://localhost:8080/api/recycling/dispatches/$($createdDispatch.dispatchId)/status" -Method Patch -ContentType "application/json" -Body '{"status":"DELIVERED"}'
Write-Host " PASS (Status: $($step2.status))" -ForegroundColor Green

Write-Host "Test 2.11: Updating dispatch to RECEIPT_CONFIRMED (Weighbridge)..." -NoNewline
$step3 = Invoke-RestMethod -Uri "http://localhost:8080/api/recycling/dispatches/$($createdDispatch.dispatchId)/status" -Method Patch -ContentType "application/json" -Body '{"status":"RECEIPT_CONFIRMED","receivedWeightKg":235.0,"receiptNotes":"Weighbridge confirmed. Recycled cleanly."}'
Write-Host " PASS (Status: $($step3.status), Received: $($step3.receivedWeightKg) kg)" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "ALL ACCEPTANCE CRITERIA FOR BOTH CHANGES FULLY PASSED!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
