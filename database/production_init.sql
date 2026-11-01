-- ============================================================================
-- Smart City Waste Collection Optimization & Recycling Management System
-- Production Database Initialization Script (MySQL 8.0 / MariaDB 10.4+)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS smart_waste_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_waste_db;

-- 1. USERS & ACTORS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'CITIZEN', -- 'ADMIN', 'DRIVER', 'CITIZEN'
    phone VARCHAR(20),
    area_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CITIZEN WASTE REPORTS TABLE
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
    assigned_driver_id BIGINT NULL,
    CONSTRAINT fk_truck_driver FOREIGN KEY (assigned_driver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_truck_status (operational_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. COLLECTION TRIPS (Combined trip associating roadside report and nearby bins)
CREATE TABLE IF NOT EXISTS collection_trips (
    trip_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_code VARCHAR(50) NOT NULL UNIQUE,
    truck_id BIGINT NOT NULL,
    driver_id BIGINT NULL,
    primary_report_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    planned_roadside_kg DECIMAL(10, 2) NOT NULL,
    planned_bins_kg DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    planned_total_load_kg DECIMAL(10, 2) NOT NULL,
    actual_collected_kg DECIMAL(10, 2) NULL,
    collection_notes TEXT NULL,
    collection_photo_url VARCHAR(500) NULL,
    dispatched_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_trip_truck FOREIGN KEY (truck_id) REFERENCES trucks(truck_id),
    CONSTRAINT fk_trip_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_trip_report FOREIGN KEY (primary_report_id) REFERENCES waste_reports(report_id),
    INDEX idx_trip_status (status),
    INDEX idx_trip_driver (driver_id)
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
    accepted_categories VARCHAR(255) NOT NULL,
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
    driver_id BIGINT NULL,
    waste_category VARCHAR(50) NOT NULL,
    dispatched_quantity_kg DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'READY_FOR_DISPATCH',
    evidence_photo_url VARCHAR(500) NULL,
    received_weight_kg DECIMAL(10, 2) NULL,
    verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    verified_by VARCHAR(100) NULL,
    verified_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    delivery_notes TEXT NULL,
    dispatched_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    receipt_confirmed_at TIMESTAMP NULL,
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

-- ============================================================================
-- INITIAL SEED DATA
-- ============================================================================

-- 1. SEED USERS (Admin, Citizens, Drivers)
INSERT INTO users (id, full_name, email, password_hash, role, phone, area_name) VALUES
(1, 'Municipal Administrator', 'admin@smartcity.gov', 'Admin@123', 'ADMIN', '0424-2223344', 'Perundurai HQ'),
(2, 'Pravin Kumar', 'pravin@gmail.com', 'Citizen@123', 'CITIZEN', '9876543210', 'Perundurai'),
(3, 'Karthik Raja', 'karthik@gmail.com', 'Citizen@123', 'CITIZEN', '9842100233', 'Thindal'),
(4, 'Murugan S (Driver)', 'driver@smartcity.gov', 'Driver@123', 'DRIVER', '9842112233', 'Perundurai Fleet Depot'),
(5, 'Ramesh K (Driver)', 'driver2@smartcity.gov', 'Driver@123', 'DRIVER', '9842112244', 'Erode Central Depot')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 2. SEED MUNICIPAL DUSTBINS
INSERT INTO dust_bins (bin_id, bin_code, area_id, area_name, latitude, longitude, bin_capacity_kg, current_fill_kg, waste_category, operational_status, collection_status) VALUES
(1, 'BIN-001', 'ERD-PER-01', 'Perundurai Old Bus Stand', 11.2756000, 77.5833000, 100.00, 85.00, 'Plastic', 'ACTIVE', 'IDLE'),
(2, 'BIN-002', 'ERD-PER-02', 'Perundurai Weekly Market', 11.2782000, 77.5865000, 120.00, 95.00, 'Organic', 'ACTIVE', 'IDLE'),
(3, 'BIN-003', 'ERD-PER-03', 'Perundurai GH Junction', 11.2731000, 77.5810000, 100.00, 45.00, 'Mixed', 'ACTIVE', 'IDLE'),
(4, 'BIN-004', 'ERD-PER-04', 'Perundurai Taluk Office Road', 11.2795000, 77.5790000, 100.00, 80.00, 'Plastic', 'ACTIVE', 'IDLE'),
(5, 'BIN-005', 'ERD-THN-01', 'Thindal Ring Road Corner', 11.3142000, 77.6749000, 150.00, 125.00, 'Plastic', 'ACTIVE', 'IDLE'),
(6, 'BIN-006', 'ERD-THN-02', 'Thindal Murugan Temple Road', 11.3180000, 77.6800000, 120.00, 90.00, 'Organic', 'ACTIVE', 'IDLE'),
(7, 'BIN-007', 'ERD-SOL-01', 'Solar Transport Nagar Gate 1', 11.3021880, 77.7277390, 200.00, 160.00, 'Mixed', 'ACTIVE', 'IDLE'),
(8, 'BIN-008', 'ERD-SIP-01', 'Perundurai SIPCOT Phase 1 Entrance', 11.2825000, 77.5920000, 250.00, 190.00, 'Plastic', 'ACTIVE', 'IDLE')
ON DUPLICATE KEY UPDATE bin_code=VALUES(bin_code);

-- 3. SEED TRUCKS
INSERT INTO trucks (truck_id, truck_code, registration_number, truck_type, total_capacity_kg, current_load_kg, assigned_area, operational_status, current_latitude, current_longitude, assigned_driver_id) VALUES
(1, 'TRK-01', 'TN-33-AX-1001', 'Hydraulic Compactor (Heavy)', 1000.00, 0.00, 'Perundurai Zone 1', 'AVAILABLE', 11.2740000, 77.5800000, 4),
(2, 'TRK-02', 'TN-33-BY-2045', 'Standard Bin Tipper (Medium)', 500.00, 0.00, 'Perundurai Central', 'AVAILABLE', 11.2760000, 77.5850000, 5),
(3, 'TRK-03', 'TN-33-CZ-3088', 'Mini Tipper (Light Urban)', 250.00, 0.00, 'Perundurai North', 'AVAILABLE', 11.2770000, 77.5820000, 4),
(4, 'TRK-04', 'TN-33-DA-4112', 'Heavy Commercial Collector', 1500.00, 0.00, 'Erode Regional', 'AVAILABLE', 11.3100000, 77.6700000, 5)
ON DUPLICATE KEY UPDATE truck_code=VALUES(truck_code);

-- 4. SEED RECYCLING FACILITIES
INSERT INTO recycling_facilities (facility_id, facility_code, facility_name, facility_type, address, latitude, longitude, accepted_categories, daily_capacity_kg, current_intake_kg, operational_status, contact_person, contact_phone, contact_email) VALUES
(1, 'FAC-01', 'GreenEarth Polymer Recovery Facility', 'Plastic & Polymer Recycling Plant', 'Plot 44, SIPCOT Industrial Park, Perundurai', 11.2890000, 77.6015000, 'Plastic,Dry Waste', 5000.00, 1200.00, 'ACTIVE', 'R. Balasubramaniam', '04294-234567', 'contact@greenearthplastics.org'),
(2, 'FAC-02', 'EcoBio Municipal Composting Plant', 'Aerobic Composting & Bio-CNG Facility', 'Survey 112, Thindal Agro Belt, Erode', 11.3250000, 77.6650000, 'Organic,Food Waste', 8000.00, 3400.00, 'ACTIVE', 'Dr. M. Senthil Kumar', '0424-2556789', 'admin@ecobiocompost.in'),
(3, 'FAC-03', 'Apex Metal & E-Waste Processing Center', 'WEEE & Scrap Recycling Unit', 'Phase II, SIDCO Industrial Complex, Erode', 11.3380000, 77.7050000, 'E-Waste / Metal,Electronics,Metal', 3000.00, 850.00, 'ACTIVE', 'P. Anandhan', '0424-2401122', 'dispatch@apexmetalrecycling.com'),
(4, 'FAC-04', 'Kaveri Construction Debris & Inert Yard', 'C&D Waste Crusher & Aggregate Depot', 'Bypass Road, Chithode Junction, Erode', 11.3650000, 77.6910000, 'Construction / Debris,Inert,Mixed', 10000.00, 2100.00, 'ACTIVE', 'K. Rajendran', '0424-2339900', 'operations@kaveriupcycling.org')
ON DUPLICATE KEY UPDATE facility_code=VALUES(facility_code);

-- 5. SEED INITIAL CITIZEN WASTE REPORTS
INSERT INTO waste_reports (report_id, citizen_id, citizen_email, citizen_name, citizen_phone, waste_category, description, photo_url, latitude, longitude, address, area_name, estimated_quantity_kg, status) VALUES
(1, 2, 'pravin@gmail.com', 'Pravin Kumar', '9876543210', 'Plastic', 'Bulk illegal plastic dumping near Old Bus Stand north corner.', NULL, 11.2758000, 77.5835000, 'North Corner, Old Bus Stand, Perundurai', 'Perundurai', 45.00, 'PENDING'),
(2, 2, 'pravin@gmail.com', 'Pravin Kumar', '9876543210', 'Organic', 'Rotting vegetable heaps left after morning weekly vegetable market.', NULL, 11.2785000, 77.5862000, 'Market Bazaar Lane, Perundurai', 'Perundurai', 60.00, 'PENDING'),
(3, 3, 'karthik@gmail.com', 'Karthik Raja', '9842100233', 'Plastic', 'Discarded beverage plastic bottles and packaging near highway bridge.', NULL, 11.3145000, 77.6745000, 'Highway Underpass, Thindal Ring Road', 'Thindal', 50.00, 'PENDING')
ON DUPLICATE KEY UPDATE report_id=VALUES(report_id);
