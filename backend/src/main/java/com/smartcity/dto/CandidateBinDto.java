package com.smartcity.dto;

import java.math.BigDecimal;

public class CandidateBinDto {
    private Long binId;
    private String binCode;
    private String areaName;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal binCapacityKg;
    private BigDecimal currentFillKg;
    private BigDecimal fillPercentage;
    private String wasteCategory;
    private String operationalStatus;
    private String collectionStatus;
    private BigDecimal distanceKm;
    private boolean eligible;
    private String exclusionReason;

    public CandidateBinDto() {}

    public Long getBinId() { return binId; }
    public void setBinId(Long binId) { this.binId = binId; }

    public String getBinCode() { return binCode; }
    public void setBinCode(String binCode) { this.binCode = binCode; }

    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public BigDecimal getBinCapacityKg() { return binCapacityKg; }
    public void setBinCapacityKg(BigDecimal binCapacityKg) { this.binCapacityKg = binCapacityKg; }

    public BigDecimal getCurrentFillKg() { return currentFillKg; }
    public void setCurrentFillKg(BigDecimal currentFillKg) { this.currentFillKg = currentFillKg; }

    public BigDecimal getFillPercentage() { return fillPercentage; }
    public void setFillPercentage(BigDecimal fillPercentage) { this.fillPercentage = fillPercentage; }

    public String getWasteCategory() { return wasteCategory; }
    public void setWasteCategory(String wasteCategory) { this.wasteCategory = wasteCategory; }

    public String getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(String operationalStatus) { this.operationalStatus = operationalStatus; }

    public String getCollectionStatus() { return collectionStatus; }
    public void setCollectionStatus(String collectionStatus) { this.collectionStatus = collectionStatus; }

    public BigDecimal getDistanceKm() { return distanceKm; }
    public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public String getExclusionReason() { return exclusionReason; }
    public void setExclusionReason(String exclusionReason) { this.exclusionReason = exclusionReason; }
}
