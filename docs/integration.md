# Integration Interfaces

This document outlines the expected interface boundaries between Shiva's modules and the other components of the system.

## 1. Agent 1A (Semantic News Parser) → Agent 0 (Master Orchestrator)
- **Input to Agent 1A**: Unstructured news feed item / article text.
- **Output from Agent 1A**: Standardized `UnifiedDisruptionEvent` contract.
- **Protocol**: Direct module calls or REST/JSON invocation depending on runtime orchestration.

## 2. Agent 1B (Weather/Telemetry Agent) → Agent 0 (Master Orchestrator)
- **Input to Agent 1B**: Raw weather alert feed, environmental payload, or sensor data.
- **Output from Agent 1B**: Standardized `UnifiedDisruptionEvent` contract.
- **Protocol**: Direct module calls.

## 3. Agent 0 (Master Orchestrator) → Agent 5 (Financial & Risk Safeguard)
- **Input to Agent 5**: A proposal object containing:
  - The `UnifiedDisruptionEvent` that triggered the evaluation.
  - The calculated rerouting option (from Agent 2) detailing costs, delays, and HazMat status.
- **Payload**: Standardized dictionary or Pydantic instance mapping costs, SLA requirements, and plan IDs.

## 4. Agent 5 (Financial & Risk Safeguard) → Agent 0 (Master Orchestrator)
- **Output from Agent 5**: `RiskSafeguardEvaluation`.
- **Response fields**:
  - `requires_human_approval`: boolean flag indicating whether safety checks passed.
  - `decision`: string enum (`AUTO_APPROVE` or `HUMAN_APPROVAL_REQUIRED`).
  - `justification`: semantic explanation of why the choice was made.
  - `audit_trail`: detailed history of checked rules.
