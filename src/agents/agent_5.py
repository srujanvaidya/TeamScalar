import logging
from typing import List, Optional
from src.contracts.schemas import RiskSafeguardEvaluation, Severity
from src.llm.client import BaseLLMClient, get_llm_client
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class JustificationSchema(BaseModel):
    justification: str = Field(..., description="Markdown formatted operator brief justifying the safeguard decision")

class FinancialRiskSafeguardAgent:
    def __init__(
        self,
        financial_threshold_usd: float = 50000.0,
        llm_client: Optional[BaseLLMClient] = None
    ):
        self.financial_threshold_usd = financial_threshold_usd
        self.llm_client = llm_client or get_llm_client()

    async def evaluate_plan(
        self,
        plan_id: str,
        baseline_cost_usd: float,
        proposed_cost_usd: float,
        hazmat_compliant: bool = True,
        sla_deadline_breached: bool = False,
        sla_penalty_usd: float = 0.0,
        context_notes: str = ""
    ) -> RiskSafeguardEvaluation:
        """Evaluate plan metrics deterministically and generate explainable justifications."""
        cost_delta_usd = proposed_cost_usd - baseline_cost_usd
        financial_exposure_usd = cost_delta_usd + sla_penalty_usd
        
        # Rule Evaluation Gates (Deterministic)
        audit_trail = ["Safeguard engine initialized."]
        
        if not hazmat_compliant:
            decision = "REJECT_ROUTE"
            requires_human_approval = False
            risk_level = Severity.CRITICAL
            audit_trail.append(
                "[REGULATORY_FAIL] HazMat class protocol non-compliant along designated transit corridor."
            )
        elif cost_delta_usd > self.financial_threshold_usd or sla_deadline_breached:
            decision = "HUMAN_APPROVAL_REQUIRED"
            requires_human_approval = True
            risk_level = Severity.CRITICAL if sla_penalty_usd > 100000.0 else Severity.HIGH
            
            if cost_delta_usd > self.financial_threshold_usd:
                audit_trail.append(
                    f"[HITL_TRIGGER] Cost delta of ${cost_delta_usd:,.2f} exceeds standard "
                    f"${self.financial_threshold_usd:,.2f} auto-approval ceiling."
                )
            if sla_deadline_breached:
                audit_trail.append(
                    f"[HITL_TRIGGER] SLA deadline breach detected. Penalty exposure: ${sla_penalty_usd:,.2f}."
                )
        else:
            decision = "AUTO_APPROVE"
            requires_human_approval = False
            risk_level = Severity.LOW
            audit_trail.append(
                "[PASS] Route variation within nominal financial and safety tolerances."
            )

        # Generate Justification (AI Synthesized with safe deterministic template fallback)
        prompt = (
            f"Write an operator justification brief in Markdown explaining this decision:\n"
            f"- Plan ID: {plan_id}\n"
            f"- Decision: {decision}\n"
            f"- Risk Level: {risk_level}\n"
            f"- Cost Delta: ${cost_delta_usd:,.2f}\n"
            f"- HazMat Status: {'Compliant' if hazmat_compliant else 'Violation'}\n"
            f"- SLA Breached: {'Yes' if sla_deadline_breached else 'No'}\n"
            f"- Context Notes: {context_notes}\n"
        )
        
        system_prompt = (
            "You are a logistics risk analyst. Write a concise operator brief detailing: "
            "1. Financial Impact, 2. Regulatory Compliance, and 3. Recommendation."
        )

        justification_text = ""
        try:
            # Query the LLM provider to construct the markdown justification report
            structured_res = await self.llm_client.generate_structured(
                prompt=prompt,
                schema=JustificationSchema,
                system_prompt=system_prompt
            )
            justification_text = structured_res.justification
        except Exception as e:
            logger.warning(f"Safeguard LLM generation failed ({e}). Falling back to template-based justification.")
            # Deterministic backup template
            justification_text = (
                f"### Safeguard Evaluation Brief\n\n"
                f"**Plan ID:** {plan_id}  \n"
                f"**Status:** {decision}  \n"
                f"**Risk Severity:** {risk_level}  \n\n"
                f"#### Analysis:\n"
                f"- **Financial Impact:** Baseline cost was ${baseline_cost_usd:,.2f}. Proposed reroute cost is ${proposed_cost_usd:,.2f}, representing a delta of ${cost_delta_usd:,.2f}.\n"
                f"- **HazMat Regulatory Compliance:** {'PASSED - Route is fully compliant with hazard regulations.' if hazmat_compliant else 'FAILED - Hazardous cargo routing violations detected.'}\n"
                f"- **SLA Breach Risk:** {'High Risk of SLA penalties.' if sla_deadline_breached else 'Low Risk of SLA breach.'}\n"
            )

        evaluation_data = {
            "plan_id": plan_id,
            "baseline_cost_usd": baseline_cost_usd,
            "proposed_cost_usd": proposed_cost_usd,
            "cost_delta_usd": cost_delta_usd,
            "sla_penalty_exposure_usd": sla_penalty_usd,
            "financial_exposure_usd": financial_exposure_usd,
            "hazmat_violation": not hazmat_compliant,
            "risk_level": risk_level,
            "requires_human_approval": requires_human_approval,
            "decision": decision,
            "justification": justification_text,
            "audit_trail": audit_trail
        }
        return RiskSafeguardEvaluation(**evaluation_data)
