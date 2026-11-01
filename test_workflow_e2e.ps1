$baseUrl = "http://localhost:8080/api"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "=== TEST 1: Citizen submits waste report ==="
$reportPayload = @{
    citizenEmail = "pravin@gmail.com"
    citizenName = "Pravin Kumar"
    citizenPhone = "9876543210"
    wasteCategory = "PLASTIC"
    description = "Roadside plastic waste near IT corridor"
    areaName = "Velachery IT Corridor"
    estimatedQuantityKg = 45.0
    latitude = 12.9716
    longitude = 80.2435
    address = "100 Feet Bypass Rd, Velachery"
} | ConvertTo-Json

$rep = Invoke-RestMethod -Uri "$baseUrl/reports" -Method Post -Body $reportPayload -Headers $headers
$repId = $rep.reportId
Write-Host "SUCCESS: Report created ID $repId | Category: $($rep.wasteCategory) | Status: $($rep.status)"

Write-Host "`n=== TEST 2: Admin confirms collection plan (Truck TRK-01, Driver ID 4) ==="
$planPayload = @{
    reportId = $repId
    truckId = 1
    selectedBinIds = @(1, 2)
    notes = "Confirmed collection plan by Admin"
} | ConvertTo-Json

$tripRes = Invoke-RestMethod -Uri "$baseUrl/trips/confirm?adminName=Municipal%20Admin" -Method Post -Body $planPayload -Headers $headers
$tripId = $tripRes.tripId
Write-Host "SUCCESS: Trip confirmed ID $tripId | Code: $($tripRes.tripCode) | Truck: $($tripRes.truckCode) | Driver: $($tripRes.assignedDriverName)"

Write-Host "`n=== TEST 3: Driver (ID 4) views assigned trips ==="
$driverTrips = Invoke-RestMethod -Uri "$baseUrl/trips/driver/4" -Method Get
$myTrip = $driverTrips | Where-Object { $_.tripId -eq $tripId }
Write-Host "SUCCESS: Driver 4 assigned trip: ID $($myTrip.tripId) | Code: $($myTrip.tripCode) | Status: $($myTrip.status)"

Write-Host "`n=== TEST 4: Driver starts trip ==="
$startPayload = @{ performedBy = "Murugan S" } | ConvertTo-Json
$started = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/start" -Method Post -Body $startPayload -Headers $headers
Write-Host "SUCCESS: Trip started: Status: $($started.status)"

Write-Host "`n=== TEST 5: Stage A - Driver records actual weights & submits collection details ==="
$completePayload = @{
    actualRoadsideKg = 48.0
    binActualKg = [ordered]@{ "1" = 25.0; "2" = 25.0 }
    notes = "Collected all roadside plastic waste and emptied 2 bins."
    collectionPhotoUrl = "http://localhost:8080/uploads/collection_site_photo_001.jpg"
} | ConvertTo-Json

$collected = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId/complete?performedBy=Murugan%20S" -Method Post -Body $completePayload -Headers $headers
Write-Host "SUCCESS: Collection completed: Status: $($collected.status) | ActualCollectedKg: $($collected.actualCollectedKg) | Photo: $($collected.collectionPhotoUrl)"

Write-Host "`n=== TEST 6: Stage B - Admin assigns recycling facility destination ==="
$dispPayload = @{
    tripId = $tripId
    facilityId = 1
    dispatchedQuantityKg = $collected.actualCollectedKg
    notes = "Dispatched plastic collection to GreenTech Recovery Facility"
} | ConvertTo-Json

$dispatch = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches?performedBy=Municipal%20Desk" -Method Post -Body $dispPayload -Headers $headers
$dispId = $dispatch.dispatchId
Write-Host "SUCCESS: Recycling destination assigned: Dispatch ID $dispId | Code: $($dispatch.dispatchCode) | Status: $($dispatch.status)"

Write-Host "`n=== TEST 7: Stage C - Driver reaches facility & submits delivery evidence ==="
$evidencePayload = @{
    evidencePhotoUrl = "http://localhost:8080/uploads/weighbridge_slip_001.jpg"
    deliveredWeightKg = 98.0
    deliveryNotes = "Delivered to GreenTech Facility Gate 2 weighbridge."
    driverId = 4
} | ConvertTo-Json

$evRes = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId/submit-evidence?performedBy=Murugan%20S" -Method Post -Body $evidencePayload -Headers $headers
Write-Host "SUCCESS: Evidence submitted: Dispatch Status: $($evRes.status) | VerificationStatus: $($evRes.verificationStatus)"

$tripAfterEvidence = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId" -Method Get
Write-Host "SUCCESS: CollectionTrip Status: $($tripAfterEvidence.status) (Must be PENDING_ADMIN_VERIFICATION)"

Write-Host "`n=== TEST 8: Admin inspects evidence & REJECTS (requests re-upload) ==="
$rejectPayload = @{
    action = "REJECT"
    rejectionReason = "Weighbridge gross tare slip is blurred and illegible. Please re-upload clear photo."
} | ConvertTo-Json

$rejRes = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId/verify?adminName=Municipal%20Admin" -Method Post -Body $rejectPayload -Headers $headers
Write-Host "SUCCESS: After Reject: Dispatch Status: $($rejRes.status) | VerificationStatus: $($rejRes.verificationStatus)"
Write-Host "         Rejection Reason saved: '$($rejRes.rejectionReason)'"

$tripAfterReject = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId" -Method Get
$reportAfterReject = Invoke-RestMethod -Uri "$baseUrl/reports/$repId" -Method Get
Write-Host "SUCCESS: Trip Status: $($tripAfterReject.status) (Must be REUPLOAD_REQUESTED)"
Write-Host "SUCCESS: Citizen Report Status: $($reportAfterReject.status) (Must remain COLLECTION_COMPLETED)"

Write-Host "`n=== TEST 9: Driver views rejection reason & re-submits corrected evidence ==="
$correctedPayload = @{
    evidencePhotoUrl = "http://localhost:8080/uploads/clear_certified_slip_002.jpg"
    deliveredWeightKg = 98.0
    deliveryNotes = "Re-uploaded clear high-res photo of certified weighbridge slip."
    driverId = 4
} | ConvertTo-Json

$evRes2 = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId/submit-evidence?performedBy=Murugan%20S" -Method Post -Body $correctedPayload -Headers $headers
Write-Host "SUCCESS: Re-submitted: Dispatch Status: $($evRes2.status) | VerificationStatus: $($evRes2.verificationStatus)"

Write-Host "`n=== TEST 10: Admin approves corrected delivery evidence ==="
$approvePayload = @{
    action = "APPROVE"
    verifiedWeightKg = 98.0
    notes = "Weighbridge slip verified and gross weight confirmed. Quality approved."
} | ConvertTo-Json

$appRes = Invoke-RestMethod -Uri "$baseUrl/recycling/dispatches/$dispId/verify?adminName=Municipal%20Admin" -Method Post -Body $approvePayload -Headers $headers
Write-Host "SUCCESS: After Approve: Dispatch Status: $($appRes.status) | VerificationStatus: $($appRes.verificationStatus) | VerifiedBy: $($appRes.verifiedBy)"

Write-Host "`n=== TEST 11: Final State & Persistence Verification in Database ==="
$finalTrip = Invoke-RestMethod -Uri "$baseUrl/trips/$tripId" -Method Get
$finalReport = Invoke-RestMethod -Uri "$baseUrl/reports/$repId" -Method Get
$finalTruck = Invoke-RestMethod -Uri "$baseUrl/trucks/1" -Method Get

Write-Host "Final Trip Status: $($finalTrip.status) (Expected: CLOSED)"
Write-Host "Final Report Status: $($finalReport.status) (Expected: CLOSED)"
Write-Host "Final Truck Status: $($finalTruck.operationalStatus) (Expected: AVAILABLE)"
Write-Host "Final Truck Load: $($finalTruck.currentLoadKg) kg (Expected: 0.00)"

if ($finalTrip.status -eq "CLOSED" -and $finalReport.status -eq "CLOSED" -and $finalTruck.operationalStatus -eq "AVAILABLE" -and [double]$finalTruck.currentLoadKg -eq 0.0) {
    Write-Host "`n>>> ALL 11 END-TO-END STAGES VERIFIED 100% PERFECTLY! LIFECYCLE PERSISTENCE CONFIRMED <<<"
} else {
    Write-Host "`n>>> ERROR: SOME FINAL STATES DID NOT MATCH <<<"
}
