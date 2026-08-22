import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from typing import Optional
from src.agents.agent_0 import MasterOrchestratorAgent, ShipmentContext, OrchestrationResult

app = FastAPI(
    title="HOP 2026 // Master Orchestrator Mission Control",
    description="Central dispatch console orchestrating perception parser, environmental ingestor, and risk safeguard agents."
)

orchestrator = MasterOrchestratorAgent()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "agent_fleet": {
            "Agent 0 - Orchestrator": "healthy",
            "Agent 1A - News Parser": "healthy",
            "Agent 1B - Weather Ingestor": "healthy",
            "Agent 5 - Financial Safeguard": "healthy"
        }
    }

@app.post("/api/v1/orchestrator/dispatch", response_model=OrchestrationResult)
async def dispatch_shipment(payload: ShipmentContext):
    try:
        result = await orchestrator.run_shipment_mission(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/demo/full-mission-strike", response_model=OrchestrationResult)
async def demo_full_mission_strike():
    # Preset 1: Shanghai Strike Incident (Triggers Agent 1A -> Reroute -> Auto-Approve)
    context = ShipmentContext(
        container_id="CNTR-SHA-BOM-9921",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="ELECTRONICS",
        is_hazmat=False,
        baseline_cost_usd=42000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"]
    )
    disruption_text = "CRITICAL ALERT: Shanghai Port Dockworkers Strike has closed down Port Operations."
    return await orchestrator.run_shipment_mission(context, inject_disruption_text=disruption_text)

@app.get("/demo/full-mission-typhoon", response_model=OrchestrationResult)
async def demo_full_mission_typhoon():
    # Preset 2: Taiwan Strait Super Typhoon (Triggers Agent 1B -> Reroute -> HITL Escalation)
    context = ShipmentContext(
        container_id="CNTR-TPE-ROT-4481",
        origin_node="PORT_SHANGHAI_01",
        destination_node="PORT_ROTTERDAM_02",
        cargo_type="TEXTILES",
        is_hazmat=False,
        baseline_cost_usd=35000.0,
        sla_deadline_epoch=1787349283,
        default_corridor_path=["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"]
    )
    weather_injection = {
        "lat": 24.5,
        "lon": 119.8,
        "wind_speed_knots": 62.0,
        "wave_height_m": 7.5,
        "corridor_name": "CORRIDOR_TAIWAN_STRAIT"
    }
    return await orchestrator.run_shipment_mission(context, inject_weather=weather_injection)

@app.get("/", response_class=HTMLResponse)
async def root_dashboard():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>HOP 2026 // Mission Control Center</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
        <style>
            body {
                background: linear-gradient(135deg, #090b11, #02040a);
                color: #e2e8f0;
                font-family: 'Outfit', sans-serif;
                margin: 0;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
            }
            .container {
                max-width: 1200px;
                width: 100%;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 40px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                padding-bottom: 20px;
            }
            .title-group h1 {
                margin: 0;
                font-size: 2.2rem;
                font-weight: 600;
                background: linear-gradient(to right, #38bdf8, #818cf8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .grid {
                display: grid;
                grid-template-columns: 1fr 1.2fr;
                gap: 32px;
            }
            @media (max-width: 1024px) {
                .grid {
                    grid-template-columns: 1fr;
                }
            }
            .card {
                background: rgba(15, 23, 42, 0.6);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 20px;
                padding: 32px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            h3 {
                margin-top: 0;
                margin-bottom: 20px;
                color: #38bdf8;
                font-weight: 600;
            }
            .agent-status-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                margin-bottom: 24px;
            }
            .agent-badge {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                padding: 12px;
                border-radius: 12px;
                text-align: center;
            }
            .agent-badge .name {
                font-size: 0.8rem;
                color: #94a3b8;
                display: block;
                margin-bottom: 4px;
            }
            .agent-badge .status {
                color: #10b981;
                font-weight: 600;
                font-size: 0.9rem;
            }
            .btn-preset {
                background: rgba(56, 189, 248, 0.05);
                color: #38bdf8;
                border: 1px solid rgba(56, 189, 248, 0.2);
                padding: 16px;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
                width: 100%;
                margin-bottom: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .btn-preset:hover {
                background: #38bdf8;
                color: #090b11;
                transform: translateY(-2px);
            }
            .form-group {
                margin-bottom: 16px;
            }
            label {
                display: block;
                font-size: 0.85rem;
                color: #94a3b8;
                margin-bottom: 6px;
            }
            input[type="text"], input[type="number"], select {
                width: 100%;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 10px;
                color: white;
                box-sizing: border-box;
                font-family: inherit;
            }
            .submit-btn {
                background: #0284c7;
                color: white;
                border: none;
                padding: 14px;
                border-radius: 8px;
                width: 100%;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }
            .submit-btn:hover {
                background: #0369a1;
            }
            pre {
                background: #020617;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 20px;
                overflow-x: auto;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.9rem;
                color: #34d399;
                margin: 0;
            }
            .preview-section {
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .status-banner {
                padding: 16px;
                border-radius: 12px;
                font-weight: 600;
                margin-bottom: 16px;
                display: none;
            }
        </style>
        <script>
            async function triggerPreset(url) {
                showLoading();
                try {
                    const res = await fetch(url);
                    const data = await res.json();
                    renderResult(data);
                } catch(err) {
                    showError(err);
                }
            }
            async function submitCustom(e) {
                e.preventDefault();
                showLoading();
                const payload = {
                    container_id: document.getElementById("container_id").value,
                    origin_node: document.getElementById("origin_node").value,
                    destination_node: document.getElementById("destination_node").value,
                    cargo_type: document.getElementById("cargo_type").value,
                    is_hazmat: document.getElementById("is_hazmat").value === "true",
                    baseline_cost_usd: parseFloat(document.getElementById("baseline_cost").value),
                    sla_deadline_epoch: 1787349283,
                    default_corridor_path: ["PORT_SHANGHAI_01", "CORRIDOR_TAIWAN_STRAIT", "PORT_ROTTERDAM_02"]
                };
                try {
                    const res = await fetch("/api/v1/orchestrator/dispatch", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json();
                    renderResult(data);
                } catch(err) {
                    showError(err);
                }
            }
            function showLoading() {
                document.getElementById("status-banner").style.display = "none";
                document.getElementById("output-pre").innerText = "Dispatching shipment mission DAG...";
            }
            function showError(err) {
                document.getElementById("output-pre").innerText = "Execution error: " + err;
            }
            function renderResult(data) {
                const banner = document.getElementById("status-banner");
                banner.style.display = "block";
                banner.innerText = "VERDICT: " + data.execution_status;
                
                if(data.execution_status === "DISPATCHED_AUTONOMOUS") {
                    banner.style.background = "rgba(16, 185, 129, 0.15)";
                    banner.style.color = "#10b981";
                    banner.style.border = "1px solid rgba(16, 185, 129, 0.3)";
                } else if(data.execution_status === "HELD_FOR_HUMAN_APPROVAL") {
                    banner.style.background = "rgba(245, 158, 11, 0.15)";
                    banner.style.color = "#f59e0b";
                    banner.style.border = "1px solid rgba(245, 158, 11, 0.3)";
                } else {
                    banner.style.background = "rgba(239, 68, 68, 0.15)";
                    banner.style.color = "#ef4444";
                    banner.style.border = "1px solid rgba(239, 68, 68, 0.3)";
                }
                
                document.getElementById("output-pre").innerText = JSON.stringify(data, null, 2);
            }
        </script>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="title-group">
                    <h1>Scalar Master Mission Control</h1>
                    <div style="color: #94a3b8; margin-top: 4px;">Unified Autonomous Logistics & Threat Routing DAG</div>
                </div>
                <a href="/docs" style="color: #38bdf8; text-decoration: none; font-weight: 600;">Swagger docs ➔</a>
            </div>

            <div class="agent-status-grid">
                <div class="agent-badge"><span class="name">Orchestrator</span><span class="status">Agent 0</span></div>
                <div class="agent-badge"><span class="name">Semantic News</span><span class="status">Agent 1A</span></div>
                <div class="agent-badge"><span class="name">Weather Ingest</span><span class="status">Agent 1B</span></div>
                <div class="agent-badge"><span class="name">Risk Safeguard</span><span class="status">Agent 5</span></div>
            </div>

            <div class="grid">
                <div style="display: flex; flex-direction: column; gap: 32px;">
                    <div class="card">
                        <h3>Simulate Mission Presets</h3>
                        <button class="btn-preset" onclick="triggerPreset('/demo/full-mission-strike')">
                            <span>Preset 1: Shanghai Port Strike</span>
                            <span>AUTO_APPROVE ➔</span>
                        </button>
                        <button class="btn-preset" onclick="triggerPreset('/demo/full-mission-typhoon')">
                            <span>Preset 2: Taiwan Strait Typhoon</span>
                            <span>HITL_ESCALATE ➔</span>
                        </button>
                        <button class="btn-preset" onclick="triggerPreset('/api/v1/orchestrator/dispatch')">
                            <span>Preset 3: HazMat Route Violation</span>
                            <span>REJECT_ROUTE ➔</span>
                        </button>
                    </div>

                    <div class="card">
                        <h3>Custom Journey Dispatcher</h3>
                        <form onsubmit="submitCustom(event)">
                            <div class="form-group">
                                <label>Container ID</label>
                                <input type="text" id="container_id" value="CNTR-DEV-1002" required>
                            </div>
                            <div class="form-group">
                                <label>Origin Node</label>
                                <input type="text" id="origin_node" value="PORT_SHANGHAI_01" required>
                            </div>
                            <div class="form-group">
                                <label>Destination Node</label>
                                <input type="text" id="destination_node" value="PORT_ROTTERDAM_02" required>
                            </div>
                            <div class="form-group">
                                <label>Cargo Classification</label>
                                <input type="text" id="cargo_type" value="GENERAL_CARGO" required>
                            </div>
                            <div class="form-group">
                                <label>HazMat Present</label>
                                <select id="is_hazmat">
                                    <option value="false">No (Nominal Transit)</option>
                                    <option value="true">Yes (Restricted Waterways)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Baseline Cost (USD)</label>
                                <input type="number" id="baseline_cost" value="45000" required>
                            </div>
                            <button type="submit" class="submit-btn">Dispatch Shipment mission</button>
                        </form>
                    </div>
                </div>

                <div class="preview-section">
                    <div id="status-banner" class="status-banner">VERDICT: PENDING</div>
                    <div class="card" style="flex-grow: 1; display: flex; flex-direction: column;">
                        <h3>Execution Console Output</h3>
                        <pre id="output-pre" style="flex-grow: 1;">Trigger a preset simulator or dispatch a custom journey container to view pipeline logs...</pre>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
