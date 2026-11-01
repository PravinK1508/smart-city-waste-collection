package com.smartcity.repository;

import com.smartcity.model.RecyclingFacility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecyclingFacilityRepository extends JpaRepository<RecyclingFacility, Long> {
    List<RecyclingFacility> findAllByOrderByFacilityNameAsc();
    List<RecyclingFacility> findByOperationalStatus(String operationalStatus);
    Optional<RecyclingFacility> findByFacilityCode(String facilityCode);
}
