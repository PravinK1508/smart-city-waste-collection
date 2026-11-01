package com.smartcity.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class SimulationResultDto {
    private final String label = "SIMULATION — HYPOTHETICAL RESULTS; NO REAL OPERATIONAL CHANGES.";
    private boolean feasible;
    private String feasibilityStatus;
    private String truckCode;
    private BigDecimal truckCapacityKg;
    private BigDecimal truckCurrentLoadKg;
    private BigDecimal roadsideWasteKg;
    private int selectedBinsCount;
    private BigDecimal selectedBinsTotalKg;
    private BigDecimal combinedAdditionalLoadKg;
    private BigDecimal projectedTruckLoadKg;
    private BigDecimal projectedRemainingCapacityKg;
    private List<TripStopDto> simulatedStops = new ArrayList<>();
    private BigDecimal estimatedTotalDistanceKm;
    private String facilityName;
    private boolean facilityAcceptsCategory;
    private String facilityRecommendationNotes;
    private List<String> warnings = new ArrayList<>();
    private List<String> assumptions = new ArrayList<>();

    public SimulationResultDto() {}

    public String getLabel() { return label; }

    public boolean isFeasible() { return feasible; }
    public void setFeasible(boolean feasible) { this.feasible = feasible; }

    public String getFeasibilityStatus() { return feasibilityStatus; }
    public void setFeasibilityStatus(String feasibilityStatus) { this.feasibilityStatus = feasibilityStatus; }

    public String getTruckCode() { return truckCode; }
    public void setTruckCode(String truckCode) { this.truckCode = truckCode; }

    public BigDecimal getTruckCapacityKg() { return truckCapacityKg; }
    public void setTruckCapacityKg(BigDecimal truckCapacityKg) { this.truckCapacityKg = truckCapacityKg; }

    public BigDecimal getTruckCurrentLoadKg() { return truckCurrentLoadKg; }
    public void setTruckCurrentLoadKg(BigDecimal truckCurrentLoadKg) { this.truckCurrentLoadKg = truckCurrentLoadKg; }

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

    public List<TripStopDto> getSimulatedStops() { return simulatedStops; }
    public void setSimulatedStops(List<TripStopDto> simulatedStops) { this.simulatedStops = simulatedStops; }

    public BigDecimal getEstimatedTotalDistanceKm() { return estimatedTotalDistanceKm; }
    public void setEstimatedTotalDistanceKm(BigDecimal estimatedTotalDistanceKm) { this.estimatedTotalDistanceKm = estimatedTotalDistanceKm; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public boolean isFacilityAcceptsCategory() { return facilityAcceptsCategory; }
    public void setFacilityAcceptsCategory(boolean facilityAcceptsCategory) { this.facilityAcceptsCategory = facilityAcceptsCategory; }

    public String getFacilityRecommendationNotes() { return facilityRecommendationNotes; }
    public void setFacilityRecommendationNotes(String facilityRecommendationNotes) { this.facilityRecommendationNotes = facilityRecommendationNotes; }

    public List<String> getWarnings() { return warnings; }
    public void setWarnings(List<String> warnings) { this.warnings = warnings; }

    public List<String> getAssumptions() { return assumptions; }
    public void setAssumptions(List<String> assumptions) { this.assumptions = assumptions; }
}
