import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from database.session import get_db
from database.models import Student, Referral, Registration, Event, Campaign
from database.seed_data import seed_database
from automation.engine import AutomationEngine

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    """Seeds fresh simulated database state before Phase 5 tests."""
    seed_database(reset=True)
    yield


def test_referral_code_format_and_generation():
    """
    Every registered student receives a unique referral code matching NXT-[A-Z0-9]{6} format.
    """
    payload = {
        "full_name": "Format Check Student",
        "email": "format.check@cbit.ac.in",
        "phone_number": "9811122233",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025,
        "city": "Hyderabad",
        "skill_level": "Beginner",
        "primary_goal": "Placement Resume Project",
        "acquisition_source": "WhatsApp Group"
    }
    res = client.post("/api/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    ref_code = data["referral_code"]
    assert ref_code.startswith("NXT-")
    assert len(ref_code) == 10  # 'NXT-' (4) + 6 hex/alphanumeric chars
    assert "/register?ref=" in data["referral_link"]
    assert ref_code in data["whatsapp_share_url"]


def test_successful_referral_registration_attribution():
    """
    When student B registers using student A's referral code, verify:
    1. Referral relationship is created
    2. Registration attribution is recorded
    3. Status is QUALIFIED for final-year students
    """
    # 1. Register Referrer A
    ref_a_payload = {
        "full_name": "Referrer Student Alpha",
        "email": "alpha.p5@cbit.ac.in",
        "phone_number": "9822233344",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    }
    res_a = client.post("/api/register", json=ref_a_payload)
    assert res_a.status_code == 201
    code_a = res_a.json()["referral_code"]

    # 2. Register Referee B using A's code
    ref_b_payload = {
        "full_name": "Referee Student Beta",
        "email": "beta.p5@vnrvjiet.ac.in",
        "phone_number": "9833344455",
        "college_name": "VNR VJIET",
        "branch": "IT",
        "graduation_year": 2026,  # Final year
        "referred_by_code": code_a
    }
    res_b = client.post("/api/register", json=ref_b_payload)
    assert res_b.status_code == 201
    data_b = res_b.json()
    assert data_b["student"]["referred_by_code"] == code_a

    # 3. Check Referrer A's dashboard progress
    res_track = client.get(f"/api/referral/{code_a}")
    assert res_track.status_code == 200
    track_data = res_track.json()
    assert track_data["successful_registrations"] >= 1
    assert track_data["tier_1_unlocked"] is True
    assert track_data["conversion_rate"] > 0


def test_prevent_self_referral():
    """
    A student cannot refer themselves using their own referral code, email, or phone.
    """
    # Register Student
    payload = {
        "full_name": "Self Referral Tester",
        "email": "self.ref@vasavi.ac.in",
        "phone_number": "9844455566",
        "college_name": "Vasavi",
        "branch": "ECE",
        "graduation_year": 2025
    }
    res1 = client.post("/api/register", json=payload)
    assert res1.status_code == 201
    own_code = res1.json()["referral_code"]

    # Attempt to self-refer with own code and email
    self_payload = {
        "full_name": "Self Referral Attempt",
        "email": "self.ref@vasavi.ac.in",
        "phone_number": "9844455566",
        "college_name": "Vasavi",
        "branch": "ECE",
        "graduation_year": 2025,
        "referred_by_code": own_code
    }
    res2 = client.post("/api/register", json=self_payload)
    assert res2.status_code == 400
    assert "Self-referral is not allowed" in res2.json()["detail"]


def test_prevent_invalid_referral_code():
    """
    Attempting to register with a non-existent referral code returns 400 Bad Request.
    """
    payload = {
        "full_name": "Invalid Code User",
        "email": "invalid.code@cbit.ac.in",
        "phone_number": "9855566677",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025,
        "referred_by_code": "NXT-DOESNOTEXIST"
    }
    res = client.post("/api/register", json=payload)
    assert res.status_code == 400
    assert "Invalid referral code" in res.json()["detail"]


def test_prevent_duplicate_referral():
    """
    A student cannot be referred multiple times by different referrers.
    """
    # 1. Referrer 1
    r1 = client.post("/api/register", json={
        "full_name": "Referrer One",
        "email": "ref1.dup@cbit.ac.in",
        "phone_number": "9866677788",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    })
    code1 = r1.json()["referral_code"]

    # 2. Referrer 2
    r2 = client.post("/api/register", json={
        "full_name": "Referrer Two",
        "email": "ref2.dup@cbit.ac.in",
        "phone_number": "9877788899",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    })
    code2 = r2.json()["referral_code"]

    # 3. Target referee registers under Referrer 1
    referee_payload = {
        "full_name": "Target Referee",
        "email": "target.referee@cbit.ac.in",
        "phone_number": "9888899900",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025,
        "referred_by_code": code1
    }
    r3 = client.post("/api/register", json=referee_payload)
    assert r3.status_code == 201

    # 4. Same referee tries to register under Referrer 2
    referee_payload_dup = {
        **referee_payload,
        "referred_by_code": code2
    }
    r4 = client.post("/api/register", json=referee_payload_dup)
    assert r4.status_code == 400
    assert "Duplicate referral" in r4.json()["detail"]


def test_prevent_direct_referral_loop():
    """
    Prevent 2-cycle loop: A refers B, then B attempts to refer A.
    """
    # Student A registers
    r_a = client.post("/api/register", json={
        "full_name": "Loop User Alpha",
        "email": "loop.alpha@cbit.ac.in",
        "phone_number": "9899900011",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    })
    code_a = r_a.json()["referral_code"]

    # Student B registers using A's code
    r_b = client.post("/api/register", json={
        "full_name": "Loop User Beta",
        "email": "loop.beta@cbit.ac.in",
        "phone_number": "9800011122",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025,
        "referred_by_code": code_a
    })
    code_b = r_b.json()["referral_code"]

    # Now Student A tries to register again using B's code (Direct Loop: A -> B -> A)
    r_loop = client.post("/api/register", json={
        "full_name": "Loop User Alpha",
        "email": "loop.alpha@cbit.ac.in",
        "phone_number": "9899900011",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025,
        "referred_by_code": code_b
    })
    assert r_loop.status_code == 400
    assert "Referral loop detected" in r_loop.json()["detail"]


def test_prevent_multi_hop_referral_loop():
    """
    Prevent multi-step loop: A -> B -> C -> A.
    """
    # 1. Student A
    r_a = client.post("/api/register", json={
        "full_name": "Hop User A",
        "email": "hop.a@cbit.ac.in",
        "phone_number": "9711122233",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    })
    code_a = r_a.json()["referral_code"]

    # 2. Student B referred by A
    r_b = client.post("/api/register", json={
        "full_name": "Hop User B",
        "email": "hop.b@cbit.ac.in",
        "phone_number": "9722233344",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025,
        "referred_by_code": code_a
    })
    code_b = r_b.json()["referral_code"]

    # 3. Student C referred by B
    r_c = client.post("/api/register", json={
        "full_name": "Hop User C",
        "email": "hop.c@cbit.ac.in",
        "phone_number": "9733344455",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025,
        "referred_by_code": code_b
    })
    code_c = r_c.json()["referral_code"]

    # 4. Student A attempts to be referred by C (Loop: A -> B -> C -> A)
    r_loop = client.post("/api/register", json={
        "full_name": "Hop User A",
        "email": "hop.a@cbit.ac.in",
        "phone_number": "9711122233",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025,
        "referred_by_code": code_c
    })
    assert r_loop.status_code == 400
    assert "Referral loop detected" in r_loop.json()["detail"]


def test_milestones_progression_1_3_5_10():
    """
    Evaluates milestone unlocked statuses for targets: 1, 3, 5, 10.
    """
    m0 = AutomationEngine.evaluate_referral_milestones(0)
    assert m0["tier_1_unlocked"] is False
    assert m0["tier_2_unlocked"] is False
    assert m0["tier_3_unlocked"] is False
    assert m0["tier_4_unlocked"] is False
    assert m0["next_milestone_target"] == 1

    m1 = AutomationEngine.evaluate_referral_milestones(1)
    assert m1["tier_1_unlocked"] is True
    assert m1["tier_2_unlocked"] is False
    assert m1["next_milestone_target"] == 3

    m3 = AutomationEngine.evaluate_referral_milestones(3)
    assert m3["tier_1_unlocked"] is True
    assert m3["tier_2_unlocked"] is True
    assert m3["tier_3_unlocked"] is False
    assert m3["next_milestone_target"] == 5

    m5 = AutomationEngine.evaluate_referral_milestones(5)
    assert m5["tier_3_unlocked"] is True
    assert m5["tier_4_unlocked"] is False
    assert m5["next_milestone_target"] == 10

    m10 = AutomationEngine.evaluate_referral_milestones(10)
    assert m10["tier_4_unlocked"] is True
    assert m10["next_milestone_target"] == "All Milestones Achieved"

    # Verify structured list
    assert len(m10["milestones"]) == 4
    targets = [m["target"] for m in m10["milestones"]]
    assert targets == [1, 3, 5, 10]


def test_student_referral_dashboard_endpoint():
    """
    GET /api/referral/{code} returns all required dashboard telemetry:
    referral code, referral link, friends invited, successful registrations,
    conversion rate, rank, milestones (1, 3, 5, 10), and share links.
    """
    # Register student
    reg = client.post("/api/register", json={
        "full_name": "Dashboard Tester",
        "email": "dash.tester@cbit.ac.in",
        "phone_number": "9744455566",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    })
    code = reg.json()["referral_code"]

    res = client.get(f"/api/referral/{code}")
    assert res.status_code == 200
    data = res.json()

    assert data["referral_code"] == code
    assert "/register?ref=" in data["referral_link"]
    assert "friends_invited" in data
    assert "successful_registrations" in data
    assert "conversion_rate" in data
    assert "rank" in data
    assert data["rank"] >= 1
    assert "total_referrers" in data
    assert len(data["milestones"]) == 4
    assert "whatsapp_share_url" in data
    assert "email_share_url" in data
    assert "mailto:" in data["email_share_url"]


def test_referral_leaderboard_endpoint():
    """
    GET /api/referral/leaderboard returns ranked referrers with masked names,
    qualified counts, and badges.
    """
    res = client.get("/api/referral/leaderboard")
    assert res.status_code == 200
    data = res.json()

    assert "total_participants" in data
    assert "total_referrals" in data
    assert "leaderboard" in data
    assert isinstance(data["leaderboard"], list)

    if len(data["leaderboard"]) > 0:
        top_entry = data["leaderboard"][0]
        assert top_entry["rank"] == 1
        assert "referral_code" in top_entry
        assert "student_name" in top_entry
        assert "college_name" in top_entry
        assert "successful_referrals" in top_entry
        assert "friends_invited" in top_entry
        assert "conversion_rate" in top_entry
        assert "badges" in top_entry


def test_track_referral_action_endpoint():
    """
    POST /api/referral/track-action records share actions to update conversion stats.
    """
    reg = client.post("/api/register", json={
        "full_name": "Action Tracker Student",
        "email": "action.tracker@cbit.ac.in",
        "phone_number": "9755566677",
        "college_name": "CBIT",
        "branch": "CSE",
        "graduation_year": 2025
    })
    code = reg.json()["referral_code"]

    # Track WhatsApp share
    res_wa = client.post("/api/referral/track-action", json={
        "referral_code": code,
        "channel": "WHATSAPP",
        "action": "SHARE"
    })
    assert res_wa.status_code == 200

    # Track Email share
    res_em = client.post("/api/referral/track-action", json={
        "referral_code": code,
        "channel": "EMAIL",
        "action": "SHARE"
    })
    assert res_em.status_code == 200

    # Dashboard should show at least 2 friends invited
    dash = client.get(f"/api/referral/{code}")
    assert dash.status_code == 200
    assert dash.json()["friends_invited"] >= 2
