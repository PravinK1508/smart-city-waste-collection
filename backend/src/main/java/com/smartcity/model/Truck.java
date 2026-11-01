package com.smartcity.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trucks")
public class Truck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "truck_id")
    private Long truckId;

    @Column(name = "truck_code", nullable = false, unique = true, length = 50)
    private String truckCode;

    @Column(name = "registration_number", nullable = false, length = 50)
    private String registrationNumber;

    @Column(name = "truck_type", nullable = false, length = 50)
    private String truckType;

    @Column(name = "total_capacity_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalCapacityKg;

    @Column(name = "current_load_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentLoadKg = BigDecimal.ZERO;

    @Column(name = "assigned_area", length = 100)
    private String assignedArea;

    @Column(name = "operational_status", nullable = false, length = 20)
    private String operationalStatus = "AVAILABLE";

    @Column(name = "current_latitude", precision = 10, scale = 7)
    private BigDecimal currentLatitude;

    @Column(name = "current_longitude", precision = 10, scale = 7)
    private BigDecimal currentLongitude;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt = LocalDateTime.now();

    @Column(name = "assigned_driver_id")
    private Long assignedDriverId;

    @Transient
    private String assignedDriverName;

    public Truck() {}

    @PrePersist
    public void prePersist() {
        if (currentLoadKg == null) currentLoadKg = BigDecimal.ZERO;
        if (operationalStatus == null) operationalStatus = "AVAILABLE";
        if (lastActiveAt == null) lastActiveAt = LocalDateTime.now();
    }

    @Transient
    public BigDecimal getRemainingCapacityKg() {
        if (totalCapacityKg == null) return BigDecimal.ZERO;
        BigDecimal current = (currentLoadKg != null) ? currentLoadKg : BigDecimal.ZERO;
        return totalCapacityKg.subtract(current).max(BigDecimal.ZERO);
    }

    public Long getTruckId() { return truckId; }
    public void setTruckId(Long truckId) { this.truckId = truckId; }

    public String getTruckCode() { return truckCode; }
    public void setTruckCode(String truckCode) { this.truckCode = truckCode; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getTruckType() { return truckType; }
    public void setTruckType(String truckType) { this.truckType = truckType; }

    public BigDecimal getTotalCapacityKg() { return totalCapacityKg; }
    public void setTotalCapacityKg(BigDecimal totalCapacityKg) { this.totalCapacityKg = totalCapacityKg; }

    public BigDecimal getCurrentLoadKg() { return currentLoadKg; }
    public void setCurrentLoadKg(BigDecimal currentLoadKg) { this.currentLoadKg = currentLoadKg; }

    public String getAssignedArea() { return assignedArea; }
    public void setAssignedArea(String assignedArea) { this.assignedArea = assignedArea; }

    public String getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(String operationalStatus) { this.operationalStatus = operationalStatus; }

    public BigDecimal getCurrentLatitude() { return currentLatitude; }
    public void setCurrentLatitude(BigDecimal currentLatitude) { this.currentLatitude = currentLatitude; }

    public BigDecimal getCurrentLongitude() { return currentLongitude; }
    public void setCurrentLongitude(BigDecimal currentLongitude) { this.currentLongitude = currentLongitude; }

    public LocalDateTime getLastActiveAt() { return lastActiveAt; }
    public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }

    public Long getAssignedDriverId() { return assignedDriverId; }
    public void setAssignedDriverId(Long assignedDriverId) { this.assignedDriverId = assignedDriverId; }

    public String getAssignedDriverName() { return assignedDriverName; }
    public void setAssignedDriverName(String assignedDriverName) { this.assignedDriverName = assignedDriverName; }
}
