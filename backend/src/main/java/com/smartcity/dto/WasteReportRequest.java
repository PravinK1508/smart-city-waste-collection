package com.smartcity.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class WasteReportRequest {

    @NotBlank(message = "Citizen email is required")
    private String citizenEmail;

    private String citizenName;
    private String citizenPhone;

    @NotBlank(message = "Waste category is required")
    private String wasteCategory;

    @NotBlank(message = "Description is required")
    private String description;

    private String photoUrl;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;

    @NotBlank(message = "Area name/locality is required")
    private String areaName;

    private BigDecimal estimatedQuantityKg;

    public WasteReportRequest() {}

    public String getCitizenEmail() { return citizenEmail; }
    public void setCitizenEmail(String citizenEmail) { this.citizenEmail = citizenEmail; }

    public String getCitizenName() { return citizenName; }
    public void setCitizenName(String citizenName) { this.citizenName = citizenName; }

    public String getCitizenPhone() { return citizenPhone; }
    public void setCitizenPhone(String citizenPhone) { this.citizenPhone = citizenPhone; }

    public String getWasteCategory() { return wasteCategory; }
    public void setWasteCategory(String wasteCategory) { this.wasteCategory = wasteCategory; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getAreaName() { return areaName; }
    public void setAreaName(String areaName) { this.areaName = areaName; }

    public BigDecimal getEstimatedQuantityKg() { return estimatedQuantityKg; }
    public void setEstimatedQuantityKg(BigDecimal estimatedQuantityKg) { this.estimatedQuantityKg = estimatedQuantityKg; }
}
