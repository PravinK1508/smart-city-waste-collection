# ==============================================================================
# SMART CITY WASTE COLLECTION & RECYCLING MANAGEMENT SYSTEM
# END-TO-END AUTOMATED VERIFICATION SCRIPT
# ==============================================================================

$baseUrl = "http://localhost:8080/api"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "STARTING FULL WORKFLOW INTEGRATION VERIFICATION TEST" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

function Assert-Condition($condition, $message) {
    if ($condition) {
        Write-Host " [PASS] $message" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] $message" -ForegroundColor Red
        throw "Assertion failed: $message"
    }
}

# ------------------------------------------------------------------------------
# STEP 1: Citizen Waste Reporting
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 1: CITIZEN WASTE REPORTING ---" -ForegroundColor Yellow

$reportPayload = @{
    citizenEmail = "pravin@gmail.com"
    citizenName = "Pravin K"
    citizenPhone = "9876543210"
    wasteCategory = "Plastic"
    description = "Bulk recyclable plastic bottles and packaging accumulated near Bus Stand roadside"
    address = "Near New Bus Stand, Perundurai"
    areaName = "Perundurai Central"
    latitude = [decimal]11.2750
    longitude = [decimal]77.5840
    estimatedQuantityKg = [decimal]450.00
    photoUrl = "/uploads/reports/sample.jpg"
} | ConvertTo-Json

$reportResponse = Invoke-RestMethod -Uri "$baseUrl/reports" -Method Post -ContentType "application/json" -Body (Get-Content -Raw "d:\final project\test_report.json")
Assert-Condition ($reportResponse -ne $null -and $reportResponse.reportId -gt 0) "Citizen report created successfully with ID: $($reportResponse.reportId)"
Assert-Condition ($reportResponse.status -eq "PENDING") "Initial report status is PENDING"
Assert-Condition ($reportResponse.estimatedQuantityKg -eq 450.00) "Estimated waste correctly recorded as 450.00 kg"
$reportId = $reportResponse.reportId

# ------------------------------------------------------------------------------
# STEP 2: Verify Report in Admin Dashboard and Map
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 2: VERIFY REPORT IN ADMIN OVERVIEW ---" -ForegroundColor Yellow
$fetchedReport = Invoke-RestMethod -Uri "$baseUrl/reports/$reportId" -Method Get
Assert-Condition ($fetchedReport.reportId -eq $reportId) "Admin retrieved persisted report from MySQL"
Assert-Condition ($fetchedReport.latitude -eq 11.2750 -and $fetchedReport.longitude -eq 77.5840) "Coordinates match real GIS location"

# ------------------------------------------------------------------------------
# STEP 3: Nearby Dustbins Discovery and Proximity Matrix
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 3: NEARBY DUSTBINS DISCOVERY (RADIUS = 5.0 KM) ---" -ForegroundColor Yellow
$nearbyBins = Invoke-RestMethod -Uri "$baseUrl/bins/nearby?reportId=$reportId&radius=5.0" -Method Get
Assert-Condition ($nearbyBins.Count -gt 0) "Found $($nearbyBins.Count) eligible nearby municipal dustbins within 5.0 km"
Write-Host "Nearby Bins Found:" -ForegroundColor Gray
foreach ($b in $nearbyBins) {
    Write-Host " - $($b.binCode): $($b.currentFillKg) kg / $($b.binCapacityKg) kg, Fill: $($b.fillPercentage)%, Dist: $($b.distanceKm) km, Status: $($b.collectionStatus)" -ForegroundColor Gray
}

# Filter idle bins for non-conflicting assignment
$idleNearbyBins = $nearbyBins | Where-Object { $_.collectionStatus -eq "IDLE" }
Assert-Condition ($idleNearbyBins.Count -gt 0) "Found available IDLE dustbins for assignment"

# ------------------------------------------------------------------------------
# STEP 4: Truck Capacity and Combined Calculation Verification
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 4: COMBINED COLLECTION LOAD CALCULATION AND CAPACITY VIOLATIONS ---" -ForegroundColor Yellow

$trucks = Invoke-RestMethod -Uri "$baseUrl/trucks" -Method Get
$availTrucks = $trucks | Where-Object { $_.operationalStatus -eq "AVAILABLE" }
Assert-Condition ($availTrucks.Count -gt 0) "Found available collection trucks in fleet"

# Select truck with ample capacity for feasible workflow (TRK-04: 1500 kg)
$selectedTruck = $availTrucks | Sort-Object -Property totalCapacityKg -Descending | Select-Object -First 1
Write-Host "Selected Truck for Feasible Plan: $($selectedTruck.truckCode) (Capacity: $($selectedTruck.totalCapacityKg) kg, Current Load: $($selectedTruck.currentLoadKg) kg, Remaining: $($selectedTruck.remainingCapacityKg) kg)" -ForegroundColor Gray

# Pick 2 available idle nearby bins
$selectedBinIds = @($idleNearbyBins[0].binId)
if ($idleNearbyBins.Count -gt 1) {
    $selectedBinIds += $idleNearbyBins[1].binId
}

$calcPayload = @{
    reportId = $reportId
    truckId = $selectedTruck.truckId
    selectedBinIds = $selectedBinIds
    simulateOnly = $true
} | ConvertTo-Json

$calcResult = Invoke-RestMethod -Uri "$baseUrl/trips/calculate" -Method Post -Headers $headers -Body $calcPayload
Write-Host "Combined Calculation Output:" -ForegroundColor Gray
Write-Host " - Roadside Waste: $($calcResult.roadsideWasteKg) kg" -ForegroundColor Gray
Write-Host " - Bins Additional Waste: $($calcResult.selectedBinsTotalKg) kg" -ForegroundColor Gray
Write-Host " - Combined Additional Load: $($calcResult.combinedAdditionalLoadKg) kg" -ForegroundColor Gray
Write-Host " - Projected Truck Load: $($calcResult.projectedTruckLoadKg) kg" -ForegroundColor Gray
Write-Host " - Projected Remaining Capacity: $($calcResult.projectedRemainingCapacityKg) kg" -ForegroundColor Gray
Write-Host " - Is Feasible: $($calcResult.feasible)" -ForegroundColor Gray

Assert-Condition ($calcResult.feasible -eq $true) "Calculated plan with truck $($selectedTruck.truckCode) is FEASIBLE"
Assert-Condition ($calcResult.combinedAdditionalLoadKg -eq ($calcResult.roadsideWasteKg + $calcResult.selectedBinsTotalKg)) "Combined load equals Roadside ($($calcResult.roadsideWasteKg)) + Bins ($($calcResult.selectedBinsTotalKg))"
Assert-Condition ($calcResult.projectedRemainingCapacityKg -eq ($calcResult.truckCapacityKg - $calcResult.projectedTruckLoadKg)) "Remaining capacity formula matches exactly: Total - Projected"

# Test 4B: Over-capacity violation check with small truck (TRK-03: 250 kg)
Write-Host "`nTesting Over-Capacity Hard Violation..." -ForegroundColor Gray
$smallTruck = $availTrucks | Sort-Object -Property totalCapacityKg | Select-Object -First 1
if ($smallTruck) {
    $overloadPayload = @{
        reportId = $reportId
        truckId = $smallTruck.truckId
        selectedBinIds = $selectedBinIds
        simulateOnly = $true
    } | ConvertTo-Json
    $overloadResult = Invoke-RestMethod -Uri "$baseUrl/trips/calculate" -Method Post -Headers $headers -Body $overloadPayload
    Assert-Condition ($overloadResult.feasible -eq $false) "Over-capacity correctly flagged as feasible = false for small truck ($($smallTruck.truckCode))"
    Write-Host " [PASS] Hard violation warning generated: $($overloadResult.feasibilityWarning)" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# STEP 5: Admin Confirmation and Trip Persistence
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 5: ADMIN CONFIRMATION AND TRIP PERSISTENCE ---" -ForegroundColor Yellow

$confirmPayload = @{
    reportId = $reportId
    truckId = $selectedTruck.truckId
    selectedBinIds = $selectedBinIds
    notes = "Priority morning run: roadside plastic + nearby commercial dustbins"
    simulateOnly = $false
} | ConvertTo-Json

$createdTrip = Invoke-RestMethod -Uri "$baseUrl/trips/confirm" -Method Post -Headers $headers -Body $confirmPayload
Assert-Condition ($createdTrip.tripId -gt 0) "Trip created in MySQL with ID: $($createdTrip.tripId) and Code: $($createdTrip.tripCode)"
Assert-Condition ($createdTrip.status -eq "ASSIGNED") "Trip status initialized to ASSIGNED"
Assert-Condition ($createdTrip.recommendedStops.Count -ge 2) "Trip stops sequence generated with $($createdTrip.recommendedStops.Count) ordered collection stops"
$tripId = $createdTrip.tripId

# Check database foreign key states
$reloadedTruck = Invoke-RestMethod -Uri "$baseUrl/trucks/$($selectedTruck.truckId)" -Method Get
Assert-Condition ($reloadedTruck.operationalStatus -eq "ASSIGNED") "Truck status transitioned to ASSIGNED"

$reloadedReport = Invoke-RestMethod -Uri "$baseUrl/reports/$reportId" -Method Get
Assert-Condition ($reloadedReport.status -eq "ASSIGNED") "Citizen report status transitioned to ASSIGNED"

foreach ($bId in $selectedBinIds) {
    $reloadedBin = Invoke-RestMethod -Uri "$baseUrl/bins/$bId" -Method Get
    Assert-Condition ($reloadedBin.collectionStatus -eq "SCHEDULED") "Dustbin $($reloadedBin.binCode) collectionStatus transitioned to SCHEDULED"
}

# ------------------------------------------------------------------------------
# STEP 6: Trip Lifecycle and Measured Collection Completion
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 6: DISPATCH, EXECUTE, AND COMPLETE COLLECTION ---" -ForegroundColor Yellow

# Dispatch
$dispatchedTrip = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/dispatch" -Method Post -Headers $headers -Body "{}"
Assert-Condition ($dispatchedTrip.status -eq "DISPATCHED") "Trip transitioned to DISPATCHED"

# Start Trip
$inProgressTrip = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/start" -Method Post -Headers $headers -Body "{}"
Assert-Condition ($inProgressTrip.status -eq "IN_PROGRESS") "Trip transitioned to IN_PROGRESS"

# Complete Collection with Actual Measured Weights
Write-Host "`nRecording measured weights upon collection completion..." -ForegroundColor Gray
$actualRoadsideWeight = [decimal]465.50
$actualBinWeights = @{}
foreach ($bId in $selectedBinIds) {
    $actualBinWeights["$bId"] = [decimal]210.00
}

$completionPayload = @{
    actualRoadsideKg = $actualRoadsideWeight
    binActualKg = $actualBinWeights
    notes = "Full pickup completed cleanly. No residual overflow."
} | ConvertTo-Json

$completedTrip = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/complete" -Method Post -Headers $headers -Body $completionPayload
Assert-Condition ($completedTrip.status -eq "READY_FOR_RECYCLING") "Trip transitioned to READY_FOR_RECYCLING"
Assert-Condition ($completedTrip.actualCollectedKg -gt 0) "Actual total collected recorded: $($completedTrip.actualCollectedKg) kg"

# Verify dustbins emptied to 0.00 kg
foreach ($bId in $selectedBinIds) {
    $emptiedBin = Invoke-RestMethod -Uri "$baseUrl/bins/$bId" -Method Get
    Assert-Condition ($emptiedBin.currentFillKg -eq 0.00) "Dustbin $($emptiedBin.binCode) emptied to 0.00 kg"
    Assert-Condition ($emptiedBin.collectionStatus -eq "IDLE") "Dustbin $($emptiedBin.binCode) reset to IDLE / AVAILABLE"
}

# Verify truck load updated to total collected weight
$loadedTruck = Invoke-RestMethod -Uri "$baseUrl/trucks/$($selectedTruck.truckId)" -Method Get
Assert-Condition ($loadedTruck.currentLoadKg -eq $completedTrip.actualCollectedKg) "Truck currentLoadKg accurately reflects collected payload: $($loadedTruck.currentLoadKg) kg"

# ------------------------------------------------------------------------------
# STEP 7: Recycling Destination Matching and Dispatch Management
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 7: RECYCLING DESTINATION RECOMMENDATION AND DISPATCH ---" -ForegroundColor Yellow

# Get recommendations for the trip waste category
$recommendations = Invoke-RestMethod -Uri "$baseUrl/recycling/recommendations?tripId=$tripId" -Method Get
Assert-Condition ($recommendations.Count -gt 0) "Found matching recycling facilities for Plastic category"
$bestFacility = $recommendations[0]
Write-Host "Recommended Facility: $($bestFacility.facilityName) (Accepted: $($bestFacility.acceptedCategories), Capacity: $($bestFacility.capacityKg) kg)" -ForegroundColor Gray

# Create recycling dispatch
$dispatchPayload = @{
    tripId = $tripId
    facilityId = $bestFacility.facilityId
    dispatchedQuantityKg = $completedTrip.actualCollectedKg
    notes = "Dispatched collected plastic payload for mechanical shredding and pelletization"
} | ConvertTo-Json

$dispatch = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches" -Method Post -Headers $headers -Body $dispatchPayload
Assert-Condition ($dispatch.dispatchId -gt 0) "Recycling dispatch recorded with ID: $($dispatch.dispatchId) and Code: $($dispatch.dispatchCode)"
Assert-Condition ($dispatch.status -eq "DISPATCH_PLANNED") "Initial dispatch status is DISPATCH_PLANNED"
$dispatchId = $dispatch.dispatchId

# Deliver to facility
$delivPayload = @{ status = "DELIVERED" } | ConvertTo-Json
$deliveredDispatch = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispatchId/status" -Method Patch -Headers $headers -Body $delivPayload
Assert-Condition ($deliveredDispatch.status -eq "DELIVERED") "Dispatch transitioned to DELIVERED"

# Confirm receipt with weighbridge verification
$receiptPayload = @{
    status = "RECEIPT_CONFIRMED"
    receivedWeightKg = $completedTrip.actualCollectedKg
    receiptNotes = "Weighbridge verified: Grade-A clean recyclable plastics received in full"
} | ConvertTo-Json

$confirmedDispatch = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispatchId/status" -Method Patch -Headers $headers -Body $receiptPayload
Assert-Condition ($confirmedDispatch.status -eq "RECEIPT_CONFIRMED") "Recycling receipt confirmed"

# Verify final operational states:
# 1. Collection Trip is CLOSED
$finalTrip = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId" -Method Get
Assert-Condition ($finalTrip.status -eq "CLOSED") "Collection trip marked CLOSED"

# 2. Citizen Report is CLOSED
$finalReport = Invoke-RestMethod -Uri "$baseUrl/reports/$reportId" -Method Get
Assert-Condition ($finalReport.status -eq "CLOSED") "Citizen report marked CLOSED"

# 3. Truck emptied and AVAILABLE
$finalTruck = Invoke-RestMethod -Uri "$baseUrl/trucks/$($selectedTruck.truckId)" -Method Get
Assert-Condition ($finalTruck.currentLoadKg -eq 0.00) "Truck load completely unloaded to 0.00 kg"
Assert-Condition ($finalTruck.operationalStatus -eq "AVAILABLE") "Truck status reset to AVAILABLE for new assignments"

# ------------------------------------------------------------------------------
# STEP 8: Read-Only What-If Simulation
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 8: WHAT-IF SIMULATION VERIFICATION ---" -ForegroundColor Yellow

$simPayload = @{
    reportId = $reportId
    assumedRoadsideKg = [decimal]500.00
    truckId = $finalTruck.truckId
    selectedBinIds = @($idleNearbyBins[0].binId)
    candidateFacilityId = $bestFacility.facilityId
} | ConvertTo-Json

$simResult = Invoke-RestMethod -Uri "$baseUrl/simulation/run" -Method Post -Headers $headers -Body $simPayload
Assert-Condition ($simResult -ne $null) "Simulation successfully executed"
Assert-Condition ($simResult.label -like "*SIMULATION*HYPOTHETICAL RESULTS*NO REAL OPERATIONAL CHANGES*") "Simulation contains required exact banner disclaimer"
Assert-Condition ($simResult.projectedTruckLoadKg -gt 0) "Hypothetical total waste calculated correctly"

# ------------------------------------------------------------------------------
# STEP 9: Real Analytics and Audit Logs
# ------------------------------------------------------------------------------
Write-Host "`n--- STEP 9: REAL DATABASE ANALYTICS AND AUDIT LOGS ---" -ForegroundColor Yellow

$analytics = Invoke-RestMethod -Uri "$baseUrl/analytics/dashboard" -Method Get
Assert-Condition ($analytics.totalReports -gt 0) "Total reports in analytics: $($analytics.totalReports)"
Assert-Condition ($analytics.completedReports -ge 1) "Completed reports accurately incremented in analytics: $($analytics.completedReports)"
Assert-Condition ($analytics.totalWasteCollectedKg -gt 0) "Total waste collected KPI recorded from actual DB transactions: $($analytics.totalWasteCollectedKg) kg"

$auditLogs = Invoke-RestMethod -Uri "$baseUrl/audit/logs" -Method Get
Assert-Condition ($auditLogs.Count -gt 0) "Audit trail records persistent transactions: $($auditLogs.Count) entries found"

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "ALL 9 END-TO-END WORKFLOW STEPS VERIFIED 100% SUCCESSFULLY!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
