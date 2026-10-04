"""
Phase 8: Comprehensive Unit Tests for Reusable Analytics Engine
==============================================================
Validates all 11 core calculation functions, statistical boundary conditions,
edge cases, the 6 analytical suites, and live database integrations.
"""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from database.session import SessionLocal
from database.models import Campaign, DailyMetric, Registration, Student, BudgetTransaction
from analytics.metrics import (
    calculate_conversion_rate,
    calculate_cost_per_registration,
    calculate_referral_rate,
    calculate_channel_performance,
    calculate_registration_velocity,
    calculate_forecast,
    calculate_growth_score,
    calculate_funnel_dropoff,
    calculate_budget_efficiency,
    calculate_college_performance,
    calculate_daily_growth,
)
from analytics.acquisition import AcquisitionAnalytics
from analytics.funnel import FunnelAnalytics
from analytics.referral import ReferralAnalytics
from analytics.colleges import CollegeAnalytics
from analytics.budget import BudgetAnalytics
from analytics.daily_trend import DailyTrendAnalytics
from analytics.engine import AnalyticsEngine


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
# 1. UNIT TESTS: calculate_conversion_rate()
# ==============================================================================
def test_calculate_conversion_rate_standard():
    rate = calculate_conversion_rate(conversions=520, total_visitors=1830)
    assert rate == 28.42


def test_calculate_conversion_rate_zero_visitors():
    assert calculate_conversion_rate(conversions=10, total_visitors=0) == 0.0
    assert calculate_conversion_rate(conversions=0, total_visitors=-5) == 0.0


def test_calculate_conversion_rate_negative_conversions():
    with pytest.raises(ValueError):
        calculate_conversion_rate(conversions=-1, total_visitors=100)


def test_calculate_conversion_rate_capped_at_100():
    # If conversions exceed visitors due to reporting lag, clamp to 100%
    assert calculate_conversion_rate(conversions=150, total_visitors=100) == 100.0


# ==============================================================================
# 2. UNIT TESTS: calculate_cost_per_registration()
# ==============================================================================
def test_calculate_cpr_blended():
    cpr = calculate_cost_per_registration(total_spend=2000.0, total_registrations=520)
    assert cpr == 3.85


def test_calculate_cpr_verified_only():
    cpr = calculate_cost_per_registration(
        total_spend=2000.0,
        total_registrations=520,
        verified_only=True,
        verified_registrations=492
    )
    assert cpr == 4.07


def test_calculate_cpr_zero_registrations():
    assert calculate_cost_per_registration(total_spend=2000.0, total_registrations=0) == 0.0


def test_calculate_cpr_negative_spend():
    with pytest.raises(ValueError):
        calculate_cost_per_registration(total_spend=-100.0, total_registrations=100)


# ==============================================================================
# 3. UNIT TESTS: calculate_referral_rate()
# ==============================================================================
def test_calculate_referral_rate_standard():
    res = calculate_referral_rate(referral_registrations=270, total_registrations=520, total_invites_sent=600)
    assert res["referral_share_percent"] == 51.92
    assert res["direct_registrations"] == 250
    # K = 270 / 250 = 1.08
    assert res["viral_k_factor"] == 1.08
    assert res["is_viral_loop_sustainable"] is True
    assert res["invite_conversion_percent"] == 45.0


def test_calculate_referral_rate_zero():
    res = calculate_referral_rate(referral_registrations=0, total_registrations=0)
    assert res["referral_share_percent"] == 0.0
    assert res["viral_k_factor"] == 0.0
    assert res["is_viral_loop_sustainable"] is False


def test_calculate_referral_rate_negative():
    with pytest.raises(ValueError):
        calculate_referral_rate(referral_registrations=-10, total_registrations=100)


# ==============================================================================
# 4. UNIT TESTS: calculate_channel_performance()
# ==============================================================================
def test_calculate_channel_performance():
    sample_sources = [
        {"source": "whatsapp", "visitors": 600, "registrations": 190, "verified_final_year": 180, "spend_inr": 0.0},
        {"source": "ambassador_cbit", "visitors": 450, "registrations": 140, "verified_final_year": 134, "spend_inr": 1200.0},
        {"source": "telegram", "visitors": 250, "registrations": 60, "verified_final_year": 56, "spend_inr": 0.0},
    ]
    results = calculate_channel_performance(sample_sources)
    assert len(results) == 3
    # First ranked is whatsapp due to highest registrations
    assert results[0]["source"] == "whatsapp"
    assert results[0]["conversion_rate"] == 31.67
    assert results[0]["cpr_inr"] == 0.0
    # Ambassador CPR: 1200 / 140 = 8.57
    assert results[1]["cpr_inr"] == 8.57


def test_calculate_channel_performance_empty():
    assert calculate_channel_performance([]) == []


# ==============================================================================
# 5. UNIT TESTS: calculate_registration_velocity()
# ==============================================================================
def test_calculate_registration_velocity():
    daily_data = [
        {"day_number": 1, "registrations": 38},
        {"day_number": 2, "registrations": 64},
        {"day_number": 3, "registrations": 132},
        {"day_number": 4, "registrations": 110},
        {"day_number": 5, "registrations": 82},
        {"day_number": 6, "registrations": 52},
        {"day_number": 7, "registrations": 42},
    ]
    res = calculate_registration_velocity(daily_data, window_days=3, target_registrations=500)
    assert res["elapsed_days"] == 7
    assert res["days_remaining"] == 0
    assert res["cumulative_registrations"] == 520
    assert res["overall_daily_average"] == round(520 / 7.0, 2)
    # Moving average of last 3 days (82, 52, 42) -> 176 / 3 = 58.67
    assert res["moving_average_velocity"] == 58.67
    # Acceleration: 42 - 52 = -10.0
    assert res["acceleration"] == -10.0
    assert res["pacing_status"] == "target_achieved"


def test_calculate_registration_velocity_empty():
    res = calculate_registration_velocity([])
    assert res["cumulative_registrations"] == 0
    assert res["pacing_status"] == "behind_schedule"


# ==============================================================================
# 6. UNIT TESTS: calculate_forecast()
# ==============================================================================
def test_calculate_forecast():
    daily_history = [
        {"cumulative_registrations": 38},
        {"cumulative_registrations": 102},
        {"cumulative_registrations": 234},
        {"cumulative_registrations": 344},
        {"cumulative_registrations": 426},
        {"cumulative_registrations": 478},
        {"cumulative_registrations": 520},
    ]
    res = calculate_forecast(daily_history, target=500, total_campaign_days=7)
    assert res["projected_final_registrations"] == 520
    assert res["lower_bound_95"] <= res["projected_final_registrations"]
    assert res["upper_bound_95"] >= res["projected_final_registrations"]
    assert res["target_probability_percent"] >= 70.0
    assert len(res["daily_forecast_points"]) == 7


def test_calculate_forecast_empty():
    res = calculate_forecast([])
    assert res["projected_final_registrations"] == 0
    assert res["daily_forecast_points"] == []


# ==============================================================================
# 7. UNIT TESTS: calculate_growth_score()
# ==============================================================================
def test_calculate_growth_score_high_performance():
    score = calculate_growth_score({
        "current_registrations": 520,
        "target_registrations": 500,
        "days_elapsed": 7,
        "referral_share": 51.9,
        "estimated_cpr": 3.85,
        "verified_final_year": 492,
    })
    # Target exceeded, virality > 40%, CPR <= 4, ICP fit > 90%
    assert score >= 90.0
    assert score <= 100.0


def test_calculate_growth_score_underperforming():
    score = calculate_growth_score({
        "current_registrations": 100,
        "target_registrations": 500,
        "days_elapsed": 7,
        "referral_share": 10.0,
        "estimated_cpr": 20.0,
        "verified_final_year": 50,
    })
    assert score < 50.0


# ==============================================================================
# 8. UNIT TESTS: calculate_funnel_dropoff()
# ==============================================================================
def test_calculate_funnel_dropoff():
    stages = [
        {"stage": "Landing Page Visits", "count": 1830},
        {"stage": "Form Starts", "count": 912},
        {"stage": "Completed Registrations", "count": 520},
        {"stage": "Verified Final-Year", "count": 492},
        {"stage": "Active Viral Squad", "count": 210},
    ]
    res = calculate_funnel_dropoff(stages)
    assert len(res) == 5
    # First stage top conversion is 100%
    assert res[0]["conversion_from_top"] == 100.0
    assert res[0]["dropoff_count"] == 0
    # Step 2: 912 / 1830 = 49.8%
    assert res[1]["conversion_from_previous"] == 49.8
    assert res[1]["dropoff_count"] == 918
    assert res[1]["dropoff_rate_percent"] == 50.2
    assert res[1]["bottleneck_alert"] is True  # Dropoff > 50%


def test_calculate_funnel_dropoff_empty():
    assert calculate_funnel_dropoff([]) == []


# ==============================================================================
# 9. UNIT TESTS: calculate_budget_efficiency()
# ==============================================================================
def test_calculate_budget_efficiency_within_cap():
    txs = [
        {"amount_inr": 1200.0, "transaction_type": "AMBASSADOR_INCENTIVE", "transaction_date": "2026-09-30"},
        {"amount_inr": 500.0, "transaction_type": "COMMUNITY_BOOST", "transaction_date": "2026-10-02"},
        {"amount_inr": 300.0, "transaction_type": "CONTINGENCY", "transaction_date": "2026-10-04"},
    ]
    res = calculate_budget_efficiency(txs, total_registrations=520, budget_cap=2000.0)
    assert res["total_spend_inr"] == 2000.0
    assert res["budget_cap_inr"] == 2000.0
    assert res["budget_utilization_percent"] == 100.0
    assert res["remaining_budget_inr"] == 0.0
    assert res["is_over_budget"] is False
    assert res["blended_cpr_inr"] == 3.85
    assert "AMBASSADOR_INCENTIVE" in res["spend_by_category"]
    assert res["spend_by_category"]["AMBASSADOR_INCENTIVE"] == 1200.0


def test_calculate_budget_efficiency_over_budget():
    txs = [{"amount_inr": 2500.0, "transaction_type": "ADS"}]
    res = calculate_budget_efficiency(txs, total_registrations=100, budget_cap=2000.0)
    assert res["is_over_budget"] is True
    assert res["remaining_budget_inr"] == 0.0


# ==============================================================================
# 10. UNIT TESTS: calculate_college_performance()
# ==============================================================================
def test_calculate_college_performance():
    colleges = [
        {"college": "CBIT", "registrations": 196, "verified_final_year": 186, "tier": "TIER_1"},
        {"college": "VNRVJIET", "registrations": 148, "verified_final_year": 142, "tier": "TIER_1"},
        {"college": "Vasavi", "registrations": 78, "verified_final_year": 74, "tier": "TIER_1"},
    ]
    res = calculate_college_performance(colleges, total_registrations=520)
    assert len(res) == 3
    assert res[0]["college"] == "CBIT"
    assert res[0]["rank"] == 1
    # CBIT share: 196 / 520 = 37.7% -> Core Driver
    assert res[0]["penetration_class"] == "Core Driver"
    assert res[1]["college"] == "VNRVJIET"
    assert res[1]["rank"] == 2


def test_calculate_college_performance_empty():
    assert calculate_college_performance([], total_registrations=500) == []


# ==============================================================================
# 11. UNIT TESTS: calculate_daily_growth()
# ==============================================================================
def test_calculate_daily_growth():
    metrics = [
        {"day_number": 1, "registrations_count": 38, "referral_registrations_count": 8, "verified_final_year_count": 36},
        {"day_number": 2, "registrations_count": 64, "referral_registrations_count": 22, "verified_final_year_count": 60},
    ]
    res = calculate_daily_growth(metrics, target_registrations=500, total_campaign_days=7)
    assert len(res) == 2
    assert res[0]["cumulative_registrations"] == 38
    assert res[0]["growth_rate_percent"] == 0.0
    # Day 2 growth: (64 - 38) / 38 = 68.4%
    assert res[1]["growth_rate_percent"] == 68.4
    assert res[1]["cumulative_registrations"] == 102
    assert res[1]["daily_referral_share"] == round((22 / 64.0) * 100, 1)


# ==============================================================================
# 12. INTEGRATION TESTS: The 6 Analytics Suites & Database Connectivity
# ==============================================================================
def test_analytics_suites_with_db(db_session):
    acq = AcquisitionAnalytics.from_db(db_session)
    assert "channels" in acq
    assert acq["total_registrations"] >= 0

    funnel = FunnelAnalytics.from_db(db_session)
    assert "stages" in funnel
    assert len(funnel["stages"]) == 5

    referral = ReferralAnalytics.from_db(db_session)
    assert "viral_k_factor" in referral
    assert referral["viral_k_factor"] >= 0.0

    colleges = CollegeAnalytics.from_db(db_session)
    assert "colleges" in colleges
    assert colleges["total_institutions_engaged"] >= 1

    budget = BudgetAnalytics.from_db(db_session)
    assert "total_spend_inr" in budget
    assert budget["total_spend_inr"] <= 2000.0  # Constraint enforcement

    daily = DailyTrendAnalytics.from_db(db_session)
    assert "daily_progression" in daily
    assert "forecast" in daily


def test_analytics_engine_full_report(db_session):
    report = AnalyticsEngine.generate_full_report(db_session)
    assert "overview" in report
    assert "acquisition" in report
    assert "funnel" in report
    assert "referral" in report
    assert "colleges" in report
    assert "budget" in report
    assert "daily_trend" in report
    assert report["overview"]["target_registrations"] == 500


# ==============================================================================
# 13. API ENDPOINT TEST: GET /api/analytics
# ==============================================================================
def test_get_analytics_endpoint(client):
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "daily_velocity" in data
    assert "channel_attribution" in data
    assert "college_breakdown" in data
    assert "branch_breakdown" in data
    # Phase 8 fields
    assert "acquisition" in data
    assert "funnel" in data
    assert "referral" in data
    assert "colleges" in data
    assert "budget" in data
    assert "daily_trend" in data
    assert "growth_score" in data
    assert data["growth_score"] >= 80.0
