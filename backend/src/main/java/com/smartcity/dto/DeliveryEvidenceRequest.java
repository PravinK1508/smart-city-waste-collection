package com.smartcity.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class DeliveryEvidenceRequest {

    private Long driverId;
    private String driverName;

    @NotBlank(message = "Evidence photo is required for recycling delivery verification")
    private String evidencePhotoUrl;

    @DecimalMin(value = "0.01", message = "Delivered weight must be greater than zero")
    private BigDecimal deliveredWeightKg;

    private String deliveryNotes;

    public DeliveryEvidenceRequest() {}

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getEvidencePhotoUrl() { return evidencePhotoUrl; }
    public void setEvidencePhotoUrl(String evidencePhotoUrl) { this.evidencePhotoUrl = evidencePhotoUrl; }

    public BigDecimal getDeliveredWeightKg() { return deliveredWeightKg; }
    public void setDeliveredWeightKg(BigDecimal deliveredWeightKg) { this.deliveredWeightKg = deliveredWeightKg; }

    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }
}
