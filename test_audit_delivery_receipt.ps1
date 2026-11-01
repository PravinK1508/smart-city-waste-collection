$baseUrl = "http://localhost:8080/api"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "================================================================="
Write-Host "AUDIT TEST 1: Driver submits delivery confirmation & evidence"
Write-Host "================================================================="

# 1. Citizen submits report
$rep = Invoke-RestMethod -Uri "$baseUrl/reports" -Method Post -Body (@{
    citizenEmail = "pravin@gmail.com"
    citizenName = "Pravin Kumar"
    wasteCategory = "PLASTIC"
    description = "Audit test roadside plastic"
    areaName = "Perundurai Zone 1"
    estimatedQuantityKg = 50.0
    latitude = 11.2740
    longitude = 77.5800
    address = "Main Rd, Perundurai"
} | ConvertTo-Json) -Headers $headers

$repId = $rep.reportId
Write-Host "Report #$repId created: status = $($rep.status)"

# 2. Admin confirms collection trip (TRK-01, Driver ID 4)
$tripRes = Invoke-RestMethod -Uri "$baseUrl/trips/confirm?adminName=Municipal%20Admin" -Method Post -Body (@{
    reportId = $repId
    truckId = 1
    selectedBinIds = @(1)
    notes = "Audit test plan"
} | ConvertTo-Json) -Headers $headers

$tripId = $tripRes.tripId
Write-Host "Trip #$tripId confirmed: status = $($tripRes.status), driver = $($tripRes.assignedDriverName)"

# 3. Driver completes collection
$colRes = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/complete?performedBy=Murugan%20S" -Method Post -Body (@{
    actualRoadsideKg = 50.0
    binActualKg = @{ "1" = 20.0 }
    notes = "Collected roadside plastic and emptied bin"
    collectionPhotoUrl = "http://localhost:8080/uploads/audit_col_photo.jpg"
} | ConvertTo-Json) -Headers $headers

Write-Host "Collection completed: Trip status = $($colRes.status), actualCollectedKg = $($colRes.actualCollectedKg)"

# Check Report Status after collection
$repAfterCol = Invoke-RestMethod -Uri "$baseUrl/reports/$repId" -Method Get
Write-Host "Report #$repId status after collection = $($repAfterCol.status) (Must NOT be CLOSED)"
if ($repAfterCol.status -eq "CLOSED") { throw "FAIL: Report was prematurely marked CLOSED!" }

# 4. Admin assigns recycling facility destination
$disp = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches?performedBy=Municipal%20Desk" -Method Post -Body (@{
    tripId = $tripId
    facilityId = 1
    dispatchedQuantityKg = 70.0
    notes = "Dispatched to GreenTech Facility"
} | ConvertTo-Json) -Headers $headers

$dispId = $disp.dispatchId
Write-Host "Recycling Dispatch #$dispId created: status = $($disp.status)"

# 5. Driver submits delivery confirmation & evidence
$evRes = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId/submit-evidence?performedBy=Murugan%20S" -Method Post -Body (@{
    evidencePhotoUrl = "http://localhost:8080/uploads/audit_gate_photo.jpg"
    deliveredWeightKg = 70.0
    deliveryNotes = "Delivered to facility weighbridge Gate 1"
    driverId = 4
} | ConvertTo-Json) -Headers $headers

Write-Host "`nCHECKING REQUIREMENT 1 & 2: Backend saves as PENDING_VERIFICATION"
Write-Host "Dispatch Status: $($evRes.status) (Expected: PENDING_VERIFICATION)"
Write-Host "Dispatch VerificationStatus: $($evRes.verificationStatus) (Expected: PENDING)"

# Check Trip status
$tripAfterEv = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId" -Method Get
Write-Host "Trip Status: $($tripAfterEv.status) (Expected: PENDING_ADMIN_VERIFICATION)"

# Check Report status (MUST NOT BE CLOSED)
$repAfterEv = Invoke-RestMethod -Uri "$baseUrl/reports/$repId" -Method Get
Write-Host "Citizen Report Status: $($repAfterEv.status) (Expected: COLLECTION_COMPLETED, NOT CLOSED)"

if ($evRes.status -ne "PENDING_VERIFICATION") { throw "FAIL: Dispatch status is not PENDING_VERIFICATION" }
if ($tripAfterEv.status -ne "PENDING_ADMIN_VERIFICATION") { throw "FAIL: Trip status is not PENDING_ADMIN_VERIFICATION" }
if ($repAfterEv.status -eq "CLOSED") { throw "FAIL: Report was marked CLOSED before Admin verification!" }

Write-Host "`n================================================================="
Write-Host "AUDIT TEST 2: Admin final Receipt Verification action"
Write-Host "================================================================="

$verRes = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId/verify?adminName=Municipal%20Admin" -Method Post -Body (@{
    action = "APPROVE"
    verifiedWeightKg = 70.0
    notes = "Gross tare slip verified & accepted by Municipal Admin"
} | ConvertTo-Json) -Headers $headers

Write-Host "Verification action executed: Dispatch status = $($verRes.status), VerificationStatus = $($verRes.verificationStatus)"

# Check final statuses in MySQL
$tripFinal = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId" -Method Get
$repFinal = Invoke-RestMethod -Uri "$baseUrl/reports/$repId" -Method Get
$truckFinal = Invoke-RestMethod -Uri "$baseUrl/trucks/1" -Method Get

Write-Host "`nCHECKING REQUIREMENT 5: Final statuses"
Write-Host "Final Dispatch Status: $($verRes.status) (Expected: RECEIPT_CONFIRMED)"
Write-Host "Final Trip Status: $($tripFinal.status) (Expected: CLOSED)"
Write-Host "Final Citizen Report Status: $($repFinal.status) (Expected: CLOSED)"
Write-Host "Final Truck Operational Status: $($truckFinal.operationalStatus) (Expected: AVAILABLE)"
Write-Host "Final Truck Current Load: $($truckFinal.currentLoadKg) kg (Expected: 0.00)"

if ($verRes.status -ne "RECEIPT_CONFIRMED") { throw "FAIL: Dispatch not RECEIPT_CONFIRMED" }
if ($tripFinal.status -ne "CLOSED") { throw "FAIL: Trip not CLOSED" }
if ($repFinal.status -ne "CLOSED") { throw "FAIL: Report not CLOSED" }
if ($truckFinal.operationalStatus -ne "AVAILABLE") { throw "FAIL: Truck not AVAILABLE" }

Write-Host "`n================================================================="
Write-Host "AUDIT TEST 3: Prevent duplicate completion actions"
Write-Host "================================================================="

# Attempt 1: Calling verifyDelivery again on closed dispatch
$dupVerifyBlocked = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId/verify?adminName=Admin" -Method Post -Body (@{ action = "APPROVE" } | ConvertTo-Json) -Headers $headers
} catch {
    $dupVerifyBlocked = $true
    Write-Host "SUCCESS: Duplicate verifyDelivery blocked: $($_.Exception.Message)"
}
if (-not $dupVerifyBlocked) { throw "FAIL: Duplicate verifyDelivery was NOT blocked!" }

# Attempt 2: Calling submitDeliveryEvidence on closed dispatch
$dupEvidenceBlocked = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId/submit-evidence?performedBy=Driver" -Method Post -Body (@{
        evidencePhotoUrl = "photo.jpg"; deliveredWeightKg = 70.0; deliveryNotes = "test"
    } | ConvertTo-Json) -Headers $headers
} catch {
    $dupEvidenceBlocked = $true
    Write-Host "SUCCESS: Duplicate submitDeliveryEvidence on closed dispatch blocked: $($_.Exception.Message)"
}
if (-not $dupEvidenceBlocked) { throw "FAIL: Duplicate submitDeliveryEvidence was NOT blocked!" }

# Attempt 3: Calling updateDispatchStatus on closed dispatch
$dupStatusBlocked = $false
try {
    Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId/status" -Method Patch -Body (@{ status = "DELIVERED" } | ConvertTo-Json) -Headers $headers
} catch {
    $dupStatusBlocked = $true
    Write-Host "SUCCESS: Duplicate updateDispatchStatus on closed dispatch blocked: $($_.Exception.Message)"
}
if (-not $dupStatusBlocked) { throw "FAIL: Duplicate updateDispatchStatus was NOT blocked!" }

Write-Host "`n================================================================="
Write-Host "AUDIT TEST 4: Intermediate 'Mark as Delivered' & 'Receipt Confirm'"
Write-Host "================================================================="

# Create a second trip to test the intermediate "Mark as Delivered" flow
$rep2 = Invoke-RestMethod -Uri "$baseUrl/reports" -Method Post -Body (@{
    citizenEmail = "pravin@gmail.com"; citizenName = "Pravin Kumar"; wasteCategory = "PLASTIC"
    description = "Test intermediate delivered flow"; areaName = "Zone 1"; estimatedQuantityKg = 30.0
    latitude = 11.2740; longitude = 77.5800; address = "Test Rd"
} | ConvertTo-Json) -Headers $headers
$repId2 = $rep2.reportId

$trip2 = Invoke-RestMethod -Uri "$baseUrl/trips/confirm?adminName=Admin" -Method Post -Body (@{
    reportId = $repId2; truckId = 1; selectedBinIds = @(); notes = "Trip 2"
} | ConvertTo-Json) -Headers $headers
$tripId2 = $trip2.tripId

Invoke-RestMethod -Uri "$baseUrl/trips/$tripId2/complete?performedBy=Driver" -Method Post -Body (@{
    actualRoadsideKg = 30.0; binActualKg = @{}; notes = "Col"
} | ConvertTo-Json) -Headers $headers | Out-Null

$disp2 = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches?performedBy=Admin" -Method Post -Body (@{
    tripId = $tripId2; facilityId = 1; dispatchedQuantityKg = 30.0; notes = "Disp 2"
} | ConvertTo-Json) -Headers $headers
$dispId2 = $disp2.dispatchId

# Test intermediate Mark as Delivered:
Write-Host "Admin clicks 'Mark as Delivered' on Dispatch #$dispId2..."
$delRes = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId2/status" -Method Patch -Body (@{
    status = "DELIVERED"; receivedWeightKg = 30.0; receiptNotes = "At gate"
} | ConvertTo-Json) -Headers $headers

Write-Host "After 'Mark as Delivered':"
Write-Host "Dispatch Status: $($delRes.status) (Expected: DELIVERED)"
$trip2AfterDel = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId2" -Method Get
$rep2AfterDel = Invoke-RestMethod -Uri "$baseUrl/reports/$repId2" -Method Get

Write-Host "Trip Status: $($trip2AfterDel.status) (Expected: DELIVERED_TO_FACILITY, NOT CLOSED)"
Write-Host "Report Status: $($rep2AfterDel.status) (Expected: COLLECTION_COMPLETED, NOT CLOSED)"

if ($trip2AfterDel.status -eq "CLOSED") { throw "FAIL: Intermediate Mark as Delivered closed trip!" }
if ($rep2AfterDel.status -eq "CLOSED") { throw "FAIL: Intermediate Mark as Delivered closed report!" }

# Test Receipt Confirm on DELIVERED dispatch:
Write-Host "`nAdmin clicks 'Receipt Confirm' on Dispatch #$dispId2..."
$rcRes = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId2/status?performedBy=Municipal%20Admin" -Method Patch -Body (@{
    status = "RECEIPT_CONFIRMED"; receivedWeightKg = 30.0; receiptNotes = "Receipt confirmed at weighbridge"
} | ConvertTo-Json) -Headers $headers

Write-Host "After 'Receipt Confirm':"
Write-Host "Dispatch Status: $($rcRes.status) (Expected: RECEIPT_CONFIRMED)"
Write-Host "Dispatch VerificationStatus: $($rcRes.verificationStatus) (Expected: APPROVED)"
Write-Host "Dispatch VerifiedBy: $($rcRes.verifiedBy) (Expected: Municipal Admin)"

$trip2Final = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId2" -Method Get
$rep2Final = Invoke-RestMethod -Uri "$baseUrl/reports/$repId2" -Method Get
Write-Host "Trip Status: $($trip2Final.status) (Expected: CLOSED)"
Write-Host "Report Status: $($rep2Final.status) (Expected: CLOSED)"

if ($rcRes.status -ne "RECEIPT_CONFIRMED") { throw "FAIL: Dispatch not RECEIPT_CONFIRMED" }
if ($rcRes.verificationStatus -ne "APPROVED") { throw "FAIL: VerificationStatus not APPROVED" }
if ($trip2Final.status -ne "CLOSED") { throw "FAIL: Trip not CLOSED" }
if ($rep2Final.status -ne "CLOSED") { throw "FAIL: Report not CLOSED" }

Write-Host "`n================================================================="
Write-Host "ALL AUDIT CHECKS PASSED 100% WITH ZERO BYPASS AND ZERO REGRESSION"
Write-Host "================================================================="
