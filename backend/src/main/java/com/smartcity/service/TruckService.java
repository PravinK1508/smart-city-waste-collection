package com.smartcity.service;

import com.smartcity.model.Truck;
import com.smartcity.repository.TruckRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TruckService {

    private final TruckRepository truckRepository;
    private final com.smartcity.repository.UserRepository userRepository;
    private final AuditService auditService;

    public TruckService(TruckRepository truckRepository,
                        com.smartcity.repository.UserRepository userRepository,
                        AuditService auditService) {
        this.truckRepository = truckRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    private void enrichDriver(Truck truck) {
        if (truck != null && truck.getAssignedDriverId() != null) {
            userRepository.findById(truck.getAssignedDriverId())
                    .ifPresent(u -> truck.setAssignedDriverName(u.getFullName()));
        }
    }

    public List<Truck> getAllTrucks() {
        List<Truck> list = truckRepository.findAllByOrderByTruckCodeAsc();
        list.forEach(this::enrichDriver);
        return list;
    }

    public List<Truck> getAvailableTrucks() {
        List<Truck> list = truckRepository.findByOperationalStatus("AVAILABLE");
        list.forEach(this::enrichDriver);
        return list;
    }

    public List<Truck> getTrucksByDriver(Long driverId) {
        List<Truck> list = truckRepository.findByAssignedDriverId(driverId);
        list.forEach(this::enrichDriver);
        return list;
    }

    public Truck getTruckById(Long id) {
        Truck truck = truckRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Truck not found with ID: " + id));
        enrichDriver(truck);
        return truck;
    }

    @Transactional
    public Truck updateTruckStatus(Long id, String status, String performedBy) {
        Truck truck = getTruckById(id);
        String oldStatus = truck.getOperationalStatus();
        truck.setOperationalStatus(status);
        Truck saved = truckRepository.save(truck);

        auditService.log(
                "TRUCK",
                saved.getTruckId(),
                "TRUCK_STATUS_UPDATED",
                oldStatus,
                status,
                performedBy,
                "Truck " + truck.getTruckCode() + " status changed to " + status
        );

        return saved;
    }

    @Transactional
    public Truck updateTruckLoad(Long id, BigDecimal loadKg) {
        Truck truck = getTruckById(id);
        if (loadKg.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Load cannot be negative");
        }
        if (loadKg.compareTo(truck.getTotalCapacityKg()) > 0) {
            throw new IllegalArgumentException("Current load exceeds total capacity: " + truck.getTotalCapacityKg() + " kg");
        }
        truck.setCurrentLoadKg(loadKg);
        return truckRepository.save(truck);
    }
}
