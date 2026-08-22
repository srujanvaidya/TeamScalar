import os
import re
import json
import logging
from abc import ABC, abstractmethod
from typing import Type, Optional, Any, Dict
import httpx
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class BaseLLMClient(ABC):
    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        schema: Type[BaseModel],
        system_prompt: Optional[str] = None
    ) -> BaseModel:
        """Generate structured data parsed into a Pydantic schema model."""
        pass

class HuggingFaceClient(BaseLLMClient):
    def __init__(
        self,
        api_key: Optional[str] = None,
        model_id: Optional[str] = None
    ):
        self.api_key = api_key or os.getenv("HUGGINGFACE_API_KEY", "")
        self.model_id = model_id or os.getenv("HF_MODEL_ID", "Qwen/Qwen2.5-7B-Instruct")
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"

    def _extract_json(self, text: str) -> str:
        """Extract JSON code block or JSON substring from response text."""
        # Find markdown code blocks first
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if match:
            return match.group(1).strip()
        
        # Fallback to finding the first { or [ and last } or ]
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            return text[first_brace:last_brace + 1].strip()
            
        first_bracket = text.find("[")
        last_bracket = text.rfind("]")
        if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
            return text[first_bracket:last_bracket + 1].strip()

        return text.strip()

    async def generate_structured(
        self,
        prompt: str,
        schema: Type[BaseModel],
        system_prompt: Optional[str] = None
    ) -> BaseModel:
        if not self.api_key:
            raise ValueError("HUGGINGFACE_API_KEY is not set.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Structure the instructions and request strict JSON matching the schema
        schema_json = json.dumps(schema.model_json_schema(), indent=2)
        instruction = (
            f"You must return ONLY a valid JSON object matching the JSON schema below.\n"
            f"Do not include any extra text, conversational remarks, or preamble outside the JSON block.\n\n"
            f"JSON SCHEMA:\n{schema_json}\n\n"
        )
        
        full_system_prompt = system_prompt or "You are an AI assistant parsing supply chain events into structured objects."
        inputs = f"{full_system_prompt}\n\n{instruction}Prompt: {prompt}"

        # Standard Hugging Face conversational/generation parameter payloads
        payload = {
            "inputs": inputs,
            "parameters": {
                "max_new_tokens": 1024,
                "return_full_text": False,
                # Try to request JSON format if the backend router supports it
                "response_format": {"type": "json"}
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(self.api_url, headers=headers, json=payload, timeout=60.0)
            
            if response.status_code != 200:
                logger.error(f"HF API returned status {response.status_code}: {response.text}")
                raise RuntimeError(f"Hugging Face API error ({response.status_code}): {response.text}")

            result = response.json()
            
            # Retrieve text from HF response format (which can be a dict or list of dicts)
            response_text = ""
            if isinstance(result, list) and len(result) > 0:
                response_text = result[0].get("generated_text", "")
            elif isinstance(result, dict):
                response_text = result.get("generated_text", "")
            else:
                response_text = str(result)

            logger.debug(f"Raw HF Response: {response_text}")

            cleaned_json = self._extract_json(response_text)
            try:
                return schema.model_validate_json(cleaned_json)
            except Exception as e:
                logger.error(f"Failed to validate JSON: {cleaned_json}. Error: {e}")
                raise ValueError(f"Failed to parse model output into schema {schema.__name__}: {e}")

class MockLLMClient(BaseLLMClient):
    async def generate_structured(
        self,
        prompt: str,
        schema: Type[BaseModel],
        system_prompt: Optional[str] = None
    ) -> BaseModel:
        prompt_lower = prompt.lower()
        
        # Handle UnifiedDisruptionEvent mock data generator
        if schema.__name__ == "UnifiedDisruptionEvent":
            from src.contracts.schemas import Severity, EventSource
            
            source = EventSource.NEWS
            if "weather" in prompt_lower or "hurricane" in prompt_lower or "storm" in prompt_lower:
                source = EventSource.WEATHER
            elif "telemetry" in prompt_lower or "sensor" in prompt_lower:
                source = EventSource.TELEMETRY
            elif "simulation" in prompt_lower:
                source = EventSource.SIMULATION

            severity = Severity.MEDIUM
            if "critical" in prompt_lower:
                severity = Severity.CRITICAL
            elif "high" in prompt_lower:
                severity = Severity.HIGH
            elif "low" in prompt_lower:
                severity = Severity.LOW

            # Default mocked entity attributes
            mock_data = {
                "event_id": f"evt_{abs(hash(prompt)) % 10000:04d}",
                "source": source,
                "event_type": "disruption" if "type" not in prompt_lower else "CustomEvent",
                "severity": severity,
                "confidence": 0.95,
                "description": f"Mocked disruption event extracted from prompt: {prompt[:60]}...",
                "metadata": {"mocked": True}
            }
            
            # Simple keyword matching heuristics for events
            affected_nodes = []
            for node_key in ["PORT_SHANGHAI_01", "PORT_ROTTERDAM_02", "CORRIDOR_SUEZ_CANAL", "PORT_LOS_ANGELES"]:
                if node_key.lower() in prompt_lower:
                    affected_nodes.append(node_key)

            if "strike" in prompt_lower:
                mock_data["event_type"] = "Labor Strike"
                mock_data["affected_nodes"] = affected_nodes or ["Port of Los Angeles", "Port of Long Beach"]
                mock_data["estimated_delay_hours"] = 48.0
            elif "hurricane" in prompt_lower:
                mock_data["event_type"] = "Hurricane"
                mock_data["affected_nodes"] = affected_nodes or ["Houston Port Authority"]
                mock_data["estimated_delay_hours"] = 72.0
                mock_data["impact_radius_km"] = 150.0

            return schema(**mock_data)

        # Handle RiskSafeguardEvaluation mock data generator
        elif schema.__name__ == "RiskSafeguardEvaluation":
            from src.contracts.schemas import Severity
            
            requires_approval = "approve" not in prompt_lower or "high risk" in prompt_lower or "violation" in prompt_lower
            
            mock_data = {
                "plan_id": f"plan_{abs(hash(prompt)) % 1000:03d}",
                "baseline_cost_usd": 1000.0,
                "proposed_cost_usd": 1250.0 if requires_approval else 1050.0,
                "cost_delta_usd": 250.0 if requires_approval else 50.0,
                "sla_penalty_exposure_usd": 100.0 if requires_approval else 0.0,
                "financial_exposure_usd": 350.0 if requires_approval else 50.0,
                "hazmat_violation": "hazmat" in prompt_lower,
                "risk_level": Severity.HIGH if requires_approval else Severity.LOW,
                "requires_human_approval": requires_approval,
                "decision": "HUMAN_APPROVAL_REQUIRED" if requires_approval else "AUTO_APPROVE",
                "justification": "Mocked check: Reroute matches normal limits." if not requires_approval else "Mocked check: Cost delta exceeds limit or HazMat issue.",
                "audit_trail": ["Mock Rule Engine Initialized", "Checking bounds"]
            }
            return schema(**mock_data)

        # General Fallback
        try:
            return schema()
        except Exception:
            # If schema requires specific args, try mapping empty dictionary
            return schema.model_validate({})

def get_llm_client() -> BaseLLMClient:
    provider = os.getenv("LLM_PROVIDER", "mock").lower()
    if provider == "huggingface":
        return HuggingFaceClient()
    return MockLLMClient()
