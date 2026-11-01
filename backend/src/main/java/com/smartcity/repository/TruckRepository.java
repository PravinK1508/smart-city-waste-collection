package com.smartcity.repository;

import com.smartcity.model.Truck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TruckRepository extends JpaRepository<Truck, Long> {
    List<Truck> findAllByOrderByTruckCodeAsc();
    List<Truck> findByOperationalStatus(String operationalStatus);
    Optional<Truck> findByTruckCode(String truckCode);
    List<Truck> findByAssignedDriverId(Long assignedDriverId);
}
