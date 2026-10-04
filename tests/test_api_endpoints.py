import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings
from database.session import SessionLocal
from database.seed_data import seed_database
from database.models import Student

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    """Seeds a fresh simulated database state before running API tests."""
    seed_database(reset=True)
    yield


# ------------------------------------------------------------------------------
# 1. POST /api/register
# ------------------------------------------------------------------------------
def test_api_register_new_student():
    payload = {
        "full_name": "Vikram Sethi",
        "email": "vikram.sethi@example.com",
        "phone_number": "9876543999",
        "college_name": "Chaitanya Bharathi Institute of Technology",
        "branch": "Computer Science and Engineering",
        "graduation_year": 2025,
        "referred_by_code": "NXT001",
        "utm_source": "whatsapp",
        "utm_medium": "peer_share"
    }
    response = client.post("/api/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["student"]["email"] == "vikram.sethi@example.com"
    assert data["student"]["is_final_year"] is True
    assert data["referral_code"].startswith(settings.REFERRAL_CODE_PREFIX)
    assert "https://api.whatsapp.com/send?text=" in data["whatsapp_share_url"]
    assert data["is_existing"] is False


def test_api_register_existing_student():
    # Registering the same email again should gracefully return existing registration
    payload = {
        "full_name": "Vikram Sethi",
        "email": "vikram.sethi@example.com",
        "phone_number": "9876543999",
        "college_name": "Chaitanya Bharathi Institute of Technology",
        "branch": "Computer Science and Engineering",
        "graduation_year": 2025
    }
    response = client.post("/api/register", json=payload)
    assert response.status_code == 201  # Or 200/201 response with is_existing=True
    data = response.json()
    assert data["is_existing"] is True
    assert data["student"]["email"] == "vikram.sethi@example.com"


def test_api_register_validation_error():
    # Invalid phone number (<10 digits)
    bad_payload = {
        "full_name": "Bad Student",
        "email": "bad@example.com",
        "phone_number": "123",
        "college_name": "Test College",
        "branch": "IT",
        "graduation_year": 2025
    }
    response = client.post("/api/register", json=bad_payload)
    assert response.status_code == 422


# ------------------------------------------------------------------------------
# 2. GET /api/student/{id}
# ------------------------------------------------------------------------------
def test_api_get_student_success():
    db = SessionLocal()
    first_student = db.query(Student).first()
    db.close()
    assert first_student is not None

    response = client.get(f"/api/student/{first_student.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == first_student.id
    assert data["email"] == first_student.email


def test_api_get_student_not_found():
    response = client.get("/api/student/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# ------------------------------------------------------------------------------
# 3. GET /api/referral/{code}
# ------------------------------------------------------------------------------
def test_api_get_referral_progress():
    # NXT001 (Aditya) has referred students in seed data
    response = client.get("/api/referral/NXT001")
    assert response.status_code == 200
    data = response.json()
    assert data["referral_code"] == "NXT001"
    assert data["total_referrals"] >= 3
    assert data["tier_1_unlocked"] is True
    assert data["tier_2_unlocked"] is True
    assert "whatsapp" in data["whatsapp_share_url"]


def test_api_get_referral_not_found():
    response = client.get("/api/referral/INVALID_CODE_999")
    assert response.status_code == 404


# ------------------------------------------------------------------------------
# 4. POST /api/referral
# ------------------------------------------------------------------------------
def test_api_create_referral():
    payload = {
        "referrer_code": "NXT001",
        "referee_name": "Deepak Roy",
        "referee_email": "deepak.roy@example.com",
        "channel": "WHATSAPP"
    }
    response = client.post("/api/referral", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["referral_code"] == "NXT001"


# ------------------------------------------------------------------------------
# 5. GET /api/dashboard
# ------------------------------------------------------------------------------
def test_api_get_dashboard():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["total_registrations"] > 0
    assert data["target_registrations"] == 500
    assert data["total_budget_inr"] == 2000.0
    assert "k_factor" in data
    assert "effective_cac_inr" in data
    assert len(data["recent_registrations"]) > 0


# ------------------------------------------------------------------------------
# 6. GET /api/analytics
# ------------------------------------------------------------------------------
def test_api_get_analytics():
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert len(data["daily_velocity"]) == 7
    assert len(data["channel_attribution"]) > 0
    assert len(data["college_breakdown"]) > 0


# ------------------------------------------------------------------------------
# 7. GET /api/channels
# ------------------------------------------------------------------------------
def test_api_get_channels():
    response = client.get("/api/channels")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    assert any(c["utm_source"] == "whatsapp" for c in data)


# ------------------------------------------------------------------------------
# 8. GET /api/colleges
# ------------------------------------------------------------------------------
def test_api_get_colleges():
    response = client.get("/api/colleges")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 5
    assert any(c["code"] == "CBIT" for c in data)


# ------------------------------------------------------------------------------
# 9. GET & POST /api/experiments
# ------------------------------------------------------------------------------
def test_api_get_experiments():
    response = client.get("/api/experiments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert "results" in data[0]


def test_api_create_experiment_unauthorized():
    # Without admin key, should reject with 401
    payload = {
        "name": "CTA Button Color Test",
        "hypothesis": "Cyan CTA converts higher than Emerald CTA",
        "variant_a_description": "Cyan #00D4FF Button",
        "variant_b_description": "Emerald #00E599 Button"
    }
    response = client.post("/api/experiments", json=payload)
    assert response.status_code == 401


def test_api_create_experiment_authorized():
    # With valid admin key header
    payload = {
        "name": "CTA Button Color Test",
        "hypothesis": "Cyan CTA converts higher than Emerald CTA",
        "variant_a_description": "Cyan #00D4FF Button",
        "variant_b_description": "Emerald #00E599 Button"
    }
    headers = {"X-Admin-Key": settings.ADMIN_API_KEY}
    response = client.post("/api/experiments", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "CTA Button Color Test"


# ------------------------------------------------------------------------------
# 10. GET /api/alerts
# ------------------------------------------------------------------------------
def test_api_get_alerts():
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


# ------------------------------------------------------------------------------
# 11. POST /api/simulation/event
# ------------------------------------------------------------------------------
def test_api_simulation_event_unauthorized():
    response = client.post("/api/simulation/event", json={"students_count": 5})
    assert response.status_code == 401


def test_api_simulation_event_authorized():
    headers = {"X-Admin-Key": settings.ADMIN_API_KEY}
    response = client.post(
        "/api/simulation/event",
        json={"event_type": "AMBASSADOR_BLAST", "students_count": 3, "college_code": "VNRVJIET"},
        headers=headers
    )
    assert response.status_code == 200
    assert "Successfully simulated 3 registrations" in response.json()["message"]


# ------------------------------------------------------------------------------
# 12. POST /api/ai/analyze
# ------------------------------------------------------------------------------
def test_api_ai_analyze():
    response = client.post("/api/ai/analyze", json={"topic": "VIRALITY"})
    assert response.status_code == 200
    data = response.json()
    assert data["topic"] == "VIRALITY"
    assert "insight" in data
    assert "confidence_score" in data
    assert "recorded_insight_id" in data


# ------------------------------------------------------------------------------
# 13. POST /api/simulation/reset
# ------------------------------------------------------------------------------
def test_api_simulation_reset_unauthorized():
    response = client.post("/api/simulation/reset", json={"confirm": True})
    assert response.status_code == 401


def test_api_simulation_reset_authorized():
    headers = {"X-Admin-Key": settings.ADMIN_API_KEY}
    response = client.post("/api/simulation/reset", json={"confirm": True}, headers=headers)
    assert response.status_code == 200
    assert "successfully reset" in response.json()["message"].lower()
