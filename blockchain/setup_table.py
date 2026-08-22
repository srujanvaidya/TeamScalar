"""
Creates the container_events table in Supabase.

Run this once to set up the database schema:
    python3 blockchain/setup_table.py
"""

import sys
from pathlib import Path

# Add project root to path so we can import blockchain.config
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from blockchain.config import supabase


def create_container_events_table():
    """Create the container_events table using Supabase SQL."""

    sql = """
    CREATE TABLE IF NOT EXISTS container_events (
        id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        container_id    TEXT NOT NULL,
        current_location TEXT NOT NULL,
        origin          TEXT NOT NULL,
        destination     TEXT NOT NULL,
        route           JSONB NOT NULL,
        scanned_by      TEXT NOT NULL,
        event_type      TEXT NOT NULL,
        timestamp       TIMESTAMPTZ NOT NULL,
        event_hash      TEXT NOT NULL,
        polygon_tx_hash TEXT,
        blockchain_status TEXT NOT NULL DEFAULT 'PENDING'
            CHECK (blockchain_status IN ('PENDING', 'CONFIRMED', 'FAILED')),
        created_at      TIMESTAMPTZ DEFAULT now()
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
    """

    try:
        response = supabase.rpc("exec_sql", {"query": sql}).execute()
        print("✅ Table 'container_events' created successfully!")
        print(f"   Response: {response.data}")
    except Exception as e:
        error_msg = str(e)
        if "function" in error_msg.lower() and "does not exist" in error_msg.lower():
            print("⚠️  The exec_sql RPC function is not available.")
            print("   Please create the table manually in the Supabase SQL Editor.")
            print("\n   Copy and paste the following SQL:\n")
            print(sql)
            print("\n   Go to: https://supabase.com/dashboard → SQL Editor")
        else:
            print(f"❌ Error: {e}")
            print("\n   You may need to run this SQL manually in the Supabase SQL Editor:")
            print(sql)


if __name__ == "__main__":
    create_container_events_table()
