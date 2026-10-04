import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings
from database.session import SessionLocal
from database.seed_data import seed_database
from database.migrations import run_all_migrations
from database.models import Student, Registration

client = TestClient(app)
ADMIN_HEADERS = {"X-Admin-Key": settings.ADMIN_API_KEY}


@pytest.fixture(scope="module", autouse=True)
def setup_campaign_database():
    """Seeds baseline state and ensures all migrations are executed for integration testing."""
    seed_database(reset=True)
    run_all_migrations()
    yield


# ==============================================================================
# END-TO-END CAMPAIGN SUBSYSTEM INTEGRATION SUITE
# ==============================================================================

def test_integration_subsystem_1_registration_with_attribution():
    """
    Subsystem 1: Registration with multi-touch UTM attribution and college club attribution.
    """
    payload = {
        "full_name": "Arjun Reddy",
        "email": "arjun.reddy.integration@example.com",
        "phone_number": "9123456780",
        "college_name": "Chaitanya Bharathi Institute of Technology",
        "branch": "Computer Science and Engineering",
        "graduation_year": 2025,
        "acquisition_source": "whatsapp_broadcast",
        "utm_source": "whatsapp_broadcast",
        "utm_medium": "campus_ambassador",
        "utm_campaign": "genai_launch_sprint",
        "club_name": "coding_club"
    }

    res = client.post("/api/register", json=payload)
    assert res.status_code == 201
    data = res.json()

    assert data["student"]["email"] == "arjun.reddy.integration@example.com"
    assert data["student"]["is_final_year"] is True
    assert data["referral_code"].startswith(settings.REFERRAL_CODE_PREFIX)
    assert data["status"] == "CONFIRMED"
    assert "https://api.whatsapp.com/send?text=" in data["whatsapp_share_url"]

    # Verify database persistence
    db = SessionLocal()
    st = db.query(Student).filter_by(email="arjun.reddy.integration@example.com").first()
    assert st is not None
    assert st.acquisition_source == "whatsapp_broadcast"
    db.close()


def test_integration_subsystem_2_referral_milestones_and_viral_loop():
    """
    Subsystem 2: Peer referral mechanics, Squad Pass tiers, and anti-fraud loops.
    """
    # 1. Look up Arjun's referral code
    db = SessionLocal()
    arjun = db.query(Student).filter_by(email="arjun.reddy.integration@example.com").first()
    arjun_code = arjun.referral_code
    db.close()

    # 2. Prevent self-referral (Anti-Fraud: returns 400 Bad Request)
    self_ref_payload = {
        "full_name": "Arjun Reddy Imposter",
        "email": "arjun.reddy.integration@example.com",
        "phone_number": "9123456780",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025,
        "referred_by_code": arjun_code
    }
    self_res = client.post("/api/register", json=self_ref_payload)
    assert self_res.status_code == 400
    assert "self" in self_res.json()["detail"].lower()

    # 3. Register 3 friends using Arjun's referral code
    friends = [
        ("Kavya Sharma", "kavya.integration@example.com", "9123456781"),
        ("Rohan Verma", "rohan.integration@example.com", "9123456782"),
        ("Sneha Patel", "sneha.integration@example.com", "9123456783"),
    ]

    for name, email, phone in friends:
        friend_payload = {
            "full_name": name,
            "email": email,
            "phone_number": phone,
            "college_name": "VNR Vignana Jyothi",
            "branch": "Information Technology",
            "graduation_year": 2025,
            "referred_by_code": arjun_code,
            "utm_source": "student_referral"
        }
        f_res = client.post("/api/register", json=friend_payload)
        assert f_res.status_code == 201

    # 4. Check Arjun's Squad Pass progression
    track_res = client.get(f"/api/referral/{arjun_code}")
    assert track_res.status_code == 200
    track_data = track_res.json()

    assert track_data["total_referrals"] >= 3
    assert track_data["tier_1_unlocked"] is True
    assert track_data["tier_2_unlocked"] is True
    assert len(track_data["milestones"]) >= 4

    # 5. Check Leaderboard reflection
    lb_res = client.get("/api/referral/leaderboard")
    assert lb_res.status_code == 200
    lb_data = lb_res.json()
    assert len(lb_data["leaderboard"]) > 0


def test_integration_subsystem_3_attribution_and_utm_clicks():
    """
    Subsystem 3: Attribution tracking, UTM link generator, and click telemetry.
    """
    # 1. Build UTM Campaign Link
    utm_payload = {
        "source": "whatsapp",
        "medium": "campus_ambassador",
        "campaign": "genai_launch_sprint",
        "content": "poster_a",
        "college": "CBIT",
        "club": "coding_club",
        "referral_code": "NXT123",
        "base_url": "https://nxtwave-ai-workshop.edu/register"
    }
    builder_res = client.post("/api/attribution/utm-builder", json=utm_payload)
    assert builder_res.status_code == 200
    b_data = builder_res.json()
    assert "utm_source=whatsapp" in b_data["tracking_url"]
    assert "utm_campaign=genai_launch_sprint" in b_data["tracking_url"]

    # 2. Track click on generated link
    click_payload = {
        "source": "whatsapp",
        "medium": "campus_ambassador",
        "campaign": "genai_launch_sprint"
    }
    click_res = client.post("/api/attribution/track-click", json=click_payload)
    assert click_res.status_code == 200
    assert click_res.json()["clicks_count"] >= 1

    # 3. Inspect Attribution Performance
    perf_res = client.get("/api/attribution/performance")
    assert perf_res.status_code == 200
    perf_data = perf_res.json()
    assert "sources" in perf_data
    assert len(perf_data["sources"]) > 0


def test_integration_subsystem_4_analytics_computations():
    """
    Subsystem 4: Deep analytical engine (conversion rate, CPR, K-factor, growth score).
    """
    res = client.get("/api/analytics")
    assert res.status_code == 200
    data = res.json()

    # Summary Unit Economics
    assert "summary" in data
    assert data["summary"]["total_registrations"] > 0
    assert data["summary"]["effective_cac_inr"] >= 0
    assert data["summary"]["k_factor"] >= 0

    # Funnel and Referral Dynamics
    assert "funnel" in data
    assert "referral" in data
    assert "daily_velocity" in data
    assert "growth_score" in data

    score = data["growth_score"]
    assert score >= 50.0


def test_integration_subsystem_5_budget_engine_ceiling():
    """
    Subsystem 5: Campaign budget engine with ₹2,000 max ceiling guardrail.
    """
    # 1. Get Budget Overview
    res = client.get("/api/budget/overview")
    assert res.status_code == 200
    b = res.json()

    assert b["total_allocated_inr"] <= 2000.0
    assert b["max_budget_inr"] == 2000.0
    assert b["total_spent_inr"] <= 2000.0
    assert b["remaining_budget_inr"] >= 0.0

    channels = b["channel_allocations"]

    # 2. Update channel allocations within ₹2,000 cap
    valid_allocations = {
        "allocations": [
            {"channel_id": channels[0]["channel_id"], "allocated_inr": 400.0},
            {"channel_id": channels[1]["channel_id"], "allocated_inr": 400.0},
        ]
    }
    update_res = client.post("/api/budget/allocations", json=valid_allocations)
    assert update_res.status_code == 200
    assert update_res.json()["success"] is True

    # 3. Reject allocations that breach the ₹2,000 cap
    breach_allocations = {
        "allocations": [
            {"channel_id": channels[0]["channel_id"], "allocated_inr": 1800.0},
            {"channel_id": channels[1]["channel_id"], "allocated_inr": 1200.0},
        ]
    }
    breach_res = client.post("/api/budget/allocations", json=breach_allocations)
    assert breach_res.status_code == 400
    assert "exceeds" in breach_res.json()["detail"].lower()


def test_integration_subsystem_6_velocity_forecasting():
    """
    Subsystem 6: Registration velocity forecasting (Status, Gap, Required Rate).
    """
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
    forecast = res.json()

    assert forecast["status"] in ["ON TRACK", "AT RISK", "OFF TRACK"]
    assert forecast["projected_registrations"] > 380
    assert forecast["required_daily_registrations"] > 0
    assert forecast["is_estimate"] is True
    assert "disclaimer" in forecast


def test_integration_subsystem_7_ai_growth_copilot():
    """
    Subsystem 7: AI Growth Copilot analyzing real metric snapshots with fallback.
    """
    # 1. Fetch AI Metric Snapshot
    snap_res = client.get("/api/ai/copilot/snapshot")
    assert snap_res.status_code == 200
    snapshot = snap_res.json()

    assert snapshot["target"] == 500
    assert "registration_progress" in snapshot
    assert "channel_performance" in snapshot

    # 2. Verify stored insights list
    insights_res = client.get("/api/ai/copilot/insights")
    assert insights_res.status_code == 200
    insights = insights_res.json()
    assert "count" in insights
    assert "insights" in insights


def test_integration_subsystem_8_ab_experiments_and_statistical_lift():
    """
    Subsystem 8: Experimentation engine tracking control vs. variant with statistical z-test.
    """
    # 1. Fetch Experiments list
    exp_res = client.get("/api/experiments")
    assert exp_res.status_code == 200
    experiments = exp_res.json()
    assert len(experiments) > 0

    first_exp = experiments[0]
    exp_id = first_exp["id"]

    # 2. Record conversion for variant via /track
    conv_payload = {
        "variant": "VARIANT",
        "event_type": "CONVERSION",
        "count": 5
    }
    conv_res = client.post(f"/api/experiments/{exp_id}/track", json=conv_payload)
    assert conv_res.status_code == 200

    # 3. Retrieve experiment detail and check statistical lift
    detail_res = client.get(f"/api/experiments/{exp_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()

    assert "telemetry" in detail
    assert "is_simulated" in detail
    assert "experiment_type" in detail


def test_integration_subsystem_9_automation_lifecycle_and_triggers():
    """
    Subsystem 9: Automation center rules, message templates, and audit log.
    """
    # 1. List Automation Rules
    rules_res = client.get("/api/automations")
    assert rules_res.status_code == 200
    rules = rules_res.json()
    assert len(rules) >= 4

    rule_names = [r["name"] for r in rules]
    assert any("Registration" in name for name in rule_names)

    # 2. Test trigger simulation on registration confirmation rule
    rule_id = rules[0]["id"]
    trigger_payload = {
        "custom_context": {
            "name": "Integration Student",
            "referral_link": "https://nxtwave.dev/register?ref=INTEGRATION99",
            "workshop_date": "Sunday, Oct 12, 2026 • 7:00 PM"
        }
    }
    trigger_res = client.post(f"/api/automations/{rule_id}/trigger", json=trigger_payload)
    assert trigger_res.status_code == 200
    t_data = trigger_res.json()
    assert t_data["rule_id"] == rule_id
    assert "Integration Student" in t_data["rendered_message"]

    # 3. Verify Audit Event logged
    audits_res = client.get("/api/automations/events/audits")
    assert audits_res.status_code == 200
    audits = audits_res.json()
    assert len(audits) > 0


def test_integration_subsystem_10_simulation_mode():
    """
    Subsystem 10: Hiring challenge simulation mode with event injection and day advancement.
    """
    # 1. Check Initial Simulation State
    state_res = client.get("/api/simulation/state")
    assert state_res.status_code == 200
    initial_state = state_res.json()
    initial_regs = initial_state["telemetry"]["total_registrations"]

    # 2. Inject +10 WhatsApp Registrations
    inject_payload = {
        "channel": "WHATSAPP",
        "count": 10
    }
    inject_res = client.post("/api/simulation/inject", json=inject_payload)
    assert inject_res.status_code == 200
    new_regs = inject_res.json()["total_registrations_now"]
    assert new_regs >= initial_regs + 10

    # 3. Advance 1 Simulation Day
    advance_res = client.post("/api/simulation/advance-day")
    assert advance_res.status_code == 200
    adv_data = advance_res.json()
    assert adv_data["success"] is True
    assert adv_data["current_day"] >= 1


def test_integration_subsystem_11_growth_alerts_detection():
    """
    Subsystem 11: Real-time growth guardrails and automatic anomaly alerts.
    """
    # 1. Trigger Alert Evaluation against current metrics
    eval_res = client.post("/api/alerts/evaluate")
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["total_alerts"] >= 7
    assert "alerts" in eval_data

    # 2. Fetch Alerts Summary
    summary_res = client.get("/api/alerts/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_alerts"] >= 7
    assert "critical_count" in summary
    assert "warning_count" in summary

    # 3. Fetch Full Alerts List
    list_res = client.get("/api/alerts")
    assert list_res.status_code == 200
    alerts = list_res.json()
    assert len(alerts) >= 7

    for alert in alerts:
        assert alert["severity"] in ["INFO", "WARNING", "CRITICAL"]
        assert alert["title"] != ""
        assert alert["recommended_action"] != ""
