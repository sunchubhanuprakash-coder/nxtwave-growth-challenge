"""
Phase 9: Comprehensive Unit & API Tests for Campaign Budget Engine
==================================================================
Tests:
- Strict ₹2,000 budget cap enforcement
- Editable channel allocations and boundary rejection (> ₹2,000)
- 3 Scenarios generation (Conservative, Base, Aggressive)
- Registration velocity forecasting (ON TRACK, AT RISK, OFF TRACK)
- Explicit estimate labeling and disclaimers
- Live FastAPI budget endpoints
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from database.session import SessionLocal
from database.models import CampaignSource, Campaign
from budget.engine import CampaignBudgetEngine, BudgetExceededException, MAX_CAMPAIGN_BUDGET_INR


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
# 1. UNIT TESTS: Budget Overview & Ledger Audit
# ==============================================================================
def test_budget_overview_cap_enforcement(db_session):
    overview = CampaignBudgetEngine.get_budget_overview(db_session)
    assert overview["max_budget_inr"] == 2000.0
    assert overview["total_spent_inr"] <= 2000.0
    assert overview["total_spent_inr"] >= 0.0
    assert overview["remaining_budget_inr"] >= 0.0
    assert overview["is_over_budget"] is False
    assert overview["blended_cpr_inr"] > 0.0
    assert overview["verified_cpr_inr"] > 0.0
    assert len(overview["channel_allocations"]) >= 1


# ==============================================================================
# 2. UNIT TESTS: Editable Channel Allocations & Rejection of > ₹2,000
# ==============================================================================
def test_update_allocations_within_cap(db_session):
    sources = db_session.query(CampaignSource).all()
    assert len(sources) >= 2

    # Allocate ₹500 to first, ₹400 to second, ₹0 to rest -> total ₹900 <= ₹2,000
    updates = [
        {"channel_id": sources[0].id, "allocated_inr": 500.0},
        {"channel_id": sources[1].id, "allocated_inr": 400.0},
    ]
    for s in sources[2:]:
        updates.append({"channel_id": s.id, "allocated_inr": 0.0})

    updated_overview = CampaignBudgetEngine.update_channel_allocations(updates, db_session)
    assert updated_overview["total_allocated_inr"] == 900.0
    assert updated_overview["unallocated_budget_inr"] == 1100.0


def test_update_allocations_exceeding_cap_rejected(db_session):
    sources = db_session.query(CampaignSource).all()
    # Attempt to allocate ₹1,500 + ₹1,000 = ₹2,500 > ₹2,000
    updates = [
        {"channel_id": sources[0].id, "allocated_inr": 1500.0},
        {"channel_id": sources[1].id, "allocated_inr": 1000.0},
    ]
    with pytest.raises(BudgetExceededException) as excinfo:
        CampaignBudgetEngine.update_channel_allocations(updates, db_session)

    assert "exceeds the maximum ₹2,000.00" in str(excinfo.value)


def test_update_allocations_negative_rejected(db_session):
    sources = db_session.query(CampaignSource).all()
    updates = [{"channel_id": sources[0].id, "allocated_inr": -100.0}]
    with pytest.raises(ValueError):
        CampaignBudgetEngine.update_channel_allocations(updates, db_session)


# Restore original standard allocations
def test_restore_standard_allocations(db_session):
    sources = db_session.query(CampaignSource).all()
    # 600, 600, 500, 0, 0
    std_map = {
        "whatsapp": 0.0,
        "ambassador_cbit": 600.0,
        "ambassador_vnr": 600.0,
        "telegram": 500.0,
        "linkedin": 0.0
    }
    updates = []
    for s in sources:
        amt = std_map.get(s.utm_source, 0.0)
        updates.append({"channel_id": s.id, "allocated_inr": amt})

    overview = CampaignBudgetEngine.update_channel_allocations(updates, db_session)
    assert overview["total_allocated_inr"] <= 2000.0


# ==============================================================================
# 3. UNIT TESTS: 3 Scenarios Generation
# ==============================================================================
def test_generate_scenarios():
    scenarios = CampaignBudgetEngine.generate_scenarios(
        current_registrations=520,
        total_spend_inr=2000.0,
        target_registrations=500
    )
    assert len(scenarios) == 3
    names = [s["scenario_name"] for s in scenarios]
    assert "Conservative" in names
    assert "Base" in names
    assert "Aggressive" in names

    for s in scenarios:
        assert s["is_estimate"] is True
        assert s["expected_cost"] <= 2000.0  # Budget cap must hold
        assert s["expected_registrations"] > 0
        assert s["expected_cpr"] > 0.0
        assert "risk_indicator" in s
        assert "probability_percent" in s

    # Base scenario expected registrations should achieve target 500
    base_scen = next(s for s in scenarios if s["scenario_name"] == "Base")
    assert base_scen["expected_registrations"] >= 500
    assert base_scen["risk_indicator"] == "Low Risk"

    # Aggressive scenario has highest upside registrations and lowest CPR
    agg_scen = next(s for s in scenarios if s["scenario_name"] == "Aggressive")
    assert agg_scen["expected_registrations"] > base_scen["expected_registrations"]
    assert agg_scen["expected_cpr"] < base_scen["expected_cpr"]


# ==============================================================================
# 4. UNIT TESTS: Registration Velocity Forecasting Engine
# ==============================================================================
def test_velocity_forecast_on_track():
    # Pacing well ahead: 350 registrations, 3 days left, 60/day
    res = CampaignBudgetEngine.forecast_registration_velocity(
        current_registrations=350,
        target=500,
        days_remaining=3,
        daily_registration_rate=60.0,
        channel_conversion=28.4,
        referral_rate=50.0
    )
    assert res["status"] == "ON TRACK"
    assert res["projected_registrations"] >= 500
    assert res["gap"] >= 0
    assert res["required_daily_registrations"] == 50.0  # (500 - 350) / 3
    assert res["is_estimate"] is True
    assert "disclaimer" in res


def test_velocity_forecast_at_risk():
    # Moderate pacing: 300 registrations, 3 days left, 40/day
    # projected will be between 425 and 500
    res = CampaignBudgetEngine.forecast_registration_velocity(
        current_registrations=300,
        target=500,
        days_remaining=3,
        daily_registration_rate=42.0,
        channel_conversion=20.0,
        referral_rate=30.0
    )
    assert res["status"] == "AT RISK"
    assert res["projected_registrations"] < 500
    assert res["projected_registrations"] >= 425
    assert res["gap"] < 0


def test_velocity_forecast_off_track():
    # Severely lagging: 150 registrations, 2 days left, 20/day
    res = CampaignBudgetEngine.forecast_registration_velocity(
        current_registrations=150,
        target=500,
        days_remaining=2,
        daily_registration_rate=20.0,
        channel_conversion=15.0,
        referral_rate=10.0
    )
    assert res["status"] == "OFF TRACK"
    assert res["projected_registrations"] < 425
    assert res["required_daily_registrations"] == 175.0  # (500 - 150) / 2
    assert res["gap"] < -100


def test_velocity_forecast_completed_sprint():
    # Sprint ended: days_remaining = 0, current = 520
    res = CampaignBudgetEngine.forecast_registration_velocity(
        current_registrations=520,
        target=500,
        days_remaining=0,
        daily_registration_rate=42.0,
        channel_conversion=28.4,
        referral_rate=51.9
    )
    assert res["status"] == "ON TRACK"
    assert res["projected_registrations"] == 520
    assert res["required_daily_registrations"] == 0.0
    assert res["gap"] == 20


# ==============================================================================
# 5. API ENDPOINTS TESTS
# ==============================================================================
def test_api_get_budget_overview(client):
    res = client.get("/api/budget/overview")
    assert res.status_code == 200
    data = res.json()
    assert data["max_budget_inr"] == 2000.0
    assert data["total_spent_inr"] <= 2000.0
    assert "channel_allocations" in data


def test_api_update_budget_allocations_success(client):
    # First get channels
    ov = client.get("/api/budget/overview").json()
    channels = ov["channel_allocations"]

    payload = {
        "allocations": [
            {"channel_id": channels[0]["channel_id"], "allocated_inr": 400.0},
            {"channel_id": channels[1]["channel_id"], "allocated_inr": 400.0},
        ]
    }
    res = client.post("/api/budget/allocations", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["overview"]["total_allocated_inr"] <= 2000.0


def test_api_update_budget_allocations_exceed_cap_400(client):
    ov = client.get("/api/budget/overview").json()
    channels = ov["channel_allocations"]

    # Post allocations totaling ₹3,000
    payload = {
        "allocations": [
            {"channel_id": channels[0]["channel_id"], "allocated_inr": 1800.0},
            {"channel_id": channels[1]["channel_id"], "allocated_inr": 1200.0},
        ]
    }
    res = client.post("/api/budget/allocations", json=payload)
    assert res.status_code == 400
    err = res.json()["detail"]
    assert "exceeds the maximum ₹2,000.00" in err


def test_api_get_budget_scenarios(client):
    res = client.get("/api/budget/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert data["max_budget_inr"] == 2000.0
    assert len(data["scenarios"]) == 3
    assert "disclaimer" in data


def test_api_post_velocity_forecast(client):
    payload = {
        "current_registrations": 380,
        "target": 500,
        "days_remaining": 3,
        "daily_registration_rate": 55.0,
        "channel_conversion": 28.4,
        "referral_rate": 51.9
    }
    res = client.post("/api/budget/velocity-forecast", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["ON TRACK", "AT RISK", "OFF TRACK"]
    assert data["projected_registrations"] > 380
    assert data["is_estimate"] is True
    assert "disclaimer" in data
