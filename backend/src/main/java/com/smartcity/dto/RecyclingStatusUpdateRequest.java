package com.smartcity.dto;

import java.math.BigDecimal;

public class RecyclingStatusUpdateRequest {
    private String status; // 'DISPATCHED', 'DELIVERED', 'RECEIPT_CONFIRMED'
    private BigDecimal receivedWeightKg;
    private String receiptNotes;

    public RecyclingStatusUpdateRequest() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getReceivedWeightKg() { return receivedWeightKg; }
    public void setReceivedWeightKg(BigDecimal receivedWeightKg) { this.receivedWeightKg = receivedWeightKg; }

    public String getReceiptNotes() { return receiptNotes; }
    public void setReceiptNotes(String receiptNotes) { this.receiptNotes = receiptNotes; }
}
