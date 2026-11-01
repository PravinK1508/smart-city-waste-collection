package com.smartcity.dto;

import java.math.BigDecimal;

public class TripStopDto {
    private Integer stopOrder;
    private String stopType; // 'ROADSIDE_REPORT' or 'MUNICIPAL_BIN'
    private Long referenceId;
    private String locationName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal plannedKg;
    private String status;

    public TripStopDto() {}

    public TripStopDto(Integer stopOrder, String stopType, Long referenceId, String locationName, BigDecimal latitude, BigDecimal longitude, BigDecimal plannedKg, String status) {
        this.stopOrder = stopOrder;
        this.stopType = stopType;
        this.referenceId = referenceId;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.plannedKg = plannedKg;
        this.status = status;
    }

    public Integer getStopOrder() { return stopOrder; }
    public void setStopOrder(Integer stopOrder) { this.stopOrder = stopOrder; }

    public String getStopType() { return stopType; }
    public void setStopType(String stopType) { this.stopType = stopType; }

    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public BigDecimal getPlannedKg() { return plannedKg; }
    public void setPlannedKg(BigDecimal plannedKg) { this.plannedKg = plannedKg; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
