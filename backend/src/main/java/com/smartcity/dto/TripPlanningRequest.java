package com.smartcity.dto;

import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

public class TripPlanningRequest {

    @NotNull(message = "Report ID is required")
    private Long reportId;

    @NotNull(message = "Truck ID is required")
    private Long truckId;

    private List<Long> selectedBinIds = new ArrayList<>();
    private String notes;
    private boolean simulateOnly = false;

    public TripPlanningRequest() {}

    public Long getReportId() { return reportId; }
    public void setReportId(Long reportId) { this.reportId = reportId; }

    public Long getTruckId() { return truckId; }
    public void setTruckId(Long truckId) { this.truckId = truckId; }

    public List<Long> getSelectedBinIds() { return selectedBinIds; }
    public void setSelectedBinIds(List<Long> selectedBinIds) { this.selectedBinIds = selectedBinIds; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isSimulateOnly() { return simulateOnly; }
    public void setSimulateOnly(boolean simulateOnly) { this.simulateOnly = simulateOnly; }
}
