"""
Polygon Amoy hash anchoring via zero-value native transactions.

Sends a 0 POL transaction from the owner to itself with the event_hash
embedded in the transaction's `data` field. This permanently records the
hash on-chain without needing a custom smart contract.
"""

from blockchain.config import (
    w3,
    POLYGON_CHAIN_ID,
    OWNER_PRIVATE_KEY,
    OWNER_ADDRESS,
    POLYGONSCAN_TX_URL,
)


class AnchorResult:
    """Result of a blockchain anchoring attempt."""

    def __init__(self, tx_hash: str | None, status: str, error: str | None = None):
        self.tx_hash = tx_hash          # e.g. "0xabc123..."
        self.status = status            # PENDING / CONFIRMED / FAILED
        self.error = error              # Error message if FAILED

    @property
    def polygonscan_url(self) -> str | None:
        """Full PolygonScan URL for this transaction."""
        if self.tx_hash:
            return f"{POLYGONSCAN_TX_URL}{self.tx_hash}"
        return None

    def __repr__(self) -> str:
        return f"AnchorResult(tx_hash={self.tx_hash}, status={self.status})"


def anchor_hash(event_hash: str, timeout: int = 120) -> AnchorResult:
    """
    Anchor an event hash on Polygon Amoy via a zero-value transaction.

    The event_hash is embedded in the transaction's `data` field as:
        0x + event_hash (hex-encoded SHA-256)

    Args:
        event_hash: Hex-encoded SHA-256 hash (64 chars, no '0x' prefix).
        timeout: Seconds to wait for transaction receipt.

    Returns:
        AnchorResult with tx_hash, status, and optional error.
    """
    try:
        # Encode the hash as transaction data (prefix with 0x)
        data_hex = "0x" + event_hash

        # Get the current nonce for the owner address
        nonce = w3.eth.get_transaction_count(OWNER_ADDRESS)

        # Build zero-value transaction: owner → owner with hash in data
        tx = {
            "from": OWNER_ADDRESS,
            "to": OWNER_ADDRESS,
            "value": 0,
            "nonce": nonce,
            "chainId": POLYGON_CHAIN_ID,
            "data": data_hex,
            "gas": 30000,  # Minimal gas for a simple data-carrying tx
            "maxFeePerGas": w3.to_wei("30", "gwei"),
            "maxPriorityFeePerGas": w3.to_wei("30", "gwei"),
        }

        # Sign the transaction
        signed_tx = w3.eth.account.sign_transaction(tx, OWNER_PRIVATE_KEY)

        # Send it
        raw_tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hash_hex = w3.to_hex(raw_tx_hash)

        print(f"  ⏳ Transaction sent: {tx_hash_hex}")
        print(f"     Waiting for confirmation (up to {timeout}s)...")

        # Wait for receipt
        receipt = w3.eth.wait_for_transaction_receipt(raw_tx_hash, timeout=timeout)

        if receipt["status"] == 1:
            print(f"  ✅ Confirmed in block {receipt['blockNumber']}")
            return AnchorResult(tx_hash=tx_hash_hex, status="CONFIRMED")
        else:
            print(f"  ❌ Transaction reverted in block {receipt['blockNumber']}")
            return AnchorResult(
                tx_hash=tx_hash_hex,
                status="FAILED",
                error="Transaction reverted on-chain",
            )

    except Exception as e:
        error_msg = str(e)
        print(f"  ❌ Anchoring failed: {error_msg}")
        return AnchorResult(tx_hash=None, status="FAILED", error=error_msg)


def read_anchor_data(tx_hash: str) -> str | None:
    """
    Read the anchored event hash from a transaction's input data.

    Args:
        tx_hash: The Polygon transaction hash (with 0x prefix).

    Returns:
        The event hash extracted from the transaction's data field,
        or None if the transaction cannot be found.
    """
    try:
        tx = w3.eth.get_transaction(tx_hash)
        # The input data is "0x" + event_hash
        raw_input = tx["input"]
        if isinstance(raw_input, bytes):
            return raw_input.hex()
        # String form: strip '0x' prefix
        return raw_input[2:] if raw_input.startswith("0x") else raw_input
    except Exception:
        return None
