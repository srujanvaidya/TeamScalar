import logging
import urllib.parse
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel, ValidationError

from src.contracts.schemas import UnifiedDisruptionEvent, EventSource, Severity
from src.llm.client import BaseLLMClient, get_llm_client

logger = logging.getLogger(__name__)

# Standard Port and Corridor GPS coordinates mappings
PORT_COORDINATE_MAP = {
    "PORT_SHANGHAI_01": (31.2304, 121.4737),
    "PORT_ROTTERDAM_02": (51.9244, 4.4777),
    "CORRIDOR_SUEZ_CANAL": (30.5852, 32.2654),
    "PORT_LOS_ANGELES": (33.7292, -118.2620),
    "PORT_ROTTERDAM": (51.9244, 4.4777),
    "PORT_SHANGHAI": (31.2304, 121.4737),
}

# High-fidelity synthetic fallback incidents
SYNTHETIC_INCIDENTS = [
    {
        "title": "Shanghai Port Labor Strike Causes Severe Cargo Backlog",
        "url": "https://synthetic-shipping-news.logistics/shanghai-strike",
        "text": "A sudden labor dispute at Shanghai Port (PORT_SHANGHAI_01) has halted operations. Hundreds of container ships are anchored offshore, causing an estimated delay of 48 hours for eastbound shipments.",
        "timestamp": "2026-08-22T12:00:00Z"
    },
    {
        "title": "Suez Canal Blockade: Grounded Container Vessel Restricts Maritime Flow",
        "url": "https://synthetic-shipping-news.logistics/suez-blockade",
        "text": "Authorities report that a large container ship has run aground near the southern entrance of the Suez Canal (CORRIDOR_SUEZ_CANAL). All transit routes are blocked, threatening high delay impact.",
        "timestamp": "2026-08-22T13:30:00Z"
    },
    {
        "title": "Rotterdam Customs System Halt Freezes Import Verifications",
        "url": "https://synthetic-shipping-news.logistics/rotterdam-halt",
        "text": "A severe database outage at Rotterdam Customs (PORT_ROTTERDAM_02) has frozen import clearances. Standard processing times are delayed by 24 hours.",
        "timestamp": "2026-08-22T14:45:00Z"
    }
]

class NewsSemanticParserAgent:
    def __init__(self, llm_client: Optional[BaseLLMClient] = None):
        self.llm_client = llm_client or get_llm_client()

    async def fetch_live_alerts(
        self,
        query: str = "port strike OR maritime delay OR blockade",
        max_records: int = 5
    ) -> List[Dict[str, Any]]:
        """Fetch news articles using GDELT API or fallback to synthetic incidents."""
        encoded_query = urllib.parse.quote(query)
        api_url = f"https://api.gdeltproject.org/api/v2/doc/doc?query={encoded_query}&mode=artlist&format=json"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(api_url, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    articles = data.get("articles", [])
                    results = []
                    for art in articles[:max_records]:
                        results.append({
                            "title": art.get("title", ""),
                            "url": art.get("url", ""),
                            "text": art.get("title", "") + " - " + art.get("url", ""),
                            "timestamp": art.get("seendate", datetime.utcnow().isoformat())
                        })
                    if results:
                        return results
                    logger.warning("GDELT returned empty articles. Falling back to synthetic fixtures.")
                else:
                    logger.warning(f"GDELT API status {response.status_code}. Falling back to synthetic fixtures.")
        except Exception as e:
            logger.warning(f"GDELT fetch failed ({e}). Falling back to synthetic fixtures.")

        # Return synthetic fixtures on network error or empty responses
        return SYNTHETIC_INCIDENTS[:max_records]

    async def parse_article(
        self,
        raw_text: str,
        source_url: str = "",
        timestamp: Optional[datetime] = None
    ) -> UnifiedDisruptionEvent:
        """Parse raw text to output a validated UnifiedDisruptionEvent using LLMClient."""
        event_time = timestamp or datetime.utcnow()
        
        prompt = (
            f"Analyze the following logistics/shipping news item and extract disruption details:\n"
            f"--- NEWS ITEM ---\n{raw_text}\n-----------------\n"
            f"Associate the node ID where possible from: PORT_SHANGHAI_01, PORT_ROTTERDAM_02, CORRIDOR_SUEZ_CANAL, PORT_LOS_ANGELES.\n"
        )
        
        system_prompt = (
            "You are a parser converting shipping disruption alerts into UnifiedDisruptionEvent schemas. "
            "Always output fields matching the schema JSON format."
        )

        try:
            event = await self.llm_client.generate_structured(
                prompt=prompt,
                schema=UnifiedDisruptionEvent,
                system_prompt=system_prompt
            )
            # Ensure correct source type and override if the LLM output parsed it incorrectly
            event.source = EventSource.NEWS
            event.timestamp = event_time
            if source_url:
                event.metadata["source_url"] = source_url

            # Map coordinates from standard nodes if not populated
            if event.affected_nodes:
                node = event.affected_nodes[0]
                if node in PORT_COORDINATE_MAP:
                    event.latitude, event.longitude = PORT_COORDINATE_MAP[node]

            return event

        except Exception as e:
            logger.warning(f"Failed to parse news with LLM ({e}). Invoking fallback validation.")
            
            # Simple heuristic regex matcher to build a safe fallback UnifiedDisruptionEvent
            severity = Severity.LOW
            event_type = "disruption"
            affected_nodes = []
            delay = 0.0
            
            text_lower = raw_text.lower()
            if "strike" in text_lower:
                event_type = "Labor Strike"
                severity = Severity.HIGH
            elif "blockade" in text_lower or "grounded" in text_lower:
                event_type = "Blockade"
                severity = Severity.CRITICAL

            for node_key in PORT_COORDINATE_MAP.keys():
                if node_key.lower() in text_lower:
                    affected_nodes.append(node_key)

            lat, lon = None, None
            if affected_nodes:
                lat, lon = PORT_COORDINATE_MAP.get(affected_nodes[0], (None, None))

            # Basic delay parsing
            delay_match = re.search(r"(\d+)\s*-?\s*hours?\s+delays?", text_lower)
            if delay_match:
                delay = float(delay_match.group(1))

            fallback_data = {
                "event_id": f"evt_fallback_{int(event_time.timestamp())}",
                "source": EventSource.NEWS,
                "event_type": event_type,
                "severity": severity,
                "confidence": 0.3,
                "timestamp": event_time,
                "latitude": lat,
                "longitude": lon,
                "affected_nodes": affected_nodes,
                "estimated_delay_hours": delay,
                "description": f"Fallback parse: {raw_text[:120]}...",
                "metadata": {"fallback_parsed": True, "error": str(e), "source_url": source_url}
            }
            return UnifiedDisruptionEvent(**fallback_data)
