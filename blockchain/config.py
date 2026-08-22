"""
Configuration module — single source of truth for all clients and credentials.

Loads environment variables from .env and initializes:
- Web3 connection to Polygon Amoy
- Supabase client
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
from supabase import create_client, Client

# Load .env from project root (one level up from blockchain/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)

# ── Supabase ────────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("ERROR: SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Polygon Amoy ────────────────────────────────────────────────────────────
POLYGON_RPC_URL: str = os.getenv("POLYGON_RPC_URL", "https://polygon-amoy-bor-rpc.publicnode.com")
POLYGON_CHAIN_ID: int = int(os.getenv("POLYGON_CHAIN_ID", "80002"))

OWNER_PRIVATE_KEY: str = os.getenv("OWNER_PRIVATE_KEY", "")
OWNER_ADDRESS: str = os.getenv("OWNER_ADDRESS", "")

if not OWNER_PRIVATE_KEY or not OWNER_ADDRESS:
    sys.exit("ERROR: OWNER_PRIVATE_KEY and OWNER_ADDRESS must be set in .env")

OWNER_ADDRESS = Web3.to_checksum_address(OWNER_ADDRESS)

# Contract addresses (kept for reference, not used for anchoring)
TOKEN_ADDRESS: str = os.getenv("TOKEN_ADDRESS", "")
ESCROW_ADDRESS: str = os.getenv("ESCROW_ADDRESS", "")

# ── Web3 Client ─────────────────────────────────────────────────────────────
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC_URL))

# Polygon is a PoA chain — inject middleware to handle extra block fields
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

if not w3.is_connected():
    print(f"⚠️  WARNING: Cannot connect to Polygon Amoy at {POLYGON_RPC_URL}")
    print("   Blockchain anchoring will fail, but Supabase operations will still work.")

# ── PolygonScan ─────────────────────────────────────────────────────────────
POLYGONSCAN_TX_URL = "https://amoy.polygonscan.com/tx/"
