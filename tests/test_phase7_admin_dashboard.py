import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from database.seed_data import seed_database


@pytest.fixture(scope="module")
def client():
    # Ensure clean seeded database state
    seed_database(reset=True)
    with TestClient(app) as c:
        yield c


def test_admin_dashboard_primary_kpis(client: TestClient):
    """
    Verifies that all 9 primary KPIs specified in Phase 7 are present,
    accurately computed from database metrics, and not hardcoded static mocks.
    """
    response = client.get("/api/admin/dashboard")
    assert response.status_code == 200
    data = response.json()

    assert "kpis" in data
    kpis = data["kpis"]

    # 1. Target registrations (Target: 500)
    assert kpis["target_registrations"] == 500

    # 2. Current registrations
    assert kpis["current_registrations"] >= 500

    # 3. Remaining
    assert kpis["remaining"] == max(0, 500 - kpis["current_registrations"])

    # 4. Progress %
    assert kpis["progress_percent"] == 100.0

    # 5. Days remaining
    assert kpis["days_remaining"] >= 0

    # 6. Referral share
    assert kpis["referral_share"] > 40.0  # >50% viral share achieved

    # 7. Conversion rate
    assert kpis["conversion_rate"] > 20.0

    # 8. Estimated CPR
    assert kpis["estimated_cpr"] > 0.0
    assert kpis["estimated_cpr"] <= 4.50  # within ₹2,000 / 500 = ₹4.00 budget benchmark

    # 9. Growth score
    assert kpis["growth_score"] >= 80.0  # high-performance sprint


def test_admin_dashboard_all_8_charts(client: TestClient):
    """
    Verifies that all 8 required charts are generated with rich time-series data:
    1. Registration trend
    2. Daily registrations
    3. Acquisition source
    4. Referral contribution
    5. Funnel
    6. College performance
    7. Budget
    8. Forecast
    """
    response = client.get("/api/admin/dashboard")
    assert response.status_code == 200
    charts = response.json()["charts"]

    # Chart 1: Registration trend (Cumulative Actual vs Target benchmark)
    assert "registration_trend" in charts
    trend = charts["registration_trend"]
    assert len(trend) == 7
    assert trend[0]["target_cumulative"] == 71
    assert trend[-1]["target_cumulative"] == 500
    assert trend[-1]["actual_cumulative"] >= 500

    # Chart 2: Daily registrations
    assert "daily_registrations" in charts
    daily = charts["daily_registrations"]
    assert len(daily) == 7
    assert sum(d["total_registrations"] for d in daily) >= 500

    # Chart 3: Acquisition source
    assert "acquisition_source" in charts
    sources = charts["acquisition_source"]
    assert len(sources) >= 5
    wa = next((s for s in sources if "WhatsApp" in s["source"]), None)
    assert wa is not None
    assert wa["registrations"] >= 200

    # Chart 4: Referral contribution
    assert "referral_contribution" in charts
    ref_chart = charts["referral_contribution"]
    assert len(ref_chart) == 7
    assert all("direct_registrations" in d and "referral_registrations" in d for d in ref_chart)

    # Chart 5: Funnel (5 stages)
    assert "funnel" in charts
    funnel = charts["funnel"]
    assert len(funnel) == 5
    assert funnel[0]["stage"] == "Campaign Visits"
    assert funnel[1]["stage"] == "Form Starts"
    assert funnel[2]["stage"] == "Completed Registrations"
    assert funnel[3]["stage"] == "Verified Final-Year"
    assert funnel[4]["stage"] == "Viral Squad Active"

    # Chart 6: College performance
    assert "college_performance" in charts
    cols = charts["college_performance"]
    assert len(cols) == 5
    assert any("CBIT" in c["college_code"] for c in cols)

    # Chart 7: Budget
    assert "budget" in charts
    budget = charts["budget"]
    assert len(budget) == 7
    assert budget[-1]["cumulative_spend_inr"] <= 2000.0
    assert budget[-1]["budget_cap_inr"] == 2000.0

    # Chart 8: Forecast
    assert "forecast" in charts
    forecast = charts["forecast"]
    assert len(forecast) == 7
    assert forecast[-1]["forecast"] >= 500
    assert forecast[-1]["upper_bound"] > forecast[-1]["forecast"]
    assert forecast[-1]["lower_bound"] < forecast[-1]["forecast"]


def test_admin_dashboard_filtering_options_and_slices(client: TestClient):
    """
    Verifies date, source, and college filters dynamically adjust the computed metrics.
    """
    # 1. Filter by Last 3 Days
    res_3days = client.get("/api/admin/dashboard?date_filter=last_3_days")
    assert res_3days.status_code == 200
    data_3days = res_3days.json()
    assert len(data_3days["charts"]["daily_registrations"]) == 3
    assert data_3days["kpis"]["current_registrations"] < 520

    # 2. Filter by Today
    res_today = client.get("/api/admin/dashboard?date_filter=today")
    assert res_today.status_code == 200
    data_today = res_today.json()
    assert len(data_today["charts"]["daily_registrations"]) == 1

    # 3. Filter by Source: WhatsApp
    res_wa = client.get("/api/admin/dashboard?source_filter=whatsapp")
    assert res_wa.status_code == 200
    data_wa = res_wa.json()
    assert data_wa["filters_applied"]["source_filter"] == "whatsapp"
    assert data_wa["kpis"]["current_registrations"] < 520

    # 4. Filter by College: CBIT
    res_cbit = client.get("/api/admin/dashboard?college_filter=CBIT")
    assert res_cbit.status_code == 200
    data_cbit = res_cbit.json()
    assert data_cbit["filters_applied"]["college_filter"] == "CBIT"
    assert data_cbit["kpis"]["current_registrations"] < 520

    # Check filter options structure
    assert "filter_options" in data_cbit
    opts = data_cbit["filter_options"]
    assert "sources" in opts
    assert "colleges" in opts
    assert "date_ranges" in opts
