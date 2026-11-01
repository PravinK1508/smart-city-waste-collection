package com.smartcity.repository;

import com.smartcity.model.RecyclingDispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecyclingDispatchRepository extends JpaRepository<RecyclingDispatch, Long> {
    List<RecyclingDispatch> findAllByOrderByCreatedAtDesc();
    List<RecyclingDispatch> findByTripId(Long tripId);
    List<RecyclingDispatch> findByStatus(String status);
    Optional<RecyclingDispatch> findByDispatchCode(String dispatchCode);
    boolean existsByTripId(Long tripId);
}
