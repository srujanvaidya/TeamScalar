import pytest
from fastapi.testclient import TestClient
from app_agent_5 import app
from src.agents.agent_5 import FinancialRiskSafeguardAgent
from src.contracts.schemas import RiskSafeguardEvaluation, Severity

client = TestClient(app)

@pytest.mark.asyncio
async def test_agent5_auto_approval():
    agent = FinancialRiskSafeguardAgent()
    # Cost delta is $8,200 (under $50,000 ceiling), compliant, no SLA breach
    res = await agent.evaluate_plan(
        plan_id="plan_001",
        baseline_cost_usd=40000.0,
        proposed_cost_usd=48200.0,
        hazmat_compliant=True,
        sla_deadline_breached=False
    )
    assert isinstance(res, RiskSafeguardEvaluation)
    assert res.decision == "AUTO_APPROVE"
    assert res.requires_human_approval is False
    assert res.risk_level == Severity.LOW
    assert res.cost_delta_usd == 8200.0
    assert any("PASS" in check for check in res.audit_trail)

@pytest.mark.asyncio
async def test_agent5_hitl_cost_escalation():
    agent = FinancialRiskSafeguardAgent()
    # Cost delta is $64,200 (exceeds $50,000 ceiling)
    res = await agent.evaluate_plan(
        plan_id="plan_002",
        baseline_cost_usd=100000.0,
        proposed_cost_usd=164200.0,
        hazmat_compliant=True,
        sla_deadline_breached=False
    )
    assert res.decision == "HUMAN_APPROVAL_REQUIRED"
    assert res.requires_human_approval is True
    assert res.risk_level == Severity.HIGH
    assert any("Cost delta" in check for check in res.audit_trail)

@pytest.mark.asyncio
async def test_agent5_hazmat_violation_rejection():
    agent = FinancialRiskSafeguardAgent()
    # Hazmat non-compliant must lead to immediate route rejection
    res = await agent.evaluate_plan(
        plan_id="plan_003",
        baseline_cost_usd=50000.0,
        proposed_cost_usd=55000.0,
        hazmat_compliant=False,
        sla_deadline_breached=False
    )
    assert res.decision == "REJECT_ROUTE"
    assert res.requires_human_approval is False
    assert res.risk_level == Severity.CRITICAL
    assert any("HazMat" in check for check in res.audit_trail)

@pytest.mark.asyncio
async def test_agent5_sla_breach_escalation():
    agent = FinancialRiskSafeguardAgent()
    # Under cost ceiling ($20,000 delta) but has SLA breach
    res = await agent.evaluate_plan(
        plan_id="plan_004",
        baseline_cost_usd=50000.0,
        proposed_cost_usd=70000.0,
        hazmat_compliant=True,
        sla_deadline_breached=True,
        sla_penalty_usd=25000.0
    )
    assert res.decision == "HUMAN_APPROVAL_REQUIRED"
    assert res.requires_human_approval is True
    assert res.risk_level == Severity.HIGH

def test_fastapi_agent_5_endpoints():
    # Test index dashboard
    response = client.get("/")
    assert response.status_code == 200
    assert "Scalar Agent 5" in response.text

    # Test Health Check
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    # Test Auto Approve Demo
    response = client.get("/demo/auto-approve")
    assert response.status_code == 200
    assert response.json()["decision"] == "AUTO_APPROVE"

    # Test HITL Escalation Demo
    response = client.get("/demo/hitl-escalation")
    assert response.status_code == 200
    assert response.json()["decision"] == "HUMAN_APPROVAL_REQUIRED"

    # Test Hazmat Reject Demo
    response = client.get("/demo/hazmat-reject")
    assert response.status_code == 200
    assert response.json()["decision"] == "REJECT_ROUTE"
