package com.smartcity.repository;

import com.smartcity.model.TripStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripStopRepository extends JpaRepository<TripStop, Long> {
    List<TripStop> findByTripIdOrderByStopOrderAsc(Long tripId);
}
