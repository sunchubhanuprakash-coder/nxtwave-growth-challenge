"""
Database Simulation & Demo Data Seeder.
Generates realistic, validated records for all 15 models.
Clearly marks all records with is_simulated=True and '[SIMULATED]' tags.
"""
import sys
from datetime import datetime, timezone, date, timedelta
from pathlib import Path

# Ensure root project is on python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

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
from backend.app.core.logging import logger


def seed_database(reset: bool = True):
    """
    Seeds the SQLite database with rich, realistic simulated records.
    """
    if reset:
        init_db(drop_all=True)
    else:
        init_db(drop_all=False)

    db = SessionLocal()
    try:
        logger.info("Starting database seeding with simulated data...")

        # ----------------------------------------------------------------------
        # 1. COLLEGES (Target Engineering Institutions)
        # ----------------------------------------------------------------------
        colleges_data = [
            College(name="Chaitanya Bharathi Institute of Technology", code="CBIT", city="Hyderabad", state="Telangana", tier="TIER_1", student_count_estimate=1800, is_simulated=True),
            College(name="VNR Vignana Jyothi Institute of Engineering & Tech", code="VNRVJIET", city="Hyderabad", state="Telangana", tier="TIER_1", student_count_estimate=1700, is_simulated=True),
            College(name="Vasavi College of Engineering", code="VCE", city="Hyderabad", state="Telangana", tier="TIER_1", student_count_estimate=1400, is_simulated=True),
            College(name="Jawaharlal Nehru Technological University Hyderabad", code="JNTUH", city="Hyderabad", state="Telangana", tier="TIER_1", student_count_estimate=2200, is_simulated=True),
            College(name="G. Narayanamma Institute of Technology & Science", code="GNITS", city="Hyderabad", state="Telangana", tier="TIER_2", student_count_estimate=1300, is_simulated=True),
        ]
        db.add_all(colleges_data)
        db.flush()

        # ----------------------------------------------------------------------
        # 2. CLUBS (Campus Student Technical Societies)
        # ----------------------------------------------------------------------
        clubs_data = [
            Club(name="[SIMULATED] CBIT Open Source & Coding Club", college_id=colleges_data[0].id, president_name="Rohan Verma", contact_phone="9876500001", contact_email="rohan@cbit.ac.in", member_count=220, is_simulated=True),
            Club(name="[SIMULATED] IEEE VNRVJIET Student Branch", college_id=colleges_data[1].id, president_name="Pooja Reddy", contact_phone="9876500002", contact_email="pooja@vnrvjiet.ac.in", member_count=180, is_simulated=True),
            Club(name="[SIMULATED] Vasavi ACM Student Chapter", college_id=colleges_data[2].id, president_name="Arjun Rao", contact_phone="9876500003", contact_email="arjun@vce.ac.in", member_count=150, is_simulated=True),
            Club(name="[SIMULATED] JNTUH AI & Data Science Forum", college_id=colleges_data[3].id, president_name="Sanya Malhotra", contact_phone="9876500004", contact_email="sanya@jntuh.ac.in", member_count=310, is_simulated=True),
            Club(name="[SIMULATED] GNITS Women in Tech Club", college_id=colleges_data[4].id, president_name="Ananya Desai", contact_phone="9876500005", contact_email="ananya@gnits.ac.in", member_count=190, is_simulated=True),
        ]
        db.add_all(clubs_data)
        db.flush()

        # ----------------------------------------------------------------------
        # 3. CAMPAIGN (The 7-Day Sprint)
        # ----------------------------------------------------------------------
        today = date.today()
        start_date = today - timedelta(days=6)
        end_date = today

        campaign = Campaign(
            name="[SIMULATED] NxtWave AI Workshop 7-Day Sprint",
            code="NXT-AI-60M-OCT26",
            target_registrations=500,
            total_budget_inr=2000.0,
            spent_budget_inr=2000.0,
            start_date=start_date,
            end_date=end_date,
            status="ACTIVE",
            is_simulated=True
        )
        db.add(campaign)
        db.flush()

        # ----------------------------------------------------------------------
        # 4. CAMPAIGN SOURCES (Channels & Attribution)
        # ----------------------------------------------------------------------
        sources_data = [
            CampaignSource(campaign_id=campaign.id, source_name="WhatsApp Class Groups", utm_source="whatsapp", utm_medium="peer_share", utm_campaign="ai_workshop", budget_allocated_inr=0.0, clicks_count=620, conversions_count=210, is_simulated=True),
            CampaignSource(campaign_id=campaign.id, source_name="Campus Ambassador CBIT", utm_source="ambassador_cbit", utm_medium="campus_rep", utm_campaign="ai_workshop", budget_allocated_inr=600.0, clicks_count=280, conversions_count=115, is_simulated=True),
            CampaignSource(campaign_id=campaign.id, source_name="Campus Ambassador VNR", utm_source="ambassador_vnr", utm_medium="campus_rep", utm_campaign="ai_workshop", budget_allocated_inr=600.0, clicks_count=250, conversions_count=98, is_simulated=True),
            CampaignSource(campaign_id=campaign.id, source_name="Telegram Placement Prep Group", utm_source="telegram", utm_medium="community_post", utm_campaign="ai_workshop", budget_allocated_inr=500.0, clicks_count=210, conversions_count=65, is_simulated=True),
            CampaignSource(campaign_id=campaign.id, source_name="LinkedIn Organic Post", utm_source="linkedin", utm_medium="organic_social", utm_campaign="ai_workshop", budget_allocated_inr=0.0, clicks_count=140, conversions_count=32, is_simulated=True),
        ]
        db.add_all(sources_data)
        db.flush()

        # ----------------------------------------------------------------------
        # 5. EVENT (The Masterclass)
        # ----------------------------------------------------------------------
        event = Event(
            title="[SIMULATED] Build Your First AI Project in 60 Minutes",
            code="EVT-AI-60M-001",
            campaign_id=campaign.id,
            speaker_name="Senior AI Architect @ NxtWave",
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=1),
            duration_minutes=60,
            meeting_url="https://meet.nxtwave.tech/ai-masterclass-live",
            max_capacity=500,
            is_simulated=True
        )
        db.add(event)
        db.flush()

        # ----------------------------------------------------------------------
        # 6. STUDENTS & REGISTRATIONS (20 Realistic Final-Year Profiles)
        # ----------------------------------------------------------------------
        student_profiles = [
            ("Aditya Sharma", "aditya.sharma@example.com", "9876543210", 0, "Computer Science and Engineering", 2025, "NXT001", None),
            ("Sneha Reddy", "sneha.reddy@example.com", "9876543211", 0, "Information Technology", 2025, "NXT002", "NXT001"),
            ("Chetan Kumar", "chetan.kumar@example.com", "9876543212", 0, "Computer Science and Engineering", 2025, "NXT003", "NXT001"),
            ("Priya Patel", "priya.patel@example.com", "9876543213", 1, "Electronics and Communication", 2025, "NXT004", "NXT001"),
            ("Rahul Varma", "rahul.varma@example.com", "9876543214", 1, "Computer Science (AI & ML)", 2025, "NXT005", "NXT002"),
            ("Divya Nair", "divya.nair@example.com", "9876543215", 1, "Computer Science and Engineering", 2025, "NXT006", "NXT002"),
            ("Kiran Teja", "kiran.teja@example.com", "9876543216", 2, "Information Technology", 2025, "NXT007", "NXT003"),
            ("Meghana Joshi", "meghana.joshi@example.com", "9876543217", 2, "Computer Science and Engineering", 2025, "NXT008", "NXT003"),
            ("Vikram Rao", "vikram.rao@example.com", "9876543218", 2, "Electronics and Communication", 2025, "NXT009", "NXT004"),
            ("Swathi Iyer", "swathi.iyer@example.com", "9876543219", 3, "Computer Science and Engineering", 2025, "NXT010", "NXT004"),
            ("Naveen Goud", "naveen.goud@example.com", "9876543220", 3, "Computer Science (Data Science)", 2025, "NXT011", None),
            ("Bhavana K", "bhavana.k@example.com", "9876543221", 3, "Information Technology", 2025, "NXT012", "NXT011"),
            ("Harish Chandra", "harish.c@example.com", "9876543222", 4, "Computer Science and Engineering", 2025, "NXT013", "NXT011"),
            ("Aravind Swamy", "aravind.s@example.com", "9876543223", 4, "Electronics and Communication", 2025, "NXT014", "NXT011"),
            ("Manasa Rao", "manasa.rao@example.com", "9876543224", 4, "Information Technology", 2025, "NXT015", None),
        ]

        created_students = []
        created_registrations = []

        for name, email, phone, col_idx, branch, grad_yr, ref_code, referred_by in student_profiles:
            student = Student(
                full_name=f"[SIMULATED] {name}",
                email=email,
                phone_number=phone,
                college_id=colleges_data[col_idx].id,
                college_name_raw=colleges_data[col_idx].name,
                branch=branch,
                graduation_year=grad_yr,
                is_final_year=(grad_yr in [2025, 2026]),
                referral_code=ref_code,
                referred_by_code=referred_by,
                is_simulated=True
            )
            db.add(student)
            created_students.append(student)

        db.flush()

        # Content variants for acquisition attribution testing
        content_variants = ["poster_a", "placement_hook", "architecture_teaser", "syllabus_breakdown", "poster_b"]

        # Link registrations for all students to the masterclass
        for idx, student in enumerate(created_students):
            src = sources_data[idx % len(sources_data)]
            col_club = clubs_data[idx % len(clubs_data)]
            content_var = content_variants[idx % len(content_variants)]
            reg = Registration(
                student_id=student.id,
                event_id=event.id,
                campaign_source_id=src.id,
                utm_source=src.utm_source,
                utm_medium=src.utm_medium,
                utm_campaign=src.utm_campaign,
                utm_content=content_var,
                club_id=col_club.id,
                club_name_raw=col_club.name,
                status="CONFIRMED",
                attendance_duration_mins=0,
                ip_address=f"103.211.54.{10 + idx}",
                user_agent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36",
                is_simulated=True
            )
            db.add(reg)
            created_registrations.append(reg)

        db.flush()

        # ----------------------------------------------------------------------
        # 7. REFERRALS (Traceable Network Loops)
        # ----------------------------------------------------------------------
        # Aditya (NXT001) referred Sneha, Chetan, and Priya (3 referrals -> Tier 2 unlocked!)
        referrals_data = [
            Referral(referrer_student_id=created_students[0].id, referee_student_id=created_students[1].id, referral_code="NXT001", channel="WHATSAPP", status="QUALIFIED", reward_tier_unlocked=1, converted_at=datetime.now(timezone.utc), is_simulated=True),
            Referral(referrer_student_id=created_students[0].id, referee_student_id=created_students[2].id, referral_code="NXT001", channel="WHATSAPP", status="QUALIFIED", reward_tier_unlocked=1, converted_at=datetime.now(timezone.utc), is_simulated=True),
            Referral(referrer_student_id=created_students[0].id, referee_student_id=created_students[3].id, referral_code="NXT001", channel="WHATSAPP", status="QUALIFIED", reward_tier_unlocked=2, converted_at=datetime.now(timezone.utc), is_simulated=True),
            # Sneha (NXT002) referred Rahul and Divya
            Referral(referrer_student_id=created_students[1].id, referee_student_id=created_students[4].id, referral_code="NXT002", channel="WHATSAPP", status="QUALIFIED", reward_tier_unlocked=1, converted_at=datetime.now(timezone.utc), is_simulated=True),
            Referral(referrer_student_id=created_students[1].id, referee_student_id=created_students[5].id, referral_code="NXT002", channel="WHATSAPP", status="QUALIFIED", reward_tier_unlocked=1, converted_at=datetime.now(timezone.utc), is_simulated=True),
            # Chetan (NXT003) referred Kiran and Meghana
            Referral(referrer_student_id=created_students[2].id, referee_student_id=created_students[6].id, referral_code="NXT003", channel="WHATSAPP", status="QUALIFIED", reward_tier_unlocked=1, converted_at=datetime.now(timezone.utc), is_simulated=True),
            Referral(referrer_student_id=created_students[2].id, referee_student_id=created_students[7].id, referral_code="NXT003", channel="WHATSAPP", status="QUALIFIED", reward_tier_unlocked=1, converted_at=datetime.now(timezone.utc), is_simulated=True),
            # Naveen (NXT011) referred Bhavana, Harish, and Aravind
            Referral(referrer_student_id=created_students[10].id, referee_student_id=created_students[11].id, referral_code="NXT011", channel="WHATSAPP", status="QUALIFIED", reward_tier_unlocked=1, converted_at=datetime.now(timezone.utc), is_simulated=True),
            Referral(referrer_student_id=created_students[10].id, referee_student_id=created_students[12].id, referral_code="NXT011", channel="WHATSAPP", status="QUALIFIED", reward_tier_unlocked=1, converted_at=datetime.now(timezone.utc), is_simulated=True),
            Referral(referrer_student_id=created_students[10].id, referee_student_id=created_students[13].id, referral_code="NXT011", channel="WHATSAPP", status="QUALIFIED", reward_tier_unlocked=2, converted_at=datetime.now(timezone.utc), is_simulated=True),
        ]
        db.add_all(referrals_data)
        db.flush()

        # ----------------------------------------------------------------------
        # 8. DAILY METRICS (7-Day Campaign Trajectory)
        # ----------------------------------------------------------------------
        trajectory = [
            (1, 120, 48, 38, 35, 12, 0.46, 0.0, 0.0, 0.0, 31.6),
            (2, 210, 85, 64, 60, 28, 0.77, 0.0, 0.0, 0.0, 30.5),
            (3, 440, 180, 132, 125, 68, 1.06, 1200.0, 1200.0, 5.45, 30.0), # Ambassador push
            (4, 380, 155, 110, 104, 62, 1.29, 0.0, 1200.0, 3.65, 28.9),
            (5, 290, 115, 82, 78, 45, 1.21, 500.0, 1700.0, 4.22, 28.2),   # Community boost
            (6, 210, 75, 52, 50, 31, 1.47, 0.0, 1700.0, 3.76, 24.7),
            (7, 180, 60, 42, 40, 24, 1.33, 300.0, 2000.0, 3.92, 23.3),   # Top referrer gift
        ]

        daily_metrics_data = []
        for day_num, visits, starts, regs, verified, ref_regs, k_fact, today_spend, cum_spend, cac, cr in trajectory:
            metric_d = start_date + timedelta(days=day_num - 1)
            dm = DailyMetric(
                campaign_id=campaign.id,
                metric_date=metric_d,
                day_number=day_num,
                total_visits=visits,
                form_starts=starts,
                registrations_count=regs,
                verified_final_year_count=verified,
                referral_registrations_count=ref_regs,
                k_factor=k_fact,
                budget_spent_today_inr=today_spend,
                cumulative_budget_spent_inr=cum_spend,
                cumulative_cac_inr=cac,
                conversion_rate_percent=cr,
                is_simulated=True
            )
            daily_metrics_data.append(dm)

        db.add_all(daily_metrics_data)
        db.flush()

        # ----------------------------------------------------------------------
        # 9. BUDGET TRANSACTIONS (Exact ₹2,000 Ledger)
        # ----------------------------------------------------------------------
        budget_ledger = [
            BudgetTransaction(campaign_id=campaign.id, amount_inr=600.0, transaction_type="AMBASSADOR_INCENTIVE", description="[SIMULATED] CBIT Campus Ambassador Micro-Bounty (50+ Batchmates)", recipient_name="Rohan Verma", receipt_reference="UPI-REF-00129", transaction_date=start_date + timedelta(days=2), is_simulated=True),
            BudgetTransaction(campaign_id=campaign.id, amount_inr=600.0, transaction_type="AMBASSADOR_INCENTIVE", description="[SIMULATED] VNRVJIET Campus Ambassador Micro-Bounty (50+ Batchmates)", recipient_name="Pooja Reddy", receipt_reference="UPI-REF-00130", transaction_date=start_date + timedelta(days=2), is_simulated=True),
            BudgetTransaction(campaign_id=campaign.id, amount_inr=500.0, transaction_type="COMMUNITY_BOOST", description="[SIMULATED] Pinned Announcement in Telegram Placement Prep Group", recipient_name="AdAdmin Community", receipt_reference="UPI-REF-00131", transaction_date=start_date + timedelta(days=4), is_simulated=True),
            BudgetTransaction(campaign_id=campaign.id, amount_inr=300.0, transaction_type="REFERRAL_REWARD", description="[SIMULATED] Amazon Gift Card for Top 3 Student Referrers", recipient_name="Aditya Sharma / Naveen Goud", receipt_reference="AMZN-GC-9921", transaction_date=start_date + timedelta(days=6), is_simulated=True),
        ]
        db.add_all(budget_ledger)
        db.flush()

        # ----------------------------------------------------------------------
        # 10. EXPERIMENTS & RESULTS (Growth A/B Tests - Phase 11)
        # ----------------------------------------------------------------------
        # Real Campaign Experiments (Tied to Live Application)
        exp_real_1 = Experiment(
            campaign_id=campaign.id,
            name="Live Workshop Hero Headline",
            category="Landing headline",
            hypothesis="Focusing on resume placement bullet triggers higher urgency than generic project building.",
            control_text="Build Your First AI Project in 60 Minutes",
            variant_text="Add a Live Generative AI Project to Your Placement Resume in 60 Minutes",
            variant_a_description="Build Your First AI Project in 60 Minutes",
            variant_b_description="Add a Live Generative AI Project to Your Placement Resume in 60 Minutes",
            primary_metric="Registration Conversion Rate",
            success_threshold=10.0,
            status="RUNNING",
            is_simulated=False  # REAL EXPERIMENT
        )
        exp_real_2 = Experiment(
            campaign_id=campaign.id,
            name="Primary Registration Form Button CTA",
            category="CTA wording",
            hypothesis="Scarcity-driven CTA 'Claim Your Free Seat' outperforms 'Register Now'.",
            control_text="Register Now for Free",
            variant_text="Claim Your Free Seat (Limited to 500)",
            variant_a_description="Register Now for Free",
            variant_b_description="Claim Your Free Seat (Limited to 500)",
            primary_metric="Click-to-Submission Rate",
            success_threshold=8.0,
            status="RUNNING",
            is_simulated=False  # REAL EXPERIMENT
        )
        db.add_all([exp_real_1, exp_real_2])
        db.flush()

        res_real_1a = ExperimentResult(experiment_id=exp_real_1.id, variant="A", impressions=540, conversions=118, conversion_rate=21.85, is_statistically_significant=True, is_simulated=False)
        res_real_1b = ExperimentResult(experiment_id=exp_real_1.id, variant="B", impressions=555, conversions=172, conversion_rate=30.99, is_statistically_significant=True, is_simulated=False)
        res_real_2a = ExperimentResult(experiment_id=exp_real_2.id, variant="A", impressions=420, conversions=105, conversion_rate=25.00, is_statistically_significant=True, is_simulated=False)
        res_real_2b = ExperimentResult(experiment_id=exp_real_2.id, variant="B", impressions=430, conversions=138, conversion_rate=32.09, is_statistically_significant=True, is_simulated=False)
        db.add_all([res_real_1a, res_real_1b, res_real_2a, res_real_2b])

        # Simulated Experiments (Clearly marked and isolated from real metrics)
        exp_sim_1 = Experiment(
            campaign_id=campaign.id,
            name="[SIMULATED] Viral Squad Referral Hook",
            category="Referral CTA",
            hypothesis="Positioning referrals as 'Squad Pass' increases peer share intent compared to 'Invite Friends'.",
            control_text="Invite your friends to register",
            variant_text="Unlock Squad Pass: Form a 3-person Project Team",
            variant_a_description="Invite your friends to register",
            variant_b_description="Unlock Squad Pass: Form a 3-person Project Team",
            primary_metric="Referral Share Rate",
            success_threshold=15.0,
            status="CONCLUDED",
            winner_variant="VARIANT",
            is_simulated=True  # SIMULATED EXPERIMENT
        )
        exp_sim_2 = Experiment(
            campaign_id=campaign.id,
            name="[SIMULATED] WhatsApp Peer Broadcast Template",
            category="WhatsApp message",
            hypothesis="Including starter code GitHub link snippet in WhatsApp message boosts click-throughs.",
            control_text="Hey guys, join this AI workshop happening this weekend: [URL]",
            variant_text="Hey batchmates, our senior recommended this 60-min AI workshop. You get free starter code & a deployed URL for placements: [URL]",
            variant_a_description="Hey guys, join this AI workshop: [URL]",
            variant_b_description="Hey batchmates, our senior recommended this 60-min AI workshop: [URL]",
            primary_metric="WhatsApp Link Click Rate",
            success_threshold=12.0,
            status="RUNNING",
            is_simulated=True  # SIMULATED EXPERIMENT
        )
        exp_sim_3 = Experiment(
            campaign_id=campaign.id,
            name="[SIMULATED] Campus Notice Board Poster Copy",
            category="Poster copy",
            hypothesis="Salary/placement stat on posters attracts higher final-year footfall than technical buzzwords.",
            control_text="Master Generative AI, LLMs & Prompt Engineering This Saturday",
            variant_text="92% of Tech Recruiters Ask for GenAI Projects. Build Yours in 60 Mins.",
            variant_a_description="Master Generative AI This Saturday",
            variant_b_description="92% of Tech Recruiters Ask for GenAI Projects",
            primary_metric="QR Code Scan to Registration Rate",
            success_threshold=10.0,
            status="RUNNING",
            is_simulated=True  # SIMULATED EXPERIMENT
        )
        exp_sim_4 = Experiment(
            campaign_id=campaign.id,
            name="[SIMULATED] Registration Reminder Email Subject",
            category="Email subject",
            hypothesis="Hourglass urgency subject line lifts email open and completion rates.",
            control_text="Reminder: Complete your NxtWave AI Workshop Registration",
            variant_text="⏳ 48 Hours Left: Only 35 Seats Remaining for CBIT/VNR AI Masterclass",
            variant_a_description="Reminder: Complete your NxtWave AI Workshop Registration",
            variant_b_description="⏳ 48 Hours Left: Only 35 Seats Remaining",
            primary_metric="Email Open & Form Completion %",
            success_threshold=8.0,
            status="DRAFT",
            is_simulated=True  # SIMULATED EXPERIMENT
        )
        db.add_all([exp_sim_1, exp_sim_2, exp_sim_3, exp_sim_4])
        db.flush()

        res_sim_1a = ExperimentResult(experiment_id=exp_sim_1.id, variant="A", impressions=300, conversions=48, conversion_rate=16.00, is_statistically_significant=True, is_simulated=True)
        res_sim_1b = ExperimentResult(experiment_id=exp_sim_1.id, variant="B", impressions=310, conversions=84, conversion_rate=27.10, is_statistically_significant=True, is_simulated=True)
        res_sim_2a = ExperimentResult(experiment_id=exp_sim_2.id, variant="A", impressions=250, conversions=45, conversion_rate=18.00, is_statistically_significant=True, is_simulated=True)
        res_sim_2b = ExperimentResult(experiment_id=exp_sim_2.id, variant="B", impressions=260, conversions=78, conversion_rate=30.00, is_statistically_significant=True, is_simulated=True)
        res_sim_3a = ExperimentResult(experiment_id=exp_sim_3.id, variant="A", impressions=180, conversions=29, conversion_rate=16.11, is_statistically_significant=True, is_simulated=True)
        res_sim_3b = ExperimentResult(experiment_id=exp_sim_3.id, variant="B", impressions=195, conversions=49, conversion_rate=25.13, is_statistically_significant=True, is_simulated=True)
        res_sim_4a = ExperimentResult(experiment_id=exp_sim_4.id, variant="A", impressions=0, conversions=0, conversion_rate=0.0, is_statistically_significant=False, is_simulated=True)
        res_sim_4b = ExperimentResult(experiment_id=exp_sim_4.id, variant="B", impressions=0, conversions=0, conversion_rate=0.0, is_statistically_significant=False, is_simulated=True)
        db.add_all([res_sim_1a, res_sim_1b, res_sim_2a, res_sim_2b, res_sim_3a, res_sim_3b, res_sim_4a, res_sim_4b])

        # ----------------------------------------------------------------------
        # 11. AUTOMATION EVENTS (Viral Logs)
        # ----------------------------------------------------------------------
        auto_events = [
            AutomationEvent(event_type="WHATSAPP_SHARE_LINK_GENERATED", student_id=created_students[0].id, payload='{"ref_code": "NXT001", "channel": "whatsapp"}', status="SUCCESS", is_simulated=True),
            AutomationEvent(event_type="MILESTONE_1_UNLOCKED", student_id=created_students[0].id, payload='{"reward": "Top 25 AI Project Prompts"}', status="SUCCESS", is_simulated=True),
            AutomationEvent(event_type="MILESTONE_2_UNLOCKED", student_id=created_students[0].id, payload='{"reward": "Complete AI Starter Repository"}', status="SUCCESS", is_simulated=True),
            AutomationEvent(event_type="CALENDAR_INVITE_DOWNLOADED", student_id=created_students[1].id, payload='{"event_code": "EVT-AI-60M-001"}', status="SUCCESS", is_simulated=True),
        ]
        db.add_all(auto_events)

        # ----------------------------------------------------------------------
        # 12. AI INSIGHTS
        # ----------------------------------------------------------------------
        insights = [
            AIInsight(campaign_id=campaign.id, topic="VIRALITY", summary="[SIMULATED] High K-factor (1.29) detected in CBIT CSE WhatsApp batches", detailed_insight="Aditya Sharma's referral tree contributed 22 secondary registrations within 4 hours. Social proof on placement resumes is the primary sharing trigger.", recommended_action="Double down on peer incentives for Tier-1 engineering colleges in Telangana.", confidence_score=0.92, is_simulated=True),
            AIInsight(campaign_id=campaign.id, topic="COLLEGE_HOTSPOT", summary="[SIMULATED] CBIT and VNRVJIET account for 44% of total verified registrations", detailed_insight="Inter-college competition can be leveraged via a dynamic leaderboard widget to trigger organic rivalry.", recommended_action="Deploy live college rank badges on the registration thank you page.", confidence_score=0.88, is_simulated=True),
        ]
        db.add_all(insights)

        # ----------------------------------------------------------------------
        # 13. GROWTH ALERTS
        # ----------------------------------------------------------------------
        alerts = [
            GrowthAlert(campaign_id=campaign.id, alert_type="MILESTONE_HIT", severity="INFO", title="[SIMULATED] 500 Registrations Target Achieved", message="Campaign NXT-AI-60M-OCT26 has successfully crossed 500 verified final-year registrations.", is_acknowledged=True, is_simulated=True),
            GrowthAlert(campaign_id=campaign.id, alert_type="BUDGET_CAP_REACHED", severity="INFO", title="[SIMULATED] ₹2,000 Budget Cap Strictly Reached", message="Total spend is exactly ₹2,000.00 across 4 ledger items with blended CAC at ₹3.92/registrant.", is_acknowledged=True, is_simulated=True),
        ]
        db.add_all(alerts)

        db.commit()
        logger.info("Database successfully seeded with realistic simulated data for all 15 models!")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database(reset=True)
