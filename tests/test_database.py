import pytest
from datetime import datetime, timezone, date, timedelta
from sqlalchemy.exc import IntegrityError
from database.session import SessionLocal
from database.init_db import init_db
from database.models import (
    College,
    Club,
    Student,
    Campaign,
    CampaignSource,
    Event,
    Registration,
    Referral,
    DailyMetric,
    BudgetTransaction,
    Experiment,
    ExperimentResult,
    AutomationEvent,
    AIInsight,
    GrowthAlert,
)


@pytest.fixture(scope="module")
def db_session():
    """Provides a fresh database schema for testing."""
    init_db(drop_all=True)
    db = SessionLocal()
    yield db
    db.close()


def test_college_and_club_relationship(db_session):
    college = College(
        name="Test Institute of Technology",
        code="TIT-HYD",
        city="Hyderabad",
        state="Telangana",
        tier="TIER_1",
        student_count_estimate=2000,
        is_simulated=True
    )
    db_session.add(college)
    db_session.commit()

    club = Club(
        name="[SIMULATED] Coding Club",
        college_id=college.id,
        president_name="Test President",
        member_count=120,
        is_simulated=True
    )
    db_session.add(club)
    db_session.commit()

    assert college.id is not None
    assert club.id is not None
    assert len(college.clubs) == 1
    assert college.clubs[0].name == "[SIMULATED] Coding Club"
    assert club.college.code == "TIT-HYD"


def test_student_validations_and_normalization(db_session):
    # Valid student
    student = Student(
        full_name="Rajesh Kumar",
        email="RAJESH.K@EXAMPLE.COM",  # Should lowercase
        phone_number="+91 98765 43210",  # Should normalize to 10 digits
        branch="Computer Science",
        graduation_year=2025,
        referral_code="NXTTEST01",
        is_simulated=True
    )
    db_session.add(student)
    db_session.commit()

    assert student.email == "rajesh.k@example.com"
    assert student.phone_number == "9876543210"
    assert student.is_final_year is True

    # Invalid email validation
    with pytest.raises(ValueError, match="Invalid email address"):
        Student(
            full_name="Bad Email",
            email="invalid-email-string",
            phone_number="9876543211",
            branch="CSE",
            graduation_year=2025,
            referral_code="NXTTEST02"
        )

    # Invalid phone validation (<10 digits)
    with pytest.raises(ValueError, match="at least 10 digits"):
        Student(
            full_name="Bad Phone",
            email="badphone@example.com",
            phone_number="12345",
            branch="CSE",
            graduation_year=2025,
            referral_code="NXTTEST03"
        )


def test_campaign_event_and_attribution(db_session):
    campaign = Campaign(
        name="[SIMULATED] October Growth Sprint",
        code="CAMP-OCT-2026",
        target_registrations=500,
        total_budget_inr=2000.0,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=7),
        is_simulated=True
    )
    db_session.add(campaign)
    db_session.commit()

    source = CampaignSource(
        campaign_id=campaign.id,
        source_name="WhatsApp Campus Drop",
        utm_source="whatsapp_blast",
        utm_medium="direct_message",
        utm_campaign="ai_workshop_oct",
        budget_allocated_inr=0.0,
        is_simulated=True
    )
    db_session.add(source)
    db_session.commit()

    event = Event(
        title="[SIMULATED] Build Your First AI Project in 60 Minutes",
        code="EVT-TEST-001",
        campaign_id=campaign.id,
        scheduled_at=datetime.now(timezone.utc) + timedelta(days=2),
        duration_minutes=60,
        is_simulated=True
    )
    db_session.add(event)
    db_session.commit()

    assert event.campaign.code == "CAMP-OCT-2026"
    assert len(campaign.events) == 1
    assert len(campaign.sources) == 1


def test_registration_and_deduplication(db_session):
    student = Student(
        full_name="Ananya Sharma",
        email="ananya.sharma@example.com",
        phone_number="9123456780",
        branch="IT",
        graduation_year=2025,
        referral_code="NXTTEST04",
        is_simulated=True
    )
    db_session.add(student)
    db_session.commit()

    event = db_session.query(Event).filter_by(code="EVT-TEST-001").first()

    reg1 = Registration(
        student_id=student.id,
        event_id=event.id,
        utm_source="whatsapp_blast",
        utm_medium="direct_message",
        utm_campaign="ai_workshop_oct",
        status="CONFIRMED",
        is_simulated=True
    )
    db_session.add(reg1)
    db_session.commit()
    assert reg1.id is not None

    # Attempt duplicate registration for the same student and event
    reg2 = Registration(
        student_id=student.id,
        event_id=event.id,
        status="CONFIRMED"
    )
    db_session.add(reg2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_referral_traceability_and_milestones(db_session):
    # Referrer student
    referrer = Student(
        full_name="Bhanu Prakash",
        email="bhanu.ref@example.com",
        phone_number="9876599901",
        branch="CSE",
        graduation_year=2025,
        referral_code="NXTREF99",
        is_simulated=True
    )
    # Referee student
    referee = Student(
        full_name="Karthik Reddy",
        email="karthik.ref@example.com",
        phone_number="9876599902",
        branch="ECE",
        graduation_year=2025,
        referral_code="NXTREF100",
        referred_by_code="NXTREF99",
        is_simulated=True
    )
    db_session.add_all([referrer, referee])
    db_session.commit()

    referral_tx = Referral(
        referrer_student_id=referrer.id,
        referee_student_id=referee.id,
        referral_code="NXTREF99",
        channel="WHATSAPP",
        status="QUALIFIED",
        reward_tier_unlocked=1,
        converted_at=datetime.now(timezone.utc),
        is_simulated=True
    )
    db_session.add(referral_tx)
    db_session.commit()

    # Verify bidirectional relationship
    assert len(referrer.referrals_made) == 1
    assert referrer.referrals_made[0].referee.full_name == "Karthik Reddy"
    assert len(referee.referrals_received) == 1
    assert referee.referrals_received[0].referrer.referral_code == "NXTREF99"


def test_budget_transactions_and_limits(db_session):
    campaign = db_session.query(Campaign).filter_by(code="CAMP-OCT-2026").first()

    tx = BudgetTransaction(
        campaign_id=campaign.id,
        amount_inr=500.0,
        transaction_type="AMBASSADOR_INCENTIVE",
        description="[SIMULATED] Campus Ambassador Bounty",
        recipient_name="Student Rep",
        is_simulated=True
    )
    db_session.add(tx)
    db_session.commit()
    assert tx.id is not None
    assert tx.amount_inr == 500.0

    # Negative amount validation
    with pytest.raises(ValueError, match="cannot be negative"):
        BudgetTransaction(
            campaign_id=campaign.id,
            amount_inr=-100.0,
            transaction_type="INVALID",
            description="Negative test"
        )


def test_experiments_and_results(db_session):
    campaign = db_session.query(Campaign).filter_by(code="CAMP-OCT-2026").first()

    exp = Experiment(
        campaign_id=campaign.id,
        name="[SIMULATED] Button CTA Test",
        hypothesis="Claim Free Seat vs Join Masterclass",
        variant_a_description="Claim Free Seat",
        variant_b_description="Join Masterclass",
        status="RUNNING",
        is_simulated=True
    )
    db_session.add(exp)
    db_session.commit()

    res_a = ExperimentResult(experiment_id=exp.id, variant="A", impressions=100, conversions=35, conversion_rate=35.0, is_simulated=True)
    res_b = ExperimentResult(experiment_id=exp.id, variant="B", impressions=100, conversions=24, conversion_rate=24.0, is_simulated=True)
    db_session.add_all([res_a, res_b])
    db_session.commit()

    assert len(exp.results) == 2


def test_automation_ai_insights_and_alerts(db_session):
    campaign = db_session.query(Campaign).filter_by(code="CAMP-OCT-2026").first()
    student = db_session.query(Student).filter_by(referral_code="NXTTEST01").first()

    auto_evt = AutomationEvent(
        event_type="WHATSAPP_SHARE_TRIGGERED",
        student_id=student.id,
        payload='{"target": "class_group"}',
        status="SUCCESS",
        is_simulated=True
    )
    insight = AIInsight(
        campaign_id=campaign.id,
        topic="VIRALITY",
        summary="[SIMULATED] K-factor elevated in WhatsApp groups",
        detailed_insight="Aditya's referral chain showed 40% viral conversion.",
        recommended_action="Scale student ambassador incentive.",
        confidence_score=0.91,
        is_simulated=True
    )
    alert = GrowthAlert(
        campaign_id=campaign.id,
        alert_type="MILESTONE_HIT",
        severity="INFO",
        title="[SIMULATED] 500 Students Goal Approaching",
        message="Registrations are at 450/500.",
        is_acknowledged=False,
        is_simulated=True
    )
    db_session.add_all([auto_evt, insight, alert])
    db_session.commit()

    assert auto_evt.id is not None
    assert insight.id is not None
    assert alert.id is not None
    assert alert.is_acknowledged is False
