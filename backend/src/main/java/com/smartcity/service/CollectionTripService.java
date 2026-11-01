package com.smartcity.service;

import com.smartcity.dto.*;
import com.smartcity.model.*;
import com.smartcity.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class CollectionTripService {

    private final CollectionTripRepository tripRepository;
    private final TripBinRepository tripBinRepository;
    private final TripStopRepository tripStopRepository;
    private final WasteReportRepository reportRepository;
    private final DustBinRepository dustBinRepository;
    private final TruckRepository truckRepository;
    private final UserRepository userRepository;
    private final DustBinService dustBinService;
    private final AuditService auditService;

    public CollectionTripService(CollectionTripRepository tripRepository,
                                 TripBinRepository tripBinRepository,
                                 TripStopRepository tripStopRepository,
                                 WasteReportRepository reportRepository,
                                 DustBinRepository dustBinRepository,
                                 TruckRepository truckRepository,
                                 UserRepository userRepository,
                                 DustBinService dustBinService,
                                 AuditService auditService) {
        this.tripRepository = tripRepository;
        this.tripBinRepository = tripBinRepository;
        this.tripStopRepository = tripStopRepository;
        this.reportRepository = reportRepository;
        this.dustBinRepository = dustBinRepository;
        this.truckRepository = truckRepository;
        this.userRepository = userRepository;
        this.dustBinService = dustBinService;
        this.auditService = auditService;
    }

    private void enrichTrip(CollectionTrip trip) {
        if (trip == null) return;
        if (trip.getTruckId() != null) {
            truckRepository.findById(trip.getTruckId()).ifPresent(t -> trip.setTruckCode(t.getTruckCode()));
        }
        if (trip.getDriverId() != null) {
            userRepository.findById(trip.getDriverId()).ifPresent(u -> trip.setDriverName(u.getFullName()));
        }
        if (trip.getPrimaryReportId() != null) {
            reportRepository.findById(trip.getPrimaryReportId()).ifPresent(r -> {
                trip.setReportArea(r.getAreaName());
                trip.setWasteCategory(r.getWasteCategory());
                trip.setReportDescription(r.getDescription());
                trip.setReportAddress(r.getAddress());
            });
        }
        trip.setStops(tripStopRepository.findByTripIdOrderByStopOrderAsc(trip.getTripId()));
    }

    public List<CollectionTrip> getAllTrips() {
        List<CollectionTrip> list = tripRepository.findAllByOrderByCreatedAtDesc();
        list.forEach(this::enrichTrip);
        return list;
    }

    public CollectionTrip getTripById(Long id) {
        CollectionTrip trip = tripRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found with ID: " + id));
        enrichTrip(trip);
        return trip;
    }

    public List<CollectionTrip> getTripsByDriver(Long driverId) {
        List<CollectionTrip> trips = tripRepository.findByDriverIdOrTruckAssignedDriver(driverId);
        trips.forEach(this::enrichTrip);
        return trips;
    }

    public List<TripStop> getTripStops(Long tripId) {
        return tripStopRepository.findByTripIdOrderByStopOrderAsc(tripId);
    }

    /**
     * Core Algorithm: Dynamic combined-load calculation and feasibility verification.
     */
    public TripPlanningResponse calculatePlan(TripPlanningRequest req) {
        WasteReport report = reportRepository.findById(req.getReportId())
                .orElseThrow(() -> new IllegalArgumentException("Waste report not found with ID: " + req.getReportId()));

        Truck truck = truckRepository.findById(req.getTruckId())
                .orElseThrow(() -> new IllegalArgumentException("Truck not found with ID: " + req.getTruckId()));

        BigDecimal roadsideKg = report.getEstimatedQuantityKg();
        if (roadsideKg == null || roadsideKg.compareTo(BigDecimal.ZERO) <= 0) {
            roadsideKg = BigDecimal.valueOf(40.00);
        }

        BigDecimal binsTotalKg = BigDecimal.ZERO;
        List<DustBin> selectedBins = new ArrayList<>();

        if (req.getSelectedBinIds() != null && !req.getSelectedBinIds().isEmpty()) {
            for (Long binId : req.getSelectedBinIds()) {
                DustBin bin = dustBinRepository.findById(binId)
                        .orElseThrow(() -> new IllegalArgumentException("Dustbin not found with ID: " + binId));
                selectedBins.add(bin);
                BigDecimal binKg = (bin.getCurrentFillKg() != null) ? bin.getCurrentFillKg() : BigDecimal.ZERO;
                binsTotalKg = binsTotalKg.add(binKg);
            }
        }

        // Rule: Combined additional load = Roadside waste + sum(selected bins)
        BigDecimal combinedAdditionalLoadKg = roadsideKg.add(binsTotalKg);

        BigDecimal truckCurrentLoad = (truck.getCurrentLoadKg() != null) ? truck.getCurrentLoadKg() : BigDecimal.ZERO;
        BigDecimal truckCapacity = truck.getTotalCapacityKg();
        BigDecimal truckInitialRemaining = truckCapacity.subtract(truckCurrentLoad).max(BigDecimal.ZERO);

        // Rule: Projected truck load = Current truck load + Combined additional load
        BigDecimal projectedTruckLoadKg = truckCurrentLoad.add(combinedAdditionalLoadKg);

        // Rule: Projected remaining capacity = Total capacity - Projected truck load
        BigDecimal projectedRemainingCapacityKg = truckCapacity.subtract(projectedTruckLoadKg);

        TripPlanningResponse res = new TripPlanningResponse();
        res.setReportId(report.getReportId());
        res.setReportDescription(report.getDescription());
        res.setTruckId(truck.getTruckId());
        res.setTruckCode(truck.getTruckCode());
        res.setTruckCapacityKg(truckCapacity);
        res.setTruckCurrentLoadKg(truckCurrentLoad);
        res.setTruckInitialRemainingKg(truckInitialRemaining);
        res.setRoadsideWasteKg(roadsideKg);
        res.setSelectedBinsCount(selectedBins.size());
        res.setSelectedBinsTotalKg(binsTotalKg);
        res.setCombinedAdditionalLoadKg(combinedAdditionalLoadKg);
        res.setProjectedTruckLoadKg(projectedTruckLoadKg);
        res.setProjectedRemainingCapacityKg(projectedRemainingCapacityKg);
        res.setAssignedDriverId(truck.getAssignedDriverId());
        if (truck.getAssignedDriverId() != null) {
            userRepository.findById(truck.getAssignedDriverId())
                    .ifPresent(u -> res.setAssignedDriverName(u.getFullName()));
        }

        // Rule: A truck must not be assigned a collection plan that exceeds its remaining capacity
        if (projectedTruckLoadKg.compareTo(truckCapacity) > 0) {
            res.setFeasible(false);
            BigDecimal overflow = projectedTruckLoadKg.subtract(truckCapacity);
            res.setFeasibilityWarning("CAPACITY VIOLATION: Combined load (" + combinedAdditionalLoadKg
                    + " kg) exceeds truck " + truck.getTruckCode() + "'s remaining capacity ("
                    + truckInitialRemaining + " kg) by " + overflow + " kg. Plan cannot be confirmed.");
        } else {
            res.setFeasible(true);
            res.setFeasibilityWarning(null);
        }

        // Ordered stop sequence recommendation
        List<TripStopDto> stops = new ArrayList<>();
        int order = 1;

        // Stop 1: Primary citizen roadside waste
        String repLoc = (report.getAddress() != null && !report.getAddress().isBlank())
                ? report.getAddress() : report.getAreaName();
        BigDecimal repLat = report.getLatitude() != null ? report.getLatitude() : BigDecimal.valueOf(11.2756);
        BigDecimal repLng = report.getLongitude() != null ? report.getLongitude() : BigDecimal.valueOf(77.5833);

        stops.add(new TripStopDto(
                order++,
                "ROADSIDE_REPORT",
                report.getReportId(),
                "Roadside Report: " + repLoc,
                repLat,
                repLng,
                roadsideKg,
                "PENDING"
        ));

        // Proximity ranking for selected bins from the roadside location
        selectedBins.sort(Comparator.comparingDouble(b -> {
            if (b.getLatitude() != null && b.getLongitude() != null) {
                return DustBinService.calculateHaversineDistanceKm(
                        repLat.doubleValue(), repLng.doubleValue(),
                        b.getLatitude().doubleValue(), b.getLongitude().doubleValue()
                );
            }
            return 999.0;
        }));

        double totalDistKm = 0.0;
        double prevLat = repLat.doubleValue();
        double prevLng = repLng.doubleValue();

        for (DustBin b : selectedBins) {
            double bLat = b.getLatitude() != null ? b.getLatitude().doubleValue() : prevLat;
            double bLng = b.getLongitude() != null ? b.getLongitude().doubleValue() : prevLng;

            totalDistKm += DustBinService.calculateHaversineDistanceKm(prevLat, prevLng, bLat, bLng);
            prevLat = bLat;
            prevLng = bLng;

            stops.add(new TripStopDto(
                    order++,
                    "MUNICIPAL_BIN",
                    b.getBinId(),
                    "Municipal Bin #" + b.getBinCode() + " (" + b.getAreaName() + ")",
                    b.getLatitude(),
                    b.getLongitude(),
                    b.getCurrentFillKg(),
                    "PENDING"
            ));
        }

        res.setRecommendedStops(stops);
        res.setEstimatedTotalDistanceKm(BigDecimal.valueOf(totalDistKm).setScale(2, RoundingMode.HALF_UP));
        res.setDistanceCalculationMethod("Haversine Straight-line Proximity Matrix (Labelled Proximity Ranking)");
        res.setStatus("CALCULATED");
        res.setMessage("Dynamic calculation complete.");

        return res;
    }

    /**
     * Core Feature: Admin-confirmed dispatch and persistence in MySQL with full transactions and safety checks.
     */
    @Transactional(rollbackFor = Exception.class)
    public TripPlanningResponse confirmAndCreateTrip(TripPlanningRequest req, String adminName) {
        TripPlanningResponse plan = calculatePlan(req);

        // Strict backend gate: Do not allow infeasible plans
        if (!plan.isFeasible()) {
            throw new IllegalStateException(plan.getFeasibilityWarning());
        }

        WasteReport report = reportRepository.findById(req.getReportId())
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + req.getReportId()));

        if (!"PENDING".equalsIgnoreCase(report.getStatus())) {
            throw new IllegalStateException("Report #" + report.getReportId()
                    + " is already in active status (" + report.getStatus() + "). Cannot assign again.");
        }

        Truck truck = truckRepository.findById(req.getTruckId())
                .orElseThrow(() -> new IllegalArgumentException("Truck not found: " + req.getTruckId()));

        if (!"AVAILABLE".equalsIgnoreCase(truck.getOperationalStatus())) {
            throw new IllegalStateException("Truck " + truck.getTruckCode()
                    + " is currently " + truck.getOperationalStatus() + " and cannot be dispatched.");
        }

        // Validate each bin is not already assigned
        if (req.getSelectedBinIds() != null) {
            for (Long binId : req.getSelectedBinIds()) {
                boolean activeConflict = tripBinRepository.existsByBinIdAndStatusIn(
                        binId, List.of("SCHEDULED", "IN_PROGRESS")
                );
                if (activeConflict) {
                    throw new IllegalStateException("Bin #" + binId + " is already assigned to another active collection trip!");
                }
            }
        }

        // 1. Create CollectionTrip entity
        String tripCode = "TRIP-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmssSSS"));
        CollectionTrip trip = new CollectionTrip();
        trip.setTripCode(tripCode);
        trip.setTruckId(truck.getTruckId());
        trip.setDriverId(truck.getAssignedDriverId());
        trip.setPrimaryReportId(report.getReportId());
        trip.setStatus("ASSIGNED");
        trip.setPlannedRoadsideKg(plan.getRoadsideWasteKg());
        trip.setPlannedBinsKg(plan.getSelectedBinsTotalKg());
        trip.setPlannedTotalLoadKg(plan.getCombinedAdditionalLoadKg());
        trip.setCollectionNotes(req.getNotes());

        CollectionTrip savedTrip = tripRepository.save(trip);

        // 2. Create TripBin associations and lock bin collection status
        if (req.getSelectedBinIds() != null) {
            for (Long binId : req.getSelectedBinIds()) {
                DustBin bin = dustBinRepository.findById(binId).orElseThrow();
                TripBin tripBin = new TripBin(savedTrip.getTripId(), bin.getBinId(), bin.getCurrentFillKg());
                tripBinRepository.save(tripBin);

                bin.setCollectionStatus("SCHEDULED");
                dustBinRepository.save(bin);
            }
        }

        // 3. Create TripStops in ordered sequence
        for (TripStopDto stopDto : plan.getRecommendedStops()) {
            TripStop stop = new TripStop();
            stop.setTripId(savedTrip.getTripId());
            stop.setStopOrder(stopDto.getStopOrder());
            stop.setStopType(stopDto.getStopType());
            stop.setReferenceId(stopDto.getReferenceId());
            stop.setLocationName(stopDto.getLocationName());
            stop.setLatitude(stopDto.getLatitude());
            stop.setLongitude(stopDto.getLongitude());
            stop.setPlannedKg(stopDto.getPlannedKg());
            stop.setStatus("PENDING");
            tripStopRepository.save(stop);
        }

        // 4. Update Report status
        report.setStatus("ASSIGNED");
        reportRepository.save(report);

        // 5. Update Truck status
        truck.setOperationalStatus("ASSIGNED");
        truckRepository.save(truck);

        // 6. Audit Trail
        String driverLabel = plan.getAssignedDriverName() != null ? plan.getAssignedDriverName() : "Unassigned";
        auditService.log(
                "COLLECTION_TRIP",
                savedTrip.getTripId(),
                "TRIP_CONFIRMED",
                null,
                "ASSIGNED",
                adminName != null ? adminName : "Municipal Admin",
                "Trip " + tripCode + " confirmed with truck " + truck.getTruckCode()
                        + " (Driver: " + driverLabel + ")"
                        + ", report #" + report.getReportId()
                        + ", bins: " + (req.getSelectedBinIds() != null ? req.getSelectedBinIds().size() : 0)
                        + ", total load: " + plan.getCombinedAdditionalLoadKg() + " kg"
        );

        plan.setTripId(savedTrip.getTripId());
        plan.setTripCode(savedTrip.getTripCode());
        plan.setAssignedDriverId(savedTrip.getDriverId());
        plan.setStatus("ASSIGNED");
        plan.setMessage("Trip confirmed and persisted successfully in MySQL.");

        return plan;
    }

    @Transactional
    public CollectionTrip dispatchTrip(Long tripId, String performedBy) {
        CollectionTrip trip = getTripById(tripId);
        trip.setStatus("DISPATCHED");
        trip.setDispatchedAt(LocalDateTime.now());

        Truck truck = truckRepository.findById(trip.getTruckId()).orElseThrow();
        truck.setOperationalStatus("EN_ROUTE");
        truckRepository.save(truck);

        WasteReport report = reportRepository.findById(trip.getPrimaryReportId()).orElseThrow();
        report.setStatus("DISPATCHED");
        reportRepository.save(report);

        auditService.log("COLLECTION_TRIP", trip.getTripId(), "TRIP_DISPATCHED", "ASSIGNED", "DISPATCHED", performedBy, "Truck en route to collection points");
        return tripRepository.save(trip);
    }

    @Transactional
    public CollectionTrip startTrip(Long tripId, String performedBy) {
        CollectionTrip trip = getTripById(tripId);
        trip.setStatus("IN_PROGRESS");

        WasteReport report = reportRepository.findById(trip.getPrimaryReportId()).orElseThrow();
        report.setStatus("IN_PROGRESS");
        reportRepository.save(report);

        auditService.log("COLLECTION_TRIP", trip.getTripId(), "TRIP_IN_PROGRESS", "DISPATCHED", "IN_PROGRESS", performedBy, "Collection in progress");
        return tripRepository.save(trip);
    }

    /**
     * Record actual collection progress and completion.
     */
    @Transactional(rollbackFor = Exception.class)
    public CollectionTrip completeCollection(Long tripId, CollectionCompletionRequest req, String performedBy) {
        CollectionTrip trip = getTripById(tripId);

        BigDecimal actualRoadside = (req.getActualRoadsideKg() != null)
                ? req.getActualRoadsideKg() : trip.getPlannedRoadsideKg();

        BigDecimal actualBinsTotal = BigDecimal.ZERO;
        List<TripBin> tripBins = tripBinRepository.findByTripId(tripId);

        for (TripBin tb : tripBins) {
            BigDecimal actualBinKg = (req.getBinActualKg() != null && req.getBinActualKg().containsKey(tb.getBinId()))
                    ? req.getBinActualKg().get(tb.getBinId()) : tb.getPlannedKg();

            tb.setActualCollectedKg(actualBinKg);
            tb.setStatus("COLLECTED");
            tb.setCollectedAt(LocalDateTime.now());
            tripBinRepository.save(tb);

            actualBinsTotal = actualBinsTotal.add(actualBinKg);

            // Update physical dustbin in MySQL: mark emptied and collectionStatus back to IDLE
            DustBin bin = dustBinRepository.findById(tb.getBinId()).orElseThrow();
            bin.setCurrentFillKg(BigDecimal.ZERO);
            bin.setCollectionStatus("IDLE");
            bin.setLastEmptiedAt(LocalDateTime.now());
            dustBinRepository.save(bin);
        }

        BigDecimal totalCollectedKg = actualRoadside.add(actualBinsTotal);
        trip.setActualCollectedKg(totalCollectedKg);
        trip.setStatus("READY_FOR_RECYCLING");
        trip.setCompletedAt(LocalDateTime.now());
        if (req.getNotes() != null) {
            trip.setCollectionNotes(req.getNotes());
        }
        if (req.getCollectionPhotoUrl() != null && !req.getCollectionPhotoUrl().trim().isEmpty()) {
            trip.setCollectionPhotoUrl(req.getCollectionPhotoUrl());
        }

        // Update stops
        List<TripStop> stops = tripStopRepository.findByTripIdOrderByStopOrderAsc(tripId);
        for (TripStop stop : stops) {
            stop.setStatus("COLLECTED");
            stop.setCompletedAt(LocalDateTime.now());
            if ("ROADSIDE_REPORT".equals(stop.getStopType())) {
                stop.setActualCollectedKg(actualRoadside);
            } else if ("MUNICIPAL_BIN".equals(stop.getStopType())) {
                BigDecimal bKg = (req.getBinActualKg() != null && req.getBinActualKg().containsKey(stop.getReferenceId()))
                        ? req.getBinActualKg().get(stop.getReferenceId()) : stop.getPlannedKg();
                stop.setActualCollectedKg(bKg);
            }
            tripStopRepository.save(stop);
        }

        // Update Report
        WasteReport report = reportRepository.findById(trip.getPrimaryReportId()).orElseThrow();
        report.setStatus("COLLECTION_COMPLETED");
        reportRepository.save(report);

        // Update Truck: Keep operational status as ASSIGNED while carrying collected payload to recycling destination
        Truck truck = truckRepository.findById(trip.getTruckId()).orElseThrow();
        truck.setCurrentLoadKg(totalCollectedKg);
        truck.setOperationalStatus("ASSIGNED");
        truckRepository.save(truck);

        auditService.log(
                "COLLECTION_TRIP",
                trip.getTripId(),
                "COLLECTION_COMPLETED",
                "IN_PROGRESS",
                "READY_FOR_RECYCLING",
                performedBy,
                "Collection completed. Total collected: " + totalCollectedKg + " kg. Ready for recycling facility dispatch."
        );

        return tripRepository.save(trip);
    }

    /**
     * Auto-Suggest Mode: Automatically analyzes available fleet distance, truck capacity,
     * nearby high-fill bins, and proposes an optimal collection plan with stop sequencing and transparent rationale.
     */
    public TripPlanningResponse getAutoSuggestPlan(Long reportId, Double searchRadiusKm) {
        double radius = (searchRadiusKm != null && searchRadiusKm > 0) ? searchRadiusKm : 5.0;

        WasteReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Waste report not found with ID: " + reportId));

        if (!"PENDING".equalsIgnoreCase(report.getStatus())) {
            throw new IllegalStateException("Report #" + reportId + " is already in active status (" + report.getStatus() + "). Cannot auto-suggest collection plan.");
        }

        BigDecimal roadsideKg = (report.getEstimatedQuantityKg() != null && report.getEstimatedQuantityKg().compareTo(BigDecimal.ZERO) > 0)
                ? report.getEstimatedQuantityKg() : BigDecimal.valueOf(40.00);

        BigDecimal repLat = report.getLatitude() != null ? report.getLatitude() : BigDecimal.valueOf(11.2756);
        BigDecimal repLng = report.getLongitude() != null ? report.getLongitude() : BigDecimal.valueOf(77.5833);

        List<Truck> availableTrucks = truckRepository.findByOperationalStatus("AVAILABLE");
        if (availableTrucks.isEmpty()) {
            TripPlanningResponse res = new TripPlanningResponse();
            res.setReportId(report.getReportId());
            res.setReportDescription(report.getDescription());
            res.setRoadsideWasteKg(roadsideKg);
            res.setFeasible(false);
            res.setStatus("INFEASIBLE");
            res.setFeasibilityWarning("No available trucks in the fleet. All trucks are currently assigned, en route, or under maintenance. Switch to Manual Planning Mode or wait for active trips to complete.");
            return res;
        }

        // Rank available trucks that can carry at least the roadside waste
        class RankedTruck {
            final Truck truck;
            final double distanceKm;
            final BigDecimal remainingCapKg;

            RankedTruck(Truck truck, double distanceKm, BigDecimal remainingCapKg) {
                this.truck = truck;
                this.distanceKm = distanceKm;
                this.remainingCapKg = remainingCapKg;
            }
        }

        List<RankedTruck> candidates = new ArrayList<>();
        for (Truck t : availableTrucks) {
            BigDecimal freeCap = t.getRemainingCapacityKg();
            if (freeCap.compareTo(roadsideKg) >= 0) {
                double dist = 99.0;
                if (t.getCurrentLatitude() != null && t.getCurrentLongitude() != null) {
                    dist = DustBinService.calculateHaversineDistanceKm(
                            repLat.doubleValue(), repLng.doubleValue(),
                            t.getCurrentLatitude().doubleValue(), t.getCurrentLongitude().doubleValue()
                    );
                }
                candidates.add(new RankedTruck(t, dist, freeCap));
            }
        }

        if (candidates.isEmpty()) {
            TripPlanningResponse res = new TripPlanningResponse();
            res.setReportId(report.getReportId());
            res.setReportDescription(report.getDescription());
            res.setRoadsideWasteKg(roadsideKg);
            res.setFeasible(false);
            res.setStatus("INFEASIBLE");
            res.setFeasibilityWarning("None of the available trucks have sufficient remaining capacity for the roadside waste (" + roadsideKg + " kg). Available trucks need emptying or larger capacity is required.");
            return res;
        }

        // Sort by distance ascending, then remaining capacity descending
        candidates.sort(Comparator.comparingDouble((RankedTruck rt) -> rt.distanceKm)
                .thenComparing((RankedTruck rt) -> rt.remainingCapKg, Comparator.reverseOrder()));

        RankedTruck bestRanked = candidates.get(0);
        Truck bestTruck = bestRanked.truck;
        BigDecimal truckCapRemaining = bestTruck.getRemainingCapacityKg();

        // Find candidate bins within radius
        List<CandidateBinDto> candidateBins = dustBinService.findNearbyBinsForReport(reportId, radius);
        List<CandidateBinDto> eligibleBins = candidateBins.stream()
                .filter(b -> b.isEligible() && b.getCurrentFillKg() != null && b.getCurrentFillKg().compareTo(BigDecimal.ZERO) > 0)
                .sorted((b1, b2) -> {
                    // Prioritize bins with >= 50% fill
                    boolean b1High = b1.getFillPercentage() != null && b1.getFillPercentage().compareTo(BigDecimal.valueOf(50)) >= 0;
                    boolean b2High = b2.getFillPercentage() != null && b2.getFillPercentage().compareTo(BigDecimal.valueOf(50)) >= 0;
                    if (b1High && !b2High) return -1;
                    if (!b1High && b2High) return 1;
                    // Then by distance
                    double d1 = b1.getDistanceKm() != null ? b1.getDistanceKm().doubleValue() : 999.0;
                    double d2 = b2.getDistanceKm() != null ? b2.getDistanceKm().doubleValue() : 999.0;
                    return Double.compare(d1, d2);
                })
                .toList();

        // Greedily pick bins that fit in remaining capacity
        BigDecimal runningTotal = roadsideKg;
        List<Long> selectedBinIds = new ArrayList<>();
        for (CandidateBinDto bin : eligibleBins) {
            BigDecimal binKg = bin.getCurrentFillKg();
            if (runningTotal.add(binKg).compareTo(truckCapRemaining) <= 0) {
                selectedBinIds.add(bin.getBinId());
                runningTotal = runningTotal.add(binKg);
            }
        }

        TripPlanningRequest planReq = new TripPlanningRequest();
        planReq.setReportId(reportId);
        planReq.setTruckId(bestTruck.getTruckId());
        planReq.setSelectedBinIds(selectedBinIds);

        TripPlanningResponse plan = calculatePlan(planReq);
        plan.setRecommendedBinIds(selectedBinIds);
        plan.setTruckDistanceKm(BigDecimal.valueOf(bestRanked.distanceKm).setScale(2, RoundingMode.HALF_UP));

        String driverName = plan.getAssignedDriverName() != null ? plan.getAssignedDriverName() : "Unassigned";
        double utilPct = plan.getCombinedAdditionalLoadKg().doubleValue() / bestTruck.getTotalCapacityKg().doubleValue() * 100.0;

        String rationale = String.format(
                "Optimal Recommendation: Selected Truck %s (Cap: %.0f kg, Free: %.1f kg) — closest available vehicle (%.2f km away) with sufficient capacity. Assigned Driver: %s. " +
                "Bundled %d nearby municipal bin(s) within %.1f km, totaling %.1f kg. Combined planned load is %.1f kg (%.1f%% truck capacity utilization). " +
                "Stops ordered by proximity from roadside location to minimize travel time.",
                bestTruck.getTruckCode(),
                bestTruck.getTotalCapacityKg(),
                truckCapRemaining,
                bestRanked.distanceKm,
                driverName,
                selectedBinIds.size(),
                radius,
                plan.getSelectedBinsTotalKg(),
                plan.getCombinedAdditionalLoadKg(),
                utilPct
        );
        plan.setRecommendationRationale(rationale);
        plan.setStatus("AUTO_SUGGESTED");
        plan.setMessage("Auto-suggest recommendation generated successfully.");

        return plan;
    }
}
