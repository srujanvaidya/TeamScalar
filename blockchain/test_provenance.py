"""
End-to-end test for the blockchain provenance system.

Run:
    python3 blockchain/test_provenance.py
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from blockchain.provenance import record_container_event, verify_event
from blockchain.hash_utils import compute_event_hash
from blockchain.config import POLYGONSCAN_TX_URL


def main():
    # ── Sample event from the spec ───────────────────────────────────────
    sample_event = {
        "container_id": "CONT-1024",
        "current_location": "Mumbai Port",
        "origin": "Shanghai",
        "destination": "Mumbai",
        "route": ["Shanghai", "Singapore", "Colombo", "Mumbai"],
        "scanned_by": "operator_42",
        "event_type": "PORT_ARRIVAL",
        "timestamp": "2026-08-22T12:30:00Z",
    }

    print("\n" + "=" * 60)
    print("🧪 BLOCKCHAIN PROVENANCE — END-TO-END TEST")
    print("=" * 60)

    # ── Step 1: Record the event ─────────────────────────────────────────
    print("\n📝 Recording container event...")
    record = record_container_event(sample_event)

    # ── Step 2: Display the result ───────────────────────────────────────
    print("\n" + "-" * 60)
    print("📋 COMPLETE SUPABASE RECORD:")
    print("-" * 60)
    for key, value in record.items():
        print(f"  {key:25s} : {value}")

    # ── Step 3: Verify PolygonScan link ──────────────────────────────────
    tx_hash = record.get("polygon_tx_hash")
    if tx_hash:
        url = f"{POLYGONSCAN_TX_URL}{tx_hash}"
        print(f"\n🔗 View on PolygonScan:")
        print(f"   {url}")

    # ── Step 4: Verify integrity ─────────────────────────────────────────
    print("\n" + "-" * 60)
    print("🔍 INTEGRITY VERIFICATION:")
    print("-" * 60)

    # Recompute hash from original data
    recomputed = compute_event_hash(sample_event)
    stored_hash = record.get("event_hash")
    print(f"  Stored hash:     {stored_hash}")
    print(f"  Recomputed hash: {recomputed}")
    print(f"  Hash match:      {'✅ YES' if stored_hash == recomputed else '❌ NO'}")

    # Full verification (including on-chain check)
    if stored_hash:
        verification = verify_event(stored_hash)
        print(f"\n  Supabase found:        {'✅' if verification['supabase_found'] else '❌'}")
        print(f"  Hash valid:            {'✅' if verification['hash_valid'] else '❌'}")
        print(f"  Blockchain verified:   {'✅' if verification['blockchain_verified'] else '❌'}")

    print(f"\n{'='*60}")
    print("🏁 TEST COMPLETE")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
