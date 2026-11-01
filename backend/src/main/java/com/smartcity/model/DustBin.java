package com.smartcity.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "dust_bins")
public class DustBin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bin_id")
    private Long binId;

    @Column(name = "bin_code", nullable = false, unique = true, length = 50)
    private String binCode;

    @Column(name = "area_id", nullable = false, length = 20)
    private String areaId;

    @Column(name = "area_name", nullable = false, length = 100)
    private String areaName;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "bin_capacity_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal binCapacityKg;

    @Column(name = "current_fill_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentFillKg = BigDecimal.ZERO;

    @Column(name = "waste_category", nullable = false, length = 50)
    private String wasteCategory = "Mixed";

    @Column(name = "operational_status", nullable = false, length = 20)
    private String operationalStatus = "ACTIVE";

    @Column(name = "collection_status", nullable = false, length = 20)
    private String collectionStatus = "IDLE";

    @Column(name = "last_emptied_at")
    private LocalDateTime lastEmptiedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public DustBin() {}

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (currentFillKg == null) currentFillKg = BigDecimal.ZERO;
        if (operationalStatus == null) operationalStatus = "ACTIVE";
        if (collectionStatus == null) collectionStatus = "IDLE";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Transient
    public BigDecimal getFillPercentage() {
        if (binCapacityKg == null || binCapacityKg.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        if (currentFillKg == null || currentFillKg.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return currentFillKg.multiply(BigDecimal.valueOf(100))
                .divide(binCapacityKg, 1, RoundingMode.HALF_UP);
    }

    public Long getBinId() { return binId; }
    public void setBinId(Long binId) { this.binId = binId; }

    public String getBinCode() { return binCode; }
    public void setBinCode(String binCode) { this.binCode = binCode; }

    public String getAreaId() { return areaId; }
    public void setAreaId(String areaId) { this.areaId = areaId; }

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

    public String getWasteCategory() { return wasteCategory; }
    public void setWasteCategory(String wasteCategory) { this.wasteCategory = wasteCategory; }

    public String getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(String operationalStatus) { this.operationalStatus = operationalStatus; }

    public String getCollectionStatus() { return collectionStatus; }
    public void setCollectionStatus(String collectionStatus) { this.collectionStatus = collectionStatus; }

    public LocalDateTime getLastEmptiedAt() { return lastEmptiedAt; }
    public void setLastEmptiedAt(LocalDateTime lastEmptiedAt) { this.lastEmptiedAt = lastEmptiedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
