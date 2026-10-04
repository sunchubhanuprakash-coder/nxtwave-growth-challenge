import sys
import os
sys.path.insert(0, os.path.abspath("."))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from database.session import SessionLocal
from database.models import AutomationRule
from automation.center import TemplateRenderer

def main():
    db = SessionLocal()
    rules = db.query(AutomationRule).order_by(AutomationRule.id.asc()).all()

    print("=" * 80)
    print("PHASE 12: GROWTH ENGINE AUTOMATION RULES & WEBHOOK INSPECTION")
    print("=" * 80)

    for r in rules:
        print(f"\n[Rule #{r.id}] {r.name}")
        print(f"  • Trigger:        {r.trigger}")
        print(f"  • Action:         {r.action}")
        print(f"  • Channel:        {r.channel} (Mock Adapter: {r.is_mock_adapter})")
        print(f"  • Status:         {r.status}")
        print(f"  • Trigger Count:  {r.trigger_count}")
        print(f"  • Last Triggered: {r.last_triggered}")
        print(f"  • Webhook URL:    {r.webhook_url}")
        if r.template_subject:
            print(f"  • Subject:        {r.template_subject}")
        print("  • Raw Template Body:")
        print(f"    {r.template_body}")
        
        # Test variable substitution with custom context
        custom_test = {
            "name": "Priya Sharma",
            "referral_link": "https://nxtwave.app/register?ref=NXT-PRIYA9",
            "workshop_date": "Sunday, Oct 12 • 6:00 PM IST"
        }
        rendered = TemplateRenderer.render(r.template_body, custom_test)
        print("  • Live Substituted Output (Priya Sharma):")
        print(f"    {rendered}")
        print("-" * 80)

    db.close()

if __name__ == "__main__":
    main()
