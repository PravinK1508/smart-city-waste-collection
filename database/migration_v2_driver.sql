-- ============================================================================
-- Migration: Add DRIVER role, driver-to-truck association, and driver-to-trip linkage
-- ============================================================================

USE smart_waste_db;

-- 1. Insert Driver accounts if they don't already exist
INSERT INTO users (full_name, email, password_hash, role, phone, area_name)
SELECT 'Murugan S (Driver)', 'driver@smartcity.gov', 'Driver@123', 'DRIVER', '9842112233', 'Perundurai Fleet Depot'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver@smartcity.gov');

INSERT INTO users (full_name, email, password_hash, role, phone, area_name)
SELECT 'Ramesh K (Driver)', 'driver2@smartcity.gov', 'Driver@123', 'DRIVER', '9842112244', 'Erode Central Depot'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver2@smartcity.gov');

-- 2. Add assigned_driver_id to trucks
SET @dbname = DATABASE();
SET @tablename = "trucks";
SET @columnname = "assigned_driver_id";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE trucks ADD COLUMN assigned_driver_id BIGINT NULL, ADD CONSTRAINT fk_truck_driver FOREIGN KEY (assigned_driver_id) REFERENCES users(id) ON DELETE SET NULL"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 3. Add driver_id to collection_trips
SET @columnname = "driver_id";
SET @tablename = "collection_trips";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  "ALTER TABLE collection_trips ADD COLUMN driver_id BIGINT NULL, ADD CONSTRAINT fk_trip_driver FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL, ADD INDEX idx_trip_driver (driver_id)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 4. Assign drivers to trucks
UPDATE trucks SET assigned_driver_id = (SELECT id FROM users WHERE email = 'driver@smartcity.gov' LIMIT 1) WHERE truck_code IN ('TRK-01', 'TRK-03');
UPDATE trucks SET assigned_driver_id = (SELECT id FROM users WHERE email = 'driver2@smartcity.gov' LIMIT 1) WHERE truck_code IN ('TRK-02', 'TRK-04');

-- 5. Backfill driver_id on existing collection_trips
UPDATE collection_trips ct
JOIN trucks t ON ct.truck_id = t.truck_id
SET ct.driver_id = t.assigned_driver_id
WHERE ct.driver_id IS NULL;
