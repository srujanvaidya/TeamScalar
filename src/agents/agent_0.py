import hashlib
import json
import asyncio
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from src.agents.agent_1a import NewsSemanticParserAgent
from src.agents.agent_1b import WeatherTelemetryAgent
from src.agents.agent_5 import FinancialRiskSafeguardAgent
from src.contracts.schemas import UnifiedDisruptionEvent, RiskSafeguardEvaluation, Severity, EventSource

logger = logging.getLogger(__name__)

class ShipmentContext(BaseModel):
    container_id: str = Field(..., description="Unique identifier for the shipping container")
    origin_node: str = Field(..., description="Starting logistics hub")
    destination_node: str = Field(..., description="Final delivery node")
    cargo_type: str = Field(..., description="Classification of cargo being transported")
    is_hazmat: bool = Field(default=False, description="Flag indicating hazardous cargo status")
    baseline_cost_usd: float = Field(..., description="Standard base cost of the original route")
    sla_deadline_epoch: int = Field(..., description="Epoch timestamp of SLA delivery deadline")
    default_corridor_path: List[str] = Field(..., description="Standard sequence of logistics nodes/corridors")

class OrchestrationResult(BaseModel):
    shipment_id: str = Field(..., description="ID of the shipment context evaluated")
    active_disruptions: List[UnifiedDisruptionEvent] = Field(..., description="List of detected high-risk threats")
    reroute_selected: bool = Field(..., description="Boolean indicating if rerouting was triggered")
    original_corridor_path: List[str] = Field(..., description="Original sequence of corridors")
    proposed_corridor_path: List[str] = Field(..., description="Selected sequence of corridors after threat avoidance")
    baseline_cost_usd: float = Field(..., description="Original baseline shipping cost")
    proposed_cost_usd: float = Field(..., description="Final calculated cost of the route")
    financial_impact_delta_usd: float = Field(..., description="Absolute change in cost")
    safeguard_evaluation: RiskSafeguardEvaluation = Field(..., description="Output from the financial risk safeguard agent")
    audit_hash: str = Field(..., description="SHA-256 cryptographic audit trail signature")
    execution_status: str = Field(..., description="Final dispatch decision: DISPATCHED_AUTONOMOUS, HELD_FOR_HUMAN_APPROVAL, REJECTED_SAFETY_VIOLATION")

class MasterOrchestratorAgent:
    def __init__(self):
        self.agent_1a = NewsSemanticParserAgent()
        self.agent_1b = WeatherTelemetryAgent()
        self.agent_5 = FinancialRiskSafeguardAgent()

    async def run_shipment_mission(
        self,
        context: ShipmentContext,
        inject_disruption_text: Optional[str] = None,
        inject_weather: Optional[dict] = None
    ) -> OrchestrationResult:
        """Run the complete multi-agent orchestrator pipeline."""
        
        # Concurrently perform fan-out threat perception
        tasks = []
        
        # News Ingestion (1A)
        if inject_disruption_text:
            tasks.append(self.agent_1a.parse_article(inject_disruption_text))
        else:
            async def get_news_threats():
                alerts = await self.agent_1a.fetch_live_alerts()
                if alerts:
                    return await self.agent_1a.parse_article(alerts[0]["text"], alerts[0]["url"])
                return None
            tasks.append(get_news_threats())

        # Weather/Telemetry Ingestion (1B)
        if inject_weather:
            tasks.append(self.agent_1b.evaluate_vessel_telemetry(
                vessel_id="SYSTEM_MONITOR",
                lat=inject_weather.get("lat", 24.5),
                lon=inject_weather.get("lon", 119.8),
                wind_speed_knots=inject_weather.get("wind_speed_knots", 10.0),
                wave_height_m=inject_weather.get("wave_height_m", 2.0),
                corridor_name=inject_weather.get("corridor_name", "CORRIDOR_TAIWAN_STRAIT")
            ))
        else:
            async def get_weather_threats():
                # Check for weather disruptions on the chokepoints intersecting path
                for node in context.default_corridor_path:
                    from src.agents.agent_1b import CHOKEPOINTS
                    if node in CHOKEPOINTS:
                        coords = CHOKEPOINTS[node]
                        weather = await self.agent_1b.fetch_corridor_weather(coords["lat"], coords["lon"])
                        return await self.agent_1b.evaluate_vessel_telemetry(
                            vessel_id="SYSTEM_MONITOR",
                            lat=coords["lat"],
                            lon=coords["lon"],
                            wind_speed_knots=weather["wind_speed_knots"],
                            wave_height_m=weather["wave_height_m"],
                            corridor_name=node
                        )
                return None
            tasks.append(get_weather_threats())

        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        active_disruptions = []
        for r in results:
            if isinstance(r, UnifiedDisruptionEvent):
                # Filter events with severity >= Severity.HIGH intersecting default path
                intersecting = any(node in context.default_corridor_path for node in r.affected_nodes)
                is_high_risk = r.severity in [Severity.HIGH, Severity.CRITICAL]
                if intersecting and is_high_risk:
                    active_disruptions.append(r)

        # Dynamic Corridor Planning & Cost Calculation
        reroute_selected = len(active_disruptions) > 0
        proposed_path = list(context.default_corridor_path)
        proposed_cost = context.baseline_cost_usd
        hazmat_compliant = not context.is_hazmat # If hazmat and corridor violated, will fail safety check

        if reroute_selected:
            primary_disruption = active_disruptions[0]
            # Bypassing logic: reroute PORT_SHANGHAI_01 / TAIWAN_STRAIT via EAST_PACIFIC_BYPASS
            for i, node in enumerate(proposed_path):
                if node in primary_disruption.affected_nodes:
                    if node == "CORRIDOR_TAIWAN_STRAIT" or node == "PORT_SHANGHAI_01":
                        proposed_path[i] = "CORRIDOR_EAST_PACIFIC_BYPASS"
                        proposed_cost = context.baseline_cost_usd + 8200.0 if "strike" in primary_disruption.description.lower() else context.baseline_cost_usd + 64200.0
                    else:
                        proposed_path[i] = node + "_BYPASS"
                        proposed_cost = context.baseline_cost_usd + 15000.0

            # If the shipment carries HAZMAT, we verify waterway compliance
            if context.is_hazmat:
                # Class 3 Flammables cannot go through BYPASS corridors under safety protocol
                if any("BYPASS" in node for node in proposed_path):
                    hazmat_compliant = False
        else:
            # If no threats, HazMat is compliant along standard corridor path
            if context.is_hazmat:
                hazmat_compliant = True

        # Safety & Financial Clearance (5)
        sla_deadline_breached = False
        sla_penalty = 0.0
        # If rerouted cost is too high or delay is massive, calculate SLA breach
        if reroute_selected:
            total_delay = sum(d.estimated_delay_hours for d in active_disruptions)
            # If delay is over 50 hours, it breaches SLA
            if total_delay > 50.0:
                sla_deadline_breached = True
                sla_penalty = 25000.0 if total_delay > 72.0 else 10000.0

        eval_res = await self.agent_5.evaluate_plan(
            plan_id=f"eval_{context.container_id}",
            baseline_cost_usd=context.baseline_cost_usd,
            proposed_cost_usd=proposed_cost,
            hazmat_compliant=hazmat_compliant,
            sla_deadline_breached=sla_deadline_breached,
            sla_penalty_usd=sla_penalty,
            context_notes=f"Orchestration route deviation plan for {context.container_id}."
        )

        # Cryptographic Audit Signature
        audit_raw = f"{context.container_id}:{eval_res.decision}:{proposed_cost}:{eval_res.risk_level}"
        audit_hash = hashlib.sha256(audit_raw.encode()).hexdigest()

        # Synthesis final status
        if eval_res.decision == "REJECT_ROUTE":
            status = "REJECTED_SAFETY_VIOLATION"
        elif eval_res.decision == "HUMAN_APPROVAL_REQUIRED":
            status = "HELD_FOR_HUMAN_APPROVAL"
        else:
            status = "DISPATCHED_AUTONOMOUS"

        return OrchestrationResult(
            shipment_id=context.container_id,
            active_disruptions=active_disruptions,
            reroute_selected=reroute_selected,
            original_corridor_path=context.default_corridor_path,
            proposed_corridor_path=proposed_path,
            baseline_cost_usd=context.baseline_cost_usd,
            proposed_cost_usd=proposed_cost,
            financial_impact_delta_usd=proposed_cost - context.baseline_cost_usd,
            safeguard_evaluation=eval_res,
            audit_hash=audit_hash,
            execution_status=status
        )
