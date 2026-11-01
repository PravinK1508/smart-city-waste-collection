package com.smartcity.service;

import com.smartcity.model.AuditLog;
import com.smartcity.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String entityType, Long entityId, String action, String oldStatus, String newStatus, String performedBy, String details) {
        AuditLog audit = new AuditLog(entityType, entityId, action, oldStatus, newStatus, performedBy, details);
        auditLogRepository.save(audit);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc();
    }
}
