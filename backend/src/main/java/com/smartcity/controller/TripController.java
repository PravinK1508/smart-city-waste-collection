package com.smartcity.controller;

import com.smartcity.dto.CollectionCompletionRequest;
import com.smartcity.dto.TripPlanningRequest;
import com.smartcity.dto.TripPlanningResponse;
import com.smartcity.model.CollectionTrip;
import com.smartcity.model.TripStop;
import com.smartcity.service.CollectionTripService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trips")
public class TripController {

    private final CollectionTripService tripService;

    public TripController(CollectionTripService tripService) {
        this.tripService = tripService;
    }

    @GetMapping("/auto-suggest")
    public ResponseEntity<?> autoSuggestTrip(
            @RequestParam Long reportId,
            @RequestParam(required = false, defaultValue = "5.0") Double radiusKm) {
        try {
            TripPlanningResponse response = tripService.getAutoSuggestPlan(reportId, radiusKm);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "feasible", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/calculate")
    public ResponseEntity<TripPlanningResponse> calculateTrip(@Valid @RequestBody TripPlanningRequest request) {
        return ResponseEntity.ok(tripService.calculatePlan(request));
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmTrip(
            @Valid @RequestBody TripPlanningRequest request,
            @RequestParam(required = false, defaultValue = "Municipal Admin") String adminName) {
        try {
            TripPlanningResponse response = tripService.confirmAndCreateTrip(request, adminName);
            return ResponseEntity.ok(response);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "feasible", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<CollectionTrip>> getAllTrips() {
        return ResponseEntity.ok(tripService.getAllTrips());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CollectionTrip> getTripById(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    @PostMapping("/{id}/dispatch")
    public ResponseEntity<CollectionTrip> dispatchTrip(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {
        String performedBy = payload != null ? payload.getOrDefault("performedBy", "Admin") : "Admin";
        return ResponseEntity.ok(tripService.dispatchTrip(id, performedBy));
    }

    @PostMapping("/{id}/start")
    public ResponseEntity<CollectionTrip> startTrip(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {
        String performedBy = payload != null ? payload.getOrDefault("performedBy", "Driver") : "Driver";
        return ResponseEntity.ok(tripService.startTrip(id, performedBy));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<CollectionTrip> completeTrip(
            @PathVariable Long id,
            @RequestBody CollectionCompletionRequest request,
            @RequestParam(required = false, defaultValue = "Admin") String performedBy) {
        return ResponseEntity.ok(tripService.completeCollection(id, request, performedBy));
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<CollectionTrip>> getTripsByDriver(@PathVariable Long driverId) {
        return ResponseEntity.ok(tripService.getTripsByDriver(driverId));
    }

    @GetMapping("/{id}/stops")
    public ResponseEntity<List<TripStop>> getTripStops(@PathVariable Long id) {
        return ResponseEntity.ok(tripService.getTripStops(id));
    }
}
