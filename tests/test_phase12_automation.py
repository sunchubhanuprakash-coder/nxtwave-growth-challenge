"""
Phase 12: Growth Automation Center Tests.
Validates:
1. All 5 core automations:
   - Registration confirmation
   - Referral reminder
   - Workshop reminder
   - Final reminder
   - Growth alert
2. Required fields: Name, Trigger, Action, Status, Last Triggered, Trigger Count
3. Automation-ready architecture with Mock Adapters (WhatsApp, Email, SMS, Webhook/n8n)
4. Safe execution: No real messages sent without explicit configuration (mock-first)
5. Template engine with variable substitution ({{name}}, {{referral_link}}, {{workshop_date}})
6. Webhook / n8n integration support
7. End-to-end API endpoints: List, Trigger, Toggle, Audits, Webhook Test
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.config import settings
from database.seed_data import seed_database
from database.migrations import run_all_migrations
from automation.center import (
    TemplateRenderer,
    MockWhatsAppDispatcher,
    MockEmailDispatcher,
    MockSMSDispatcher,
    WebhookDispatcher,
    AutomationCenterService,
)

client = TestClient(app)
ADMIN_HEADERS = {"X-Admin-Key": settings.ADMIN_API_KEY}


@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    seed_database(reset=True)
    run_all_migrations()
    yield


# ==============================================================================
# 1. UNIT TESTS: TEMPLATE ENGINE VARIABLE SUBSTITUTION
# ==============================================================================
def test_template_renderer_substitution_all_variables():
    template = (
        "Hi {{name}}! Your seat for {{workshop_date}} is confirmed. "
        "Invite your team: {{referral_link}}."
    )
    context = {
        "name": "Pooja Hegde",
        "workshop_date": "Sunday, Oct 12, 2026",
        "referral_link": "https://domain.com/register?ref=POOJA123"
    }
    rendered = TemplateRenderer.render(template, context)

    assert "Pooja Hegde" in rendered
    assert "Sunday, Oct 12, 2026" in rendered
    assert "https://domain.com/register?ref=POOJA123" in rendered
    assert "{{name}}" not in rendered
    assert "{{workshop_date}}" not in rendered
    assert "{{referral_link}}" not in rendered


def test_template_renderer_fallback_defaults():
    template = "Welcome {{name}}! Session on {{workshop_date}}. Link: {{referral_link}}"
    rendered = TemplateRenderer.render(template)

    assert "Aditya Sharma" in rendered
    assert "Saturday, Oct 11, 2026" in rendered
    assert "http://localhost:5173/register?ref=NXT-BH7K29" in rendered


def test_template_renderer_missing_keys_safe_preservation():
    template = "Hello {{unknown_variable}}, your code is {{referral_code}}."
    rendered = TemplateRenderer.render(template)
    assert "{{unknown_variable}}" in rendered
    assert "NXT-BH7K29" in rendered


# ==============================================================================
# 2. UNIT TESTS: MOCK ADAPTERS & SAFETY
# ==============================================================================
def test_mock_adapters_safety_and_structure():
    # WhatsApp
    wa_res = MockWhatsAppDispatcher.dispatch("+919876543210", "Hello Test")
    assert wa_res.success is True
    assert wa_res.channel == "WHATSAPP"
    assert wa_res.is_mock is True
    assert wa_res.details["provider"] == "mock_whatsapp_adapter"

    # Email
    email_res = MockEmailDispatcher.dispatch("student@example.com", "Workshop Confirmation", "Body text")
    assert email_res.success is True
    assert email_res.channel == "EMAIL"
    assert email_res.is_mock is True

    # SMS
    sms_res = MockSMSDispatcher.dispatch("+919876543210", "SMS Body")
    assert sms_res.success is True
    assert sms_res.channel == "SMS"
    assert sms_res.is_mock is True

    # Webhook
    hook_res = WebhookDispatcher.dispatch(
        "https://n8n.webhook.internal/test",
        {"event": "TEST_EVENT", "data": 123}
    )
    assert hook_res.success is True
    assert hook_res.channel == "WEBHOOK"
    assert hook_res.is_mock is True
    assert hook_res.webhook_status_code == 200


# ==============================================================================
# 3. INTEGRATION TESTS: AUTOMATION CENTER API ENDPOINTS
# ==============================================================================
def test_api_get_automations_all_five_present():
    response = client.get("/api/automations")
    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 5

    names = [a["name"] for a in data]
    expected_automations = [
        "Registration Confirmation",
        "Referral Reminder",
        "Workshop Reminder",
        "Final Reminder",
        "Growth Alert",
    ]
    for expected in expected_automations:
        assert any(expected.lower() in n.lower() for n in names), f"Missing automation: {expected}"

    # Verify all required properties
    for rule in data:
        assert "name" in rule
        assert "trigger" in rule
        assert "action" in rule
        assert "status" in rule
        assert "trigger_count" in rule
        assert "is_mock_adapter" in rule
        assert rule["is_mock_adapter"] is True, "Must default to safe mock adapter"
        assert "sample_rendered_message" in rule
        assert "{{name}}" not in rule["sample_rendered_message"]


def test_api_trigger_automation_rule():
    # Fetch rules
    get_res = client.get("/api/automations")
    assert get_res.status_code == 200
    rule = get_res.json()[0]
    rule_id = rule["id"]
    initial_count = rule["trigger_count"]

    # Trigger with custom context
    trigger_payload = {
        "custom_context": {
            "name": "Sneha Reddy",
            "referral_link": "https://nxtwave.dev/register?ref=SNEHA99",
            "workshop_date": "Sunday, Oct 12, 2026 • 7:00 PM"
        }
    }
    resp = client.post(f"/api/automations/{rule_id}/trigger", json=trigger_payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["rule_id"] == rule_id
    assert "Sneha Reddy" in data["rendered_message"]
    assert "SNEHA99" in data["rendered_message"]
    assert data["trigger_count"] == initial_count + 1
    assert data["last_triggered"] is not None
    assert data["dispatch"]["is_mock"] is True
    assert "audit_event_id" in data


def test_api_toggle_automation_status():
    get_res = client.get("/api/automations")
    rule = get_res.json()[0]
    rule_id = rule["id"]
    initial_status = rule["status"]

    # Toggle
    t1 = client.patch(f"/api/automations/{rule_id}/toggle", headers=ADMIN_HEADERS)
    assert t1.status_code == 200
    expected_status_1 = "PAUSED" if initial_status == "ACTIVE" else "ACTIVE"
    assert t1.json()["status"] == expected_status_1

    # Toggle back
    t2 = client.patch(f"/api/automations/{rule_id}/toggle", headers=ADMIN_HEADERS)
    assert t2.status_code == 200
    assert t2.json()["status"] == initial_status


def test_api_update_automation_template():
    get_res = client.get("/api/automations")
    rule = get_res.json()[0]
    rule_id = rule["id"]

    new_template = "Hello {{name}}! Updated template with {{referral_link}} on {{workshop_date}}."
    up_res = client.put(
        f"/api/automations/{rule_id}",
        json={"template_body": new_template},
        headers=ADMIN_HEADERS
    )
    assert up_res.status_code == 200
    data = up_res.json()
    assert data["template_body"] == new_template
    assert "Aditya Sharma" in data["sample_rendered_message"]


def test_api_automation_audits_log():
    # Query audits
    resp = client.get("/api/automations/events/audits?limit=10")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert "event_type" in first
    assert "status" in first
    assert "payload" in first


def test_api_webhook_n8n_test_endpoint():
    payload = {
        "webhook_url": "https://n8n.webhook.internal/webhook/growth-engine-audit",
        "event_name": "STUDENT_REGISTRATION_VERIFIED",
        "sample_context": {
            "name": "Rahul Verma",
            "college": "VNR Vignana Jyothi",
            "referral_code": "RAHUL007"
        }
    }
    resp = client.post("/api/automations/webhook/test", json=payload, headers=ADMIN_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["channel"] == "WEBHOOK"
    assert data["webhook_url"] == payload["webhook_url"]
    assert "payload_dispatched" in data
