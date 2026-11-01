package com.smartcity.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class DeliveryVerificationRequest {

    @NotBlank(message = "Verification action is required (APPROVE or REJECT)")
    private String action; // "APPROVE" or "REJECT"

    private String rejectionReason;
    private BigDecimal verifiedWeightKg;
    private String verifiedBy;
    private String notes;

    public DeliveryVerificationRequest() {}

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public BigDecimal getVerifiedWeightKg() { return verifiedWeightKg; }
    public void setVerifiedWeightKg(BigDecimal verifiedWeightKg) { this.verifiedWeightKg = verifiedWeightKg; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
