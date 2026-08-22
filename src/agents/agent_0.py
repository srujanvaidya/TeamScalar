import hashlib
import json
import asyncio
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Import Shiva's Perception and Safety Agents
from src.agents.agent_1a import NewsSemanticParserAgent
from src.agents.agent_1b import WeatherTelemetryAgent
from src.agents.agent_5 import FinancialRiskSafeguardAgent
from src.contracts.schemas import UnifiedDisruptionEvent, RiskSafeguardEvaluation, Severity, EventSource

# Import Tejas's Navigator and Validator Agents
from src.agents.agent_2 import MultimodalNavigatorAgent
from src.agents.agent_3 import RoutePolicyValidatorAgent

logger = logging.getLogger(__name__)

class ShipmentContext(BaseModel):
    container_id: str = Field(..., description="Unique identifier for the shipping container")
    origin_node: str = Field(..., description="Starting logistics hub")
    destination_node: str = Field(..., description="Final delivery node")
    cargo_type: str = Field(..., description="Classification of cargo being transported")
    is_hazmat: bool = Field(default=False, description="Flag indicating hazardous cargo status")
    baseline_cost_usd: float = Field(..., description="Standard base cost of the original route")
    sla_deadline_epoch: int = Field(..., description="Epoch timestamp of SLA delivery deadline")
    default_corridor_path: List[str] = Field(..., description="Standard sequence of logistics corridors")
    customer_tier: str = Field(default="TIER_2_COMMERCIAL", description="Customer priority tier")
    sku_id: Optional[str] = Field(default="SKU-PRECISION-SEMI-808", description="Product SKU identifier")
    quantity_units: int = Field(default=500, description="Quantity being shipped")
    allowed_transport_modes: List[str] = Field(default_factory=lambda: ["SEA", "AIR", "RAIL", "ROAD"], description="Allowed transport modes")

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
    origin_coordinates: List[float] = Field(default_factory=list, description="Origin GPS coordinates [lat, lon]")
    destination_coordinates: List[float] = Field(default_factory=list, description="Destination GPS coordinates [lat, lon]")
    transit_distance_nm: float = Field(default=0.0, description="Nautical miles distance between origin and destination")
    blockchain_receipt: Optional[Dict[str, Any]] = Field(None, description="Blockchain transaction anchor receipt metadata")

class MasterOrchestratorAgent:
    def __init__(self):
        # Instantiate all 5 agents (News, Weather, Navigator, Validator, Safeguard)
        self.news_agent = self.agent_1a = NewsSemanticParserAgent()
        self.weather_agent = self.agent_1b = WeatherTelemetryAgent()
        self.navigator_agent = MultimodalNavigatorAgent()
        self.validator_agent = RoutePolicyValidatorAgent()
        self.safeguard_agent = self.agent_5 = FinancialRiskSafeguardAgent()

    async def run_shipment_mission(
        self,
        context: ShipmentContext,
        inject_disruption_text: Optional[str] = None,
        inject_weather: Optional[dict] = None
    ) -> OrchestrationResult:
        """Run the complete multi-agent orchestrator pipeline funnel."""
        
        # Step 1: Concurrently perform fan-out threat perception
        tasks = []
        
        # News Ingestion (1A)
        if inject_disruption_text:
            tasks.append(self.news_agent.parse_article(inject_disruption_text))
        else:
            async def get_news_threats():
                alerts = await self.news_agent.fetch_live_alerts()
                if alerts:
                    return await self.news_agent.parse_article(alerts[0]["text"], alerts[0]["url"])
                return None
            tasks.append(get_news_threats())

        # Weather/Telemetry Ingestion (1B)
        if inject_weather:
            tasks.append(self.weather_agent.evaluate_vessel_telemetry(
                vessel_id="SYSTEM_MONITOR",
                lat=inject_weather.get("lat", 24.5),
                lon=inject_weather.get("lon", 119.8),
                wind_speed_knots=inject_weather.get("wind_speed_knots", 10.0),
                wave_height_m=inject_weather.get("wave_height_m", 2.0),
                corridor_name=inject_weather.get("corridor_name", "CORRIDOR_TAIWAN_STRAIT")
            ))
        else:
            async def get_weather_threats():
                for node in context.default_corridor_path:
                    from src.agents.agent_1b import CHOKEPOINTS
                    if node in CHOKEPOINTS:
                        coords = CHOKEPOINTS[node]
                        weather = await self.weather_agent.fetch_corridor_weather(coords["lat"], coords["lon"])
                        return await self.weather_agent.evaluate_vessel_telemetry(
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
                intersecting = any(node in context.default_corridor_path for node in r.affected_nodes)
                is_high_risk = r.severity in [Severity.HIGH, Severity.CRITICAL]
                if intersecting and is_high_risk:
                    active_disruptions.append(r)

        # Step 2: Threat Aggregation & Bypassing Decision Gate
        reroute_selected = len(active_disruptions) > 0
        proposed_path = list(context.default_corridor_path)
        proposed_cost = context.baseline_cost_usd
        hazmat_compliant = not context.is_hazmat
        sla_deadline_breached = False
        sla_penalty = 0.0

        tradeoff_md = ""
        if reroute_selected:
            # Step 3: Graph Exploration (Agent 2)
            candidate_corridors = await self.navigator_agent.find_alternative_corridors(
                origin=context.origin_node,
                destination=context.destination_node,
                current_path=context.default_corridor_path,
                active_disruptions=active_disruptions
            )

            # Step 4: Policy Validation & Cost Estimation (Agent 3)
            optimal_plan = await self.validator_agent.select_optimal_policy(
                candidate_corridors=candidate_corridors,
                baseline_cost_usd=context.baseline_cost_usd,
                is_hazmat=context.is_hazmat,
                customer_tier=context.customer_tier,
                allowed_transport_modes=context.allowed_transport_modes
            )

            proposed_path = optimal_plan["selected_path"]
            proposed_cost = optimal_plan["proposed_cost_usd"]
            hazmat_compliant = optimal_plan["hazmat_compliant"]
            sla_deadline_breached = optimal_plan["sla_breached"]
            sla_penalty = optimal_plan["sla_penalty_usd"]

            # Generate comparative tradeoff matrix in Markdown
            matrix = [
                "### Multi-Modal Tradeoff Matrix",
                "| Route ID | Modes | Transit (Hours) | Base Cost (USD) |",
                "|---|---|---|---|",
            ]
            for c in candidate_corridors:
                matrix.append(f"| {c['route_id']} | {', '.join(c['modal_sequence'])} | {c['estimated_transit_hours']}h | ${c['base_freight_cost_usd']:,.2f} |")
            tradeoff_md = "\n".join(matrix)
        else:
            if context.is_hazmat:
                hazmat_compliant = True

        # Step 5: Safety & Financial Clearance Gate (Agent 5)
        eval_res = await self.safeguard_agent.evaluate_plan(
            plan_id=f"eval_{context.container_id}",
            baseline_cost_usd=context.baseline_cost_usd,
            proposed_cost_usd=proposed_cost,
            hazmat_compliant=hazmat_compliant,
            sla_deadline_breached=sla_deadline_breached,
            sla_penalty_usd=sla_penalty,
            context_notes=f"Orchestration route deviation plan for {context.container_id}."
        )

        if tradeoff_md:
            eval_res.justification += f"\n\n{tradeoff_md}"

        # Step 6: Cryptographic Hash & Verdict Synthesis
        audit_raw = f"{context.container_id}:{eval_res.decision}:{proposed_cost}:{eval_res.risk_level}"
        audit_hash = hashlib.sha256(audit_raw.encode()).hexdigest()


        if eval_res.decision == "REJECT_ROUTE":
            status = "REJECTED_SAFETY_VIOLATION"
        elif eval_res.decision == "HUMAN_APPROVAL_REQUIRED":
            status = "HELD_FOR_HUMAN_APPROVAL"
        else:
            status = "DISPATCHED_AUTONOMOUS"

        # Resolve coordinates and maritime distance
        from src.data.port_registry import GlobalPortRegistry
        registry = GlobalPortRegistry()
        origin_port = registry.get_port(context.origin_node)
        dest_port = registry.get_port(context.destination_node)
        origin_coords = [origin_port.latitude, origin_port.longitude] if origin_port else [0.0, 0.0]
        dest_coords = [dest_port.latitude, dest_port.longitude] if dest_port else [0.0, 0.0]
        dist_nm = registry.compute_maritime_distance_nm(context.origin_node, context.destination_node)

        # Step 7: Blockchain Provenance Anchoring (via bridge adapter)
        blockchain_receipt = None
        if reroute_selected and eval_res.decision == "AUTO_APPROVE":
            from src.blockchain.bridge_adapter import BlockchainBridge
            blockchain_receipt = await BlockchainBridge.anchor_reroute_decision(
                ship_id=context.container_id,
                location=context.origin_node,
                route_ports=proposed_path,
                decision_metadata={
                    "proposed_cost": proposed_cost,
                    "audit_hash": audit_hash
                }
            )

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
            execution_status=status,
            origin_coordinates=origin_coords,
            destination_coordinates=dest_coords,
            transit_distance_nm=dist_nm,
            blockchain_receipt=blockchain_receipt
        )
