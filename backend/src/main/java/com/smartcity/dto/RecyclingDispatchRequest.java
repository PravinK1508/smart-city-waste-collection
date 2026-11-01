package com.smartcity.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class RecyclingDispatchRequest {

    @NotNull(message = "Trip ID is required")
    private Long tripId;

    @NotNull(message = "Facility ID is required")
    private Long facilityId;

    private BigDecimal dispatchedQuantityKg;
    private String notes;

    public RecyclingDispatchRequest() {}

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public BigDecimal getDispatchedQuantityKg() { return dispatchedQuantityKg; }
    public void setDispatchedQuantityKg(BigDecimal dispatchedQuantityKg) { this.dispatchedQuantityKg = dispatchedQuantityKg; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
