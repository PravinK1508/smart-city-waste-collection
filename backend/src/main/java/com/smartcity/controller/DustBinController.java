package com.smartcity.controller;

import com.smartcity.dto.CandidateBinDto;
import com.smartcity.model.DustBin;
import com.smartcity.service.DustBinService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bins")
public class DustBinController {

    private final DustBinService dustBinService;

    public DustBinController(DustBinService dustBinService) {
        this.dustBinService = dustBinService;
    }

    @GetMapping
    public ResponseEntity<List<DustBin>> getAllBins() {
        return ResponseEntity.ok(dustBinService.getAllBins());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DustBin> getBinById(@PathVariable Long id) {
        return ResponseEntity.ok(dustBinService.getBinById(id));
    }

    @GetMapping("/nearby")
    public ResponseEntity<List<CandidateBinDto>> getNearbyBins(
            @RequestParam Long reportId,
            @RequestParam(required = false, defaultValue = "5.0") Double radius) {
        return ResponseEntity.ok(dustBinService.findNearbyBinsForReport(reportId, radius));
    }

    @PutMapping("/{id}/fill")
    public ResponseEntity<DustBin> updateFill(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> payload) {
        BigDecimal newFill = payload.get("currentFillKg");
        return ResponseEntity.ok(dustBinService.updateFillLevel(id, newFill));
    }
}
