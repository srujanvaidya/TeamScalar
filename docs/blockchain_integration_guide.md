# Blockchain Rerouting & Provenance Integration Guide

Describes the integration of Agent 0 and Agent 5 with Srujan's Polygon & Supabase Blockchain Provenance module.

## Workflow Functionality
1. **Approval Detection**: When the master orchestrator automatically approves a rerouting plan (status: `DISPATCHED_AUTONOMOUS`, decision: `AUTO_APPROVE`), it launches the blockchain bridge.
2. **Standardization**: The bridge resolves UN/LOCODEs and ports using the spatial port registry.
3. **CLI Execution**: The bridge runs `blockchain/agent_reroute.py` via an asynchronous subprocess to register the provenance entry in Supabase and anchor it to the Polygon Amoy blockchain.
4. **Fallback**: If the network is offline or keys are absent, it returns a simulated record with a deterministic hash.
