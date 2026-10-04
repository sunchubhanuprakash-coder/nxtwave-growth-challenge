"""
Phase 11: Growth Experimentation System Tests.
Validates:
1. All 6 surface areas: Landing headline, CTA wording, Referral CTA, WhatsApp message, Poster copy, Email subject
2. Experiment metadata: Name, Hypothesis, Control, Variant, Primary Metric, Threshold, Start/End Date, Status
3. Tracking: Control/Variant impressions and conversions
4. Calculations: Conversion rate, Lift, Difference, Two-proportion Z-test, Winner
5. Strict distinction between SIMULATED EXPERIMENT and REAL EXPERIMENT
6. End-to-end API endpoints: GET, POST, Track, Simulate Traffic, Conclude
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings
from database.seed_data import seed_database
from analytics.experiments import (
    calculate_variant_conversion_rate,
    calculate_lift,
    calculate_difference,
    calculate_two_proportion_z_test,
    calculate_experiment_metrics,
    ALLOWED_EXPERIMENT_CATEGORIES,
    ALLOWED_EXPERIMENT_STATUSES,
)

client = TestClient(app)
ADMIN_HEADERS = {"X-Admin-Key": settings.ADMIN_API_KEY}


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    seed_database(reset=True)
    yield


# ==============================================================================
# 1. UNIT TESTS: CONVERSION RATE & LIFT CALCULATIONS
# ==============================================================================
def test_calculate_variant_conversion_rate():
    assert calculate_variant_conversion_rate(25, 100) == 25.0
    assert calculate_variant_conversion_rate(0, 100) == 0.0
    assert calculate_variant_conversion_rate(10, 0) == 0.0
    assert calculate_variant_conversion_rate(-5, 100) == 0.0
    assert calculate_variant_conversion_rate(150, 100) == 100.0  # Clamped to impressions


def test_calculate_lift():
    # 20% to 30% = +50% lift
    assert calculate_lift(20.0, 30.0) == 50.0
    # 25% to 20% = -20% lift
    assert calculate_lift(25.0, 20.0) == -20.0
    # Zero baseline
    assert calculate_lift(0.0, 15.0) == 100.0
    assert calculate_lift(0.0, 0.0) == 0.0


def test_calculate_difference():
    # Difference in percentage points
    assert calculate_difference(20.0, 30.0) == 10.0
    assert calculate_difference(25.0, 20.0) == -5.0
    assert calculate_difference(15.5, 15.5) == 0.0


def test_calculate_two_proportion_z_test():
    # High statistical significance
    z, p, conf, is_sig = calculate_two_proportion_z_test(
        control_conversions=100,
        control_impressions=500,
        variant_conversions=160,
        variant_impressions=500,
    )
    assert z > 1.96
    assert p < 0.05
    assert conf >= 95.0
    assert is_sig is True

    # No statistical significance (small sample / small delta)
    z2, p2, conf2, is_sig2 = calculate_two_proportion_z_test(
        control_conversions=10,
        control_impressions=100,
        variant_conversions=11,
        variant_impressions=100,
    )
    assert is_sig2 is False
    assert conf2 < 95.0


def test_calculate_experiment_metrics_winner_variants():
    # Case A: Sample size not reached
    small_sample = calculate_experiment_metrics(
        control_impressions=20,
        control_conversions=5,
        variant_impressions=25,
        variant_conversions=10,
        min_sample_size=50,
    )
    assert small_sample["winner"] == "INCONCLUSIVE (COLLECTING DATA)"
    assert small_sample["sample_size_reached"] is False

    # Case B: Variant wins convincingly with > 5% threshold
    variant_win = calculate_experiment_metrics(
        control_impressions=500,
        control_conversions=100,   # 20.0%
        variant_impressions=500,
        variant_conversions=160,   # 32.0% -> +60% lift
        success_threshold=5.0,
        min_sample_size=50,
    )
    assert variant_win["winner"] == "VARIANT"
    assert variant_win["lift"] == 60.0
    assert variant_win["difference"] == 12.0
    assert variant_win["is_statistically_significant"] is True

    # Case C: Control wins (variant performed worse)
    control_win = calculate_experiment_metrics(
        control_impressions=500,
        control_conversions=160,   # 32.0%
        variant_impressions=500,
        variant_conversions=100,   # 20.0% -> -37.5% lift
        success_threshold=5.0,
        min_sample_size=50,
    )
    assert control_win["winner"] == "CONTROL"
    assert control_win["lift"] == -37.5
    assert control_win["difference"] == -12.0

    # Case D: Inconclusive / Tie within threshold
    tie = calculate_experiment_metrics(
        control_impressions=500,
        control_conversions=120,   # 24.0%
        variant_impressions=500,
        variant_conversions=122,   # 24.4% -> +1.67% lift (< 5.0% threshold)
        success_threshold=5.0,
        min_sample_size=50,
    )
    assert tie["winner"] == "NO_WINNER"


# ==============================================================================
# 2. INTEGRATION TESTS: EXPERIMENT API ENDPOINTS
# ==============================================================================
def test_api_get_experiments_list():
    response = client.get("/api/experiments")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

    # Check structure of items
    first = data[0]
    assert "name" in first
    assert "hypothesis" in first
    assert "category" in first
    assert "control" in first
    assert "variant" in first
    assert "primary_metric" in first
    assert "success_threshold" in first
    assert "status" in first
    assert "is_simulated" in first
    assert "experiment_type" in first
    assert "telemetry" in first


def test_api_strict_distinction_real_vs_simulated():
    response = client.get("/api/experiments")
    assert response.status_code == 200
    data = response.json()

    real_exps = [e for e in data if e["is_simulated"] is False]
    sim_exps = [e for e in data if e["is_simulated"] is True]

    assert len(real_exps) >= 1, "Must have at least one real experiment"
    assert len(sim_exps) >= 1, "Must have at least one simulated experiment"

    for r in real_exps:
        assert r["experiment_type"] == "REAL EXPERIMENT"
        assert "[SIMULATED]" not in r["name"]

    for s in sim_exps:
        assert s["experiment_type"] == "SIMULATED EXPERIMENT"


def test_api_filter_experiments_by_category():
    for cat in ["Landing headline", "CTA wording", "Referral CTA", "WhatsApp message", "Poster copy", "Email subject"]:
        response = client.get(f"/api/experiments?category={cat}")
        assert response.status_code == 200
        data = response.json()
        for item in data:
            assert item["category"] == cat


def test_api_create_experiment_real_and_simulated():
    # 1. Real Experiment Creation
    payload_real = {
        "name": "Phase 11 Registration Hero Subtitle Test",
        "category": "Landing headline",
        "hypothesis": "Mentioning Google/Meta alumni guest mentors increases trust and registration completion by >10%.",
        "control": "Walk away with a live, hosted Generative AI application URL.",
        "variant": "Build live with mentors from Google & Meta. Deploy your project URL in 60 minutes.",
        "primary_metric": "Registration Conversion Rate",
        "success_threshold": 10.0,
        "is_simulated": False
    }
    resp = client.post("/api/experiments", json=payload_real, headers=ADMIN_HEADERS)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == payload_real["name"]
    assert data["category"] == "Landing headline"
    assert data["is_simulated"] is False
    assert data["experiment_type"] == "REAL EXPERIMENT"
    assert data["telemetry"]["control_impressions"] == 0
    exp_id = data["id"]

    # 2. Tracking impressions and conversions
    # Track 100 control impressions, 20 conversions
    tr1 = client.post(f"/api/experiments/{exp_id}/track", json={"variant": "CONTROL", "event_type": "IMPRESSION", "count": 100})
    assert tr1.status_code == 200
    assert tr1.json()["telemetry"]["control_impressions"] == 100

    tr2 = client.post(f"/api/experiments/{exp_id}/track", json={"variant": "CONTROL", "event_type": "CONVERSION", "count": 20})
    assert tr2.status_code == 200
    assert tr2.json()["telemetry"]["control_conversions"] == 20
    assert tr2.json()["telemetry"]["control_conversion_rate"] == 20.0

    # Track 100 variant impressions, 35 conversions
    client.post(f"/api/experiments/{exp_id}/track", json={"variant": "VARIANT", "event_type": "IMPRESSION", "count": 100})
    tr3 = client.post(f"/api/experiments/{exp_id}/track", json={"variant": "VARIANT", "event_type": "CONVERSION", "count": 35})
    assert tr3.status_code == 200
    res_data = tr3.json()
    assert res_data["telemetry"]["variant_conversion_rate"] == 35.0
    assert res_data["telemetry"]["difference"] == 15.0
    assert res_data["telemetry"]["lift"] == 75.0
    assert res_data["telemetry"]["winner"] == "VARIANT"


def test_api_simulate_traffic_and_conclude():
    # Create simulated experiment
    payload_sim = {
        "name": "[SIMULATED] Discord vs WhatsApp Broadcast Speed",
        "category": "WhatsApp message",
        "hypothesis": "Automated WhatsApp blast achieves faster milestone velocity than Discord.",
        "control": "WhatsApp batch blast link",
        "variant": "Discord announcement channel ping",
        "primary_metric": "Registration Velocity",
        "success_threshold": 12.0,
        "is_simulated": True
    }
    resp = client.post("/api/experiments", json=payload_sim, headers=ADMIN_HEADERS)
    assert resp.status_code == 201
    sim_id = resp.json()["id"]

    # Simulate 300 visitors with variant bias
    sim_resp = client.post(
        f"/api/experiments/{sim_id}/simulate-traffic",
        json={"visitors": 300, "control_bias_pct": 18.0, "variant_bias_pct": 32.0}
    )
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert sim_data["telemetry"]["control_impressions"] == 150
    assert sim_data["telemetry"]["variant_impressions"] == 150
    assert sim_data["telemetry"]["lift"] > 0
    assert sim_data["is_simulated"] is True
    assert sim_data["experiment_type"] == "SIMULATED EXPERIMENT"

    # Conclude experiment
    conclude_resp = client.post(
        f"/api/experiments/{sim_id}/conclude",
        json={},
        headers=ADMIN_HEADERS
    )
    assert conclude_resp.status_code == 200
    assert conclude_resp.json()["status"] == "CONCLUDED"
    assert conclude_resp.json()["end_date"] is not None
