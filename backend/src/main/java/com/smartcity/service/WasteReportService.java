package com.smartcity.service;

import com.smartcity.dto.WasteReportRequest;
import com.smartcity.model.User;
import com.smartcity.model.WasteReport;
import com.smartcity.repository.UserRepository;
import com.smartcity.repository.WasteReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class WasteReportService {

    private final WasteReportRepository reportRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public WasteReportService(WasteReportRepository reportRepository, UserRepository userRepository, AuditService auditService) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public WasteReport createReport(WasteReportRequest req) {
        WasteReport report = new WasteReport();
        report.setCitizenEmail(req.getCitizenEmail().trim().toLowerCase());
        report.setCitizenName(req.getCitizenName());
        report.setCitizenPhone(req.getCitizenPhone());
        report.setWasteCategory(req.getWasteCategory().trim());
        report.setDescription(req.getDescription().trim());
        report.setPhotoUrl(req.getPhotoUrl());
        report.setLatitude(req.getLatitude());
        report.setLongitude(req.getLongitude());
        report.setAddress(req.getAddress());
        report.setAreaName(req.getAreaName().trim());

        if (req.getEstimatedQuantityKg() != null && req.getEstimatedQuantityKg().compareTo(BigDecimal.ZERO) > 0) {
            report.setEstimatedQuantityKg(req.getEstimatedQuantityKg());
        } else {
            // Standard default baseline roadside waste estimate
            report.setEstimatedQuantityKg(BigDecimal.valueOf(40.00));
        }

        report.setStatus("PENDING");

        // Link user if registered
        Optional<User> userOpt = userRepository.findByEmail(report.getCitizenEmail());
        userOpt.ifPresent(u -> {
            report.setCitizenId(u.getId());
            if (report.getCitizenName() == null || report.getCitizenName().isBlank()) {
                report.setCitizenName(u.getFullName());
            }
            if (report.getCitizenPhone() == null || report.getCitizenPhone().isBlank()) {
                report.setCitizenPhone(u.getPhone());
            }
        });

        WasteReport saved = reportRepository.save(report);

        auditService.log(
                "WASTE_REPORT",
                saved.getReportId(),
                "REPORT_SUBMITTED",
                null,
                "PENDING",
                saved.getCitizenEmail(),
                "New waste report created in area: " + saved.getAreaName() + ", category: " + saved.getWasteCategory()
        );

        return saved;
    }

    public List<WasteReport> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<WasteReport> getReportsByCitizen(String email) {
        return reportRepository.findByCitizenEmailOrderByCreatedAtDesc(email.trim().toLowerCase());
    }

    public WasteReport getReportById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Waste report not found with ID: " + id));
    }

    @Transactional
    public WasteReport updateStatus(Long id, String newStatus, String performedBy, String notes) {
        WasteReport report = getReportById(id);
        String oldStatus = report.getStatus();
        report.setStatus(newStatus);
        WasteReport saved = reportRepository.save(report);

        auditService.log(
                "WASTE_REPORT",
                saved.getReportId(),
                "STATUS_UPDATED",
                oldStatus,
                newStatus,
                performedBy,
                notes != null ? notes : "Status changed from " + oldStatus + " to " + newStatus
        );

        return saved;
    }
}
