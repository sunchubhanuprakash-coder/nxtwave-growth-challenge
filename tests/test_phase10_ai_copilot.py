"""
Phase 10: Comprehensive Unit & Integration Tests for AI Growth Copilot
======================================================================
Tests:
- Verified Metric Snapshot generation (11 mandatory elements, zero hallucination)
- Provider abstraction and deterministic fallback resilience
- Structured JSON output validation (status, observations, diagnosis, recommendations, experiments, risks, priority_actions, confidence)
- Recommendation item completeness (observation, diagnosis, action, expected_impact, priority, confidence)
- Database persistence in ai_insights table
- Live FastAPI Copilot endpoints
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from database.session import SessionLocal
from database.models import AIInsight
from ai.base import BaseAIProvider
from ai.fallback import DeterministicFallbackProvider
from ai.provider import FallbackWrapper, get_ai_provider
from ai.copilot import GrowthCopilotEngine


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==============================================================================
# 1. UNIT TESTS: Verified Metric Snapshot Generation (11 Elements)
# ==============================================================================
def test_build_metric_snapshot_completeness(db_session):
    snapshot = GrowthCopilotEngine.build_metric_snapshot(db_session)

    # Verify all 11 mandatory elements required by the challenge
    assert "registration_progress" in snapshot
    assert "target" in snapshot
    assert "days_remaining" in snapshot
    assert "registration_velocity" in snapshot
    assert "channel_performance" in snapshot
    assert "referral_rate" in snapshot
    assert "conversion" in snapshot
    assert "budget" in snapshot
    assert "college_performance" in snapshot
    assert "funnel_dropoff" in snapshot
    assert "forecast" in snapshot

    # Verify specific factual integrity (anti-hallucination)
    reg_prog = snapshot["registration_progress"]
    assert reg_prog["target_registrations"] == 500
    assert reg_prog["current_registrations"] >= 0
    assert snapshot["target"] == 500

    # Budget values match the strict ₹2,000 cap
    budget = snapshot["budget"]
    assert budget["budget_cap_inr"] == 2000.0
    assert budget["total_spent_inr"] <= 2000.0

    # Funnel stages exist
    assert len(snapshot["funnel_dropoff"]) >= 4

    # Channels and colleges exist
    assert len(snapshot["channel_performance"]) >= 1
    assert len(snapshot["college_performance"]) >= 1


# ==============================================================================
# 2. UNIT TESTS: Deterministic Fallback Provider & Structured JSON Output
# ==============================================================================
@pytest.mark.anyio
async def test_deterministic_fallback_structured_output(db_session):
    snapshot = GrowthCopilotEngine.build_metric_snapshot(db_session)
    provider = DeterministicFallbackProvider()

    analysis = await provider.analyze_growth_telemetry(snapshot)

    # 1. Status
    assert analysis["status"] in ["ON TRACK", "AT RISK", "OFF TRACK"]

    # 2. Observations list
    assert isinstance(analysis["observations"], list)
    assert len(analysis["observations"]) >= 3

    # 3. Diagnosis list
    assert isinstance(analysis["diagnosis"], list)
    assert len(analysis["diagnosis"]) >= 3

    # 4. Recommendations list
    assert isinstance(analysis["recommendations"], list)
    assert len(analysis["recommendations"]) >= 3

    # Every recommendation must include all 6 required fields:
    # Observation, Diagnosis, Action, Expected impact, Priority, Confidence
    for rec in analysis["recommendations"]:
        assert "observation" in rec and len(rec["observation"]) > 0
        assert "diagnosis" in rec and len(rec["diagnosis"]) > 0
        assert "action" in rec and len(rec["action"]) > 0
        assert "expected_impact" in rec and len(rec["expected_impact"]) > 0
        assert rec["priority"] in ["HIGH", "MEDIUM", "LOW"]
        assert rec["confidence"] in ["HIGH", "MEDIUM", "LOW"]

    # 5. Experiments
    assert isinstance(analysis["experiments"], list)
    for exp in analysis["experiments"]:
        assert "name" in exp
        assert "hypothesis" in exp
        assert "metric" in exp

    # 6. Risks
    assert isinstance(analysis["risks"], list)
    assert len(analysis["risks"]) >= 2

    # 7. Priority actions
    assert isinstance(analysis["priority_actions"], list)
    assert len(analysis["priority_actions"]) >= 2

    # 8. Confidence
    assert analysis["confidence"] in ["HIGH", "MEDIUM", "LOW"]
    assert analysis["is_estimate"] is True


# ==============================================================================
# 3. UNIT TESTS: Failover Wrapper Resilience (Must work without API key)
# ==============================================================================
class MockFailingProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "mock_failing"

    async def analyze_growth_telemetry(self, snapshot):
        raise ConnectionError("Mock external API connection failed or rate limited.")

    async def generate_response(self, prompt, system_prompt=None):
        raise TimeoutError("Network timeout.")

    async def generate_viral_hook(self, college_name, branch):
        raise RuntimeError("Quota exceeded.")

    async def simulate_project_outcome(self, user_interest):
        raise RuntimeError("API key invalid.")


@pytest.mark.anyio
async def test_fallback_wrapper_failover(db_session):
    snapshot = GrowthCopilotEngine.build_metric_snapshot(db_session)
    failing = MockFailingProvider()
    fallback = DeterministicFallbackProvider()

    wrapper = FallbackWrapper(primary=failing, fallback=fallback)
    result = await wrapper.analyze_growth_telemetry(snapshot)

    # Should not crash, and should return valid structured analysis from fallback
    assert result["status"] in ["ON TRACK", "AT RISK", "OFF TRACK"]
    assert len(result["recommendations"]) >= 1
    assert result.get("fallback_triggered") is True
    assert "Mock external API connection failed" in result.get("fallback_reason", "")


# ==============================================================================
# 4. INTEGRATION TESTS: Database Persistence of Insights
# ==============================================================================
@pytest.mark.anyio
async def test_copilot_analysis_persistence_in_db(db_session):
    initial_count = db_session.query(AIInsight).count()

    analysis = await GrowthCopilotEngine.run_copilot_analysis(db_session)

    assert "insight_id" in analysis
    assert analysis["insight_id"] is not None

    # Check database record
    new_count = db_session.query(AIInsight).count()
    assert new_count == initial_count + 1

    stored_record = db_session.query(AIInsight).filter(AIInsight.id == analysis["insight_id"]).first()
    assert stored_record is not None
    assert stored_record.topic == "GROWTH_COPILOT_AUDIT"
    assert "AI Copilot Assessment" in stored_record.summary

    # Check listing stored insights
    stored_list = GrowthCopilotEngine.list_stored_insights(db_session, limit=5)
    assert len(stored_list) >= 1
    assert stored_list[0]["id"] == stored_record.id


# ==============================================================================
# 5. API ENDPOINTS TESTS
# ==============================================================================
def test_api_get_verified_metric_snapshot(client):
    res = client.get("/api/ai/copilot/snapshot")
    assert res.status_code == 200
    data = res.json()
    assert "registration_progress" in data
    assert "budget" in data
    assert data["target"] == 500


def test_api_post_run_ai_copilot_analysis(client):
    res = client.post("/api/ai/copilot/analyze")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["ON TRACK", "AT RISK", "OFF TRACK"]
    assert len(data["observations"]) >= 1
    assert len(data["diagnosis"]) >= 1
    assert len(data["recommendations"]) >= 1
    assert len(data["experiments"]) >= 1
    assert len(data["risks"]) >= 1
    assert len(data["priority_actions"]) >= 1
    assert data["confidence"] in ["HIGH", "MEDIUM", "LOW"]
    assert data["insight_id"] is not None

    # Verify each recommendation structure
    for rec in data["recommendations"]:
        assert "observation" in rec
        assert "diagnosis" in rec
        assert "action" in rec
        assert "expected_impact" in rec
        assert "priority" in rec
        assert "confidence" in rec


def test_api_get_stored_ai_insights(client):
    res = client.get("/api/ai/copilot/insights?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "insights" in data
    assert "count" in data
    assert data["count"] >= 1
    assert data["insights"][0]["topic"] == "GROWTH_COPILOT_AUDIT"
