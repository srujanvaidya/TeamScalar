# System Architecture

## Pipeline Flow

```mermaid
graph TD
    Signals[External Signals] --> A1A[Agent 1A: News/Semantic Event Parser]
    Signals --> A1B[Agent 1B: Weather/Telemetry Agent]
    A1A --> UDE[UnifiedDisruptionEvent]
    A1B --> UDE
    UDE --> A0[Agent 0: Master Orchestrator]
    A0 --> A2[Agent 2: Graph Route Optimization]
    A2 --> A3[Agent 3: Constraint Validator]
    A3 --> A5[Agent 5: Financial & Risk Safeguard]
    A5 --> Decision{Decision Level}
    Decision -->|Low Risk| AA[Auto Approval]
    Decision -->|High Risk| HA[Human Approval]
    AA --> Exec[Execution / Audit Trail]
    HA --> Exec
```

The system ingests signals, standardizes them, calculates alternative routing options, validates logical constraints, and routes the proposed plans through deterministic financial/risk gates.

## Shiva's Scope & Ownership
- **Agent 1A (Semantic News Parser)**: Extract disruption metadata from news alerts.
- **Agent 1B (Weather & Telemetry Agent)**: Parse environmental telemetry data.
- **Agent 5 (Financial & Risk Safeguard)**: Verify plan costs, SLA exposure, HazMat, and risk thresholds.
- **Shared Contracts & Integration Adapters**: Shared interface contracts to ensure clean communication with other agents.
- **Testing**: Test suite coverage for all Shiva-owned modules.

## Determinism Guarantees
To prevent hallucinations or unpredictable routing behavior:
- **Routing & Cost Calculations**: Solved deterministically via graph optimization algorithms.
- **Safety & Policy Constraints**: Validated using strict deterministic threshold checks (e.g., maximum cost increases, SLA breach calculations, and HazMat limitations). LLMs are utilized solely for extraction (1A/1B) and narrative justifications (5), but they cannot override safety rules.
