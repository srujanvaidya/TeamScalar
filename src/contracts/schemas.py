from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class EventSource(str, Enum):
    NEWS = "NEWS"
    WEATHER = "WEATHER"
    TELEMETRY = "TELEMETRY"
    SIMULATION = "SIMULATION"

class UnifiedDisruptionEvent(BaseModel):
    event_id: str = Field(..., description="Unique identifier for the disruption event")
    source: EventSource = Field(..., description="Source of the event (e.g., NEWS, WEATHER)")
    event_type: str = Field(..., description="Sub-type of the disruption (e.g., hurricane, labor strike)")
    severity: Severity = Field(..., description="Classification of disruption severity")
    confidence: float = Field(..., description="LLM/Sensor confidence score between 0.0 and 1.0")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time of signal generation")
    latitude: Optional[float] = Field(None, description="GPS latitude of the disruption center")
    longitude: Optional[float] = Field(None, description="GPS longitude of the disruption center")
    affected_nodes: List[str] = Field(default_factory=list, description="IDs of affected logistics nodes/hubs")
    impact_radius_km: float = Field(0.0, description="Estimated radius of physical/operational impact")
    estimated_delay_hours: float = Field(0.0, description="Estimated routing/logistics delay")
    description: str = Field(..., description="Semantic summary of the disruption event")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional custom metadata fields")

class RiskSafeguardEvaluation(BaseModel):
    plan_id: str = Field(..., description="Identifier of the rerouting plan being evaluated")
    baseline_cost_usd: float = Field(..., description="Original cost of transit in USD")
    proposed_cost_usd: float = Field(..., description="Rerouted cost of transit in USD")
    cost_delta_usd: float = Field(..., description="Absolute financial change in USD")
    sla_penalty_exposure_usd: float = Field(..., description="Potential SLA violation fees in USD")
    financial_exposure_usd: float = Field(..., description="Combined cost delta + SLA penalty exposure")
    hazmat_violation: bool = Field(..., description="Flag indicating if a HazMat constraint was breached")
    risk_level: Severity = Field(..., description="Classified risk level based on financials/safety")
    requires_human_approval: bool = Field(..., description="Flag indicating if safety rules demand manual check")
    decision: str = Field(..., description="Final safeguard decision (e.g., AUTO_APPROVE or HUMAN_APPROVAL_REQUIRED)")
    justification: str = Field(..., description="Narrative explainability text justifying the decision")
    audit_trail: List[str] = Field(default_factory=list, description="Sequence of deterministic checks executed")
