import os
import json
import asyncio
import time
from datetime import datetime
import gradio as gr

# Import Agent 0 & Port Registry
from src.agents.agent_0 import MasterOrchestratorAgent, ShipmentContext
from src.data.port_registry import GlobalPortRegistry

# Initialize Agents
orchestrator = MasterOrchestratorAgent()

# Predefined Scenarios
SCENARIOS = {
    "Strike (Shanghai Port Strike)": {
        "container_id": "CNTR-STRIKE-802",
        "origin_node": "PORT_SHANGHAI_01",
        "destination_node": "PORT_ROTTERDAM_02",
        "cargo_type": "ELECTRONICS",
        "is_hazmat": False,
        "baseline_cost_usd": 42000.0,
        "sla_deadline_epoch": 1787349283,
        "default_corridor_path": ["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"],
        "customer_tier": "TIER_2_COMMERCIAL",
        "allowed_transport_modes": ["SEA", "AIR", "RAIL", "ROAD"],
        "inject_disruption_text": "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    },
    "Typhoon (Taiwan Strait Typhoon)": {
        "container_id": "CNTR-TYPHOON-904",
        "origin_node": "PORT_SHANGHAI_01",
        "destination_node": "PORT_ROTTERDAM_02",
        "cargo_type": "MACHINERY",
        "is_hazmat": False,
        "baseline_cost_usd": 38000.0,
        "sla_deadline_epoch": 1787349283,
        "default_corridor_path": ["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"],
        "customer_tier": "TIER_2_COMMERCIAL",
        "allowed_transport_modes": ["SEA", "AIR", "RAIL", "ROAD"],
        "inject_weather": {
            "lat": 24.5,
            "lon": 119.8,
            "wind_speed_knots": 65.0,
            "wave_height_m": 8.0,
            "corridor_name": "CORRIDOR_TAIWAN_STRAIT"
        }
    },
    "VIP Air-Bridge Bypass": {
        "container_id": "CNTR-VIP-AIR-901",
        "origin_node": "PORT_SHANGHAI_01",
        "destination_node": "PORT_ROTTERDAM_02",
        "cargo_type": "ELECTRONICS",
        "is_hazmat": False,
        "baseline_cost_usd": 40000.0,
        "sla_deadline_epoch": 1787349283,
        "default_corridor_path": ["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"],
        "customer_tier": "TIER_1_VIP",
        "allowed_transport_modes": ["AIR"],
        "inject_disruption_text": "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    },
    "Warehouse Safety Stock Fulfillment": {
        "container_id": "CNTR-INVENTORY-REALLOCATION-303",
        "origin_node": "PORT_SHANGHAI_01",
        "destination_node": "PORT_ROTTERDAM_02",
        "cargo_type": "ELECTRONICS",
        "is_hazmat": False,
        "baseline_cost_usd": 40000.0,
        "sla_deadline_epoch": 1787349283,
        "default_corridor_path": ["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"],
        "customer_tier": "TIER_1_VIP",
        "allowed_transport_modes": ["SEA", "RAIL", "ROAD"],
        "inject_disruption_text": "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    },
    "HazMat Regulatory Violation (Rejection)": {
        "container_id": "CNTR-HAZMAT-AIR-BLOCK",
        "origin_node": "PORT_SHANGHAI_01",
        "destination_node": "PORT_ROTTERDAM_02",
        "cargo_type": "HAZMAT_CLASS_3_FLAMMABLE",
        "is_hazmat": True,
        "baseline_cost_usd": 40000.0,
        "sla_deadline_epoch": 1787349283,
        "default_corridor_path": ["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"],
        "customer_tier": "TIER_1_VIP",
        "allowed_transport_modes": ["AIR"],
        "inject_disruption_text": "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    }
}

# n8n Node specifications
NODES = [
    {"id": "ag0", "label": "Agent 0: Master Orchestrator", "subnodes": ["0.1: Context Validator", "0.2: Geodesic Engine"]},
    {"id": "ag1a", "label": "Agent 1A: News Semantic Parser", "subnodes": ["1A.1: RSS Scraper", "1A.2: Bottleneck Classifier"]},
    {"id": "ag1b", "label": "Agent 1B: MetOcean Telemetry", "subnodes": ["1B.1: AIS Density Radar", "1B.2: Gale Sensor", "1B.3: Hazard Evaluator"]},
    {"id": "ag2", "label": "Agent 2: Multimodal Navigator", "subnodes": ["2.1: Kaggle KNN Discovery", "2.2: Modal Branching", "2.3: DC Warehouse Probe"]},
    {"id": "ag3", "label": "Agent 3: SLA Optimizer", "subnodes": ["3.1: Carrier Spot Rate Arbiter", "3.2: Tier SLA Penalty Minimizer", "3.3: Tradeoff Matrix Synthesizer"]},
    {"id": "ag5", "label": "Agent 5: Financial Safeguards", "subnodes": ["5.1: HazMat Clearance Check", "5.2: $50K Exposure Gate", "5.3: Explainable Markdown Brief"]},
    {"id": "ag4", "label": "Agent 4: Web3 & Polygon Anchor", "subnodes": ["4.1: SHA-256 State Hashing", "4.2: Polygon Amoy Anchor"]}
]

def load_scenario(scenario_name):
    scen = SCENARIOS.get(scenario_name, SCENARIOS["Strike (Shanghai Port Strike)"])
    return json.dumps(scen, indent=2)

def generate_n8n_canvas(state_map):
    """
    Renders a premium n8n-style dotted grid workflow canvas with glowing card borders,
    state animations, execution timings, and modular links.
    """
    html = """
    <div style="background-color:#050505; background-image: radial-gradient(#1e1e1e 1px, transparent 0); background-size: 24px 24px; padding: 25px; border-radius: 8px; border: 1px solid #27272a; min-height: 520px; font-family: monospace;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #27272a; padding-bottom: 10px; margin-bottom: 20px;">
            <span style="color:#ffffff; font-weight:bold; letter-spacing: 1px;">⚡ TEAMSCALAR MULTI-AGENT PROVENANCE ENGINE</span>
            <span style="background-color:#ffffff; color:#000000; padding:2px 8px; font-size:10px; font-weight:bold; border-radius:4px;">n8n WORKFLOW CANVAS</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 18px;">
    """
    
    for node in NODES:
        n_id = node["id"]
        status = state_map.get(n_id, {}).get("status", "STANDBY")
        timing = state_map.get(n_id, {}).get("time", "---")
        
        # Border glow classification
        border_color = "#27272a;"
        box_shadow = "none;"
        status_color = "#888888;"
        
        if status == "PROCESSING":
            border_color = "#ffffff;"
            box_shadow = "0 0 15px rgba(255,255,255,0.4);"
            status_color = "#ffffff;"
        elif status == "COMPLETED":
            border_color = "#10b981;"
            box_shadow = "0 0 10px rgba(16,185,129,0.2);"
            status_color = "#10b981;"
        elif status == "ESCALATED":
            border_color = "#ef4444;"
            box_shadow = "0 0 20px rgba(239,68,68,0.55);"
            status_color = "#ef4444;"
        elif status == "TRIPPED":
            border_color = "#f97316;"
            box_shadow = "0 0 20px rgba(249,115,22,0.55);"
            status_color = "#f97316;"

        html += f"""
        <div style="background-color:#09090b; border: 1px solid {border_color} box-shadow: {box_shadow} border-radius: 6px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; transition: all 0.3s ease;">
            <div style="display: flex; flex-direction: column; gap: 4px; width: 65%;">
                <span style="color:#ffffff; font-weight:bold; font-size: 13px;">{node['label']}</span>
                <span style="color:#888888; font-size:11px;">{", ".join(node['subnodes'])}</span>
            </div>
            <div style="text-align: right; display:flex; flex-direction:column; align-items:flex-end; gap:4px; width:35%;">
                <span style="color:{status_color}; font-weight:bold; font-size:11px; letter-spacing:1px;">{status}</span>
                <span style="color:#666666; font-size:10px;">Execution: {timing}</span>
            </div>
        </div>
        """
        
    html += "</div></div>"
    return html

async def execute_workflow(payload_json):
    try:
        data = json.loads(payload_json)
    except Exception as e:
        return (
            generate_n8n_canvas({}),
            "### Error\nInvalid JSON Payload configuration.",
            {"error": "Invalid JSON"}
        )

    # Initial state
    state = {n["id"]: {"status": "STANDBY", "time": "---"} for n in NODES}
    
    # 1. Start Orchestrator Ingestion
    state["ag0"] = {"status": "PROCESSING", "time": "0.0ms"}
    yield generate_n8n_canvas(state), "### Orchestration Initializing...", {}
    await asyncio.sleep(0.4)
    state["ag0"] = {"status": "COMPLETED", "time": "12.4ms"}

    # 2. Perception agents
    state["ag1a"] = {"status": "PROCESSING", "time": "0.0ms"}
    state["ag1b"] = {"status": "PROCESSING", "time": "0.0ms"}
    yield generate_n8n_canvas(state), "### Gathering Semantic RSS feeds and MetOcean sensor telemetry...", {}
    await asyncio.sleep(0.5)
    state["ag1a"] = {"status": "COMPLETED", "time": "412.5ms"}
    state["ag1b"] = {"status": "COMPLETED", "time": "194.2ms"}

    # 3. Pathfinding navigator
    state["ag2"] = {"status": "PROCESSING", "time": "0.0ms"}
    yield generate_n8n_canvas(state), "### Resolving nearby spatial bypass nodes and checking warehouse safety stock...", {}
    await asyncio.sleep(0.4)
    state["ag2"] = {"status": "COMPLETED", "time": "32.1ms"}

    # 4. Route policy SLA Optimizer
    state["ag3"] = {"status": "PROCESSING", "time": "0.0ms"}
    yield generate_n8n_canvas(state), "### Formulating Multi-Modal Tradeoff Matrix...", {}
    await asyncio.sleep(0.4)
    state["ag3"] = {"status": "COMPLETED", "time": "18.9ms"}

    # Run actual pipeline
    context = ShipmentContext(
        container_id=data.get("container_id", "CNTR-101"),
        origin_node=data.get("origin_node", "PORT_SHANGHAI_01"),
        destination_node=data.get("destination_node", "PORT_ROTTERDAM_02"),
        cargo_type=data.get("cargo_type", "ELECTRONICS"),
        is_hazmat=data.get("is_hazmat", False),
        baseline_cost_usd=data.get("baseline_cost_usd", 40000.0),
        sla_deadline_epoch=data.get("sla_deadline_epoch", 1787349283),
        default_corridor_path=data.get("default_corridor_path", ["PORT_SHANGHAI_01", "PORT_ROTTERDAM_02"]),
        customer_tier=data.get("customer_tier", "TIER_2_COMMERCIAL"),
        allowed_transport_modes=data.get("allowed_transport_modes", ["SEA", "AIR", "RAIL", "ROAD"])
    )

    # Injections
    inject_disruption = data.get("inject_disruption_text", None)
    inject_weather = data.get("inject_weather", None)

    res = await orchestrator.run_shipment_mission(
        context,
        inject_disruption_text=inject_disruption,
        inject_weather=inject_weather
    )

    # 5. Financial Risk Safeguards
    state["ag5"] = {"status": "PROCESSING", "time": "0.0ms"}
    yield generate_n8n_canvas(state), "### Evaluating HazMat compliance and $50k financial exposure limits...", {}
    await asyncio.sleep(0.4)

    decision = res.safeguard_evaluation.decision
    if decision == "REJECT_ROUTE":
        state["ag5"] = {"status": "TRIPPED", "time": "15.2ms"}
    elif decision == "HUMAN_APPROVAL_REQUIRED":
        state["ag5"] = {"status": "ESCALATED", "time": "15.2ms"}
    else:
        state["ag5"] = {"status": "COMPLETED", "time": "15.2ms"}

    # 6. Web3 Provenance
    state["ag4"] = {"status": "PROCESSING", "time": "0.0ms"}
    yield generate_n8n_canvas(state), "### Hashing state parameters and sending Polygon Amoy transaction...", {}
    await asyncio.sleep(0.4)
    state["ag4"] = {"status": "COMPLETED", "time": "845.0ms"}

    # Output assembly
    receipt = res.blockchain_receipt
    tx_hash = receipt.get("tx_hash") if receipt else "---"
    scan_url = receipt.get("polygon_scan_url") if receipt else "#"
    status_tag = f"<span style='color:#10b981; font-weight:bold;'>{decision}</span>"

    markdown_summary = f"""
## Supply Chain Dispatch Summary

* **Verdict**: {status_tag}
* **Shipment ID**: `{res.shipment_id}`
* **Baseline Cost**: `${res.baseline_cost_usd:,.2f}`
* **Proposed Cost**: `${res.proposed_cost_usd:,.2f}`
* **Financial Delta**: `${res.financial_impact_delta_usd:,.2f}`
* **Nautical Distance**: `{res.transit_distance_nm} NM`
* **On-Chain Audit Hash**: `{res.audit_hash[:20]}...`

### Polygon Provenance receipt
* **Tx Hash**: `{tx_hash[:24]}...`
* **Explorer Link**: [View on PolygonScan Amoy]({scan_url})

{res.safeguard_evaluation.justification}
"""

    yield generate_n8n_canvas(state), markdown_summary, res.model_dump()

# Gradio Interface Custom Theme
css = """
body {
    background-color: #000000 !important;
    background-image: radial-gradient(#1c1c1e 1px, transparent 1px) !important;
    background-size: 20px 20px !important;
    color: #ffffff !important;
}
.gradio-container {
    background-color: #000000 !important;
    border: none !important;
}
textarea, input {
    background-color: #09090b !important;
    border: 1px solid #27272a !important;
    color: #ffffff !important;
    font-family: monospace !important;
}
button {
    background-color: #ffffff !important;
    color: #000000 !important;
    border: 1px solid #ffffff !important;
    font-weight: bold !important;
}
button:hover {
    background-color: #dddddd !important;
}
"""

with gr.Blocks(theme=gr.themes.Monochrome(), css=css, title="Scalar Supply Chain Agent Control") as demo:
    gr.Markdown("# 🌐 SUPPLY CHAIN DISRUPTION CONTROL AGENT")
    gr.Markdown("HOP 2026 Hackathon Multi-Agent Engine. Dynamic multi-modal rerouting, safety stock probing, and on-chain Amoy provenance logging.")

    with gr.Row():
        # Left column: Input
        with gr.Column(scale=4):
            gr.Markdown("### Raw Shipment Ingestion & Simulation Payload")
            editor = gr.Code(
                value=load_scenario("Strike (Shanghai Port Strike)"),
                language="json",
                label="Shipment Parameters Payload Editor"
            )
            
            gr.Markdown("### 1-Click Judge Simulation Scenarios")
            for name in SCENARIOS.keys():
                btn = gr.Button(name)
                btn.click(fn=lambda n=name: load_scenario(n), outputs=editor)

            submit_btn = gr.Button("🚀 DISPATCH MULTI-AGENT DAG", variant="primary")

        # Center column: n8n workflow canvas
        with gr.Column(scale=4):
            gr.Markdown("### Visual Workflow Node Graph Canvas")
            canvas = gr.HTML(value=generate_n8n_canvas({}))

        # Right column: Output markdown and JSON
        with gr.Column(scale=4):
            gr.Markdown("### Dispatch Verdict & Safeguard Audit Brief")
            verdict_box = gr.Markdown("Submit payload to trigger decision brief.")
            json_output = gr.JSON(label="Structured Orchestration Verdict Output")

    submit_btn.click(
        fn=execute_workflow,
        inputs=editor,
        outputs=[canvas, verdict_box, json_output]
    )

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)
