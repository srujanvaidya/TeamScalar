-- It looks like the 'scanned_by' column was accidentally dropped or missed 
-- when recreating/updating the table previously.

-- Run this to add it back:
ALTER TABLE container_events ADD COLUMN scanned_by TEXT NOT NULL DEFAULT 'unknown';
