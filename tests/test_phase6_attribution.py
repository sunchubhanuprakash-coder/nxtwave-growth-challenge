import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.main import app
from database.session import SessionLocal
from database.models import Registration, Student, CampaignSource, Club, College
from database.seed_data import seed_database


@pytest.fixture(scope="module")
def client():
    # Ensure fresh seeded state
    seed_database(reset=True)
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="function")
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_colleges_clubs_tree_endpoint(client: TestClient):
    """
    Verifies that the colleges-clubs directory endpoint returns live database entities.
    """
    response = client.get("/api/attribution/colleges-clubs")
    assert response.status_code == 200
    data = response.json()
    assert "colleges" in data
    assert len(data["colleges"]) >= 5
    
    # Check that CBIT has clubs
    cbit = next((c for c in data["colleges"] if "CBIT" in c["college_name"] or c["college_code"] == "CBIT"), None)
    assert cbit is not None
    assert len(cbit["clubs"]) > 0


def test_utm_builder_endpoint(client: TestClient):
    """
    Tests UTM tracking URL generation with all 6 required parameters + referral code.
    Inputs: Source, Medium, Campaign, Content, College, Club, Ref.
    """
    payload = {
        "source": "whatsapp",
        "medium": "college_group",
        "campaign": "ai_workshop",
        "content": "poster_a",
        "college": "CBIT",
        "club": "coding_club",
        "referral_code": "NXT123",
        "base_url": "https://nxtwave-ai-workshop.edu/register"
    }

    response = client.post("/api/attribution/utm-builder", json=payload)
    assert response.status_code == 200
    data = response.json()

    tracking_url = data["tracking_url"]
    assert "utm_source=whatsapp" in tracking_url
    assert "utm_medium=college_group" in tracking_url
    assert "utm_campaign=ai_workshop" in tracking_url
    assert "utm_content=poster_a" in tracking_url
    assert "college=CBIT" in tracking_url
    assert "club=coding_club" in tracking_url
    assert "ref=NXT123" in tracking_url
    assert data["relative_url"].startswith("/register?")

    # Verify QR code data URL is generated
    assert data["qr_code_data_url"] is not None
    assert data["qr_code_data_url"].startswith("data:image/png;base64,")


def test_registration_with_complete_attribution(client: TestClient, db_session: Session):
    """
    Simulates registration originating from an attribution link:
    /register?utm_source=whatsapp&utm_medium=college_group&utm_campaign=ai_workshop&utm_content=poster_a&ref=NXT001&college=CBIT&club=coding_club
    Verifies that complete attribution is persisted with the registration.
    """
    reg_payload = {
        "full_name": "Siddharth Verma",
        "email": "siddharth.verma.attr@example.com",
        "phone": "9811223344",
        "college": "Chaitanya Bharathi Institute of Technology",
        "club": "[SIMULATED] CBIT Open Source & Coding Club",
        "branch": "Computer Science and Engineering",
        "graduation_year": 2025,
        "utm_source": "whatsapp",
        "utm_medium": "college_group",
        "utm_campaign": "ai_workshop",
        "utm_content": "poster_a",
        "ref": "NXT001"
    }

    response = client.post("/api/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()

    assert data["status"] == "CONFIRMED"
    assert "attribution" in data
    attr = data["attribution"]
    assert attr["source"] == "whatsapp"
    assert attr["medium"] == "college_group"
    assert attr["campaign"] == "ai_workshop"
    assert attr["content"] == "poster_a"
    assert attr["referral"] == "NXT001"
    assert ("CBIT" in attr["college"]) or ("Chaitanya" in attr["college"])
    assert "CBIT Open Source & Coding Club" in attr["club"]

    # Verify directly in SQLite database
    student = db_session.query(Student).filter_by(email="siddharth.verma.attr@example.com").first()
    assert student is not None
    assert student.referred_by_code == "NXT001"

    registration = db_session.query(Registration).filter_by(student_id=student.id).first()
    assert registration is not None
    assert registration.utm_source == "whatsapp"
    assert registration.utm_medium == "college_group"
    assert registration.utm_content == "poster_a"
    assert registration.club_name_raw == "[SIMULATED] CBIT Open Source & Coding Club"
    assert registration.club_id is not None


def test_track_utm_click(client: TestClient, db_session: Session):
    """
    Verifies click tracking increments clicks_count in the database.
    """
    # Track click on a unique source
    payload = {
        "source": "placement_telegram_channel",
        "medium": "channel_post",
        "campaign": "ai_workshop"
    }

    res1 = client.post("/api/attribution/track-click", json=payload)
    assert res1.status_code == 200
    clicks_1 = res1.json()["clicks_count"]
    assert clicks_1 >= 1

    # Second click
    res2 = client.post("/api/attribution/track-click", json=payload)
    assert res2.status_code == 200
    clicks_2 = res2.json()["clicks_count"]
    assert clicks_2 == clicks_1 + 1

    # Verify in DB
    source_row = db_session.query(CampaignSource).filter_by(utm_source="placement_telegram_channel").first()
    assert source_row is not None
    assert source_row.clicks_count == clicks_2


def test_source_performance_is_database_driven(client: TestClient, db_session: Session):
    """
    Verifies that all performance metrics are dynamically aggregated from database events.
    Checks sources, contents, colleges, clubs, and overall totals.
    """
    response = client.get("/api/attribution/performance")
    assert response.status_code == 200
    perf = response.json()

    # Compare directly with live DB count queries
    db_total_regs = db_session.query(Registration).count()
    assert perf["total_registrations"] == db_total_regs

    db_verified_count = (
        db_session.query(Registration)
        .join(Student, Registration.student_id == Student.id)
        .filter(Student.is_final_year == True)
        .count()
    )
    assert perf["total_verified_final_year"] == db_verified_count

    # Check sources list
    assert len(perf["sources"]) > 0
    top_source = perf["sources"][0]
    assert "source" in top_source
    assert "total_registrations" in top_source
    assert "verified_final_year" in top_source
    assert "verification_rate_percent" in top_source
    assert "k_factor" in top_source

    # Check content variants breakdown
    assert len(perf["contents"]) > 0
    poster_a = next((c for c in perf["contents"] if c["content"] == "poster_a"), None)
    assert poster_a is not None
    assert poster_a["total_registrations"] >= 1

    # Check college attribution
    assert len(perf["colleges"]) > 0
    cbit_col = next((c for c in perf["colleges"] if "CBIT" in c["college"] or "Chaitanya" in c["college"]), None)
    assert cbit_col is not None

    # Check clubs attribution
    assert len(perf["clubs"]) > 0
