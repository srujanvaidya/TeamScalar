"""
Configuration module — single source of truth for all clients and credentials.

Loads environment variables from .env / frontend/.env.local and initializes:
- Web3 connection to Polygon Amoy
- Supabase client
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

try:
    from web3 import Web3
    from web3.middleware import ExtraDataToPOAMiddleware
except ImportError:
    for sp in [
        "/Users/tanmaykadam/miniconda3/lib/python3.13/site-packages",
        "/Library/Frameworks/Python.framework/Versions/3.13/lib/python3.13/site-packages"
    ]:
        if sp not in sys.path and os.path.exists(sp):
            sys.path.append(sp)
    from web3 import Web3
    from web3.middleware import ExtraDataToPOAMiddleware

try:
    from supabase import create_client, Client
except ImportError:
    for sp in [
        "/Users/tanmaykadam/miniconda3/lib/python3.13/site-packages",
        "/Library/Frameworks/Python.framework/Versions/3.13/lib/python3.13/site-packages"
    ]:
        if sp not in sys.path and os.path.exists(sp):
            sys.path.append(sp)
    from supabase import create_client, Client

# Load .env / .env.local from project root and frontend/
_root_dir = Path(__file__).resolve().parent.parent
load_dotenv(_root_dir / ".env")
load_dotenv(_root_dir / ".env.local")
load_dotenv(_root_dir / "frontend" / ".env.local")

# ── Supabase ────────────────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://palvwjxfasrwvstbccld.supabase.co")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Polygon Amoy ────────────────────────────────────────────────────────────
POLYGON_RPC_URL: str = os.getenv("POLYGON_RPC_URL", "https://polygon-amoy-bor-rpc.publicnode.com")
POLYGON_CHAIN_ID: int = int(os.getenv("POLYGON_CHAIN_ID", "80002"))

DEFAULT_TESTNET_KEY = "0x8f2a55949038a9610f50df23b588365c7673a610d4c4f3c5211da07d62073b9f"

OWNER_PRIVATE_KEY: str = os.getenv("OWNER_PRIVATE_KEY") or DEFAULT_TESTNET_KEY

if OWNER_PRIVATE_KEY:
    try:
        w3_temp = Web3()
        OWNER_ADDRESS = w3_temp.eth.account.from_key(OWNER_PRIVATE_KEY).address
    except Exception:
        OWNER_ADDRESS = "0x07FB424Ff100F9f3F7ad0A04E11c09ED9fca5ef6"
else:
    OWNER_ADDRESS = "0x07FB424Ff100F9f3F7ad0A04E11c09ED9fca5ef6"

OWNER_ADDRESS = Web3.to_checksum_address(OWNER_ADDRESS)

# Contract addresses
TOKEN_ADDRESS: str = os.getenv("TOKEN_ADDRESS", "")
ESCROW_ADDRESS: str = os.getenv("ESCROW_ADDRESS", "0xbe6E842E5CCD8752EF538B7874530F3bE702e8Ae")

# ── Web3 Client ─────────────────────────────────────────────────────────────
w3 = Web3(Web3.HTTPProvider(POLYGON_RPC_URL))

# Polygon is a PoA chain — inject middleware to handle extra block fields
w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

if not w3.is_connected():
    print(f"⚠️  WARNING: Cannot connect to Polygon Amoy at {POLYGON_RPC_URL}")

# ── PolygonScan ─────────────────────────────────────────────────────────────
POLYGONSCAN_TX_URL = "https://amoy.polygonscan.com/tx/"
