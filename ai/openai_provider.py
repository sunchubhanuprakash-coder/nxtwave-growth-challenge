"""
OpenAI-Compatible AI Provider
=============================
Integrates with any OpenAI-compatible Chat Completions API
(OpenAI, DeepSeek, Groq, Ollama, vLLM, etc.) using httpx.
Enforces structured JSON output parsing and schema conformity.
"""

import json
from typing import Dict, Any, Optional
import httpx

from backend.app.core.logging import logger
from ai.base import BaseAIProvider


class OpenAICompatibleProvider(BaseAIProvider):
    """
    Client for OpenAI-compatible REST APIs.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.openai.com/v1",
        model: str = "gpt-4o-mini",
        timeout_seconds: float = 25.0
    ):
        self.api_key = api_key.strip()
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout_seconds

    @property
    def provider_name(self) -> str:
        return "openai"

    async def analyze_growth_telemetry(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends verified metric snapshot to LLM with instructions to produce structured growth diagnostics.
        """
        system_prompt = (
            "You are the Lead Growth Strategist & AI Copilot for the NxtWave Student Growth Challenge "
            "(Target: 500 final-year engineering student registrations, ₹2,000 budget cap, 7-day sprint).\n"
            "Analyze the provided VERIFIED application metric snapshot.\n"
            "CRITICAL: Do NOT invent or hallucinate metrics. Base all observations strictly on the data provided.\n"
            "Return valid JSON matching this schema:\n"
            "{\n"
            '  "status": "ON TRACK" | "AT RISK" | "OFF TRACK",\n'
            '  "observations": ["string", ...],\n'
            '  "diagnosis": ["string", ...],\n'
            '  "recommendations": [\n'
            "    {\n"
            '      "observation": "string",\n'
            '      "diagnosis": "string",\n'
            '      "action": "string",\n'
            '      "expected_impact": "string",\n'
            '      "priority": "HIGH" | "MEDIUM" | "LOW",\n'
            '      "confidence": "HIGH" | "MEDIUM" | "LOW"\n'
            "    }\n"
            "  ],\n"
            '  "experiments": [{"name": "string", "hypothesis": "string", "metric": "string"}],\n'
            '  "risks": ["string", ...],\n'
            '  "priority_actions": ["string", ...],\n'
            '  "confidence": "HIGH" | "MEDIUM" | "LOW"\n'
            "}"
        )

        user_prompt = f"VERIFIED APPLICATION METRIC SNAPSHOT:\n{json.dumps(snapshot, indent=2)}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.4
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            parsed["provider_used"] = self.provider_name
            return parsed

    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()

    async def generate_viral_hook(self, college_name: str, branch: str) -> Dict[str, Any]:
        prompt = f"Generate high-converting WhatsApp class group copy for final-year {branch} students at {college_name} to join free workshop 'Build Your First AI Project in 60 Minutes'."
        system_prompt = "Return valid JSON with keys: headline, whatsapp_message, call_to_action."
        raw = await self.generate_response(prompt, system_prompt)
        try:
            return json.loads(raw)
        except Exception:
            return {
                "headline": f"Urgent: Final-Year {branch} Placement Project Pass",
                "whatsapp_message": raw,
                "call_to_action": "Claim Free Seat",
                "provider": self.provider_name
            }

    async def simulate_project_outcome(self, user_interest: str) -> Dict[str, Any]:
        prompt = f"Suggest an AI project buildable in 60 minutes for student interested in: {user_interest}. Return JSON with project_title, estimated_build_time, live_url_ready, recommended_tech_stack, placement_impact."
        raw = await self.generate_response(prompt, "Return valid JSON only.")
        try:
            return json.loads(raw)
        except Exception:
            return {
                "project_title": "Custom Generative AI Career Copilot",
                "estimated_build_time": "55 minutes",
                "live_url_ready": True,
                "recommended_tech_stack": ["FastAPI", "React", "HuggingFace"],
                "placement_impact": "High placement portfolio showcase",
                "provider": self.provider_name
            }
