package com.smartcity.repository;

import com.smartcity.model.TripBin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface TripBinRepository extends JpaRepository<TripBin, Long> {
    List<TripBin> findByTripId(Long tripId);
    boolean existsByBinIdAndStatusIn(Long binId, Collection<String> statuses);
}
