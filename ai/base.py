from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseAIProvider(ABC):
    """
    Abstract Base Class for all AI Providers.
    Ensures provider-agnostic interchangeability and deterministic fallback resilience.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Identifier name of the provider (e.g. 'openai', 'gemini', 'deterministic_fallback')."""
        pass

    @abstractmethod
    async def analyze_growth_telemetry(self, snapshot: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes a verified application metrics snapshot and returns structured copilot insights:
        - status: str (ON TRACK | AT RISK | OFF TRACK)
        - observations: List[str]
        - diagnosis: List[str]
        - recommendations: List[Dict[str, Any]] (observation, diagnosis, action, expected_impact, priority, confidence)
        - experiments: List[Dict[str, Any]] (name, hypothesis, metric)
        - risks: List[str]
        - priority_actions: List[str]
        - confidence: str (HIGH | MEDIUM | LOW)
        """
        pass

    @abstractmethod
    async def generate_response(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generates a text completion for a given user prompt."""
        pass

    @abstractmethod
    async def generate_viral_hook(self, college_name: str, branch: str) -> Dict[str, Any]:
        """Generates personalized viral share copy for WhatsApp groups based on student profile."""
        pass

    @abstractmethod
    async def simulate_project_outcome(self, user_interest: str) -> Dict[str, Any]:
        """Simulates what project output a student will achieve during the 60-minute workshop."""
        pass
