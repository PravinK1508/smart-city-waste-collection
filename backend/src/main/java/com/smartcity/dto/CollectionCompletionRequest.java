package com.smartcity.dto;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class CollectionCompletionRequest {
    private BigDecimal actualRoadsideKg;
    private Map<Long, BigDecimal> binActualKg = new HashMap<>();
    private String notes;
    private String collectionPhotoUrl;

    public CollectionCompletionRequest() {}

    public BigDecimal getActualRoadsideKg() { return actualRoadsideKg; }
    public void setActualRoadsideKg(BigDecimal actualRoadsideKg) { this.actualRoadsideKg = actualRoadsideKg; }

    public Map<Long, BigDecimal> getBinActualKg() { return binActualKg; }
    public void setBinActualKg(Map<Long, BigDecimal> binActualKg) { this.binActualKg = binActualKg; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCollectionPhotoUrl() { return collectionPhotoUrl; }
    public void setCollectionPhotoUrl(String collectionPhotoUrl) { this.collectionPhotoUrl = collectionPhotoUrl; }
}
