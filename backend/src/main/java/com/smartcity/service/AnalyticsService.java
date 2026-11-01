package com.smartcity.service;

import com.smartcity.dto.DashboardStatsDto;
import com.smartcity.model.*;
import com.smartcity.repository.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final WasteReportRepository reportRepository;
    private final DustBinRepository dustBinRepository;
    private final TruckRepository truckRepository;
    private final CollectionTripRepository tripRepository;
    private final RecyclingDispatchRepository dispatchRepository;
    private final RecyclingFacilityRepository facilityRepository;

    public AnalyticsService(WasteReportRepository reportRepository,
                            DustBinRepository dustBinRepository,
                            TruckRepository truckRepository,
                            CollectionTripRepository tripRepository,
                            RecyclingDispatchRepository dispatchRepository,
                            RecyclingFacilityRepository facilityRepository) {
        this.reportRepository = reportRepository;
        this.dustBinRepository = dustBinRepository;
        this.truckRepository = truckRepository;
        this.tripRepository = tripRepository;
        this.dispatchRepository = dispatchRepository;
        this.facilityRepository = facilityRepository;
    }

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto stats = new DashboardStatsDto();

        // 1. Waste Reports Metrics
        List<WasteReport> reports = reportRepository.findAll();
        stats.setTotalReports(reports.size());

        long pending = 0, inProgress = 0, completed = 0;
        Map<String, Long> byCategory = new HashMap<>();
        Map<String, Long> byLocality = new HashMap<>();

        for (WasteReport r : reports) {
            String st = r.getStatus();
            if ("PENDING".equalsIgnoreCase(st)) pending++;
            else if ("IN_PROGRESS".equalsIgnoreCase(st) || "DISPATCHED".equalsIgnoreCase(st) || "ASSIGNED".equalsIgnoreCase(st)) inProgress++;
            else if ("COLLECTION_COMPLETED".equalsIgnoreCase(st) || "READY_FOR_RECYCLING".equalsIgnoreCase(st) || "CLOSED".equalsIgnoreCase(st)) completed++;

            byCategory.merge(r.getWasteCategory() != null ? r.getWasteCategory() : "Other", 1L, Long::sum);
            byLocality.merge(r.getAreaName() != null ? r.getAreaName() : "General", 1L, Long::sum);
        }

        stats.setPendingReports(pending);
        stats.setInProgressReports(inProgress);
        stats.setCompletedReports(completed);
        stats.setReportsByCategory(byCategory);
        stats.setReportsByLocality(byLocality);

        // 2. Dustbins Metrics
        List<DustBin> bins = dustBinRepository.findAll();
        stats.setTotalBins(bins.size());
        long activeBins = 0;
        long binsAbove75 = 0;
        BigDecimal totalFillPct = BigDecimal.ZERO;

        for (DustBin b : bins) {
            if ("ACTIVE".equalsIgnoreCase(b.getOperationalStatus())) activeBins++;
            BigDecimal pct = b.getFillPercentage();
            if (pct.compareTo(BigDecimal.valueOf(75.0)) >= 0) binsAbove75++;
            totalFillPct = totalFillPct.add(pct);
        }

        stats.setActiveBins(activeBins);
        stats.setBinsAbove75Pct(binsAbove75);
        if (!bins.isEmpty()) {
            stats.setAverageBinFillPercentage(totalFillPct.divide(BigDecimal.valueOf(bins.size()), 1, RoundingMode.HALF_UP));
        } else {
            stats.setAverageBinFillPercentage(BigDecimal.ZERO);
        }

        // 3. Truck Fleet Metrics
        List<Truck> trucks = truckRepository.findAll();
        stats.setTotalTrucks(trucks.size());
        long availTrucks = 0, busyTrucks = 0;
        for (Truck t : trucks) {
            if ("AVAILABLE".equalsIgnoreCase(t.getOperationalStatus())) availTrucks++;
            else busyTrucks++;
        }
        stats.setAvailableTrucks(availTrucks);
        stats.setBusyTrucks(busyTrucks);

        // 4. Trips Metrics
        List<CollectionTrip> trips = tripRepository.findAll();
        stats.setTotalTrips(trips.size());
        long actTrips = 0, compTrips = 0, combinedCount = 0, singleCount = 0;
        BigDecimal totalWasteCollected = BigDecimal.ZERO;

        for (CollectionTrip t : trips) {
            String ts = t.getStatus();
            if ("ASSIGNED".equalsIgnoreCase(ts) || "DISPATCHED".equalsIgnoreCase(ts) || "IN_PROGRESS".equalsIgnoreCase(ts)) {
                actTrips++;
            } else if ("COLLECTION_COMPLETED".equalsIgnoreCase(ts) || "READY_FOR_RECYCLING".equalsIgnoreCase(ts) || "CLOSED".equalsIgnoreCase(ts)) {
                compTrips++;
            }

            if (t.getPlannedBinsKg() != null && t.getPlannedBinsKg().compareTo(BigDecimal.ZERO) > 0) {
                combinedCount++;
            } else {
                singleCount++;
            }

            if (t.getActualCollectedKg() != null) {
                totalWasteCollected = totalWasteCollected.add(t.getActualCollectedKg());
            } else if (compTrips > 0 && t.getPlannedTotalLoadKg() != null) {
                totalWasteCollected = totalWasteCollected.add(t.getPlannedTotalLoadKg());
            }
        }

        stats.setActiveTrips(actTrips);
        stats.setCompletedTrips(compTrips);
        stats.setCombinedTripsCount(combinedCount);
        stats.setSingleSourceTripsCount(singleCount);
        stats.setTotalWasteCollectedKg(totalWasteCollected);

        // 5. Recycling Dispatches
        List<RecyclingDispatch> dispatches = dispatchRepository.findAll();
        stats.setTotalRecyclingDispatches(dispatches.size());
        long delivered = 0;
        BigDecimal totalRecycledKg = BigDecimal.ZERO;
        Map<String, Long> byFacility = new HashMap<>();

        Map<Long, String> facilityNames = new HashMap<>();
        facilityRepository.findAll().forEach(f -> facilityNames.put(f.getFacilityId(), f.getFacilityName()));

        for (RecyclingDispatch d : dispatches) {
            if ("DELIVERED".equalsIgnoreCase(d.getStatus()) || "RECEIPT_CONFIRMED".equalsIgnoreCase(d.getStatus())) {
                delivered++;
                BigDecimal wt = d.getReceivedWeightKg() != null ? d.getReceivedWeightKg() : d.getDispatchedQuantityKg();
                totalRecycledKg = totalRecycledKg.add(wt);
            }
            String fName = facilityNames.getOrDefault(d.getFacilityId(), "Facility #" + d.getFacilityId());
            byFacility.merge(fName, 1L, Long::sum);
        }

        stats.setDeliveredRecyclingDispatches(delivered);
        stats.setTotalWasteRecycledKg(totalRecycledKg);
        stats.setDispatchesByFacility(byFacility);

        return stats;
    }
}
