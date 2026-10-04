import asyncio
from ai.fallback import DeterministicFallbackProvider


def test_ai_fallback_response():
    provider = DeterministicFallbackProvider()
    response = asyncio.run(provider.generate_response("Tell me about the workshop"))
    assert "Build Your First AI Project in 60 Minutes" in response


def test_ai_fallback_viral_hook():
    provider = DeterministicFallbackProvider()
    hook = asyncio.run(provider.generate_viral_hook("IIT Madras", "Computer Science"))
    assert "headline" in hook
    assert "whatsapp_message" in hook
    assert "IIT Madras" in hook["whatsapp_message"]
    assert "COMPUTER SCIENCE" in hook["headline"]


def test_ai_fallback_simulation():
    provider = DeterministicFallbackProvider()
    outcome = asyncio.run(provider.simulate_project_outcome("finance and stocks"))
    assert "project_title" in outcome
    assert "55 minutes" in outcome["estimated_build_time"]
    assert outcome["live_url_ready"] is True

