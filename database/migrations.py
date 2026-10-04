"""
Database Schema Migration Utilities.
Safely adds new columns and tables to SQLite without dropping existing data.
"""
import sys
import os
sys.path.insert(0, os.path.abspath("."))

from sqlalchemy import text
from database.session import engine
from backend.app.core.logging import logger


def migrate_experiments_table():
    """
    Ensures the 'experiments' table has all Phase 11 columns in SQLite:
    category, control_text, variant_text, primary_metric, success_threshold,
    start_date, end_date.
    """
    try:
        with engine.connect() as conn:
            # Check if experiments table exists
            table_check = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='experiments'")).fetchone()
            if not table_check:
                return

            existing_cols = [c[1] for c in conn.execute(text("PRAGMA table_info(experiments)")).fetchall()]
            
            columns_to_add = [
                ("category", "VARCHAR(50) DEFAULT 'Landing headline'"),
                ("control_text", "TEXT"),
                ("variant_text", "TEXT"),
                ("primary_metric", "VARCHAR(100) DEFAULT 'Conversion Rate'"),
                ("success_threshold", "FLOAT DEFAULT 5.0"),
                ("start_date", "DATETIME"),
                ("end_date", "DATETIME"),
            ]

            for col_name, col_type in columns_to_add:
                if col_name not in existing_cols:
                    logger.info(f"Adding missing column to experiments table: {col_name}")
                    conn.execute(text(f"ALTER TABLE experiments ADD COLUMN {col_name} {col_type}"))

            conn.commit()
    except Exception as e:
        logger.warning(f"Experiment table migration check notice: {e}")


def migrate_automation_tables():
    """
    Ensures the 'automation_rules' table exists in SQLite and seeds the 5 default automation rules
    (Registration Confirmation, Referral Reminder, Workshop Reminder, Final Reminder, Growth Alert).
    """
    from database.base import Base
    import database.models  # Ensure models are loaded
    from database.models import AutomationRule
    from database.session import SessionLocal

    try:
        # Create table if not exists
        Base.metadata.create_all(bind=engine, tables=[Base.metadata.tables["automation_rules"]])
        
        # Check and seed 5 default automation rules
        db = SessionLocal()
        try:
            count = db.query(AutomationRule).count()
            if count == 0:
                logger.info("Seeding 5 core Growth Engine Automation Rules...")
                default_rules = [
                    AutomationRule(
                        name="Registration Confirmation",
                        trigger="STUDENT_REGISTERED",
                        action="SEND_WHATSAPP_CONFIRMATION",
                        channel="WHATSAPP",
                        status="ACTIVE",
                        template_body="Hi {{name}}! 🎉 Your seat for the NxtWave AI Masterclass on {{workshop_date}} is confirmed! Walk away with a live deployed AI project URL on your resume. Invite batchmates with your exclusive referral link: {{referral_link}}",
                        template_subject="Registration Confirmed: AI Project Masterclass",
                        webhook_url="https://n8n.webhook.internal/webhook/registration-confirm",
                        trigger_count=520,
                        is_mock_adapter=True,
                        is_simulated=False
                    ),
                    AutomationRule(
                        name="Referral Reminder",
                        trigger="REFERRAL_INACTIVE_24H",
                        action="SEND_REFERRAL_BOOST",
                        channel="WHATSAPP",
                        status="ACTIVE",
                        template_body="Hey {{name}}, unlock your Milestone 1 Squad Pass for the upcoming {{workshop_date}} masterclass! Share your personal referral link {{referral_link}} with 1 batchmate to receive the Top 25 AI Project Blueprints kit.",
                        template_subject="Unlock your Squad Pass: 1 Referral Away",
                        webhook_url="https://n8n.webhook.internal/webhook/referral-reminder",
                        trigger_count=312,
                        is_mock_adapter=True,
                        is_simulated=False
                    ),
                    AutomationRule(
                        name="Workshop Reminder",
                        trigger="WORKSHOP_T_MINUS_24H",
                        action="SEND_EMAIL_CALENDAR_REMINDER",
                        channel="EMAIL",
                        status="ACTIVE",
                        template_body="Hi {{name}}, only 24 hours left until our live AI Masterclass on {{workshop_date}}! Ensure your IDE and Python environment are ready. Invite batchmates before registration closes: {{referral_link}}",
                        template_subject="⏳ 24h Countdown: NxtWave AI Masterclass Live Session",
                        webhook_url="https://n8n.webhook.internal/webhook/workshop-reminder",
                        trigger_count=485,
                        is_mock_adapter=True,
                        is_simulated=False
                    ),
                    AutomationRule(
                        name="Final Reminder",
                        trigger="WORKSHOP_T_MINUS_2H",
                        action="SEND_SMS_URGENCY",
                        channel="SMS",
                        status="ACTIVE",
                        template_body="🚨 FINAL CALL for {{name}}! Live AI Workshop begins in 2 hours on {{workshop_date}}. Join the meeting room now and bring your team using: {{referral_link}}",
                        template_subject="🚨 Starting in 2 Hours: Live AI Project Deployment",
                        webhook_url="https://n8n.webhook.internal/webhook/final-reminder",
                        trigger_count=470,
                        is_mock_adapter=True,
                        is_simulated=False
                    ),
                    AutomationRule(
                        name="Growth Alert",
                        trigger="GROWTH_METRIC_BREACH",
                        action="TRIGGER_WEBHOOK_N8N",
                        channel="WEBHOOK",
                        status="ACTIVE",
                        template_body="⚡ [GROWTH COPILOT ALERT] Campaign notification for {{name}}. Registrations approaching capacity for {{workshop_date}}. Verified referral link: {{referral_link}}",
                        template_subject="⚡ Growth Alert: Registration Velocity Breach",
                        webhook_url="https://n8n.webhook.internal/webhook/growth-alert",
                        trigger_count=18,
                        is_mock_adapter=True,
                        is_simulated=False
                    ),
                ]
                db.add_all(default_rules)
                db.commit()
                logger.info("Successfully seeded 5 core Automation Rules.")
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Automation table migration check notice: {e}")


def migrate_simulation_tables():
    """
    Ensures the 'simulation_states' table exists in SQLite and seeds the initial state
    (Day 1 of 7, scenario=BASE, days_remaining=7).
    """
    from database.base import Base
    import database.models
    from database.models import SimulationState
    from database.session import SessionLocal

    try:
        Base.metadata.create_all(bind=engine, tables=[Base.metadata.tables["simulation_states"]])
        db = SessionLocal()
        try:
            state = db.query(SimulationState).first()
            if not state:
                logger.info("Initializing campaign simulation state (Day 1 of 7)...")
                initial_state = SimulationState(
                    current_day=1,
                    scenario="BASE",
                    days_remaining=7,
                    total_simulated_injected=0,
                    is_active=True,
                    is_simulated=True
                )
                db.add(initial_state)
                db.commit()
                logger.info("Successfully initialized SimulationState.")
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Simulation table migration check notice: {e}")


def migrate_growth_alerts_table():
    """
    Ensures the 'growth_alerts' table has Phase 14 columns in SQLite:
    detected_metric, reason, recommended_action.
    """
    try:
        with engine.connect() as conn:
            table_check = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='growth_alerts'")).fetchone()
            if not table_check:
                return

            existing_cols = [c[1] for c in conn.execute(text("PRAGMA table_info(growth_alerts)")).fetchall()]
            
            columns_to_add = [
                ("detected_metric", "VARCHAR(255)"),
                ("reason", "TEXT"),
                ("recommended_action", "TEXT"),
            ]

            for col_name, col_type in columns_to_add:
                if col_name not in existing_cols:
                    logger.info(f"Adding missing column to growth_alerts table: {col_name}")
                    conn.execute(text(f"ALTER TABLE growth_alerts ADD COLUMN {col_name} {col_type}"))

            conn.commit()
    except Exception as e:
        logger.warning(f"GrowthAlerts table migration check notice: {e}")


def run_all_migrations():
    migrate_experiments_table()
    migrate_automation_tables()
    migrate_simulation_tables()
    migrate_growth_alerts_table()


if __name__ == "__main__":
    run_all_migrations()
    print("Database migrations completed successfully.")


