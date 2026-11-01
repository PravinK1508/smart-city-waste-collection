package com.smartcity.controller;

import com.smartcity.dto.WasteReportRequest;
import com.smartcity.model.WasteReport;
import com.smartcity.service.WasteReportService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class WasteReportController {

    private final WasteReportService reportService;

    public WasteReportController(WasteReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping
    public ResponseEntity<WasteReport> createReport(@Valid @RequestBody WasteReportRequest request) {
        WasteReport saved = reportService.createReport(request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<WasteReport>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/my-reports")
    public ResponseEntity<List<WasteReport>> getMyReports(@RequestParam String email) {
        return ResponseEntity.ok(reportService.getReportsByCitizen(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WasteReport> getReportById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getReportById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<WasteReport> updateReportStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        String performedBy = payload.getOrDefault("performedBy", "Admin");
        String notes = payload.get("notes");
        return ResponseEntity.ok(reportService.updateStatus(id, newStatus, performedBy, notes));
    }
}
