# Agent 5 — Financial Risk Safeguard & Audit Engine Specification

## Overview & Role
Agent 5 resides in the **Safety & Guardrails Layer** of HOP 2026 // Scalar. It intercepts alternative rerouting plan options output by upstream constraint planners and evaluates them against strict, hard-coded safety and financial limits. 

Its decisions are 100% deterministic, guaranteeing that no LLM hallucination can override policy boundaries. The LLM is used solely to generate operator Markdown justification summaries.

---

## Deterministic Rule Hierarchy

1. **HazMat Rule**: If a route contains any hazardous cargo violations (`hazmat_compliant = False`), the route is immediately blocked.
   - **Decision**: `REJECT_ROUTE`
   - **Severity**: `CRITICAL`
   - **Action**: Auto-Rejected.
2. **Financial Ceiling Rule**: If the cost delta of the proposed Rerouted cost minus Baseline cost exceeds **$50,000 USD** OR the SLA deadline is breached, it is escalated for manual authorization.
   - **Decision**: `HUMAN_APPROVAL_REQUIRED`
   - **Severity**: `HIGH` (escalated to `CRITICAL` if SLA penalties exceed $100k)
   - **Action**: Escalated to Human-In-The-Loop (HITL).
3. **Autonomous Clearance**: If all checks are compliant, under threshold, and SLA remains intact, it is cleared automatically.
   - **Decision**: `AUTO_APPROVE`
   - **Severity**: `LOW`
   - **Action**: Auto-Cleared.

---

## Canonical JSON Evaluation Contract
Example response from Agent 5:
```json
{
  "plan_id": "plan_hitl_demo",
  "baseline_cost_usd": 120000.0,
  "proposed_cost_usd": 184200.0,
  "cost_delta_usd": 64200.0,
  "sla_penalty_exposure_usd": 25000.0,
  "financial_exposure_usd": 89200.0,
  "hazmat_violation": false,
  "risk_level": "HIGH",
  "requires_human_approval": true,
  "decision": "HUMAN_APPROVAL_REQUIRED",
  "justification": "### Rerouting Justification Brief... (Markdown Brief)",
  "audit_trail": [
    "Safeguard engine initialized.",
    "[HITL_TRIGGER] Cost delta of $64,200.00 exceeds standard $50,000.00 auto-approval ceiling."
  ]
}
```

---

## Verification & Execution
Run tests locally via:
```powershell
python -m pytest tests/agents/test_agent_5.py
```
