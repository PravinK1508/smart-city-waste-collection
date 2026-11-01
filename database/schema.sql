-- ============================================================================
-- Smart City Waste Collection Optimization & Recycling Management System
-- Database Schema: smart_waste_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS smart_waste_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_waste_db;


CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CITIZEN',
    phone VARCHAR(20),
    area_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS waste_reports (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    citizen_id BIGINT NULL,
    citizen_email VARCHAR(100) NOT NULL,
    citizen_name VARCHAR(100),
    citizen_phone VARCHAR(20),
    waste_category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    photo_url VARCHAR(255),
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    address VARCHAR(255),
    area_name VARCHAR(100) NOT NULL,
    estimated_quantity_kg DECIMAL(10, 2) NOT NULL DEFAULT 40.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_citizen FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_report_status (status),
    INDEX idx_report_area (area_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. MUNICIPAL DUSTBINS (Fixed municipal collection points)
CREATE TABLE IF NOT EXISTS dust_bins (
    bin_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bin_code VARCHAR(50) NOT NULL UNIQUE,
    area_id VARCHAR(20) NOT NULL,
    area_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    bin_capacity_kg DECIMAL(10, 2) NOT NULL,
    current_fill_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    waste_category VARCHAR(50) NOT NULL DEFAULT 'Mixed',
    operational_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    collection_status VARCHAR(20) NOT NULL DEFAULT 'IDLE',
    last_emptied_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bin_area (area_name),
    INDEX idx_bin_operational (operational_status),
    INDEX idx_bin_collection (collection_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TRUCKS (Municipal collection fleet)
CREATE TABLE IF NOT EXISTS trucks (
    truck_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    truck_code VARCHAR(50) NOT NULL UNIQUE,
    registration_number VARCHAR(50) NOT NULL,
    truck_type VARCHAR(50) NOT NULL,
    total_capacity_kg DECIMAL(10, 2) NOT NULL,
    current_load_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    assigned_area VARCHAR(100),
    operational_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    current_latitude DECIMAL(10, 7) NULL,
    current_longitude DECIMAL(10, 7) NULL,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_truck_status (operational_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. COLLECTION TRIPS (Combined trip associating roadside report and nearby bins)
CREATE TABLE IF NOT EXISTS collection_trips (
    trip_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_code VARCHAR(50) NOT NULL UNIQUE,
    truck_id BIGINT NOT NULL,
    primary_report_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    planned_roadside_kg DECIMAL(10, 2) NOT NULL,
    planned_bins_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    planned_total_load_kg DECIMAL(10, 2) NOT NULL,
    actual_collected_kg DECIMAL(10, 2) NULL,
    collection_notes TEXT NULL,
    dispatched_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_trip_truck FOREIGN KEY (truck_id) REFERENCES trucks(truck_id),
    CONSTRAINT fk_trip_report FOREIGN KEY (primary_report_id) REFERENCES waste_reports(report_id),
    INDEX idx_trip_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. TRIP DUSTBINS (Associating multiple selected bins with a trip)
CREATE TABLE IF NOT EXISTS trip_bins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    bin_id BIGINT NOT NULL,
    planned_kg DECIMAL(10, 2) NOT NULL,
    actual_collected_kg DECIMAL(10, 2) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    collected_at TIMESTAMP NULL,
    CONSTRAINT fk_tripbin_trip FOREIGN KEY (trip_id) REFERENCES collection_trips(trip_id) ON DELETE CASCADE,
    CONSTRAINT fk_tripbin_bin FOREIGN KEY (bin_id) REFERENCES dust_bins(bin_id),
    CONSTRAINT uq_trip_bin UNIQUE (trip_id, bin_id),
    INDEX idx_tripbin_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. TRIP STOPS (Ordered sequence of stops in the combined collection route)
CREATE TABLE IF NOT EXISTS trip_stops (
    stop_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    stop_order INT NOT NULL,
    stop_type VARCHAR(30) NOT NULL, -- 'ROADSIDE_REPORT' or 'MUNICIPAL_BIN'
    reference_id BIGINT NOT NULL,    -- report_id or bin_id
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    planned_kg DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    actual_collected_kg DECIMAL(10, 2) NULL,
    completed_at TIMESTAMP NULL,
    CONSTRAINT fk_tripstop_trip FOREIGN KEY (trip_id) REFERENCES collection_trips(trip_id) ON DELETE CASCADE,
    INDEX idx_tripstop_order (trip_id, stop_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. RECYCLING FACILITIES (Registered destination processing units)
CREATE TABLE IF NOT EXISTS recycling_facilities (
    facility_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    facility_code VARCHAR(50) NOT NULL UNIQUE,
    facility_name VARCHAR(150) NOT NULL,
    facility_type VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    accepted_categories VARCHAR(255) NOT NULL, -- Comma-separated list of accepted waste types
    daily_capacity_kg DECIMAL(10, 2) NOT NULL,
    current_intake_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    operational_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    contact_person VARCHAR(100),
    contact_phone VARCHAR(30),
    contact_email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_facility_operational (operational_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. RECYCLING DISPATCHES (Tracking transfer from collection trip to recycling facility)
CREATE TABLE IF NOT EXISTS recycling_dispatches (
    dispatch_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispatch_code VARCHAR(50) NOT NULL UNIQUE,
    trip_id BIGINT NOT NULL,
    facility_id BIGINT NOT NULL,
    waste_category VARCHAR(50) NOT NULL,
    dispatched_quantity_kg DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'READY_FOR_DISPATCH',
    dispatched_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    receipt_confirmed_at TIMESTAMP NULL,
    received_weight_kg DECIMAL(10, 2) NULL,
    receipt_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_recdisp_trip FOREIGN KEY (trip_id) REFERENCES collection_trips(trip_id),
    CONSTRAINT fk_recdisp_facility FOREIGN KEY (facility_id) REFERENCES recycling_facilities(facility_id),
    INDEX idx_recdisp_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. AUDIT & STATUS LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    performed_by VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
