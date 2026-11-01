package com.smartcity.repository;

import com.smartcity.model.WasteReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WasteReportRepository extends JpaRepository<WasteReport, Long> {
    List<WasteReport> findAllByOrderByCreatedAtDesc();
    List<WasteReport> findByCitizenEmailOrderByCreatedAtDesc(String citizenEmail);
    List<WasteReport> findByStatus(String status);
    long countByStatus(String status);
}
