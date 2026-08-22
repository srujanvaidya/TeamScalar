-- Run this in the Supabase SQL Editor to add the ships table and update container_events

-- 1. Create the new ships table
CREATE TABLE IF NOT EXISTS ships (
    id TEXT PRIMARY KEY,       -- e.g., 'SHIP-001'
    name TEXT NOT NULL,        -- e.g., 'EVERGREEN'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add ship_id to container_events as a foreign key (handle if column already exists from previous steps)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='container_events' AND column_name='ship_id') THEN
        ALTER TABLE container_events ADD COLUMN ship_id TEXT REFERENCES ships(id);
    ELSE
        -- If it exists from the previous plan, just add the foreign key constraint
        -- We drop it first to be safe, then add the constraint
        ALTER TABLE container_events ADD CONSTRAINT fk_ship FOREIGN KEY (ship_id) REFERENCES ships(id);
    END IF;
END $$;

-- 3. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_container_events_ship_id ON container_events(ship_id);
