-- ============================================================================
-- Migration V3: Add Delivery Evidence & Admin Verification Fields
-- ============================================================================

USE smart_waste_db;

ALTER TABLE recycling_dispatches
    ADD COLUMN IF NOT EXISTS evidence_photo_url VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS driver_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS verified_by VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL,
    ADD COLUMN IF NOT EXISTS delivery_notes TEXT NULL;
