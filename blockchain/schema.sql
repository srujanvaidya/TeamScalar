-- ============================================================
-- Container Events Table for Blockchain Provenance
-- 
-- Copy this entire SQL and paste it into the Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS container_events (
    id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    container_id      TEXT NOT NULL,
    current_location  TEXT NOT NULL,
    origin            TEXT NOT NULL,
    destination       TEXT NOT NULL,
    route             JSONB NOT NULL,
    scanned_by        TEXT NOT NULL,
    event_type        TEXT NOT NULL,
    timestamp         TIMESTAMPTZ NOT NULL,
    event_hash        TEXT NOT NULL,
    polygon_tx_hash   TEXT,
    blockchain_status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK (blockchain_status IN ('PENDING', 'CONFIRMED', 'FAILED')),
    created_at        TIMESTAMPTZ DEFAULT now()
);

-- Index on container_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_container_events_container_id
    ON container_events(container_id);

-- Index on event_hash for integrity verification
CREATE INDEX IF NOT EXISTS idx_container_events_event_hash
    ON container_events(event_hash);

-- Index on blockchain_status for monitoring pending transactions
CREATE INDEX IF NOT EXISTS idx_container_events_blockchain_status
    ON container_events(blockchain_status);
