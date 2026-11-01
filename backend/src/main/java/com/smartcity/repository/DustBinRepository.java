package com.smartcity.repository;

import com.smartcity.model.DustBin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DustBinRepository extends JpaRepository<DustBin, Long> {
    List<DustBin> findAllByOrderByAreaNameAsc();
    List<DustBin> findByOperationalStatus(String operationalStatus);
    List<DustBin> findByCollectionStatus(String collectionStatus);
    Optional<DustBin> findByBinCode(String binCode);
}
