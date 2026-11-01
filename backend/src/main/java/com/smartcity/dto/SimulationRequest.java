package com.smartcity.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class SimulationRequest {
    private Long reportId;
    private BigDecimal assumedRoadsideKg;
    private Long truckId;
    private List<Long> selectedBinIds = new ArrayList<>();
    private Long candidateFacilityId;

    public SimulationRequest() {}

    public Long getReportId() { return reportId; }
    public void setReportId(Long reportId) { this.reportId = reportId; }

    public BigDecimal getAssumedRoadsideKg() { return assumedRoadsideKg; }
    public void setAssumedRoadsideKg(BigDecimal assumedRoadsideKg) { this.assumedRoadsideKg = assumedRoadsideKg; }

    public Long getTruckId() { return truckId; }
    public void setTruckId(Long truckId) { this.truckId = truckId; }

    public List<Long> getSelectedBinIds() { return selectedBinIds; }
    public void setSelectedBinIds(List<Long> selectedBinIds) { this.selectedBinIds = selectedBinIds; }

    public Long getCandidateFacilityId() { return candidateFacilityId; }
    public void setCandidateFacilityId(Long candidateFacilityId) { this.candidateFacilityId = candidateFacilityId; }
}
