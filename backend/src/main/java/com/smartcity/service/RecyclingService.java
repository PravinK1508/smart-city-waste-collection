package com.smartcity.service;

import com.smartcity.dto.DeliveryEvidenceRequest;
import com.smartcity.dto.DeliveryVerificationRequest;
import com.smartcity.dto.RecyclingDispatchRequest;
import com.smartcity.dto.RecyclingStatusUpdateRequest;
import com.smartcity.model.*;
import com.smartcity.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class RecyclingService {

    private final RecyclingFacilityRepository facilityRepository;
    private final RecyclingDispatchRepository dispatchRepository;
    private final CollectionTripRepository tripRepository;
    private final WasteReportRepository reportRepository;
    private final TruckRepository truckRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public RecyclingService(RecyclingFacilityRepository facilityRepository,
                            RecyclingDispatchRepository dispatchRepository,
                            CollectionTripRepository tripRepository,
                            WasteReportRepository reportRepository,
                            TruckRepository truckRepository,
                            UserRepository userRepository,
                            AuditService auditService) {
        this.facilityRepository = facilityRepository;
        this.dispatchRepository = dispatchRepository;
        this.tripRepository = tripRepository;
        this.reportRepository = reportRepository;
        this.truckRepository = truckRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    public List<RecyclingFacility> getAllFacilities() {
        return facilityRepository.findAllByOrderByFacilityNameAsc();
    }

    public RecyclingFacility getFacilityById(Long id) {
        return facilityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Recycling facility not found with ID: " + id));
    }

    private RecyclingDispatch enrichDispatch(RecyclingDispatch dispatch) {
        if (dispatch == null) return null;
        if (dispatch.getFacilityId() != null) {
            facilityRepository.findById(dispatch.getFacilityId()).ifPresent(fac -> {
                dispatch.setFacilityName(fac.getFacilityName());
                dispatch.setFacilityAddress(fac.getAddress());
                dispatch.setFacilityType(fac.getFacilityType());
                dispatch.setContactPerson(fac.getContactPerson());
                dispatch.setContactPhone(fac.getContactPhone());
            });
        }
        if (dispatch.getTripId() != null) {
            tripRepository.findById(dispatch.getTripId()).ifPresent(trip -> {
                dispatch.setReportId(trip.getPrimaryReportId());
                if (trip.getTruckId() != null) {
                    truckRepository.findById(trip.getTruckId()).ifPresent(trk -> {
                        dispatch.setTruckCode(trk.getTruckCode());
                    });
                }
                if (trip.getDriverId() != null) {
                    userRepository.findById(trip.getDriverId()).ifPresent(u -> {
                        dispatch.setDriverName(u.getFullName());
                    });
                }
            });
        }
        return dispatch;
    }

    public List<RecyclingDispatch> getAllDispatches() {
        List<RecyclingDispatch> list = dispatchRepository.findAllByOrderByCreatedAtDesc();
        list.forEach(this::enrichDispatch);
        return list;
    }

    public RecyclingDispatch getDispatchById(Long id) {
        RecyclingDispatch dispatch = dispatchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Dispatch not found with ID: " + id));
        return enrichDispatch(dispatch);
    }

    public RecyclingDispatch getDispatchByTripId(Long tripId) {
        List<RecyclingDispatch> list = dispatchRepository.findByTripId(tripId);
        return list.isEmpty() ? null : enrichDispatch(list.get(0));
    }

    /**
     * Recommends registered recycling facilities matching the trip's collected waste category.
     */
    public List<RecyclingFacility> getRecommendedFacilitiesForTrip(Long tripId) {
        CollectionTrip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Trip not found with ID: " + tripId));
        WasteReport report = reportRepository.findById(trip.getPrimaryReportId())
                .orElseThrow(() -> new IllegalArgumentException("Report not found for trip: " + tripId));

        String category = report.getWasteCategory();
        List<RecyclingFacility> all = facilityRepository.findAll();
        List<RecyclingFacility> matching = new ArrayList<>();

        for (RecyclingFacility fac : all) {
            if ("ACTIVE".equalsIgnoreCase(fac.getOperationalStatus()) && fac.acceptsCategory(category)) {
                matching.add(fac);
            }
        }

        return matching;
    }

    /**
     * Dispatches collected waste to a registered recycling destination.
     */
    @Transactional(rollbackFor = Exception.class)
    public RecyclingDispatch createDispatch(RecyclingDispatchRequest req, String performedBy) {
        CollectionTrip trip = tripRepository.findById(req.getTripId())
                .orElseThrow(() -> new IllegalArgumentException("Trip not found: " + req.getTripId()));

        if (dispatchRepository.existsByTripId(trip.getTripId())) {
            throw new IllegalStateException("Recycling destination has already been assigned to this collection trip (Trip #" + trip.getTripId() + ").");
        }

        if ("CANCELLED".equalsIgnoreCase(trip.getStatus()) || "CLOSED".equalsIgnoreCase(trip.getStatus())) {
            throw new IllegalStateException("Trip is closed or cancelled. Current status: " + trip.getStatus());
        }

        RecyclingFacility facility = facilityRepository.findById(req.getFacilityId())
                .orElseThrow(() -> new IllegalArgumentException("Facility not found: " + req.getFacilityId()));

        WasteReport report = reportRepository.findById(trip.getPrimaryReportId()).orElseThrow();

        if (!facility.acceptsCategory(report.getWasteCategory())) {
            throw new IllegalArgumentException("Facility " + facility.getFacilityName()
                    + " does not accept waste category: " + report.getWasteCategory()
                    + " (Accepted: " + facility.getAcceptedCategories() + ")");
        }

        BigDecimal qty = req.getDispatchedQuantityKg();
        if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
            qty = trip.getActualCollectedKg() != null ? trip.getActualCollectedKg() : trip.getPlannedTotalLoadKg();
        }

        String dispatchCode = String.format("DISP-%s-T%d", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmssSSS")), trip.getTripId());
        RecyclingDispatch dispatch = new RecyclingDispatch();
        dispatch.setDispatchCode(dispatchCode);
        dispatch.setTripId(trip.getTripId());
        dispatch.setFacilityId(facility.getFacilityId());
        dispatch.setWasteCategory(report.getWasteCategory());
        dispatch.setDispatchedQuantityKg(qty);
        dispatch.setStatus("DISPATCH_PLANNED");
        dispatch.setReceiptNotes(req.getNotes());
        if (trip.getDriverId() != null) {
            dispatch.setDriverId(trip.getDriverId());
        }

        RecyclingDispatch saved = dispatchRepository.save(dispatch);

        if ("COLLECTION_COMPLETED".equalsIgnoreCase(trip.getStatus())) {
            trip.setStatus("READY_FOR_RECYCLING");
            tripRepository.save(trip);
        }

        auditService.log(
                "RECYCLING_DISPATCH",
                saved.getDispatchId(),
                "DISPATCH_PLANNED",
                null,
                "DISPATCH_PLANNED",
                performedBy,
                "Dispatch planned for " + qty + " kg of " + report.getWasteCategory()
                        + " to " + facility.getFacilityName()
        );

        return enrichDispatch(saved);
    }

    /**
     * Updates dispatch lifecycle status (DISPATCHED, DELIVERED, RECEIPT_CONFIRMED).
     */
    @Transactional(rollbackFor = Exception.class)
    public RecyclingDispatch updateDispatchStatus(Long dispatchId, RecyclingStatusUpdateRequest req, String performedBy) {
        RecyclingDispatch dispatch = getDispatchById(dispatchId);
        String oldStatus = dispatch.getStatus();
        String targetStatus = req.getStatus();

        if (targetStatus == null) {
            throw new IllegalArgumentException("Target status is required");
        }

        // Prevent modifying already closed/confirmed dispatches
        if ("RECEIPT_CONFIRMED".equalsIgnoreCase(dispatch.getStatus()) || "APPROVED".equalsIgnoreCase(dispatch.getVerificationStatus())) {
            throw new IllegalStateException("Dispatch " + dispatch.getDispatchCode() + " has already been verified and closed. No further status changes permitted.");
        }

        switch (targetStatus.toUpperCase()) {
            case "DISPATCHED" -> {
                dispatch.setStatus("DISPATCHED");
                dispatch.setDispatchedAt(LocalDateTime.now());
            }
            case "DELIVERED" -> {
                // Do not let an intermediate Mark as Delivered action overwrite/bypass pending verification
                if ("PENDING_VERIFICATION".equalsIgnoreCase(dispatch.getStatus())) {
                    throw new IllegalStateException("Driver has already submitted delivery evidence (Pending Verification). Please review and verify evidence.");
                }
                dispatch.setStatus("DELIVERED");
                dispatch.setDeliveredAt(LocalDateTime.now());
                if (req.getReceivedWeightKg() != null) {
                    dispatch.setReceivedWeightKg(req.getReceivedWeightKg());
                }
                if (req.getReceiptNotes() != null) {
                    dispatch.setReceiptNotes(req.getReceiptNotes());
                }

                // Update collection trip to DELIVERED_TO_FACILITY without closing it
                CollectionTrip trip = tripRepository.findById(dispatch.getTripId()).orElseThrow();
                trip.setStatus("DELIVERED_TO_FACILITY");
                tripRepository.save(trip);
            }
            case "RECEIPT_CONFIRMED" -> {
                // Only Admin's final Receipt Verification action changes the recycling dispatch, trip and original citizen report to CLOSED
                DeliveryVerificationRequest verifyReq = new DeliveryVerificationRequest();
                verifyReq.setAction("APPROVE");
                verifyReq.setVerifiedWeightKg(req.getReceivedWeightKg());
                verifyReq.setNotes(req.getReceiptNotes());
                return verifyDelivery(dispatchId, verifyReq, performedBy != null ? performedBy : "Admin");
            }
            default -> throw new IllegalArgumentException("Unknown status transition: " + targetStatus);
        }

        RecyclingDispatch saved = dispatchRepository.save(dispatch);

        auditService.log(
                "RECYCLING_DISPATCH",
                saved.getDispatchId(),
                "STATUS_UPDATED",
                oldStatus,
                saved.getStatus(),
                performedBy,
                "Recycling dispatch " + saved.getDispatchCode() + " status updated to " + saved.getStatus()
        );

        return enrichDispatch(saved);
    }

    /**
     * Driver submits delivery evidence photo, delivered weight, and notes for admin verification.
     */
    @Transactional(rollbackFor = Exception.class)
    public RecyclingDispatch submitDeliveryEvidence(Long dispatchId, DeliveryEvidenceRequest req, String performedBy) {
        RecyclingDispatch dispatch = getDispatchById(dispatchId);

        // Prevent duplicate completion or re-submission on closed dispatches
        if ("RECEIPT_CONFIRMED".equalsIgnoreCase(dispatch.getStatus()) || "APPROVED".equalsIgnoreCase(dispatch.getVerificationStatus())) {
            throw new IllegalStateException("Delivery for dispatch " + dispatch.getDispatchCode() + " has already been verified and closed.");
        }

        if (req.getEvidencePhotoUrl() == null || req.getEvidencePhotoUrl().isBlank()) {
            throw new IllegalArgumentException("Delivery evidence photo is required for verification.");
        }

        BigDecimal delWeight = req.getDeliveredWeightKg();
        if (delWeight == null || delWeight.compareTo(BigDecimal.ZERO) <= 0) {
            delWeight = dispatch.getDispatchedQuantityKg();
        }

        dispatch.setEvidencePhotoUrl(req.getEvidencePhotoUrl());
        dispatch.setReceivedWeightKg(delWeight);
        dispatch.setDeliveryNotes(req.getDeliveryNotes());
        if (req.getDriverId() != null) {
            dispatch.setDriverId(req.getDriverId());
        }
        dispatch.setDeliveredAt(LocalDateTime.now());
        dispatch.setStatus("PENDING_VERIFICATION");
        dispatch.setVerificationStatus("PENDING");
        dispatch.setRejectionReason(null); // Clear previous rejection if re-uploading

        CollectionTrip trip = tripRepository.findById(dispatch.getTripId()).orElseThrow();
        trip.setStatus("PENDING_ADMIN_VERIFICATION");
        tripRepository.save(trip);

        RecyclingDispatch saved = dispatchRepository.save(dispatch);

        auditService.log(
                "RECYCLING_DISPATCH",
                saved.getDispatchId(),
                "DELIVERY_EVIDENCE_SUBMITTED",
                "DISPATCH_PLANNED",
                "PENDING_VERIFICATION",
                performedBy != null ? performedBy : "Driver",
                "Delivery evidence submitted by driver. Payload: " + delWeight + " kg. Awaiting Admin verification."
        );

        return enrichDispatch(saved);
    }

    /**
     * Admin verifies delivery evidence: APPROVE closes workflow; REJECT requests re-upload.
     */
    @Transactional(rollbackFor = Exception.class)
    public RecyclingDispatch verifyDelivery(Long dispatchId, DeliveryVerificationRequest req, String adminName) {
        RecyclingDispatch dispatch = getDispatchById(dispatchId);

        // Prevent duplicate verification actions
        if ("APPROVED".equalsIgnoreCase(dispatch.getVerificationStatus()) || "RECEIPT_CONFIRMED".equalsIgnoreCase(dispatch.getStatus())) {
            throw new IllegalStateException("Delivery for dispatch " + dispatch.getDispatchCode() + " has already been verified and closed.");
        }

        if (req.getAction() == null) {
            throw new IllegalArgumentException("Verification action is required (APPROVE or REJECT)");
        }

        String action = req.getAction().trim().toUpperCase();

        if ("APPROVE".equals(action)) {
            dispatch.setVerificationStatus("APPROVED");
            dispatch.setStatus("RECEIPT_CONFIRMED");
            dispatch.setVerifiedBy(adminName);
            dispatch.setVerifiedAt(LocalDateTime.now());
            dispatch.setReceiptConfirmedAt(LocalDateTime.now());

            if (req.getVerifiedWeightKg() != null && req.getVerifiedWeightKg().compareTo(BigDecimal.ZERO) > 0) {
                dispatch.setReceivedWeightKg(req.getVerifiedWeightKg());
            }
            if (req.getNotes() != null && !req.getNotes().isBlank()) {
                dispatch.setReceiptNotes(req.getNotes());
            }

            // Update facility intake
            RecyclingFacility facility = facilityRepository.findById(dispatch.getFacilityId()).orElseThrow();
            BigDecimal currentIntake = facility.getCurrentIntakeKg() != null ? facility.getCurrentIntakeKg() : BigDecimal.ZERO;
            facility.setCurrentIntakeKg(currentIntake.add(dispatch.getReceivedWeightKg()));
            facilityRepository.save(facility);

            // Close collection trip
            CollectionTrip trip = tripRepository.findById(dispatch.getTripId()).orElseThrow();
            trip.setStatus("CLOSED");
            tripRepository.save(trip);

            // Close citizen waste report
            WasteReport report = reportRepository.findById(trip.getPrimaryReportId()).orElseThrow();
            report.setStatus("CLOSED");
            reportRepository.save(report);

            // Free truck
            Truck truck = truckRepository.findById(trip.getTruckId()).orElseThrow();
            truck.setCurrentLoadKg(BigDecimal.ZERO);
            truck.setOperationalStatus("AVAILABLE");
            truckRepository.save(truck);

            auditService.log(
                    "RECYCLING_DISPATCH",
                    dispatch.getDispatchId(),
                    "DELIVERY_APPROVED",
                    "PENDING_VERIFICATION",
                    "RECEIPT_CONFIRMED",
                    adminName,
                    "Admin approved delivery evidence. Verified weight: " + dispatch.getReceivedWeightKg() + " kg. Workflow closed."
            );
        } else if ("REJECT".equals(action)) {
            if (req.getRejectionReason() == null || req.getRejectionReason().isBlank()) {
                throw new IllegalArgumentException("Rejection reason is required when requesting re-upload.");
            }

            dispatch.setVerificationStatus("REJECTED");
            dispatch.setStatus("REJECTED");
            dispatch.setVerifiedBy(adminName);
            dispatch.setVerifiedAt(LocalDateTime.now());
            dispatch.setRejectionReason(req.getRejectionReason());

            // Update collection trip to REUPLOAD_REQUESTED
            CollectionTrip trip = tripRepository.findById(dispatch.getTripId()).orElseThrow();
            trip.setStatus("REUPLOAD_REQUESTED");
            tripRepository.save(trip);

            // Keep citizen report open
            WasteReport report = reportRepository.findById(trip.getPrimaryReportId()).orElseThrow();
            report.setStatus("COLLECTION_COMPLETED");
            reportRepository.save(report);

            auditService.log(
                    "RECYCLING_DISPATCH",
                    dispatch.getDispatchId(),
                    "DELIVERY_REJECTED",
                    "PENDING_VERIFICATION",
                    "REJECTED",
                    adminName,
                    "Admin rejected delivery evidence: " + req.getRejectionReason()
            );
        } else {
            throw new IllegalArgumentException("Unknown verification action: " + req.getAction() + ". Must be APPROVE or REJECT.");
        }

        RecyclingDispatch saved = dispatchRepository.save(dispatch);
        return enrichDispatch(saved);
    }
}
