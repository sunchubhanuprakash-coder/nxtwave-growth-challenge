"""
Phase 13: Full Simulation & Demo Mode Service.
Provides interactive simulation triggers:
  - +10 WhatsApp registrations
  - +10 Referral registrations
  - +5 Club registrations
  - +5 Email registrations
  - Advance 1 day (7-day timeline progression)
  - Scenario testing: Conservative, Base, Aggressive
  - Reset campaign

Strictly isolates simulated datasets with is_simulated=True and '[SIMULATED]' tags.
Never represents simulated results as real campaign results.
"""
import uuid
import random
from datetime import datetime, timezone, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database.models import (
    Student,
    Registration,
    Referral,
    Event,
    Campaign,
    CampaignSource,
    College,
    Club,
    DailyMetric,
    SimulationState,
)
from backend.app.core.logging import logger


INDIAN_FIRST_NAMES = [
    "Aarav", "Aditi", "Ananya", "Arjun", "Bhavya", "Chetan", "Devika", "Divya",
    "Gaurav", "Harsh", "Ishaan", "Kavya", "Kiran", "Madhav", "Manish", "Meghana",
    "Naveen", "Neha", "Nikhil", "Pooja", "Pranav", "Priya", "Rahul", "Rishi",
    "Rohan", "Sakshi", "Sanjay", "Siddharth", "Sneha", "Tanvi", "Varun", "Vikram"
]

INDIAN_LAST_NAMES = [
    "Reddy", "Sharma", "Varma", "Patel", "Kumar", "Iyer", "Nair", "Rao",
    "Joshi", "Goud", "Chowdary", "Gupta", "Mishra", "Deshmukh", "Bhat", "Mehta"
]

ENGINEERING_BRANCHES = [
    "Computer Science and Engineering",
    "Information Technology",
    "Computer Science (AI & ML)",
    "Computer Science (Data Science)",
    "Electronics and Communication",
]


class SimulationService:
    """
    Simulation Engine orchestrating hiring challenge demo mode and 7-day timeline progression.
    """

    DISCLAIMER = (
        "## DEMO / SIMULATION MODE: All student cohorts, injection triggers, and timeline "
        "progressions are strictly isolated for hiring evaluation and architectural validation. "
        "Never represent simulated results as real campaign results."
    )

    @classmethod
    def get_or_create_state(cls, db: Session) -> SimulationState:
        """
        Retrieves or initializes the campaign simulation state.
        """
        from database.base import Base
        from database.session import engine
        Base.metadata.create_all(bind=engine, tables=[Base.metadata.tables["simulation_states"]])

        state = db.query(SimulationState).first()
        if not state:
            state = SimulationState(
                current_day=1,
                scenario="BASE",
                days_remaining=7,
                total_simulated_injected=0,
                whatsapp_injected=0,
                referral_injected=0,
                club_injected=0,
                email_injected=0,
                is_active=True,
                is_simulated=True
            )
            db.add(state)
            db.commit()
            db.refresh(state)
        return state

    @classmethod
    def get_simulation_summary(cls, db: Session) -> Dict[str, Any]:
        """
        Returns full state: current day, 7-day timeline, scenario comparisons,
        channel breakdown, and downstream metrics.
        """
        state = cls.get_or_create_state(db)
        campaign = db.query(Campaign).first()

        total_regs = db.query(Registration).count()
        verified_final = db.query(Registration).join(Student).filter(Student.is_final_year == True).count()
        target = campaign.target_registrations if campaign else 500

        # Channel counts
        sources = db.query(CampaignSource).all()
        channel_conversions = {s.utm_source.lower(): s.conversions_count for s in sources}

        # K-Factor calculation
        direct_count = db.query(Student).filter(
            (Student.referred_by_code == None) | (Student.referred_by_code == "")
        ).count()
        referred_count = total_regs - direct_count
        k_factor = round(referred_count / max(direct_count, 1), 2)

        # 7-Day Timeline Calculation
        timeline = cls._build_7day_timeline(state.current_day, total_regs, state.scenario, db)

        # 3 Scenario Projections
        scenarios = cls._build_scenario_projections(total_regs, state.current_day)

        return {
            "mode": "DEMO_SIMULATION_MODE",
            "disclaimer": cls.DISCLAIMER,
            "current_day": state.current_day,
            "days_remaining": state.days_remaining,
            "scenario": state.scenario,
            "is_active": state.is_active,
            "last_advanced_at": state.last_advanced_at.isoformat() if state.last_advanced_at else None,
            "telemetry": {
                "total_registrations": total_regs,
                "verified_final_year": verified_final,
                "target_registrations": target,
                "remaining_to_target": max(0, target - total_regs),
                "progress_percent": round((total_regs / max(target, 1)) * 100, 1),
                "k_factor": k_factor,
                "total_simulated_injected": state.total_simulated_injected,
                "whatsapp_injected": state.whatsapp_injected,
                "referral_injected": state.referral_injected,
                "club_injected": state.club_injected,
                "email_injected": state.email_injected,
                "channel_conversions": channel_conversions,
            },
            "timeline": timeline,
            "scenarios": scenarios,
        }

    @classmethod
    def _build_7day_timeline(
        cls,
        current_day: int,
        current_total_regs: int,
        active_scenario: str,
        db: Session
    ) -> List[Dict[str, Any]]:
        """
        Builds a 7-day chronological progression showing completed days and projected future days.
        """
        daily_metrics = {m.day_number: m for m in db.query(DailyMetric).order_by(DailyMetric.day_number).all()}
        campaign = db.query(Campaign).first()
        start_date = campaign.start_date if campaign else date.today()

        # Cumulative distribution curve base targets
        base_curve = [45, 98, 165, 240, 335, 425, 520]
        if active_scenario == "CONSERVATIVE":
            curve = [35, 75, 120, 175, 230, 280, 320]
        elif active_scenario == "AGGRESSIVE":
            curve = [60, 140, 245, 365, 490, 610, 710]
        else:
            curve = base_curve

        timeline = []
        cumulative = 0

        for day in range(1, 8):
            day_date = start_date + timedelta(days=day - 1)
            is_completed = day < current_day
            is_current = day == current_day
            is_future = day > current_day

            if day in daily_metrics:
                m = daily_metrics[day]
                regs_today = m.registrations_count
                cumulative += regs_today
                k_val = m.k_factor
                budget_today = m.budget_spent_today_inr
            else:
                expected_target = curve[day - 1]
                prev_expected = curve[day - 2] if day > 1 else 0
                regs_today = expected_target - prev_expected
                cumulative = expected_target
                k_val = 1.25 if active_scenario == "BASE" else (0.82 if active_scenario == "CONSERVATIVE" else 1.65)
                budget_today = 285.0

            top_channels = ["WhatsApp Groups", "Peer Referrals", "Campus Ambassadors", "Coding Clubs", "Email Broadcast"]
            top_channel = top_channels[(day - 1) % len(top_channels)]

            timeline.append({
                "day_number": day,
                "day_label": f"Day {day}",
                "date": day_date.isoformat(),
                "registrations_today": regs_today,
                "cumulative_registrations": cumulative if is_completed or is_current else curve[day - 1],
                "target": 500,
                "k_factor": k_val,
                "top_channel": top_channel,
                "budget_spent": budget_today,
                "is_completed": is_completed,
                "is_current": is_current,
                "is_future": is_future,
                "status": "COMPLETED" if is_completed else ("IN_PROGRESS" if is_current else "PROJECTED")
            })

        return timeline

    @classmethod
    def _build_scenario_projections(cls, current_regs: int, current_day: int) -> Dict[str, Any]:
        """
        Builds side-by-side comparative models for Conservative, Base, and Aggressive scenarios.
        """
        days_left = max(0, 7 - current_day)
        return {
            "CONSERVATIVE": {
                "name": "Conservative Scenario",
                "projected_registrations": 320,
                "expected_cpr_inr": 6.25,
                "k_factor": 0.82,
                "conversion_rate_pct": 15.4,
                "status": "OFF TRACK",
                "risk_indicator": "High Dropoff & Stalled Referrals",
                "daily_run_rate_needed": round(max(0, 500 - current_regs) / max(days_left, 1), 1),
                "probability_reaching_500": 34.0,
                "color": "rose"
            },
            "BASE": {
                "name": "Base Scenario",
                "projected_registrations": 520,
                "expected_cpr_inr": 3.85,
                "k_factor": 1.29,
                "conversion_rate_pct": 26.5,
                "status": "ON TRACK",
                "risk_indicator": "Low Pacing Risk (Milestone Met)",
                "daily_run_rate_needed": round(max(0, 500 - current_regs) / max(days_left, 1), 1),
                "probability_reaching_500": 94.0,
                "color": "cyan"
            },
            "AGGRESSIVE": {
                "name": "Aggressive Scenario",
                "projected_registrations": 710,
                "expected_cpr_inr": 2.82,
                "k_factor": 1.68,
                "conversion_rate_pct": 35.8,
                "status": "AHEAD OF SCHEDULE",
                "risk_indicator": "Capacity Exceeded (Scale Overflows)",
                "daily_run_rate_needed": round(max(0, 500 - current_regs) / max(days_left, 1), 1),
                "probability_reaching_500": 99.5,
                "color": "emerald"
            }
        }

    @classmethod
    def inject_registrations(
        cls,
        channel: str,
        count: int,
        db: Session
    ) -> Dict[str, Any]:
        """
        Executes interactive batch injection of simulated registrations:
          - Channel: WHATSAPP (+10), REFERRAL (+10), CLUB (+5), EMAIL (+5)
          - Updates: Database, Dashboard, Funnel, Referral Analytics, Channel Analytics, Forecast, AI Insights
        """
        channel_upper = channel.upper().strip()
        state = cls.get_or_create_state(db)
        campaign = db.query(Campaign).first()
        event = db.query(Event).first()
        colleges = db.query(College).all()
        clubs = db.query(Club).all()

        if not event:
            raise ValueError("No active masterclass event found in database.")

        # Ensure matching CampaignSource exists for attribution
        source_mapping = {
            "WHATSAPP": ("WhatsApp Class Groups", "whatsapp", "peer_share"),
            "REFERRAL": ("Peer Referral Invite", "referral", "peer_invite"),
            "CLUB": ("Technical Club Partnership", "club", "coding_club"),
            "EMAIL": ("Email Countdown Broadcast", "email", "newsletter"),
        }

        if channel_upper not in source_mapping:
            raise ValueError(f"Unsupported simulation channel: {channel_upper}. Use WHATSAPP, REFERRAL, CLUB, or EMAIL.")

        src_name, utm_src, utm_med = source_mapping[channel_upper]
        camp_source = db.query(CampaignSource).filter(CampaignSource.utm_source == utm_src).first()
        if not camp_source and campaign:
            camp_source = CampaignSource(
                campaign_id=campaign.id,
                source_name=src_name,
                utm_source=utm_src,
                utm_medium=utm_med,
                utm_campaign="ai_workshop",
                budget_allocated_inr=0.0,
                clicks_count=0,
                conversions_count=0,
                is_simulated=True
            )
            db.add(camp_source)
            db.flush()

        # Find existing active referrers if referral injection
        existing_referrers = db.query(Student).filter(Student.referral_code.isnot(None)).all()
        created_students = []

        for i in range(count):
            first_name = random.choice(INDIAN_FIRST_NAMES)
            last_name = random.choice(INDIAN_LAST_NAMES)
            rnd_token = uuid.uuid4().hex[:5].upper()
            full_name = f"[SIMULATED] {first_name} {last_name}"
            email = f"sim_{first_name.lower()}.{last_name.lower()}.{rnd_token}@example.com"
            phone = f"98{random.randint(10000000, 99999999)}"[:10]
            ref_code = f"NXT-SIM{rnd_token}"
            branch = random.choice(ENGINEERING_BRANCHES)
            college = random.choice(colleges) if colleges else None

            # Determine referrer for referral channel
            referred_by = None
            if channel_upper == "REFERRAL" and existing_referrers:
                referrer_student = random.choice(existing_referrers)
                referred_by = referrer_student.referral_code

            # Determine club for club channel
            target_club = None
            club_name = None
            if channel_upper == "CLUB":
                target_club = random.choice(clubs) if clubs else None
                club_name = target_club.name if target_club else "Campus AI & Coding Club"

            st = Student(
                full_name=full_name,
                email=email,
                phone_number=phone,
                college_id=college.id if college else None,
                college_name_raw=college.name if college else "Hyderabad Institute of Technology",
                branch=branch,
                graduation_year=2025,
                is_final_year=True,
                skill_level=random.choice(["Beginner", "Intermediate", "Python Ready"]),
                primary_goal="Live Project URL on Resume",
                acquisition_source=src_name,
                referral_code=ref_code,
                referred_by_code=referred_by,
                is_simulated=True
            )
            db.add(st)
            db.flush()

            # Create Registration entity with attribution
            reg = Registration(
                student_id=st.id,
                event_id=event.id,
                campaign_source_id=camp_source.id if camp_source else None,
                utm_source=utm_src,
                utm_medium=utm_med,
                utm_campaign="ai_workshop",
                club_id=target_club.id if target_club else None,
                club_name_raw=club_name,
                status="CONFIRMED",
                is_simulated=True
            )
            db.add(reg)
            db.flush()

            # If referral, create Referral relationship record
            if channel_upper == "REFERRAL" and referred_by:
                referrer_record = db.query(Student).filter(Student.referral_code == referred_by).first()
                if referrer_record:
                    ref_rel = Referral(
                        referrer_student_id=referrer_record.id,
                        referee_student_id=st.id,
                        referral_code=referred_by,
                        channel="WHATSAPP",
                        status="REGISTERED",
                        converted_at=datetime.now(timezone.utc),
                        is_simulated=True
                    )
                    db.add(ref_rel)

            created_students.append({
                "student_id": st.id,
                "name": full_name,
                "channel": channel_upper,
                "email": email,
                "referral_code": ref_code,
                "referred_by": referred_by,
                "college": st.college_name_raw
            })

        # Update CampaignSource counts
        if camp_source:
            camp_source.conversions_count += count
            camp_source.clicks_count += count * 4  # Simulate realistic 25% click-to-registration conversion

        # Update SimulationState injection counters
        state.total_simulated_injected += count
        if channel_upper == "WHATSAPP":
            state.whatsapp_injected += count
        elif channel_upper == "REFERRAL":
            state.referral_injected += count
        elif channel_upper == "CLUB":
            state.club_injected += count
        elif channel_upper == "EMAIL":
            state.email_injected += count

        db.commit()

        # Re-fetch new overall counts
        new_total = db.query(Registration).count()
        new_verified = db.query(Registration).join(Student).filter(Student.is_final_year == True).count()

        logger.info(f"Simulated +{count} registrations via {channel_upper}. Total registrations: {new_total}")

        return {
            "success": True,
            "channel": channel_upper,
            "injected_count": count,
            "total_registrations_now": new_total,
            "verified_final_year_now": new_verified,
            "target_registrations": 500,
            "remaining_to_target": max(0, 500 - new_total),
            "sample_created_students": created_students[:3],
            "disclaimer": cls.DISCLAIMER
        }

    @classmethod
    def advance_day(cls, db: Session) -> Dict[str, Any]:
        """
        Advances the simulation timeline by 1 day (from Day 1 up to Day 7).
        Updates DailyMetric, increments day counter, and adjusts remaining days.
        """
        state = cls.get_or_create_state(db)
        campaign = db.query(Campaign).first()

        if state.current_day >= 7:
            return {
                "message": "Campaign has reached Day 7 (Final Day of Workshop).",
                "current_day": 7,
                "days_remaining": 0,
                "is_concluded": True
            }

        prev_day = state.current_day
        state.current_day += 1
        state.days_remaining = max(0, 7 - state.current_day)
        state.last_advanced_at = datetime.now(timezone.utc)

        # Record or update DailyMetric for previous day
        metric_date = (campaign.start_date if campaign else date.today()) + timedelta(days=prev_day - 1)
        total_regs = db.query(Registration).count()

        # Check existing metric for that day
        metric = db.query(DailyMetric).filter(DailyMetric.day_number == prev_day).first()
        if not metric and campaign:
            metric = DailyMetric(
                campaign_id=campaign.id,
                metric_date=metric_date,
                day_number=prev_day,
                total_visits=int(total_regs * 3.8),
                form_starts=int(total_regs * 1.4),
                registrations_count=total_regs,
                verified_final_year_count=int(total_regs * 0.95),
                referral_registrations_count=int(total_regs * 0.42),
                k_factor=1.29,
                budget_spent_today_inr=285.0,
                cumulative_budget_spent_inr=float(prev_day * 285.0),
                cumulative_cac_inr=round((prev_day * 285.0) / max(total_regs, 1), 2),
                conversion_rate_percent=26.5,
                is_simulated=True
            )
            db.add(metric)

        db.commit()

        return {
            "success": True,
            "previous_day": prev_day,
            "current_day": state.current_day,
            "days_remaining": state.days_remaining,
            "message": f"Successfully advanced simulation timeline to Day {state.current_day} of 7.",
            "disclaimer": cls.DISCLAIMER
        }

    @classmethod
    def set_scenario(cls, scenario: str, db: Session) -> Dict[str, Any]:
        """
        Switches testing scenario: CONSERVATIVE, BASE, or AGGRESSIVE.
        """
        sc_clean = scenario.upper().strip()
        if sc_clean not in ["CONSERVATIVE", "BASE", "AGGRESSIVE"]:
            raise ValueError(f"Invalid scenario '{scenario}'. Choose from CONSERVATIVE, BASE, or AGGRESSIVE.")

        state = cls.get_or_create_state(db)
        state.scenario = sc_clean
        db.commit()

        return {
            "success": True,
            "scenario": sc_clean,
            "message": f"Testing scenario updated to {sc_clean}.",
            "disclaimer": cls.DISCLAIMER
        }

    @classmethod
    def reset_campaign(cls, db: Session) -> Dict[str, Any]:
        """
        Completely resets the database to baseline and re-initializes simulation state.
        """
        from database.seed_data import seed_database
        from database.migrations import migrate_simulation_tables, migrate_automation_tables

        logger.warning("Resetting campaign simulation dataset...")
        seed_database(reset=True)
        migrate_automation_tables()
        migrate_simulation_tables()

        # Re-fetch new session instance
        fresh_state = cls.get_or_create_state(db)
        fresh_state.current_day = 1
        fresh_state.scenario = "BASE"
        fresh_state.days_remaining = 7
        fresh_state.total_simulated_injected = 0
        fresh_state.whatsapp_injected = 0
        fresh_state.referral_injected = 0
        fresh_state.club_injected = 0
        fresh_state.email_injected = 0
        db.commit()

        return {
            "success": True,
            "message": "Campaign database successfully reset to clean Day 1 state.",
            "current_day": 1,
            "days_remaining": 7,
            "scenario": "BASE",
            "disclaimer": cls.DISCLAIMER
        }
