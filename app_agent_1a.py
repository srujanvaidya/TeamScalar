import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, List
from src.agents.agent_1a import NewsSemanticParserAgent
from src.contracts.schemas import UnifiedDisruptionEvent

app = FastAPI(
    title="HOP 2026 // Agent 1A - News/Semantic Event Parser",
    description="Microservice agent for parsing logistics news signals into structured UnifiedDisruptionEvents."
)

agent = NewsSemanticParserAgent()

class ParseRequest(BaseModel):
    text: str
    source_url: Optional[str] = ""

@app.get("/health")
def health_check():
    return {"status": "healthy", "agent": "Agent 1A"}

@app.post("/api/v1/agent1a/parse", response_model=UnifiedDisruptionEvent)
async def parse_text(payload: ParseRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text payload cannot be empty.")
    try:
        event = await agent.parse_article(payload.text, payload.source_url)
        return event
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/agent1a/poll-live", response_model=List[UnifiedDisruptionEvent])
async def poll_live():
    try:
        articles = await agent.fetch_live_alerts()
        parsed_events = []
        for art in articles:
            event = await agent.parse_article(
                raw_text=art["text"],
                source_url=art["url"]
            )
            parsed_events.append(event)
        return parsed_events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/demo", response_class=HTMLResponse)
async def run_demo():
    simulated_text = (
        "CRITICAL ALERT: Shanghai Port (PORT_SHANGHAI_01) has announced an immediate "
        "indefinite labor strike. Operations are halted at key container terminals. "
        "Estimated routing delays exceed 48 hours for outgoing cargo."
    )
    try:
        event = await agent.parse_article(simulated_text, "https://demo.logistics/shanghai-incident")
        json_output = event.model_dump_json(indent=2)
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Agent 1A - Simulation Demo</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
            <style>
                body {{
                    background: linear-gradient(135deg, #0f172a, #1e293b);
                    color: #f8fafc;
                    font-family: 'Outfit', sans-serif;
                    padding: 40px;
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }}
                .container {{
                    background: rgba(30, 41, 59, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 800px;
                    width: 100%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                }}
                h1 {{
                    font-weight: 600;
                    margin-top: 0;
                    color: #38bdf8;
                }}
                p {{
                    color: #94a3b8;
                    line-height: 1.6;
                }}
                .badge {{
                    background: #e11d48;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    text-transform: uppercase;
                    font-weight: bold;
                    display: inline-block;
                    margin-bottom: 16px;
                }}
                pre {{
                    background: #020617;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    padding: 20px;
                    overflow-x: auto;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.95rem;
                    color: #34d399;
                }}
                .btn {{
                    background: #0284c7;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    display: inline-block;
                    margin-top: 20px;
                    transition: background 0.2s;
                }}
                .btn:hover {{
                    background: #0369a1;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <span class="badge">Simulated Incident</span>
                <h1>Shanghai Port Strike Parsing Demo</h1>
                <p><strong>Input Text:</strong> <i>{simulated_text}</i></p>
                <h3>Parsed UnifiedDisruptionEvent JSON Output:</h3>
                <pre>{json_output}</pre>
                <a href="/" class="btn">Back to Dashboard</a>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/", response_class=HTMLResponse)
async def root_dashboard():
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Agent 1A - Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body {
                background: linear-gradient(135deg, #0f172a, #020617);
                color: #f8fafc;
                font-family: 'Outfit', sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }
            .dashboard-card {
                background: rgba(30, 41, 59, 0.7);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
            }
            .logo {
                font-size: 2.5rem;
                font-weight: 600;
                background: linear-gradient(to right, #38bdf8, #818cf8);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 8px;
            }
            .subtitle {
                color: #94a3b8;
                font-size: 1.1rem;
                margin-bottom: 32px;
            }
            .badge-operational {
                background: rgba(16, 185, 129, 0.15);
                color: #10b981;
                border: 1px solid rgba(16, 185, 129, 0.3);
                padding: 6px 12px;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 0.85rem;
                display: inline-block;
                margin-bottom: 24px;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            .links-container {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .link-card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.05);
                padding: 16px;
                border-radius: 12px;
                color: #f8fafc;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.2s ease-in-out;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .link-card:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: #38bdf8;
                transform: translateY(-2px);
            }
            .link-card span.icon {
                color: #38bdf8;
            }
        </style>
    </head>
    <body>
        <div class="dashboard-card">
            <div class="logo">Scalar Agent 1A</div>
            <div class="subtitle">News & Semantic Disruption Event Parser</div>
            <div>
                <span class="badge-operational">● Operational</span>
            </div>
            <div class="links-container">
                <a href="/docs" class="link-card">
                    <span>Swagger Interactive API Docs</span>
                    <span class="icon">➔</span>
                </a>
                <a href="/api/v1/agent1a/poll-live" class="link-card">
                    <span>Live GDELT News Ingestion</span>
                    <span class="icon">➔</span>
                </a>
                <a href="/demo" class="link-card">
                    <span>1-Click Strike Simulation Demo</span>
                    <span class="icon">➔</span>
                </a>
            </div>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
