package com.smartcity.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "collection_trips")
public class CollectionTrip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "trip_id")
    private Long tripId;

    @Column(name = "trip_code", nullable = false, unique = true, length = 50)
    private String tripCode;

    @Column(name = "truck_id", nullable = false)
    private Long truckId;

    @Column(name = "primary_report_id", nullable = false)
    private Long primaryReportId;

    @Column(nullable = false, length = 30)
    private String status = "PLANNED";

    @Column(name = "planned_roadside_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal plannedRoadsideKg;

    @Column(name = "planned_bins_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal plannedBinsKg = BigDecimal.ZERO;

    @Column(name = "planned_total_load_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal plannedTotalLoadKg;

    @Column(name = "actual_collected_kg", precision = 10, scale = 2)
    private BigDecimal actualCollectedKg;

    @Column(name = "collection_notes", columnDefinition = "TEXT")
    private String collectionNotes;

    @Column(name = "collection_photo_url", length = 500)
    private String collectionPhotoUrl;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "driver_id")
    private Long driverId;

    @Transient
    private String driverName;

    @Transient
    private String truckCode;

    @Transient
    private String reportArea;

    @Transient
    private String wasteCategory;

    @Transient
    private String reportDescription;

    @Transient
    private String reportAddress;

    @Transient
    private List<TripStop> stops = new ArrayList<>();

    public CollectionTrip() {}

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (status == null) status = "PLANNED";
        if (plannedBinsKg == null) plannedBinsKg = BigDecimal.ZERO;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public String getTripCode() { return tripCode; }
    public void setTripCode(String tripCode) { this.tripCode = tripCode; }

    public Long getTruckId() { return truckId; }
    public void setTruckId(Long truckId) { this.truckId = truckId; }

    public Long getPrimaryReportId() { return primaryReportId; }
    public void setPrimaryReportId(Long primaryReportId) { this.primaryReportId = primaryReportId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getPlannedRoadsideKg() { return plannedRoadsideKg; }
    public void setPlannedRoadsideKg(BigDecimal plannedRoadsideKg) { this.plannedRoadsideKg = plannedRoadsideKg; }

    public BigDecimal getPlannedBinsKg() { return plannedBinsKg; }
    public void setPlannedBinsKg(BigDecimal plannedBinsKg) { this.plannedBinsKg = plannedBinsKg; }

    public BigDecimal getPlannedTotalLoadKg() { return plannedTotalLoadKg; }
    public void setPlannedTotalLoadKg(BigDecimal plannedTotalLoadKg) { this.plannedTotalLoadKg = plannedTotalLoadKg; }

    public BigDecimal getActualCollectedKg() { return actualCollectedKg; }
    public void setActualCollectedKg(BigDecimal actualCollectedKg) { this.actualCollectedKg = actualCollectedKg; }

    public String getCollectionNotes() { return collectionNotes; }
    public void setCollectionNotes(String collectionNotes) { this.collectionNotes = collectionNotes; }

    public String getCollectionPhotoUrl() { return collectionPhotoUrl; }
    public void setCollectionPhotoUrl(String collectionPhotoUrl) { this.collectionPhotoUrl = collectionPhotoUrl; }

    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getTruckCode() { return truckCode; }
    public void setTruckCode(String truckCode) { this.truckCode = truckCode; }

    public String getReportArea() { return reportArea; }
    public void setReportArea(String reportArea) { this.reportArea = reportArea; }

    public String getWasteCategory() { return wasteCategory; }
    public void setWasteCategory(String wasteCategory) { this.wasteCategory = wasteCategory; }

    public String getReportDescription() { return reportDescription; }
    public void setReportDescription(String reportDescription) { this.reportDescription = reportDescription; }

    public String getReportAddress() { return reportAddress; }
    public void setReportAddress(String reportAddress) { this.reportAddress = reportAddress; }

    public List<TripStop> getStops() { return stops; }
    public void setStops(List<TripStop> stops) { this.stops = stops; }
}
