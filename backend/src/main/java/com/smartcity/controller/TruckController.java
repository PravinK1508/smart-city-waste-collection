package com.smartcity.controller;

import com.smartcity.model.Truck;
import com.smartcity.service.TruckService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trucks")
public class TruckController {

    private final TruckService truckService;

    public TruckController(TruckService truckService) {
        this.truckService = truckService;
    }

    @GetMapping
    public ResponseEntity<List<Truck>> getAllTrucks() {
        return ResponseEntity.ok(truckService.getAllTrucks());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Truck>> getAvailableTrucks() {
        return ResponseEntity.ok(truckService.getAvailableTrucks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Truck> getTruckById(@PathVariable Long id) {
        return ResponseEntity.ok(truckService.getTruckById(id));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Truck>> getTrucksByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(truckService.getTrucksByDriver(driverId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Truck> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        String performedBy = payload.getOrDefault("performedBy", "Admin");
        return ResponseEntity.ok(truckService.updateTruckStatus(id, status, performedBy));
    }
}
