package com.smartcity.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_bins", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"trip_id", "bin_id"})
})
public class TripBin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @Column(name = "bin_id", nullable = false)
    private Long binId;

    @Column(name = "planned_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal plannedKg;

    @Column(name = "actual_collected_kg", precision = 10, scale = 2)
    private BigDecimal actualCollectedKg;

    @Column(nullable = false, length = 20)
    private String status = "SCHEDULED";

    @Column(name = "collected_at")
    private LocalDateTime collectedAt;

    public TripBin() {}

    public TripBin(Long tripId, Long binId, BigDecimal plannedKg) {
        this.tripId = tripId;
        this.binId = binId;
        this.plannedKg = plannedKg;
        this.status = "SCHEDULED";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public Long getBinId() { return binId; }
    public void setBinId(Long binId) { this.binId = binId; }

    public BigDecimal getPlannedKg() { return plannedKg; }
    public void setPlannedKg(BigDecimal plannedKg) { this.plannedKg = plannedKg; }

    public BigDecimal getActualCollectedKg() { return actualCollectedKg; }
    public void setActualCollectedKg(BigDecimal actualCollectedKg) { this.actualCollectedKg = actualCollectedKg; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCollectedAt() { return collectedAt; }
    public void setCollectedAt(LocalDateTime collectedAt) { this.collectedAt = collectedAt; }
}
