import pytest
from datetime import datetime
from pydantic import ValidationError
from src.contracts.schemas import (
    Severity,
    EventSource,
    UnifiedDisruptionEvent,
    RiskSafeguardEvaluation,
)

def test_severity_enum():
    assert Severity.LOW == "LOW"
    assert Severity.CRITICAL == "CRITICAL"

def test_event_source_enum():
    assert EventSource.NEWS == "NEWS"
    assert EventSource.WEATHER == "WEATHER"

def test_valid_unified_disruption_event():
    data = {
        "event_id": "evt_123",
        "source": "NEWS",
        "event_type": "Labor Strike",
        "severity": "HIGH",
        "confidence": 0.85,
        "description": "Port of LA strike reported.",
        "estimated_delay_hours": 12.0,
    }
    event = UnifiedDisruptionEvent(**data)
    assert event.event_id == "evt_123"
    assert event.source == EventSource.NEWS
    assert event.severity == Severity.HIGH
    assert isinstance(event.timestamp, datetime)

def test_invalid_unified_disruption_event():
    # Missing required 'description' and invalid 'severity'
    data = {
        "event_id": "evt_123",
        "source": "NEWS",
        "event_type": "Labor Strike",
        "severity": "VERY_HIGH",  # Invalid enum value
        "confidence": 0.85,
    }
    with pytest.raises(ValidationError):
        UnifiedDisruptionEvent(**data)

def test_valid_risk_safeguard_evaluation():
    data = {
        "plan_id": "plan_999",
        "baseline_cost_usd": 1000.0,
        "proposed_cost_usd": 1200.0,
        "cost_delta_usd": 200.0,
        "sla_penalty_exposure_usd": 0.0,
        "financial_exposure_usd": 200.0,
        "hazmat_violation": False,
        "risk_level": "LOW",
        "requires_human_approval": False,
        "decision": "AUTO_APPROVE",
        "justification": "Cost delta is within the 20% limit and no HazMat violation.",
        "audit_trail": ["Check HazMat: Pass", "Check Financial Threshold: Pass"],
    }
    eval_obj = RiskSafeguardEvaluation(**data)
    assert eval_obj.plan_id == "plan_999"
    assert eval_obj.cost_delta_usd == 200.0
    assert not eval_obj.requires_human_approval

def test_invalid_risk_safeguard_evaluation():
    # Missing required field 'decision'
    data = {
        "plan_id": "plan_999",
        "baseline_cost_usd": 1000.0,
        "proposed_cost_usd": 1200.0,
        "cost_delta_usd": 200.0,
        "sla_penalty_exposure_usd": 0.0,
        "financial_exposure_usd": 200.0,
        "hazmat_violation": False,
        "risk_level": "LOW",
        "requires_human_approval": False,
        "justification": "Missing decision parameter.",
    }
    with pytest.raises(ValidationError):
        RiskSafeguardEvaluation(**data)
