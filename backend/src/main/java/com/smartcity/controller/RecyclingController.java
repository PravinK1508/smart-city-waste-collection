package com.smartcity.controller;

import com.smartcity.dto.DeliveryEvidenceRequest;
import com.smartcity.dto.DeliveryVerificationRequest;
import com.smartcity.dto.RecyclingDispatchRequest;
import com.smartcity.dto.RecyclingStatusUpdateRequest;
import com.smartcity.model.RecyclingDispatch;
import com.smartcity.model.RecyclingFacility;
import com.smartcity.service.RecyclingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recycling")
public class RecyclingController {

    private final RecyclingService recyclingService;

    public RecyclingController(RecyclingService recyclingService) {
        this.recyclingService = recyclingService;
    }

    @GetMapping("/facilities")
    public ResponseEntity<List<RecyclingFacility>> getAllFacilities() {
        return ResponseEntity.ok(recyclingService.getAllFacilities());
    }

    @GetMapping("/facilities/{id}")
    public ResponseEntity<RecyclingFacility> getFacilityById(@PathVariable Long id) {
        return ResponseEntity.ok(recyclingService.getFacilityById(id));
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<RecyclingFacility>> getRecommendations(@RequestParam Long tripId) {
        return ResponseEntity.ok(recyclingService.getRecommendedFacilitiesForTrip(tripId));
    }

    @GetMapping("/dispatches")
    public ResponseEntity<List<RecyclingDispatch>> getAllDispatches() {
        return ResponseEntity.ok(recyclingService.getAllDispatches());
    }

    @GetMapping("/dispatches/{id}")
    public ResponseEntity<RecyclingDispatch> getDispatchById(@PathVariable Long id) {
        return ResponseEntity.ok(recyclingService.getDispatchById(id));
    }

    @GetMapping("/dispatches/by-trip/{tripId}")
    public ResponseEntity<?> getDispatchByTripId(@PathVariable Long tripId) {
        RecyclingDispatch dispatch = recyclingService.getDispatchByTripId(tripId);
        if (dispatch == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dispatch);
    }

    @PostMapping("/dispatches")
    public ResponseEntity<?> createDispatch(
            @Valid @RequestBody RecyclingDispatchRequest request,
            @RequestParam(required = false, defaultValue = "Recycling Officer") String performedBy) {
        try {
            RecyclingDispatch dispatch = recyclingService.createDispatch(request, performedBy);
            return ResponseEntity.ok(dispatch);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PatchMapping("/dispatches/{id}/status")
    public ResponseEntity<?> updateDispatchStatus(
            @PathVariable Long id,
            @RequestBody RecyclingStatusUpdateRequest request,
            @RequestParam(required = false, defaultValue = "Facility In-charge") String performedBy) {
        try {
            RecyclingDispatch updated = recyclingService.updateDispatchStatus(id, request, performedBy);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/dispatches/{id}/submit-evidence")
    public ResponseEntity<?> submitDeliveryEvidence(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryEvidenceRequest request,
            @RequestParam(required = false, defaultValue = "Driver") String performedBy) {
        try {
            RecyclingDispatch updated = recyclingService.submitDeliveryEvidence(id, request, performedBy);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/dispatches/{id}/verify")
    public ResponseEntity<?> verifyDelivery(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryVerificationRequest request,
            @RequestParam(required = false, defaultValue = "Municipal Admin") String adminName) {
        try {
            RecyclingDispatch updated = recyclingService.verifyDelivery(id, request, adminName);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
