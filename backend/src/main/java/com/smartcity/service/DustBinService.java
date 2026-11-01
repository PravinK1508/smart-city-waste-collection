package com.smartcity.service;

import com.smartcity.dto.CandidateBinDto;
import com.smartcity.model.DustBin;
import com.smartcity.model.WasteReport;
import com.smartcity.repository.DustBinRepository;
import com.smartcity.repository.TripBinRepository;
import com.smartcity.repository.WasteReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class DustBinService {

    private final DustBinRepository dustBinRepository;
    private final WasteReportRepository reportRepository;
    private final TripBinRepository tripBinRepository;
    private final AuditService auditService;

    public DustBinService(DustBinRepository dustBinRepository,
                          WasteReportRepository reportRepository,
                          TripBinRepository tripBinRepository,
                          AuditService auditService) {
        this.dustBinRepository = dustBinRepository;
        this.reportRepository = reportRepository;
        this.tripBinRepository = tripBinRepository;
        this.auditService = auditService;
    }

    public List<DustBin> getAllBins() {
        return dustBinRepository.findAllByOrderByAreaNameAsc();
    }

    public DustBin getBinById(Long id) {
        return dustBinRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dustbin not found with ID: " + id));
    }

    @Transactional
    public DustBin updateFillLevel(Long id, BigDecimal newFillKg) {
        DustBin bin = getBinById(id);
        if (newFillKg.compareTo(BigDecimal.ZERO) < 0 || newFillKg.compareTo(bin.getBinCapacityKg()) > 0) {
            throw new IllegalArgumentException("Fill level must be between 0 and bin capacity (" + bin.getBinCapacityKg() + " kg)");
        }
        bin.setCurrentFillKg(newFillKg);
        return dustBinRepository.save(bin);
    }

    public List<CandidateBinDto> findNearbyBinsForReport(Long reportId, Double searchRadiusKm) {
        WasteReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Waste report not found with ID: " + reportId));

        double radius = (searchRadiusKm != null && searchRadiusKm > 0) ? searchRadiusKm : 5.0; // Default 5 km search radius
        List<DustBin> allBins = dustBinRepository.findAll();
        List<CandidateBinDto> candidates = new ArrayList<>();

        boolean hasReportCoords = report.getLatitude() != null && report.getLongitude() != null;

        for (DustBin bin : allBins) {
            CandidateBinDto dto = new CandidateBinDto();
            dto.setBinId(bin.getBinId());
            dto.setBinCode(bin.getBinCode());
            dto.setAreaName(bin.getAreaName());
            dto.setLatitude(bin.getLatitude());
            dto.setLongitude(bin.getLongitude());
            dto.setBinCapacityKg(bin.getBinCapacityKg());
            dto.setCurrentFillKg(bin.getCurrentFillKg());
            dto.setFillPercentage(bin.getFillPercentage());
            dto.setWasteCategory(bin.getWasteCategory());
            dto.setOperationalStatus(bin.getOperationalStatus());
            dto.setCollectionStatus(bin.getCollectionStatus());

            Double distanceKm = null;
            if (hasReportCoords && bin.getLatitude() != null && bin.getLongitude() != null) {
                distanceKm = calculateHaversineDistanceKm(
                        report.getLatitude().doubleValue(),
                        report.getLongitude().doubleValue(),
                        bin.getLatitude().doubleValue(),
                        bin.getLongitude().doubleValue()
                );
                dto.setDistanceKm(BigDecimal.valueOf(distanceKm).setScale(2, RoundingMode.HALF_UP));
            } else {
                dto.setDistanceKm(null);
            }

            // Check eligibility & exclusion reasons
            boolean activeTripConflict = tripBinRepository.existsByBinIdAndStatusIn(
                    bin.getBinId(),
                    List.of("SCHEDULED", "IN_PROGRESS")
            );

            if (!"ACTIVE".equalsIgnoreCase(bin.getOperationalStatus())) {
                dto.setEligible(false);
                dto.setExclusionReason("Bin status is " + bin.getOperationalStatus() + " (not operational)");
            } else if (activeTripConflict) {
                dto.setEligible(false);
                dto.setExclusionReason("Already assigned to another active collection trip");
            } else if (distanceKm != null && distanceKm > radius) {
                dto.setEligible(false);
                dto.setExclusionReason("Outside search radius (" + dto.getDistanceKm() + " km > " + radius + " km limit)");
            } else if (!hasReportCoords && !bin.getAreaName().equalsIgnoreCase(report.getAreaName())) {
                dto.setEligible(false);
                dto.setExclusionReason("Area mismatch with report locality (" + report.getAreaName() + ")");
            } else if (bin.getCurrentFillKg() == null || bin.getCurrentFillKg().compareTo(BigDecimal.ZERO) <= 0) {
                dto.setEligible(false);
                dto.setExclusionReason("Bin is currently empty (0.00 kg waste)");
            } else {
                dto.setEligible(true);
                dto.setExclusionReason("Eligible for combined collection");
            }

            candidates.add(dto);
        }

        // Sort by distance (if available) then by fill percentage descending
        candidates.sort(Comparator.comparing(CandidateBinDto::isEligible).reversed()
                .thenComparing((a, b) -> {
                    if (a.getDistanceKm() != null && b.getDistanceKm() != null) {
                        return a.getDistanceKm().compareTo(b.getDistanceKm());
                    }
                    return b.getFillPercentage().compareTo(a.getFillPercentage());
                }));

        return candidates;
    }

    /**
     * Deterministic Haversine distance formula between two GPS points
     */
    public static double calculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the Earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
