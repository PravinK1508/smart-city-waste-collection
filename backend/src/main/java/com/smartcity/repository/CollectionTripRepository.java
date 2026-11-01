package com.smartcity.repository;

import com.smartcity.model.CollectionTrip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionTripRepository extends JpaRepository<CollectionTrip, Long> {
    List<CollectionTrip> findAllByOrderByCreatedAtDesc();
    List<CollectionTrip> findByStatus(String status);
    Optional<CollectionTrip> findByTripCode(String tripCode);
    boolean existsByPrimaryReportIdAndStatusIn(Long primaryReportId, Collection<String> statuses);
    boolean existsByTruckIdAndStatusIn(Long truckId, Collection<String> statuses);
    List<CollectionTrip> findByDriverIdOrderByCreatedAtDesc(Long driverId);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM CollectionTrip c WHERE c.driverId = :driverId OR c.truckId IN (SELECT t.truckId FROM Truck t WHERE t.assignedDriverId = :driverId) ORDER BY c.createdAt DESC")
    List<CollectionTrip> findByDriverIdOrTruckAssignedDriver(@org.springframework.data.repository.query.Param("driverId") Long driverId);
}
