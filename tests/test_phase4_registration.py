import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from database.seed_data import seed_database
from database.session import SessionLocal
from database.models import Student, Registration, Referral, AutomationEvent

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    seed_database(reset=True)
    yield




def test_successful_registration_all_fields():
    payload = {
        "full_name": "Rithvik Sharma",
        "email": "rithvik.sharma@example.com",
        "phone_number": "9812345678",
        "college_name": "Vasavi College of Engineering (VCE)",
        "branch": "Computer Science (AI & ML)",
        "graduation_year": 2025,
        "city": "Hyderabad",
        "skill_level": "Intermediate",
        "primary_goal": "Placement Resume Project (Immediate hiring)",
        "acquisition_source": "College WhatsApp Group",
        "referred_by_code": "NXT001",
        "utm_source": "whatsapp_batch2025",
        "utm_medium": "peer_viral_loop",
        "utm_campaign": "placement_boost_oct"
    }

    response = client.post("/api/register", json=payload)
    assert response.status_code == 201
    data = response.json()

    # Verify response structure
    assert data["student"]["full_name"] == "Rithvik Sharma"
    assert data["student"]["email"] == "rithvik.sharma@example.com"
    assert data["student"]["phone_number"] == "9812345678"
    assert data["student"]["city"] == "Hyderabad"
    assert data["student"]["skill_level"] == "Intermediate"
    assert data["student"]["primary_goal"] == "Placement Resume Project (Immediate hiring)"
    assert data["student"]["acquisition_source"] == "College WhatsApp Group"
    assert data["student"]["is_final_year"] is True
    assert data["referral_code"].startswith("NXT")
    assert "ref=" in data["referral_link"]
    assert "https://api.whatsapp.com/send?text=" in data["whatsapp_share_url"]
    assert data["is_existing"] is False

    # Check persistence in database
    db = SessionLocal()
    st = db.query(Student).filter_by(email="rithvik.sharma@example.com").first()
    assert st is not None
    assert st.city == "Hyderabad"
    assert st.skill_level == "Intermediate"

    reg = db.query(Registration).filter_by(student_id=st.id).first()
    assert reg is not None
    assert reg.utm_source == "whatsapp_batch2025"
    assert reg.utm_medium == "peer_viral_loop"
    assert reg.utm_campaign == "placement_boost_oct"

    # Check that a referral record was created linking to NXT001 (Aditya)
    ref = db.query(Referral).filter_by(referee_student_id=st.id).first()
    assert ref is not None
    assert ref.referral_code == "NXT001"
    assert ref.status == "QUALIFIED"

    # Check automation event was logged
    auto_evt = db.query(AutomationEvent).filter_by(
        student_id=st.id, event_type="REGISTRATION_CONFIRMED"
    ).first()
    assert auto_evt is not None
    db.close()


def test_duplicate_registration_graceful_handling():
    # Submit the exact same student again
    payload = {
        "full_name": "Rithvik Sharma",
        "email": "rithvik.sharma@example.com",
        "phone_number": "9812345678",
        "college_name": "Vasavi College of Engineering (VCE)",
        "branch": "Computer Science (AI & ML)",
        "graduation_year": 2025
    }

    response = client.post("/api/register", json=payload)
    assert response.status_code == 201
    data = response.json()

    # Must return is_existing = True and retain their unique referral code
    assert data["is_existing"] is True
    assert data["student"]["email"] == "rithvik.sharma@example.com"
    assert data["referral_code"].startswith("NXT")
    assert "whatsapp" in data["whatsapp_share_url"]


def test_invalid_email_validation():
    payload = {
        "full_name": "Invalid Email Student",
        "email": "invalid-not-an-email",
        "phone_number": "9876543210",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    }
    response = client.post("/api/register", json=payload)
    assert response.status_code == 422


def test_invalid_phone_validation():
    payload = {
        "full_name": "Invalid Phone Student",
        "email": "valid.student@example.com",
        "phone_number": "12345",  # Less than 10 digits
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    }
    response = client.post("/api/register", json=payload)
    assert response.status_code == 422


def test_referral_registration_attribution_flow():
    # First student registers
    st1_payload = {
        "full_name": "Alpha Referrer",
        "email": "alpha.referrer@example.com",
        "phone_number": "9988776655",
        "college_name": "JNTUH",
        "branch": "Information Technology",
        "graduation_year": 2025
    }
    r1 = client.post("/api/register", json=st1_payload)
    assert r1.status_code == 201
    alpha_code = r1.json()["referral_code"]

    # Second student registers with alpha_code as referral
    st2_payload = {
        "full_name": "Beta Referee",
        "email": "beta.referee@example.com",
        "phone_number": "9988776656",
        "college_name": "JNTUH",
        "branch": "Information Technology",
        "graduation_year": 2025,
        "referred_by_code": alpha_code
    }
    r2 = client.post("/api/register", json=st2_payload)
    assert r2.status_code == 201

    # Now verify Alpha's Squad Pass progress via GET /api/referral/{code}
    track_resp = client.get(f"/api/referral/{alpha_code}")
    assert track_resp.status_code == 200
    track_data = track_resp.json()
    assert track_data["referral_code"] == alpha_code
    assert track_data["qualified_referrals"] >= 1
    assert track_data["tier_1_unlocked"] is True
    assert "Top 25 AI Project Prompts" in track_data["tier_1_reward"]
