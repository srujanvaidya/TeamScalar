import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional
from src.agents.agent_5 import FinancialRiskSafeguardAgent
from src.contracts.schemas import RiskSafeguardEvaluation

app = FastAPI(
    title="HOP 2026 // Agent 5 - Financial & Risk Safeguard Engine",
    description="Microservice agent for executing deterministic financial risk gates and safety protocols."
)

agent = FinancialRiskSafeguardAgent()

class PlanEvaluationRequest(BaseModel):
    plan_id: str
    baseline_cost_usd: float
    proposed_cost_usd: float
    hazmat_compliant: bool = True
    sla_deadline_breached: bool = False
    sla_penalty_usd: float = 0.0
    context_notes: Optional[str] = ""

@app.get("/health")
def health_check():
    return {"status": "healthy", "agent": "5 - Financial & Risk Safeguard"}

@app.post("/api/v1/agent5/evaluate", response_model=RiskSafeguardEvaluation)
async def evaluate_logistics_plan(payload: PlanEvaluationRequest):
    try:
        evaluation = await agent.evaluate_plan(
            plan_id=payload.plan_id,
            baseline_cost_usd=payload.baseline_cost_usd,
            proposed_cost_usd=payload.proposed_cost_usd,
            hazmat_compliant=payload.hazmat_compliant,
            sla_deadline_breached=payload.sla_deadline_breached,
            sla_penalty_usd=payload.sla_penalty_usd,
            context_notes=payload.context_notes or ""
        )
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/demo/auto-approve", response_model=RiskSafeguardEvaluation)
async def demo_auto_approve():
    # Scenario A: Standard low-cost deviation (+$8,200) -> AUTO_APPROVE
    return await agent.evaluate_plan(
        plan_id="plan_auto_approve_demo",
        baseline_cost_usd=42000.0,
        proposed_cost_usd=50200.0,
        hazmat_compliant=True,
        sla_deadline_breached=False,
        context_notes="Standard rerouting due to minor harbor traffic swell."
    )

@app.get("/demo/hitl-escalation", response_model=RiskSafeguardEvaluation)
async def demo_hitl_escalation():
    # Scenario B: Severe Shanghai reroute (+$64,200) -> HUMAN_APPROVAL_REQUIRED
    return await agent.evaluate_plan(
        plan_id="plan_hitl_demo",
        baseline_cost_usd=120000.0,
        proposed_cost_usd=184200.0,
        hazmat_compliant=True,
        sla_deadline_breached=True,
        sla_penalty_usd=25000.0,
        context_notes="Rerouting via Cape of Good Hope due to Shanghai port strike."
    )

@app.get("/demo/hazmat-reject", response_model=RiskSafeguardEvaluation)
async def demo_hazmat_reject():
    # Scenario C: Route traversing restricted waterways with Class 3 Flammables -> REJECT_ROUTE
    return await agent.evaluate_plan(
        plan_id="plan_hazmat_demo",
        baseline_cost_usd=75000.0,
        proposed_cost_usd=92000.0,
        hazmat_compliant=False,
        sla_deadline_breached=False,
        context_notes="Rerouting through restricted inner-harbor canal carrying Class 3 flammables."
    )

@app.get("/", response_class=HTMLResponse)
async def root_dashboard():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Agent 5 - Operator Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
        <style>
            body {
                background: linear-gradient(135deg, #0b0f19, #020617);
                color: #f8fafc;
                font-family: 'Outfit', sans-serif;
                margin: 0;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
            }
            .dashboard-container {
                max-width: 1000px;
                width: 100%;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 40px;
            }
            .logo {
                font-size: 2.2rem;
                font-weight: 600;
                background: linear-gradient(to right, #38bdf8, #818cf8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .badge-operational {
                background: rgba(16, 185, 129, 0.15);
                color: #10b981;
                border: 1px solid rgba(16, 185, 129, 0.3);
                padding: 6px 16px;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 32px;
            }
            @media (max-width: 768px) {
                .grid {
                    grid-template-columns: 1fr;
                }
            }
            .card {
                background: rgba(30, 41, 59, 0.45);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 20px;
                padding: 32px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
            }
            h3 {
                margin-top: 0;
                color: #38bdf8;
                font-weight: 600;
            }
            .rule-item {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            .rule-item:last-child {
                border-bottom: none;
            }
            .rule-label {
                color: #94a3b8;
            }
            .rule-val {
                font-weight: 600;
                color: #f1f5f9;
            }
            .btn {
                background: rgba(56, 189, 248, 0.1);
                color: #38bdf8;
                border: 1px solid rgba(56, 189, 248, 0.3);
                padding: 14px 20px;
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
            .btn:hover {
                background: #38bdf8;
                color: #0f172a;
                transform: translateY(-2px);
            }
            .preview-card {
                grid-column: span 2;
            }
            @media (max-width: 768px) {
                .preview-card {
                    grid-column: span 1;
                }
            }
            .output-tabs {
                display: flex;
                gap: 12px;
                margin-bottom: 16px;
            }
            .tab-btn {
                background: transparent;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 8px 16px;
                font-weight: 600;
                border-bottom: 2px solid transparent;
            }
            .tab-btn.active {
                color: #38bdf8;
                border-bottom-color: #38bdf8;
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
            .docs-link {
                color: #94a3b8;
                text-decoration: none;
                font-weight: 600;
            }
            .docs-link:hover {
                color: #38bdf8;
            }
        </style>
        <script>
            let currentData = null;
            async function runScenario(endpoint) {
                const pre = document.getElementById("json-pre");
                pre.innerText = "Processing evaluation...";
                try {
                    const res = await fetch(endpoint);
                    const data = await res.json();
                    currentData = data;
                    showJSON();
                } catch(err) {
                    pre.innerText = "Error: " + err;
                }
            }
            function showJSON() {
                document.getElementById("tab-json").classList.add("active");
                document.getElementById("tab-just").classList.remove("active");
                document.getElementById("json-pre").innerText = JSON.stringify(currentData, null, 2);
            }
            function showJustification() {
                document.getElementById("tab-json").classList.remove("active");
                document.getElementById("tab-just").classList.add("active");
                document.getElementById("json-pre").innerText = currentData ? currentData.justification : "No data evaluated yet.";
            }
        </script>
    </head>
    <body>
        <div class="dashboard-container">
            <div class="header">
                <div>
                    <div class="logo">Scalar Agent 5</div>
                    <div style="color: #94a3b8; margin-top: 4px;">Explainable Audit & Financial Risk Safeguards</div>
                </div>
                <div>
                    <span class="badge-operational">● Operational</span>
                </div>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>Deterministic Safeguard Rules</h3>
                    <div class="rule-item">
                        <span class="rule-label">Auto-Approval Cost Limit</span>
                        <span class="rule-val">$50,000.00 USD</span>
                    </div>
                    <div class="rule-item">
                        <span class="rule-label">HazMat Compliance Block</span>
                        <span class="rule-val">Mandatory (Zero Tolerance)</span>
                    </div>
                    <div class="rule-item">
                        <span class="rule-label">SLA Deadline Violation</span>
                        <span class="rule-val">Escalate to HITL</span>
                    </div>
                    <div class="rule-item">
                        <span class="rule-label">SLA Critical Threshold</span>
                        <span class="rule-val">>$100,000.00 USD</span>
                    </div>
                    <div style="margin-top: 24px; text-align: right;">
                        <a href="/docs" class="docs-link">Interactive Swagger Docs ➔</a>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Interactive Demo Scenarios</h3>
                    <button class="btn" onclick="runScenario('/demo/auto-approve')">
                        <span>1. Nominal deviation (+$8.2k)</span>
                        <span>AUTO_APPROVE ➔</span>
                    </button>
                    <button class="btn" onclick="runScenario('/demo/hitl-escalation')">
                        <span>2. Severe deviation (+$64.2k)</span>
                        <span>HITL_ESCALATE ➔</span>
                    </button>
                    <button class="btn" onclick="runScenario('/demo/hazmat-reject')">
                        <span>3. Waterway HazMat Violation</span>
                        <span>REJECT_ROUTE ➔</span>
                    </button>
                </div>
                
                <div class="card preview-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3>Evaluation Report Output Preview</h3>
                        <div class="output-tabs">
                            <button id="tab-json" class="tab-btn active" onclick="showJSON()">Raw JSON</button>
                            <button id="tab-just" class="tab-btn" onclick="showJustification()">Justification Brief</button>
                        </div>
                    </div>
                    <pre id="json-pre">Select a scenario above to execute the safeguard checks and view the audit logs...</pre>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082)
