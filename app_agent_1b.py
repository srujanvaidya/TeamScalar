import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
from src.agents.agent_1b import WeatherTelemetryAgent, CHOKEPOINTS
from src.contracts.schemas import UnifiedDisruptionEvent

app = FastAPI(
    title="HOP 2026 // Agent 1B - Environmental Telemetry & Weather Agent",
    description="Microservice agent for processing environmental metrics and sensor feeds into UnifiedDisruptionEvents."
)

agent = WeatherTelemetryAgent()

class EvaluateRequest(BaseModel):
    vessel_id: str
    lat: float
    lon: float
    wind_speed_knots: float
    wave_height_m: float = 2.0
    corridor_name: str = "CORRIDOR_TAIWAN_STRAIT"

@app.get("/health")
def health_check():
    return {"status": "healthy", "agent": "1B - Environmental Telemetry"}

@app.post("/api/v1/agent1b/evaluate", response_model=UnifiedDisruptionEvent)
async def evaluate_telemetry(payload: EvaluateRequest):
    try:
        event = await agent.evaluate_vessel_telemetry(
            vessel_id=payload.vessel_id,
            lat=payload.lat,
            lon=payload.lon,
            wind_speed_knots=payload.wind_speed_knots,
            wave_height_m=payload.wave_height_m,
            corridor_name=payload.corridor_name
        )
        return event
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/agent1b/poll-chokepoints", response_model=List[UnifiedDisruptionEvent])
async def poll_chokepoints():
    try:
        events = []
        for name, coords in CHOKEPOINTS.items():
            weather = await agent.fetch_corridor_weather(coords["lat"], coords["lon"])
            event = await agent.evaluate_vessel_telemetry(
                vessel_id="SYSTEM_MONITOR",
                lat=coords["lat"],
                lon=coords["lon"],
                wind_speed_knots=weather["wind_speed_knots"],
                wave_height_m=weather["wave_height_m"],
                corridor_name=name
            )
            events.append(event)
        return events
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/demo", response_class=HTMLResponse)
async def run_demo():
    try:
        event = await agent.evaluate_vessel_telemetry(
            vessel_id="IMO_938411",
            lat=24.5,
            lon=119.8,
            wind_speed_knots=64.5,
            wave_height_m=7.2,
            corridor_name="CORRIDOR_TAIWAN_STRAIT"
        )
        json_output = event.model_dump_json(indent=2)
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Agent 1B - Weather Simulation Demo</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
            <style>
                body {{
                    background: linear-gradient(135deg, #090d16, #111827);
                    color: #f3f4f6;
                    font-family: 'Outfit', sans-serif;
                    padding: 40px;
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }}
                .container {{
                    background: rgba(17, 24, 39, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 32px;
                    max-width: 800px;
                    width: 100%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
                }}
                h1 {{
                    font-weight: 600;
                    margin-top: 0;
                    color: #fb7185;
                }}
                p {{
                    color: #9ca3af;
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
                    background: #030712;
                    border: 1px solid #1f2937;
                    border-radius: 8px;
                    padding: 20px;
                    overflow-x: auto;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.95rem;
                    color: #fb7185;
                }}
                .btn {{
                    background: #e11d48;
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
                    background: #be123c;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <span class="badge">Simulated Weather Feed</span>
                <h1>Taiwan Strait Typhoon Evaluation Demo</h1>
                <p><strong>Conditions Evaluated:</strong> Vessel IMO_938411, Wind 64.5 knots, Waves 7.2m.</p>
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
        <title>Agent 1B - Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
            body {
                background: linear-gradient(135deg, #090d16, #030712);
                color: #f3f4f6;
                font-family: 'Outfit', sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
            }
            .dashboard-card {
                background: rgba(17, 24, 39, 0.7);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
            }
            .logo {
                font-size: 2.5rem;
                font-weight: 600;
                background: linear-gradient(to right, #fb7185, #f43f5e);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 8px;
            }
            .subtitle {
                color: #9ca3af;
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
                color: #f3f4f6;
                text-decoration: none;
                font-weight: 600;
                transition: all 0.2s ease-in-out;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .link-card:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: #fb7185;
                transform: translateY(-2px);
            }
            .link-card span.icon {
                color: #fb7185;
            }
        </style>
    </head>
    <body>
        <div class="dashboard-card">
            <div class="logo">Scalar Agent 1B</div>
            <div class="subtitle">Environmental Telemetry & Weather Agent</div>
            <div>
                <span class="badge-operational">● Operational</span>
            </div>
            <div class="links-container">
                <a href="/docs" class="link-card">
                    <span>Swagger Interactive API Docs</span>
                    <span class="icon">➔</span>
                </a>
                <a href="/api/v1/agent1b/poll-chokepoints" class="link-card">
                    <span>Poll Global Maritime Chokepoints</span>
                    <span class="icon">➔</span>
                </a>
                <a href="/demo" class="link-card">
                    <span>1-Click Typhoon Simulation Demo</span>
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
