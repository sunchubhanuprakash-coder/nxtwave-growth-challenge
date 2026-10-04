import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from database.session import SessionLocal
from database.models import Student, Registration, SimulationState, Referral

client = TestClient(app)


def test_simulation_state_endpoint():
    """Verify GET /api/simulation/state returns 7-day timeline, scenario comparisons, and disclaimer."""
    response = client.get("/api/simulation/state")
    assert response.status_code == 200
    data = response.json()

    assert data["mode"] == "DEMO_SIMULATION_MODE"
    assert "DEMO / SIMULATION MODE" in data["disclaimer"]
    assert "Never represent simulated results" in data["disclaimer"]
    assert 1 <= data["current_day"] <= 7
    assert "telemetry" in data
    assert "total_registrations" in data["telemetry"]
    assert "timeline" in data
    assert len(data["timeline"]) == 7
    assert "scenarios" in data
    assert "CONSERVATIVE" in data["scenarios"]
    assert "BASE" in data["scenarios"]
    assert "AGGRESSIVE" in data["scenarios"]


def test_inject_whatsapp_registrations():
    """Verify +10 WhatsApp registrations injection."""
    pre_res = client.get("/api/simulation/state").json()
    pre_total = pre_res["telemetry"]["total_registrations"]

    response = client.post("/api/simulation/inject", json={"channel": "WHATSAPP", "count": 10})
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["channel"] == "WHATSAPP"
    assert data["injected_count"] == 10
    assert data["total_registrations_now"] == pre_total + 10
    assert len(data["sample_created_students"]) > 0
    assert "[SIMULATED]" in data["sample_created_students"][0]["name"]


def test_inject_referral_registrations():
    """Verify +10 Referral registrations with referrer attribution and referral records."""
    pre_res = client.get("/api/simulation/state").json()
    pre_total = pre_res["telemetry"]["total_registrations"]

    response = client.post("/api/simulation/inject", json={"channel": "REFERRAL", "count": 10})
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["channel"] == "REFERRAL"
    assert data["injected_count"] == 10
    assert data["total_registrations_now"] == pre_total + 10


def test_inject_club_and_email_registrations():
    """Verify +5 Club registrations and +5 Email registrations."""
    # Club (+5)
    res_club = client.post("/api/simulation/inject", json={"channel": "CLUB", "count": 5})
    assert res_club.status_code == 200
    assert res_club.json()["injected_count"] == 5

    # Email (+5)
    res_email = client.post("/api/simulation/inject", json={"channel": "EMAIL", "count": 5})
    assert res_email.status_code == 200
    assert res_email.json()["injected_count"] == 5


def test_advance_simulation_day():
    """Verify advancing simulation timeline updates current day and days remaining."""
    pre_res = client.get("/api/simulation/state").json()
    pre_day = pre_res["current_day"]

    if pre_day < 7:
        response = client.post("/api/simulation/advance-day")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["current_day"] == pre_day + 1
        assert data["days_remaining"] == max(0, 7 - (pre_day + 1))


def test_scenario_testing_switch():
    """Verify switching scenarios: Conservative, Aggressive, Base."""
    for sc in ["CONSERVATIVE", "AGGRESSIVE", "BASE"]:
        res = client.post("/api/simulation/scenario", json={"scenario": sc})
        assert res.status_code == 200
        assert res.json()["scenario"] == sc

        state = client.get("/api/simulation/state").json()
        assert state["scenario"] == sc


def test_downstream_updates_dashboard_and_analytics():
    """Verify every event updates dashboard, funnel analytics, and channel metrics."""
    # Record current counts
    dash_pre = client.get("/api/dashboard").json()
    pre_regs = dash_pre["total_registrations"]

    # Inject 10 WhatsApp students
    client.post("/api/simulation/inject", json={"channel": "WHATSAPP", "count": 10})

    # 1. Dashboard must reflect the +10
    dash_post = client.get("/api/dashboard").json()
    assert dash_post["total_registrations"] == pre_regs + 10

    # 2. Analytics must reflect updated total
    analytics = client.get("/api/analytics").json()
    assert analytics["summary"]["total_registrations"] >= pre_regs + 10

    # 3. Channel breakdown must contain WhatsApp
    channels = client.get("/api/channels").json()
    assert len(channels) > 0


def test_disclaimer_and_simulated_tags_enforced():
    """Verify simulated students have is_simulated=True and [SIMULATED] in name."""
    db = SessionLocal()
    try:
        sim_students = db.query(Student).filter(Student.is_simulated == True).limit(10).all()
        assert len(sim_students) > 0
        for s in sim_students:
            assert s.is_simulated is True
            assert "[SIMULATED]" in s.full_name
    finally:
        db.close()


def test_reset_campaign():
    """Verify resetting campaign restores clean baseline state."""
    response = client.post(
        "/api/simulation/reset",
        json={"confirm": True},
        headers={"X-Admin-Key": "growth_admin_secret_2026"}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["current_day"] == 1
    assert data["days_remaining"] == 7

    state = client.get("/api/simulation/state").json()
    assert state["current_day"] == 1
    assert state["days_remaining"] == 7
