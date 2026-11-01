package com.smartcity.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "recycling_dispatches")
public class RecyclingDispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dispatch_id")
    private Long dispatchId;

    @Column(name = "dispatch_code", nullable = false, unique = true, length = 50)
    private String dispatchCode;

    @Column(name = "trip_id", nullable = false)
    private Long tripId;

    @Column(name = "facility_id", nullable = false)
    private Long facilityId;

    @Column(name = "waste_category", nullable = false, length = 50)
    private String wasteCategory;

    @Column(name = "dispatched_quantity_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal dispatchedQuantityKg;

    @Column(nullable = false, length = 30)
    private String status = "READY_FOR_DISPATCH";

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "receipt_confirmed_at")
    private LocalDateTime receiptConfirmedAt;

    @Column(name = "received_weight_kg", precision = 10, scale = 2)
    private BigDecimal receivedWeightKg;

    @Column(name = "receipt_notes", columnDefinition = "TEXT")
    private String receiptNotes;

    @Column(name = "evidence_photo_url", length = 500)
    private String evidencePhotoUrl;

    @Column(name = "driver_id")
    private Long driverId;

    @Column(name = "verification_status", length = 30)
    private String verificationStatus = "PENDING";

    @Column(name = "verified_by", length = 100)
    private String verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "delivery_notes", columnDefinition = "TEXT")
    private String deliveryNotes;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Transient
    private String facilityName;

    @Transient
    private String facilityAddress;

    @Transient
    private String facilityType;

    @Transient
    private String contactPerson;

    @Transient
    private String contactPhone;

    @Transient
    private String driverName;

    @Transient
    private String truckCode;

    @Transient
    private Long reportId;

    public RecyclingDispatch() {}

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (status == null) status = "READY_FOR_DISPATCH";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getDispatchId() { return dispatchId; }
    public void setDispatchId(Long dispatchId) { this.dispatchId = dispatchId; }

    public String getDispatchCode() { return dispatchCode; }
    public void setDispatchCode(String dispatchCode) { this.dispatchCode = dispatchCode; }

    public Long getTripId() { return tripId; }
    public void setTripId(Long tripId) { this.tripId = tripId; }

    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }

    public String getWasteCategory() { return wasteCategory; }
    public void setWasteCategory(String wasteCategory) { this.wasteCategory = wasteCategory; }

    public BigDecimal getDispatchedQuantityKg() { return dispatchedQuantityKg; }
    public void setDispatchedQuantityKg(BigDecimal dispatchedQuantityKg) { this.dispatchedQuantityKg = dispatchedQuantityKg; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public LocalDateTime getReceiptConfirmedAt() { return receiptConfirmedAt; }
    public void setReceiptConfirmedAt(LocalDateTime receiptConfirmedAt) { this.receiptConfirmedAt = receiptConfirmedAt; }

    public BigDecimal getReceivedWeightKg() { return receivedWeightKg; }
    public void setReceivedWeightKg(BigDecimal receivedWeightKg) { this.receivedWeightKg = receivedWeightKg; }

    public String getReceiptNotes() { return receiptNotes; }
    public void setReceiptNotes(String receiptNotes) { this.receiptNotes = receiptNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public String getFacilityAddress() { return facilityAddress; }
    public void setFacilityAddress(String facilityAddress) { this.facilityAddress = facilityAddress; }

    public String getFacilityType() { return facilityType; }
    public void setFacilityType(String facilityType) { this.facilityType = facilityType; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getEvidencePhotoUrl() { return evidencePhotoUrl; }
    public void setEvidencePhotoUrl(String evidencePhotoUrl) { this.evidencePhotoUrl = evidencePhotoUrl; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getTruckCode() { return truckCode; }
    public void setTruckCode(String truckCode) { this.truckCode = truckCode; }

    public Long getReportId() { return reportId; }
    public void setReportId(Long reportId) { this.reportId = reportId; }
}
