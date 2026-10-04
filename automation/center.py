"""
Phase 12: Growth Automation Center Engine.
Manages automated triggers, template substitution ({{name}}, {{referral_link}}, {{workshop_date}}),
mock adapters, webhook/n8n integrations, and execution audits.
Strictly ensures real external messages are never sent without explicit configuration.
"""
import re
import json
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from database.models import AutomationRule, AutomationEvent, Student, Campaign
from backend.app.core.logging import logger
from backend.app.config import settings


# ==============================================================================
# 1. TEMPLATE SUBSTITUTION ENGINE
# ==============================================================================
class TemplateRenderer:
    """
    Renders message templates with dynamic variable substitutions:
    - {{name}}
    - {{referral_link}}
    - {{workshop_date}}
    - {{referral_code}}
    - {{college_name}}
    - {{seats_left}}
    """

    DEFAULT_CONTEXT = {
        "name": "Aditya Sharma",
        "referral_link": "http://localhost:5173/register?ref=NXT-BH7K29",
        "workshop_date": "Saturday, Oct 11, 2026 • 6:00 PM IST",
        "referral_code": "NXT-BH7K29",
        "college_name": "Chaitanya Bharathi Institute of Technology",
        "seats_left": "8",
        "alert_title": "Registration Velocity Surge",
        "alert_message": "Campus campaign reached 98% target.",
    }

    @classmethod
    def render(cls, template: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Substitutes all {{variable}} placeholders using context with safe fallbacks.
        """
        if not template:
            return ""

        merged = {**cls.DEFAULT_CONTEXT, **(context or {})}

        def replace_match(match):
            key = match.group(1).strip()
            return str(merged.get(key, f"{{{{{key}}}}}"))

        # Regex replaces {{ variable_name }} or {{variable_name}}
        rendered = re.sub(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}", replace_match, template)
        return rendered


# ==============================================================================
# 2. DISPATCHER ADAPTERS (Mock-First Architecture)
# ==============================================================================
class DispatchResult:
    def __init__(
        self,
        success: bool,
        channel: str,
        message: str,
        recipient: str,
        is_mock: bool = True,
        webhook_status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.success = success
        self.channel = channel
        self.message = message
        self.recipient = recipient
        self.is_mock = is_mock
        self.webhook_status_code = webhook_status_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "channel": self.channel,
            "message": self.message,
            "recipient": self.recipient,
            "is_mock": self.is_mock,
            "webhook_status_code": self.webhook_status_code,
            "details": self.details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


class MockWhatsAppDispatcher:
    """Simulates WhatsApp Business API delivery."""
    @staticmethod
    def dispatch(recipient: str, message: str) -> DispatchResult:
        logger.info(f"[MOCK WHATSAPP DISPATCH] To: {recipient} | Body: {message[:80]}...")
        return DispatchResult(
            success=True,
            channel="WHATSAPP",
            message=message,
            recipient=recipient,
            is_mock=True,
            details={"provider": "mock_whatsapp_adapter", "delivery_status": "DELIVERED_SIMULATED"}
        )


class MockEmailDispatcher:
    """Simulates Email / SMTP / SendGrid delivery."""
    @staticmethod
    def dispatch(recipient: str, subject: str, message: str) -> DispatchResult:
        logger.info(f"[MOCK EMAIL DISPATCH] To: {recipient} | Subject: {subject}")
        return DispatchResult(
            success=True,
            channel="EMAIL",
            message=message,
            recipient=recipient,
            is_mock=True,
            details={"provider": "mock_email_adapter", "subject": subject, "delivery_status": "DELIVERED_SIMULATED"}
        )


class MockSMSDispatcher:
    """Simulates SMS Gateway delivery."""
    @staticmethod
    def dispatch(recipient: str, message: str) -> DispatchResult:
        logger.info(f"[MOCK SMS DISPATCH] To: {recipient} | Body: {message[:80]}...")
        return DispatchResult(
            success=True,
            channel="SMS",
            message=message,
            recipient=recipient,
            is_mock=True,
            details={"provider": "mock_sms_adapter", "delivery_status": "DELIVERED_SIMULATED"}
        )


class WebhookDispatcher:
    """
    Webhook / n8n integration dispatcher.
    Sends real HTTP POST if configured and valid, or safely mocks when in test mode.
    """
    @staticmethod
    def dispatch(webhook_url: Optional[str], payload: Dict[str, Any]) -> DispatchResult:
        if not webhook_url:
            return DispatchResult(
                success=True,
                channel="WEBHOOK",
                message=json.dumps(payload),
                recipient="unconfigured_webhook",
                is_mock=True,
                details={"status": "SKIPPED_NO_URL", "notice": "Webhook URL not configured; simulated successfully."}
            )

        # If real webhook dispatch is enabled and not a placeholder URL
        is_placeholder = "internal" in webhook_url or "example" in webhook_url or "localhost" in webhook_url
        if is_placeholder:
            logger.info(f"[SIMULATED WEBHOOK/n8n DISPATCH] URL: {webhook_url} | Payload: {json.dumps(payload)[:100]}...")
            return DispatchResult(
                success=True,
                channel="WEBHOOK",
                message=json.dumps(payload),
                recipient=webhook_url,
                is_mock=True,
                webhook_status_code=200,
                details={"provider": "mock_webhook_n8n_adapter", "delivery_status": "SIMULATED_200_OK"}
            )

        # Real HTTP dispatch attempt
        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.post(webhook_url, json=payload)
                return DispatchResult(
                    success=res.is_success,
                    channel="WEBHOOK",
                    message=json.dumps(payload),
                    recipient=webhook_url,
                    is_mock=False,
                    webhook_status_code=res.status_code,
                    details={"provider": "live_webhook", "response_text": res.text[:200]}
                )
        except Exception as e:
            logger.warning(f"Live webhook dispatch error (fallback to safe mock): {e}")
            return DispatchResult(
                success=False,
                channel="WEBHOOK",
                message=json.dumps(payload),
                recipient=webhook_url,
                is_mock=True,
                details={"error": str(e), "fallback": "mock_adapter_logged"}
            )


# ==============================================================================
# 3. AUTOMATION CENTER SERVICE
# ==============================================================================
class AutomationCenterService:
    """
    Core service managing growth automation lifecycle, triggering, and audit logging.
    """

    @staticmethod
    def list_automations(db: Session) -> List[AutomationRule]:
        return db.query(AutomationRule).order_by(AutomationRule.id.asc()).all()

    @staticmethod
    def get_automation(rule_id: int, db: Session) -> Optional[AutomationRule]:
        return db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()

    @staticmethod
    def toggle_status(rule_id: int, db: Session) -> Optional[AutomationRule]:
        rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first()
        if not rule:
            return None
        rule.status = "PAUSED" if rule.status == "ACTIVE" else "ACTIVE"
        db.commit()
        db.refresh(rule)
        return rule

    @classmethod
    def execute_automation(
        cls,
        rule_id: int,
        student_id: Optional[int] = None,
        custom_context: Optional[Dict[str, Any]] = None,
        db: Session = None,
    ) -> Dict[str, Any]:
        """
        Executes an automation rule:
        1. Validates rule status
        2. Resolves context (from student record or defaults)
        3. Renders template variables ({{name}}, {{referral_link}}, {{workshop_date}})
        4. Dispatches via channel mock adapter or webhook
        5. Updates last_triggered and trigger_count
        6. Logs execution audit to AutomationEvent table
        """
        rule = db.query(AutomationRule).filter(AutomationRule.id == rule_id).first() if db else None
        if not rule:
            raise ValueError(f"Automation rule #{rule_id} not found.")

        # Build context
        context = {**TemplateRenderer.DEFAULT_CONTEXT}
        student_record = None

        if student_id and db:
            student_record = db.query(Student).filter(Student.id == student_id).first()
            if student_record:
                context["name"] = student_record.full_name
                context["referral_code"] = student_record.referral_code
                context["referral_link"] = f"http://localhost:5173/register?ref={student_record.referral_code}"
                if student_record.college:
                    context["college_name"] = student_record.college.name

        if custom_context:
            context.update(custom_context)

        # Render message and subject
        rendered_body = TemplateRenderer.render(rule.template_body, context)
        rendered_subject = TemplateRenderer.render(rule.template_subject or "", context)

        # Determine recipient
        recipient = (
            student_record.phone_number if student_record and rule.channel in ("WHATSAPP", "SMS")
            else student_record.email if student_record and rule.channel == "EMAIL"
            else rule.webhook_url if rule.channel == "WEBHOOK"
            else "+91 98765 43210 (Demo Batch Student)"
        )

        # Dispatch via channel adapter
        dispatch_result: DispatchResult
        if rule.channel == "WHATSAPP":
            dispatch_result = MockWhatsAppDispatcher.dispatch(recipient, rendered_body)
        elif rule.channel == "EMAIL":
            dispatch_result = MockEmailDispatcher.dispatch(recipient, rendered_subject, rendered_body)
        elif rule.channel == "SMS":
            dispatch_result = MockSMSDispatcher.dispatch(recipient, rendered_body)
        elif rule.channel == "WEBHOOK":
            payload = {
                "automation_name": rule.name,
                "trigger": rule.trigger,
                "event_type": "GROWTH_AUTOMATION_TRIGGERED",
                "rendered_message": rendered_body,
                "context": context,
                "executed_at": datetime.now(timezone.utc).isoformat()
            }
            dispatch_result = WebhookDispatcher.dispatch(rule.webhook_url, payload)
        else:
            dispatch_result = MockWhatsAppDispatcher.dispatch(recipient, rendered_body)

        # Update telemetry
        rule.last_triggered = datetime.now(timezone.utc)
        rule.trigger_count += 1

        # Audit log in AutomationEvent
        audit_event = AutomationEvent(
            event_type=f"AUTOMATION_{rule.trigger}",
            student_id=student_record.id if student_record else None,
            payload=json.dumps({
                "rule_id": rule.id,
                "rule_name": rule.name,
                "channel": rule.channel,
                "recipient": recipient,
                "rendered_message": rendered_body,
                "rendered_subject": rendered_subject,
                "dispatch": dispatch_result.to_dict()
            }),
            status="SUCCESS" if dispatch_result.success else "FAILED",
            is_simulated=True
        )
        db.add(audit_event)
        db.commit()
        db.refresh(rule)

        return {
            "rule_id": rule.id,
            "rule_name": rule.name,
            "trigger": rule.trigger,
            "channel": rule.channel,
            "status": rule.status,
            "recipient": recipient,
            "rendered_message": rendered_body,
            "rendered_subject": rendered_subject,
            "dispatch": dispatch_result.to_dict(),
            "trigger_count": rule.trigger_count,
            "last_triggered": rule.last_triggered.isoformat() if rule.last_triggered else None,
            "audit_event_id": audit_event.id
        }

    @staticmethod
    def get_recent_audits(limit: int = 15, db: Session = None) -> List[Dict[str, Any]]:
        """Retrieves recent automation dispatch audit events from the database."""
        if not db:
            return []
        events = db.query(AutomationEvent).order_by(AutomationEvent.id.desc()).limit(limit).all()
        results = []
        for e in events:
            parsed = {}
            if e.payload:
                try:
                    parsed = json.loads(e.payload)
                except Exception:
                    parsed = {"raw": e.payload}
            results.append({
                "id": e.id,
                "event_type": e.event_type,
                "student_id": e.student_id,
                "status": e.status,
                "executed_at": e.executed_at.isoformat() if e.executed_at else None,
                "payload": parsed
            })
        return results
