package com.smartcity.service;

import com.smartcity.dto.SimulationRequest;
import com.smartcity.dto.SimulationResultDto;
import com.smartcity.dto.TripStopDto;
import com.smartcity.model.DustBin;
import com.smartcity.model.RecyclingFacility;
import com.smartcity.model.Truck;
import com.smartcity.model.WasteReport;
import com.smartcity.repository.DustBinRepository;
import com.smartcity.repository.RecyclingFacilityRepository;
import com.smartcity.repository.TruckRepository;
import com.smartcity.repository.WasteReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class SimulationService {

    private final WasteReportRepository reportRepository;
    private final TruckRepository truckRepository;
    private final DustBinRepository dustBinRepository;
    private final RecyclingFacilityRepository facilityRepository;

    public SimulationService(WasteReportRepository reportRepository,
                             TruckRepository truckRepository,
                             DustBinRepository dustBinRepository,
                             RecyclingFacilityRepository facilityRepository) {
        this.reportRepository = reportRepository;
        this.truckRepository = truckRepository;
        this.dustBinRepository = dustBinRepository;
        this.facilityRepository = facilityRepository;
    }

    /**
     * Pure read-only simulation calculation. NEVER persists or alters database records.
     */
    @Transactional(readOnly = true)
    public SimulationResultDto runSimulation(SimulationRequest req) {
        SimulationResultDto result = new SimulationResultDto();
        List<String> warnings = new ArrayList<>();
        List<String> assumptions = new ArrayList<>();

        // 1. Resolve or simulate Roadside Waste
        BigDecimal roadsideKg;
        String wasteCategory = "Mixed";
        BigDecimal repLat = BigDecimal.valueOf(11.2756);
        BigDecimal repLng = BigDecimal.valueOf(77.5833);
        String repLoc = "Simulated Roadside Location";

        if (req.getReportId() != null) {
            WasteReport report = reportRepository.findById(req.getReportId()).orElse(null);
            if (report != null) {
                roadsideKg = (req.getAssumedRoadsideKg() != null && req.getAssumedRoadsideKg().compareTo(BigDecimal.ZERO) > 0)
                        ? req.getAssumedRoadsideKg() : report.getEstimatedQuantityKg();
                wasteCategory = report.getWasteCategory();
                if (report.getLatitude() != null) repLat = report.getLatitude();
                if (report.getLongitude() != null) repLng = report.getLongitude();
                if (report.getAddress() != null) repLoc = report.getAddress();
                assumptions.add("Base data pulled from real Waste Report #" + report.getReportId() + " (" + wasteCategory + ")");
            } else {
                roadsideKg = req.getAssumedRoadsideKg() != null ? req.getAssumedRoadsideKg() : BigDecimal.valueOf(40.00);
                assumptions.add("Hypothetical roadside waste quantity assumed: " + roadsideKg + " kg");
            }
        } else {
            roadsideKg = req.getAssumedRoadsideKg() != null ? req.getAssumedRoadsideKg() : BigDecimal.valueOf(40.00);
            assumptions.add("Hypothetical roadside waste quantity assumed: " + roadsideKg + " kg");
        }

        result.setRoadsideWasteKg(roadsideKg);

        // 2. Resolve Truck
        Truck truck = null;
        if (req.getTruckId() != null) {
            truck = truckRepository.findById(req.getTruckId()).orElse(null);
        }
        if (truck == null) {
            truck = truckRepository.findAll().stream().findFirst().orElse(null);
        }

        if (truck == null) {
            throw new IllegalStateException("No truck fleet available in database for simulation.");
        }

        BigDecimal truckCap = truck.getTotalCapacityKg();
        BigDecimal currentLoad = truck.getCurrentLoadKg() != null ? truck.getCurrentLoadKg() : BigDecimal.ZERO;
        result.setTruckCode(truck.getTruckCode());
        result.setTruckCapacityKg(truckCap);
        result.setTruckCurrentLoadKg(currentLoad);

        // 3. Resolve Selected Bins
        BigDecimal binsTotal = BigDecimal.ZERO;
        List<DustBin> bins = new ArrayList<>();
        if (req.getSelectedBinIds() != null && !req.getSelectedBinIds().isEmpty()) {
            for (Long binId : req.getSelectedBinIds()) {
                dustBinRepository.findById(binId).ifPresent(b -> {
                    bins.add(b);
                });
            }
        }

        for (DustBin b : bins) {
            binsTotal = binsTotal.add(b.getCurrentFillKg() != null ? b.getCurrentFillKg() : BigDecimal.ZERO);
        }

        result.setSelectedBinsCount(bins.size());
        result.setSelectedBinsTotalKg(binsTotal);

        // Calculations
        BigDecimal combinedAdditional = roadsideKg.add(binsTotal);
        BigDecimal projectedLoad = currentLoad.add(combinedAdditional);
        BigDecimal projectedRemaining = truckCap.subtract(projectedLoad);

        result.setCombinedAdditionalLoadKg(combinedAdditional);
        result.setProjectedTruckLoadKg(projectedLoad);
        result.setProjectedRemainingCapacityKg(projectedRemaining);

        // Feasibility check
        if (projectedLoad.compareTo(truckCap) <= 0) {
            result.setFeasible(true);
            result.setFeasibilityStatus("FEASIBLE: Truck " + truck.getTruckCode() + " can accommodate the combined load.");
        } else {
            result.setFeasible(false);
            BigDecimal overage = projectedLoad.subtract(truckCap);
            result.setFeasibilityStatus("INFEASIBLE: Over capacity by " + overage + " kg.");
            warnings.add("Exceeds maximum payload of truck " + truck.getTruckCode() + " (" + truckCap + " kg)");
        }

        // Stops sequence
        List<TripStopDto> simulatedStops = new ArrayList<>();
        int stopOrder = 1;
        simulatedStops.add(new TripStopDto(
                stopOrder++,
                "ROADSIDE_REPORT",
                req.getReportId() != null ? req.getReportId() : 0L,
                "Simulated Pickup: " + repLoc,
                repLat,
                repLng,
                roadsideKg,
                "HYPOTHETICAL"
        ));

        double totalDist = 0.0;
        double pLat = repLat.doubleValue();
        double pLng = repLng.doubleValue();

        for (DustBin b : bins) {
            double bLat = b.getLatitude() != null ? b.getLatitude().doubleValue() : pLat;
            double bLng = b.getLongitude() != null ? b.getLongitude().doubleValue() : pLng;
            totalDist += DustBinService.calculateHaversineDistanceKm(pLat, pLng, bLat, bLng);
            pLat = bLat;
            pLng = bLng;

            simulatedStops.add(new TripStopDto(
                    stopOrder++,
                    "MUNICIPAL_BIN",
                    b.getBinId(),
                    "Simulated Bin Pickup: #" + b.getBinCode() + " (" + b.getAreaName() + ")",
                    b.getLatitude(),
                    b.getLongitude(),
                    b.getCurrentFillKg(),
                    "HYPOTHETICAL"
            ));
        }

        result.setSimulatedStops(simulatedStops);
        result.setEstimatedTotalDistanceKm(BigDecimal.valueOf(totalDist).setScale(2, RoundingMode.HALF_UP));

        // 4. Candidate Facility Evaluation
        if (req.getCandidateFacilityId() != null) {
            RecyclingFacility fac = facilityRepository.findById(req.getCandidateFacilityId()).orElse(null);
            if (fac != null) {
                result.setFacilityName(fac.getFacilityName());
                boolean accepts = fac.acceptsCategory(wasteCategory);
                result.setFacilityAcceptsCategory(accepts);
                if (accepts) {
                    result.setFacilityRecommendationNotes("Facility accepts waste category '" + wasteCategory + "'.");
                } else {
                    result.setFacilityRecommendationNotes("Category mismatch! Facility accepts: " + fac.getAcceptedCategories());
                    warnings.add("Facility cannot process " + wasteCategory + " waste!");
                }
            }
        }

        assumptions.add("Calculations are deterministic based on stored bin fill levels and static distance matrices.");
        result.setWarnings(warnings);
        result.setAssumptions(assumptions);

        return result;
    }
}
