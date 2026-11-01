package com.smartcity.dto;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class DashboardStatsDto {
    private long totalReports;
    private long pendingReports;
    private long inProgressReports;
    private long completedReports;

    private long totalBins;
    private long activeBins;
    private long binsAbove75Pct;
    private BigDecimal averageBinFillPercentage;

    private long totalTrucks;
    private long availableTrucks;
    private long busyTrucks;

    private long totalTrips;
    private long activeTrips;
    private long completedTrips;
    private long combinedTripsCount;
    private long singleSourceTripsCount;

    private long totalRecyclingDispatches;
    private long deliveredRecyclingDispatches;

    private BigDecimal totalWasteCollectedKg;
    private BigDecimal totalWasteRecycledKg;

    private Map<String, Long> reportsByCategory = new HashMap<>();
    private Map<String, Long> reportsByLocality = new HashMap<>();
    private Map<String, Long> dispatchesByFacility = new HashMap<>();

    public DashboardStatsDto() {}

    public long getTotalReports() { return totalReports; }
    public void setTotalReports(long totalReports) { this.totalReports = totalReports; }

    public long getPendingReports() { return pendingReports; }
    public void setPendingReports(long pendingReports) { this.pendingReports = pendingReports; }

    public long getInProgressReports() { return inProgressReports; }
    public void setInProgressReports(long inProgressReports) { this.inProgressReports = inProgressReports; }

    public long getCompletedReports() { return completedReports; }
    public void setCompletedReports(long completedReports) { this.completedReports = completedReports; }

    public long getTotalBins() { return totalBins; }
    public void setTotalBins(long totalBins) { this.totalBins = totalBins; }

    public long getActiveBins() { return activeBins; }
    public void setActiveBins(long activeBins) { this.activeBins = activeBins; }

    public long getBinsAbove75Pct() { return binsAbove75Pct; }
    public void setBinsAbove75Pct(long binsAbove75Pct) { this.binsAbove75Pct = binsAbove75Pct; }

    public BigDecimal getAverageBinFillPercentage() { return averageBinFillPercentage; }
    public void setAverageBinFillPercentage(BigDecimal averageBinFillPercentage) { this.averageBinFillPercentage = averageBinFillPercentage; }

    public long getTotalTrucks() { return totalTrucks; }
    public void setTotalTrucks(long totalTrucks) { this.totalTrucks = totalTrucks; }

    public long getAvailableTrucks() { return availableTrucks; }
    public void setAvailableTrucks(long availableTrucks) { this.availableTrucks = availableTrucks; }

    public long getBusyTrucks() { return busyTrucks; }
    public void setBusyTrucks(long busyTrucks) { this.busyTrucks = busyTrucks; }

    public long getTotalTrips() { return totalTrips; }
    public void setTotalTrips(long totalTrips) { this.totalTrips = totalTrips; }

    public long getActiveTrips() { return activeTrips; }
    public void setActiveTrips(long activeTrips) { this.activeTrips = activeTrips; }

    public long getCompletedTrips() { return completedTrips; }
    public void setCompletedTrips(long completedTrips) { this.completedTrips = completedTrips; }

    public long getCombinedTripsCount() { return combinedTripsCount; }
    public void setCombinedTripsCount(long combinedTripsCount) { this.combinedTripsCount = combinedTripsCount; }

    public long getSingleSourceTripsCount() { return singleSourceTripsCount; }
    public void setSingleSourceTripsCount(long singleSourceTripsCount) { this.singleSourceTripsCount = singleSourceTripsCount; }

    public long getTotalRecyclingDispatches() { return totalRecyclingDispatches; }
    public void setTotalRecyclingDispatches(long totalRecyclingDispatches) { this.totalRecyclingDispatches = totalRecyclingDispatches; }

    public long getDeliveredRecyclingDispatches() { return deliveredRecyclingDispatches; }
    public void setDeliveredRecyclingDispatches(long deliveredRecyclingDispatches) { this.deliveredRecyclingDispatches = deliveredRecyclingDispatches; }

    public BigDecimal getTotalWasteCollectedKg() { return totalWasteCollectedKg; }
    public void setTotalWasteCollectedKg(BigDecimal totalWasteCollectedKg) { this.totalWasteCollectedKg = totalWasteCollectedKg; }

    public BigDecimal getTotalWasteRecycledKg() { return totalWasteRecycledKg; }
    public void setTotalWasteRecycledKg(BigDecimal totalWasteRecycledKg) { this.totalWasteRecycledKg = totalWasteRecycledKg; }

    public Map<String, Long> getReportsByCategory() { return reportsByCategory; }
    public void setReportsByCategory(Map<String, Long> reportsByCategory) { this.reportsByCategory = reportsByCategory; }

    public Map<String, Long> getReportsByLocality() { return reportsByLocality; }
    public void setReportsByLocality(Map<String, Long> reportsByLocality) { this.reportsByLocality = reportsByLocality; }

    public Map<String, Long> getDispatchesByFacility() { return dispatchesByFacility; }
    public void setDispatchesByFacility(Map<String, Long> dispatchesByFacility) { this.dispatchesByFacility = dispatchesByFacility; }
}
