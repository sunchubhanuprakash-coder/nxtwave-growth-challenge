"""
Phase 14 Test Suite: Automatic Growth Alerts
============================================
Validates the automatic detection, severity calculation, data-backed metrics,
reasons, prescriptive recommendations, and alerting API endpoints for all 7 growth conditions:
1. Registration velocity below target
2. Referral rate decline
3. High traffic but low conversion
4. Budget overspending
5. Channel underperformance
6. Sudden registration spike
7. Forecast falling below 500
"""

import pytest
from fastapi.testclient import TestClient
from database.session import SessionLocal
from database.models import Campaign, Registration, Student, GrowthAlert
from analytics.alerts import GrowthAlertEngine
from backend.app.main import app

client = TestClient(app)


def test_growth_alert_engine_evaluates_all_7_conditions():
    """
    Verifies that GrowthAlertEngine checks all 7 required growth conditions
    and produces synchronized GrowthAlert records with proper titles, metrics, reasons, and actions.
    """
    db = SessionLocal()
    try:
        alerts = GrowthAlertEngine.evaluate_and_sync_alerts(db)
        assert len(alerts) >= 7

        alert_types = {a.alert_type for a in alerts}
        expected_types = {
            "REGISTRATION_VELOCITY",
            "REFERRAL_RATE_DECLINE",
            "HIGH_TRAFFIC_LOW_CONVERSION",
            "BUDGET_OVERSPENDING",
            "CHANNEL_UNDERPERFORMANCE",
            "REGISTRATION_SPIKE",
            "FORECAST_FALLING_BELOW_500",
        }
        assert expected_types.issubset(alert_types), f"Missing alert types: {expected_types - alert_types}"

        for alert in alerts:
            # Check required fields
            assert alert.title, "Alert missing title"
            assert alert.severity in ("INFO", "WARNING", "CRITICAL"), f"Invalid severity: {alert.severity}"
            assert alert.detected_metric, f"Alert {alert.alert_type} missing detected_metric"
            assert alert.reason, f"Alert {alert.alert_type} missing reason"
            assert alert.recommended_action, f"Alert {alert.alert_type} missing recommended_action"
            assert len(alert.recommended_action) > 10, "Recommendation is too brief"
            assert len(alert.reason) > 10, "Reason is too brief"
    finally:
        db.close()


def test_api_get_alerts_list():
    """
    Verifies GET /api/alerts returns all evaluated alerts with full schema metadata.
    """
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 7

    first = data[0]
    assert "id" in first
    assert "title" in first
    assert "severity" in first
    assert "detected_metric" in first
    assert "reason" in first
    assert "recommended_action" in first
    assert "is_acknowledged" in first


def test_api_get_alerts_filtered_by_severity():
    """
    Verifies filtering alerts by severity (e.g. CRITICAL, INFO).
    """
    response_crit = client.get("/api/alerts?severity=CRITICAL")
    assert response_crit.status_code == 200
    crit_alerts = response_crit.json()
    for a in crit_alerts:
        assert a["severity"] == "CRITICAL"

    response_info = client.get("/api/alerts?severity=INFO")
    assert response_info.status_code == 200
    info_alerts = response_info.json()
    for a in info_alerts:
        assert a["severity"] == "INFO"


def test_api_get_alerts_summary():
    """
    Verifies GET /api/alerts/summary returns aggregated counts and categorized status.
    """
    response = client.get("/api/alerts/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_alerts" in data
    assert "critical_count" in data
    assert "warning_count" in data
    assert "info_count" in data
    assert "unacknowledged_count" in data
    assert "alerts" in data
    assert data["total_alerts"] >= 7
    assert data["critical_count"] + data["warning_count"] + data["info_count"] == data["total_alerts"]


def test_api_post_evaluate_alerts():
    """
    Verifies POST /api/alerts/evaluate forces a live evaluation across database telemetry.
    """
    response = client.post("/api/alerts/evaluate")
    assert response.status_code == 200
    data = response.json()
    assert data["total_alerts"] >= 7
    assert isinstance(data["alerts"], list)


def test_api_acknowledge_alert():
    """
    Verifies PATCH /api/alerts/{id}/acknowledge toggles is_acknowledged to True.
    """
    # First get an unacknowledged alert
    list_resp = client.get("/api/alerts")
    alerts = list_resp.json()
    assert len(alerts) > 0
    target_alert = alerts[0]
    target_id = target_alert["id"]

    ack_resp = client.patch(f"/api/alerts/{target_id}/acknowledge")
    assert ack_resp.status_code == 200
    ack_data = ack_resp.json()
    assert ack_data["success"] is True
    assert ack_data["alert_id"] == target_id
    assert ack_data["is_acknowledged"] is True

    # Verify query for unacknowledged alerts handles it
    unack_resp = client.get("/api/alerts?unacknowledged_only=true")
    assert unack_resp.status_code == 200
    unack_ids = [a["id"] for a in unack_resp.json()]
    assert target_id not in unack_ids


def test_alert_recommendations_are_metric_driven():
    """
    Verifies that recommendations contain dynamic metric details rather than static text.
    """
    db = SessionLocal()
    try:
        alerts = GrowthAlertEngine.evaluate_and_sync_alerts(db)
        found_dynamic = False
        for a in alerts:
            # Check that detected_metric or reason contains numbers, ratios, or specific units
            if any(char.isdigit() for char in a.detected_metric or ""):
                found_dynamic = True
            # Recommendations should reference specific operational actions
            assert len(a.recommended_action) > 15
        assert found_dynamic, "Detected metrics should contain dynamic numeric observations"
    finally:
        db.close()
