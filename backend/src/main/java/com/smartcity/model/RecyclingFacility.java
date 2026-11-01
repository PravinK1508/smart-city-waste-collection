package com.smartcity.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recycling_facilities")
public class RecyclingFacility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "facility_id")
    private Long facilityId;

    @Column(name = "facility_code", nullable = false, unique = true, length = 50)
    private String facilityCode;

    @Column(name = "facility_name", nullable = false, length = 150)
    private String facilityName;

    @Column(name = "facility_type", nullable = false, length = 100)
    private String facilityType;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "accepted_categories", nullable = false, length = 255)
    private String acceptedCategories;

    @Column(name = "daily_capacity_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal dailyCapacityKg;

    @Column(name = "current_intake_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentIntakeKg = BigDecimal.ZERO;

    @Column(name = "operational_status", nullable = false, length = 20)
    private String operationalStatus = "ACTIVE";

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public RecyclingFacility() {}

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (currentIntakeKg == null) currentIntakeKg = BigDecimal.ZERO;
        if (operationalStatus == null) operationalStatus = "ACTIVE";
    }

    public boolean acceptsCategory(String category) {
        if (category == null || acceptedCategories == null) return false;
        String normalizedTarget = category.trim().toLowerCase();
        for (String accepted : acceptedCategories.split(",")) {
            String norm = accepted.trim().toLowerCase();
            if (norm.equals(normalizedTarget) || norm.contains(normalizedTarget) || normalizedTarget.contains(norm)) {
                return true;
            }
        }
        return false;
    }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public String getFacilityCode() { return facilityCode; }
    public void setFacilityCode(String facilityCode) { this.facilityCode = facilityCode; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public String getFacilityType() { return facilityType; }
    public void setFacilityType(String facilityType) { this.facilityType = facilityType; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getAcceptedCategories() { return acceptedCategories; }
    public void setAcceptedCategories(String acceptedCategories) { this.acceptedCategories = acceptedCategories; }

    public BigDecimal getDailyCapacityKg() { return dailyCapacityKg; }
    public void setDailyCapacityKg(BigDecimal dailyCapacityKg) { this.dailyCapacityKg = dailyCapacityKg; }

    public BigDecimal getCurrentIntakeKg() { return currentIntakeKg; }
    public void setCurrentIntakeKg(BigDecimal currentIntakeKg) { this.currentIntakeKg = currentIntakeKg; }

    public String getOperationalStatus() { return operationalStatus; }
    public void setOperationalStatus(String operationalStatus) { this.operationalStatus = operationalStatus; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
