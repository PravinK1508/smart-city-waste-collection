-- ============================================================================
-- Smart City Waste Collection Optimization & Recycling Management System
-- Initial Seed Data: smart_waste_db
-- ============================================================================

USE smart_waste_db;

-- 1. SEED USERS
INSERT INTO users (id, full_name, email, password_hash, role, phone, area_name) VALUES
(1, 'Municipal Administrator', 'admin@smartcity.gov', 'Admin@123', 'ADMIN', '0424-2223344', 'Perundurai HQ'),
(2, 'Pravin Kumar', 'pravin@gmail.com', 'Citizen@123', 'CITIZEN', '9876543210', 'Perundurai'),
(3, 'Karthik Raja', 'karthik@gmail.com', 'Citizen@123', 'CITIZEN', '9842100233', 'Thindal')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 2. SEED MUNICIPAL DUSTBINS (Realistic coordinates around Perundurai & Erode)
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

-- 3. SEED TRUCKS (With varied capacities, initial loads, and operational statuses)
INSERT INTO trucks (truck_id, truck_code, registration_number, truck_type, total_capacity_kg, current_load_kg, assigned_area, operational_status, current_latitude, current_longitude) VALUES
(1, 'TRK-01', 'TN-33-AX-1001', 'Hydraulic Compactor (Heavy)', 1000.00, 0.00, 'Perundurai Zone 1', 'AVAILABLE', 11.2740000, 77.5800000),
(2, 'TRK-02', 'TN-33-BY-2045', 'Standard Bin Tipper (Medium)', 500.00, 0.00, 'Perundurai Central', 'AVAILABLE', 11.2760000, 77.5850000),
(3, 'TRK-03', 'TN-33-CZ-3088', 'Mini Tipper (Light Urban)', 250.00, 50.00, 'Perundurai North', 'AVAILABLE', 11.2770000, 77.5820000),
(4, 'TRK-04', 'TN-33-DA-4112', 'Heavy Commercial Collector', 1500.00, 0.00, 'Erode Regional', 'AVAILABLE', 11.3100000, 77.6700000)
ON DUPLICATE KEY UPDATE truck_code=VALUES(truck_code);

-- 4. SEED RECYCLING FACILITIES (With verified waste category matching)
INSERT INTO recycling_facilities (facility_id, facility_code, facility_name, facility_type, address, latitude, longitude, accepted_categories, daily_capacity_kg, current_intake_kg, operational_status, contact_person, contact_phone, contact_email) VALUES
(1, 'FAC-01', 'GreenEarth Polymer Recovery Facility', 'Plastic & Polymer Recycling Plant', 'Plot 44, SIPCOT Industrial Park, Perundurai', 11.2890000, 77.6015000, 'Plastic,Dry Waste', 5000.00, 1200.00, 'ACTIVE', 'R. Balasubramaniam', '04294-234567', 'contact@greenearthplastics.org'),
(2, 'FAC-02', 'EcoBio Municipal Composting Plant', 'Aerobic Composting & Bio-CNG Facility', 'Survey 112, Thindal Agro Belt, Erode', 11.3250000, 77.6650000, 'Organic,Food Waste', 8000.00, 3400.00, 'ACTIVE', 'Dr. M. Senthil Kumar', '0424-2556789', 'admin@ecobiocompost.in'),
(3, 'FAC-03', 'Apex Metal & E-Waste Processing Center', 'WEEE & Scrap Recycling Unit', 'Phase II, SIDCO Industrial Complex, Erode', 11.3380000, 77.7050000, 'E-Waste / Metal,Electronics,Metal', 3000.00, 850.00, 'ACTIVE', 'P. Anandhan', '0424-2401122', 'dispatch@apexmetalrecycling.com'),
(4, 'FAC-04', 'Kaveri Construction Debris & Inert Yard', 'C&D Waste Crusher & Aggregate Depot', 'Bypass Road, Chithode Junction, Erode', 11.3650000, 77.6910000, 'Construction / Debris,Inert,Mixed', 10000.00, 2100.00, 'ACTIVE', 'K. Rajendran', '0424-2339900', 'operations@kaveriupcycling.org')
ON DUPLICATE KEY UPDATE facility_code=VALUES(facility_code);

-- 5. SEED INITIAL CITIZEN WASTE REPORTS (Active roadside dumps needing collection)
INSERT INTO waste_reports (report_id, citizen_id, citizen_email, citizen_name, citizen_phone, waste_category, description, photo_url, latitude, longitude, address, area_name, estimated_quantity_kg, status) VALUES
(1, 2, 'pravin@gmail.com', 'Pravin Kumar', '9876543210', 'Plastic', 'Bulk illegal plastic dumping near Old Bus Stand north corner.', '/uploads/reports/sample_plastic_dump1.jpg', 11.2758000, 77.5835000, 'North Corner, Old Bus Stand, Perundurai', 'Perundurai', 45.00, 'PENDING'),
(2, 2, 'pravin@gmail.com', 'Pravin Kumar', '9876543210', 'Organic', 'Rotting vegetable heaps left after morning weekly vegetable market.', '/uploads/reports/sample_organic_dump2.jpg', 11.2785000, 77.5862000, 'Market Bazaar Lane, Perundurai', 'Perundurai', 60.00, 'PENDING'),
(3, 3, 'karthik@gmail.com', 'Karthik Raja', '9842100233', 'Plastic', 'Discarded beverage plastic bottles and packaging near highway bridge.', '/uploads/reports/sample_plastic_dump3.jpg', 11.3145000, 77.6745000, 'Highway Underpass, Thindal Ring Road', 'Thindal', 50.00, 'PENDING')
ON DUPLICATE KEY UPDATE report_id=VALUES(report_id);
