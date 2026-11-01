package com.smartcity.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_stops")
public class TripStop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stop_id")
    private Long stopId;

    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder;

    @Column(name = "stop_type", nullable = false, length = 30)
    private String stopType; // 'ROADSIDE_REPORT', 'MUNICIPAL_BIN'

    @Column(name = "reference_id", nullable = false)
    private Long referenceId;

    @Column(name = "location_name", nullable = false, length = 255)
    private String locationName;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "planned_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal plannedKg;

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, ARRIVED, COLLECTED, SKIPPED

    @Column(name = "actual_collected_kg", precision = 10, scale = 2)
    private BigDecimal actualCollectedKg;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public TripStop() {}

    public Long getStopId() { return stopId; }
    public void setStopId(Long stopId) { this.stopId = stopId; }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

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

    public BigDecimal getActualCollectedKg() { return actualCollectedKg; }
    public void setActualCollectedKg(BigDecimal actualCollectedKg) { this.actualCollectedKg = actualCollectedKg; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
