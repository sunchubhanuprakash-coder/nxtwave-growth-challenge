"""
AI Provider Factory & Failover Layer
====================================
Configures and initializes AI providers (OpenAI, Gemini, Deterministic Fallback).
Wraps external API clients with automatic failover to the local deterministic engine.
"""

from typing import Dict, Any, Optional
from backend.app.config import settings
from backend.app.core.logging import logger
from ai.base import BaseAIProvider
from ai.fallback import DeterministicFallbackProvider
from ai.openai_provider import OpenAICompatibleProvider
from ai.gemini_provider import GeminiProvider


class FallbackWrapper(BaseAIProvider):
    """
    Wraps any external provider with automatic failover to the deterministic fallback.
    Guarantees that network timeouts, rate limits, or API key issues never crash the app.
    """
    def __init__(self, primary: BaseAIProvider, fallback: BaseAIProvider):
        self.primary = primary
        self.fallback = fallback

    @property
    def provider_name(self) -> str:
        return f"{self.primary.provider_name}_with_fallback"

    async def analyze_growth_telemetry(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        try:
            return await self.primary.analyze_growth_telemetry(snapshot)
        except Exception as e:
            logger.warning(f"Primary AI provider failed during growth telemetry analysis: {e}. Executing deterministic fallback.")
            res = await self.fallback.analyze_growth_telemetry(snapshot)
            res["fallback_triggered"] = True
            res["fallback_reason"] = str(e)
            return res

    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        try:
            return await self.primary.generate_response(prompt, system_prompt)
        except Exception as e:
            logger.warning(f"Primary AI provider failed: {e}. Executing deterministic fallback.")
            return await self.fallback.generate_response(prompt, system_prompt)

    async def generate_viral_hook(self, college_name: str, branch: str) -> Dict[str, Any]:
        try:
            return await self.primary.generate_viral_hook(college_name, branch)
        except Exception as e:
            logger.warning(f"Primary AI provider failed on viral hook: {e}. Executing deterministic fallback.")
            return await self.fallback.generate_viral_hook(college_name, branch)

    async def simulate_project_outcome(self, user_interest: str) -> Dict[str, Any]:
        try:
            return await self.primary.simulate_project_outcome(user_interest)
        except Exception as e:
            logger.warning(f"Primary AI provider failed on project outcome: {e}. Executing deterministic fallback.")
            return await self.fallback.simulate_project_outcome(user_interest)


def get_ai_provider() -> BaseAIProvider:
    """
    Factory function returning the configured AI Provider.
    Defaults safely to DeterministicFallbackProvider when API keys are absent.
    """
    fallback = DeterministicFallbackProvider()

    if settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        try:
            logger.info("Initializing OpenAI-compatible provider with live client...")
            openai_provider = OpenAICompatibleProvider(
                api_key=settings.OPENAI_API_KEY,
                model=settings.AI_MODEL_NAME
            )
            return FallbackWrapper(primary=openai_provider, fallback=fallback)
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI provider: {e}. Falling back.")
            return fallback

    elif settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        try:
            logger.info("Initializing Gemini provider with live client...")
            gemini_provider = GeminiProvider(
                api_key=settings.GEMINI_API_KEY
            )
            return FallbackWrapper(primary=gemini_provider, fallback=fallback)
        except Exception as e:
            logger.error(f"Failed to initialize Gemini provider: {e}. Falling back.")
            return fallback

    # Default to deterministic fallback (Offline / Zero-Cost)
    return fallback
