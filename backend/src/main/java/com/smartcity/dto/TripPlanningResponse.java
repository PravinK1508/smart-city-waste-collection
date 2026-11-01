package com.smartcity.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class TripPlanningResponse {
    private Long tripId;
    private String tripCode;
    private Long reportId;
    private String reportDescription;
    private Long truckId;
    private String truckCode;
    private BigDecimal truckCapacityKg;
    private BigDecimal truckCurrentLoadKg;
    private BigDecimal truckInitialRemainingKg;
    private BigDecimal roadsideWasteKg;
    private int selectedBinsCount;
    private BigDecimal selectedBinsTotalKg;
    private BigDecimal combinedAdditionalLoadKg;
    private BigDecimal projectedTruckLoadKg;
    private BigDecimal projectedRemainingCapacityKg;
    private boolean feasible;
    private String feasibilityWarning;
    private List<TripStopDto> recommendedStops = new ArrayList<>();
    private BigDecimal estimatedTotalDistanceKm;
    private String distanceCalculationMethod;
    private String status;
    private String message;
    private Long assignedDriverId;
    private String assignedDriverName;
    private String recommendationRationale;
    private List<Long> recommendedBinIds = new ArrayList<>();
    private BigDecimal truckDistanceKm;

    public TripPlanningResponse() {}

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public String getTripCode() { return tripCode; }
    public void setTripCode(String tripCode) { this.tripCode = tripCode; }

    public Long getReportId() { return reportId; }
    public void setReportId(Long reportId) { this.reportId = reportId; }

    public String getReportDescription() { return reportDescription; }
    public void setReportDescription(String reportDescription) { this.reportDescription = reportDescription; }

    public Long getTruckId() { return truckId; }
    public void setTruckId(Long truckId) { this.truckId = truckId; }

    public String getTruckCode() { return truckCode; }
    public void setTruckCode(String truckCode) { this.truckCode = truckCode; }

    public BigDecimal getTruckCapacityKg() { return truckCapacityKg; }
    public void setTruckCapacityKg(BigDecimal truckCapacityKg) { this.truckCapacityKg = truckCapacityKg; }

    public BigDecimal getTruckCurrentLoadKg() { return truckCurrentLoadKg; }
    public void setTruckCurrentLoadKg(BigDecimal truckCurrentLoadKg) { this.truckCurrentLoadKg = truckCurrentLoadKg; }

    public BigDecimal getTruckInitialRemainingKg() { return truckInitialRemainingKg; }
    public void setTruckInitialRemainingKg(BigDecimal truckInitialRemainingKg) { this.truckInitialRemainingKg = truckInitialRemainingKg; }

    public BigDecimal getRoadsideWasteKg() { return roadsideWasteKg; }
    public void setRoadsideWasteKg(BigDecimal roadsideWasteKg) { this.roadsideWasteKg = roadsideWasteKg; }

    public int getSelectedBinsCount() { return selectedBinsCount; }
    public void setSelectedBinsCount(int selectedBinsCount) { this.selectedBinsCount = selectedBinsCount; }

    public BigDecimal getSelectedBinsTotalKg() { return selectedBinsTotalKg; }
    public void setSelectedBinsTotalKg(BigDecimal selectedBinsTotalKg) { this.selectedBinsTotalKg = selectedBinsTotalKg; }

    public BigDecimal getCombinedAdditionalLoadKg() { return combinedAdditionalLoadKg; }
    public void setCombinedAdditionalLoadKg(BigDecimal combinedAdditionalLoadKg) { this.combinedAdditionalLoadKg = combinedAdditionalLoadKg; }

    public BigDecimal getProjectedTruckLoadKg() { return projectedTruckLoadKg; }
    public void setProjectedTruckLoadKg(BigDecimal projectedTruckLoadKg) { this.projectedTruckLoadKg = projectedTruckLoadKg; }

    public BigDecimal getProjectedRemainingCapacityKg() { return projectedRemainingCapacityKg; }
    public void setProjectedRemainingCapacityKg(BigDecimal projectedRemainingCapacityKg) { this.projectedRemainingCapacityKg = projectedRemainingCapacityKg; }

    public boolean isFeasible() { return feasible; }
    public void setFeasible(boolean feasible) { this.feasible = feasible; }

    public String getFeasibilityWarning() { return feasibilityWarning; }
    public void setFeasibilityWarning(String feasibilityWarning) { this.feasibilityWarning = feasibilityWarning; }

    public List<TripStopDto> getRecommendedStops() { return recommendedStops; }
    public void setRecommendedStops(List<TripStopDto> recommendedStops) { this.recommendedStops = recommendedStops; }

    public BigDecimal getEstimatedTotalDistanceKm() { return estimatedTotalDistanceKm; }
    public void setEstimatedTotalDistanceKm(BigDecimal estimatedTotalDistanceKm) { this.estimatedTotalDistanceKm = estimatedTotalDistanceKm; }

    public String getDistanceCalculationMethod() { return distanceCalculationMethod; }
    public void setDistanceCalculationMethod(String distanceCalculationMethod) { this.distanceCalculationMethod = distanceCalculationMethod; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Long getAssignedDriverId() { return assignedDriverId; }
    public void setAssignedDriverId(Long assignedDriverId) { this.assignedDriverId = assignedDriverId; }

    public String getAssignedDriverName() { return assignedDriverName; }
    public void setAssignedDriverName(String assignedDriverName) { this.assignedDriverName = assignedDriverName; }

    public String getRecommendationRationale() { return recommendationRationale; }
    public void setRecommendationRationale(String recommendationRationale) { this.recommendationRationale = recommendationRationale; }

    public List<Long> getRecommendedBinIds() { return recommendedBinIds; }
    public void setRecommendedBinIds(List<Long> recommendedBinIds) { this.recommendedBinIds = recommendedBinIds; }

    public BigDecimal getTruckDistanceKm() { return truckDistanceKm; }
    public void setTruckDistanceKm(BigDecimal truckDistanceKm) { this.truckDistanceKm = truckDistanceKm; }
}
