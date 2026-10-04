"""
Google Gemini AI Provider
=========================
Integrates with Google Gemini REST API (`generateContent`) using httpx.
Extracts structured JSON responses with failover protection.
"""

import json
from typing import Dict, Any, Optional
import httpx

from backend.app.core.logging import logger
from ai.base import BaseAIProvider


class GeminiProvider(BaseAIProvider):
    """
    Client for Google Gemini API.
    """

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-1.5-flash",
        timeout_seconds: float = 25.0
    ):
        self.api_key = api_key.strip()
        self.model = model
        self.timeout = timeout_seconds
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def analyze_growth_telemetry(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        system_instruction = (
            "You are the Lead Growth Strategist & AI Copilot for the NxtWave Student Growth Challenge. "
            "Analyze the provided verified application metric snapshot strictly without hallucinating metrics. "
            "Return valid JSON matching the exact schema with keys: status, observations, diagnosis, "
            "recommendations (each with observation, diagnosis, action, expected_impact, priority, confidence), "
            "experiments (name, hypothesis, metric), risks, priority_actions, confidence."
        )

        user_content = f"{system_instruction}\n\nVERIFIED METRIC SNAPSHOT:\n{json.dumps(snapshot, indent=2)}"

        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [
                {
                    "parts": [{"text": user_content}]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.4
            }
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(raw_text)
            parsed["provider_used"] = self.provider_name
            return parsed

    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
        text_content = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        payload = {
            "contents": [{"parts": [{"text": text_content}]}],
            "generationConfig": {"temperature": 0.7}
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, headers={"Content-Type": "application/json"}, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    async def generate_viral_hook(self, college_name: str, branch: str) -> Dict[str, Any]:
        prompt = f"Generate high-converting WhatsApp class group copy for final-year {branch} students at {college_name} to join free workshop 'Build Your First AI Project in 60 Minutes'. Return JSON with headline, whatsapp_message, call_to_action."
        raw = await self.generate_response(prompt, "Return valid JSON only.")
        try:
            return json.loads(raw)
        except Exception:
            return {
                "headline": f"Exclusive: Final-Year {branch} AI Workshop Pass",
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
                "project_title": "AI Knowledge Agent & Resume Chatbot",
                "estimated_build_time": "55 minutes",
                "live_url_ready": True,
                "recommended_tech_stack": ["FastAPI", "React", "Gemini API"],
                "placement_impact": "Direct portfolio deployment",
                "provider": self.provider_name
            }
