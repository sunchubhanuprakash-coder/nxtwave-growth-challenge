import re
from datetime import datetime, timezone, date
from typing import Optional, List
from sqlalchemy import (
    String, Integer, Float, Boolean, Text, ForeignKey, DateTime, Date,
    Index, UniqueConstraint, CheckConstraint, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship, validates
from database.base import Base


# ==============================================================================
# 1. COLLEGE MODEL
# ==============================================================================
class College(Base):
    """
    Engineering college directory record for campus network tracking.
    """
    __tablename__ = "colleges"

    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    tier: Mapped[str] = mapped_column(String(20), default="TIER_2")  # TIER_1, TIER_2, TIER_3
    student_count_estimate: Mapped[int] = mapped_column(Integer, default=1500)
    is_target: Mapped[bool] = mapped_column(Boolean, default=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    students: Mapped[List["Student"]] = relationship("Student", back_populates="college")
    clubs: Mapped[List["Club"]] = relationship("Club", back_populates="college", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<College(code='{self.code}', name='{self.name}', tier='{self.tier}')>"


# ==============================================================================
# 2. CLUB MODEL
# ==============================================================================
class Club(Base):
    """
    Student technical clubs/societies (ACM, IEEE, Coding Club) within colleges.
    """
    __tablename__ = "clubs"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    college_id: Mapped[int] = mapped_column(ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True)
    president_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    member_count: Mapped[int] = mapped_column(Integer, default=100)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    college: Mapped["College"] = relationship("College", back_populates="clubs")

    __table_args__ = (
        UniqueConstraint("college_id", "name", name="uq_college_club"),
    )

    def __repr__(self) -> str:
        return f"<Club(name='{self.name}', college_id={self.college_id})>"


# ==============================================================================
# 3. STUDENT MODEL
# ==============================================================================
class Student(Base):
    """
    Student profile. A student registers once, but can participate in referrals.
    """
    __tablename__ = "students"

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    college_id: Mapped[Optional[int]] = mapped_column(ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True, index=True)
    college_name_raw: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    branch: Mapped[str] = mapped_column(String(100), nullable=False)
    graduation_year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    is_final_year: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    skill_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="Beginner")
    primary_goal: Mapped[Optional[str]] = mapped_column(String(150), nullable=True, default="Placement / Resume Project")
    acquisition_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="WhatsApp")
    referral_code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    referred_by_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    college: Mapped[Optional["College"]] = relationship("College", back_populates="students")
    registrations: Mapped[List["Registration"]] = relationship("Registration", back_populates="student", cascade="all, delete-orphan")
    referrals_made: Mapped[List["Referral"]] = relationship(
        "Referral",
        foreign_keys="Referral.referrer_student_id",
        back_populates="referrer",
        cascade="all, delete-orphan"
    )
    referrals_received: Mapped[List["Referral"]] = relationship(
        "Referral",
        foreign_keys="Referral.referee_student_id",
        back_populates="referee"
    )
    automation_events: Mapped[List["AutomationEvent"]] = relationship("AutomationEvent", back_populates="student")

    @validates("email")
    def validate_email(self, key, address):
        if not address or "@" not in address:
            raise ValueError(f"Invalid email address: {address}")
        return address.strip().lower()

    @validates("phone_number")
    def validate_phone(self, key, phone):
        cleaned = re.sub(r"[^\d]", "", phone or "")
        if len(cleaned) < 10:
            raise ValueError(f"Phone number must contain at least 10 digits: {phone}")
        return cleaned[-10:]  # Normalize to 10-digit mobile

    @validates("graduation_year")
    def validate_grad_year(self, key, year):
        if not (2020 <= int(year) <= 2035):
            raise ValueError(f"Graduation year out of plausible range: {year}")
        return int(year)

    @property
    def college_name(self) -> str:
        if self.college:
            return self.college.name
        return self.college_name_raw or "Engineering College"

    def __repr__(self) -> str:
        return f"<Student(id={self.id}, name='{self.full_name}', email='{self.email}', ref_code='{self.referral_code}')>"


# ==============================================================================
# 4. CAMPAIGN MODEL
# ==============================================================================
class Campaign(Base):
    """
    7-Day Acquisition Campaign with budget and milestone governance.
    """
    __tablename__ = "campaigns"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    target_registrations: Mapped[int] = mapped_column(Integer, default=500)
    total_budget_inr: Mapped[float] = mapped_column(Float, default=2000.0)
    spent_budget_inr: Mapped[float] = mapped_column(Float, default=0.0)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")  # DRAFT, ACTIVE, PAUSED, COMPLETED
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    events: Mapped[List["Event"]] = relationship("Event", back_populates="campaign", cascade="all, delete-orphan")
    sources: Mapped[List["CampaignSource"]] = relationship("CampaignSource", back_populates="campaign", cascade="all, delete-orphan")
    daily_metrics: Mapped[List["DailyMetric"]] = relationship("DailyMetric", back_populates="campaign", cascade="all, delete-orphan")
    budget_transactions: Mapped[List["BudgetTransaction"]] = relationship("BudgetTransaction", back_populates="campaign", cascade="all, delete-orphan")
    experiments: Mapped[List["Experiment"]] = relationship("Experiment", back_populates="campaign", cascade="all, delete-orphan")
    ai_insights: Mapped[List["AIInsight"]] = relationship("AIInsight", back_populates="campaign", cascade="all, delete-orphan")
    alerts: Mapped[List["GrowthAlert"]] = relationship("GrowthAlert", back_populates="campaign", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Campaign(code='{self.code}', target={self.target_registrations}, budget=₹{self.total_budget_inr})>"


# ==============================================================================
# 5. CAMPAIGN SOURCE MODEL (Acquisition Attribution)
# ==============================================================================
class CampaignSource(Base):
    """
    Acquisition channels and attribution tracking (WhatsApp, LinkedIn, Ambassadors).
    """
    __tablename__ = "campaign_sources"

    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    source_name: Mapped[str] = mapped_column(String(100), nullable=False)
    utm_source: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    utm_medium: Mapped[str] = mapped_column(String(100), nullable=False)
    utm_campaign: Mapped[str] = mapped_column(String(100), nullable=False)
    budget_allocated_inr: Mapped[float] = mapped_column(Float, default=0.0)
    clicks_count: Mapped[int] = mapped_column(Integer, default=0)
    conversions_count: Mapped[int] = mapped_column(Integer, default=0)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="sources")
    registrations: Mapped[List["Registration"]] = relationship("Registration", back_populates="campaign_source")

    __table_args__ = (
        UniqueConstraint("campaign_id", "utm_source", "utm_medium", name="uq_campaign_source_medium"),
    )

    def __repr__(self) -> str:
        return f"<CampaignSource(name='{self.source_name}', utm_source='{self.utm_source}')>"


# ==============================================================================
# 6. EVENT MODEL
# ==============================================================================
class Event(Base):
    """
    Free Workshop/Masterclass: 'Build Your First AI Project in 60 Minutes'.
    """
    __tablename__ = "events"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False, unique=True, index=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    speaker_name: Mapped[str] = mapped_column(String(150), default="NxtWave AI Lead")
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    meeting_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    max_capacity: Mapped[int] = mapped_column(Integer, default=500)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="events")
    registrations: Mapped[List["Registration"]] = relationship("Registration", back_populates="event", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Event(code='{self.code}', title='{self.title}')>"


# ==============================================================================
# 7. REGISTRATION MODEL (With Attribution & UTM Support)
# ==============================================================================
class Registration(Base):
    """
    Workshop registration transaction. Connects student to event with attribution.
    """
    __tablename__ = "registrations"

    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_source_id: Mapped[Optional[int]] = mapped_column(ForeignKey("campaign_sources.id", ondelete="SET NULL"), nullable=True, index=True)

    # Attribution & UTM parameters
    utm_source: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    utm_medium: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    utm_campaign: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    utm_term: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    utm_content: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    club_id: Mapped[Optional[int]] = mapped_column(ForeignKey("clubs.id", ondelete="SET NULL"), nullable=True, index=True)
    club_name_raw: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    referrer_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Status & Attendance
    status: Mapped[str] = mapped_column(String(30), default="CONFIRMED")  # CONFIRMED, ATTENDED, CANCELLED
    attendance_duration_mins: Mapped[int] = mapped_column(Integer, default=0)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="registrations")
    event: Mapped["Event"] = relationship("Event", back_populates="registrations")
    campaign_source: Mapped[Optional["CampaignSource"]] = relationship("CampaignSource", back_populates="registrations")
    club: Mapped[Optional["Club"]] = relationship("Club")

    __table_args__ = (
        UniqueConstraint("student_id", "event_id", name="uq_student_event_registration"),
        Index("ix_reg_event_source", "event_id", "utm_source"),
    )

    def __repr__(self) -> str:
        return f"<Registration(id={self.id}, student_id={self.student_id}, event_id={self.event_id}, status='{self.status}')>"


# ==============================================================================
# 8. REFERRAL MODEL (Traceable Peer-to-Peer Virality)
# ==============================================================================
class Referral(Base):
    """
    Traceable referral invitation and conversion tracking.
    """
    __tablename__ = "referrals"

    referrer_student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    referee_student_id: Mapped[Optional[int]] = mapped_column(ForeignKey("students.id", ondelete="SET NULL"), nullable=True, index=True)
    referral_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    channel: Mapped[str] = mapped_column(String(50), default="WHATSAPP")  # WHATSAPP, LINKEDIN, TELEGRAM, DIRECT
    status: Mapped[str] = mapped_column(String(30), default="INVITED")  # INVITED, CLICKED, REGISTERED, QUALIFIED, REWARDED
    reward_tier_unlocked: Mapped[int] = mapped_column(Integer, default=0)  # 0, 1 (1 ref), 2 (3 refs)
    converted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    referrer: Mapped["Student"] = relationship("Student", foreign_keys=[referrer_student_id], back_populates="referrals_made")
    referee: Mapped[Optional["Student"]] = relationship("Student", foreign_keys=[referee_student_id], back_populates="referrals_received")

    __table_args__ = (
        Index("ix_referral_lookup", "referral_code", "status"),
    )

    def __repr__(self) -> str:
        return f"<Referral(from={self.referrer_student_id}, to={self.referee_student_id}, status='{self.status}')>"


# ==============================================================================
# 9. DAILY METRIC MODEL (Time-Series Growth Analytics)
# ==============================================================================
class DailyMetric(Base):
    """
    Daily aggregated telemetry capturing registration velocity and viral coefficient.
    """
    __tablename__ = "daily_metrics"

    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)  # Day 1 to 7
    total_visits: Mapped[int] = mapped_column(Integer, default=0)
    form_starts: Mapped[int] = mapped_column(Integer, default=0)
    registrations_count: Mapped[int] = mapped_column(Integer, default=0)
    verified_final_year_count: Mapped[int] = mapped_column(Integer, default=0)
    referral_registrations_count: Mapped[int] = mapped_column(Integer, default=0)
    k_factor: Mapped[float] = mapped_column(Float, default=0.0)
    budget_spent_today_inr: Mapped[float] = mapped_column(Float, default=0.0)
    cumulative_budget_spent_inr: Mapped[float] = mapped_column(Float, default=0.0)
    cumulative_cac_inr: Mapped[float] = mapped_column(Float, default=0.0)
    conversion_rate_percent: Mapped[float] = mapped_column(Float, default=0.0)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="daily_metrics")

    __table_args__ = (
        UniqueConstraint("campaign_id", "metric_date", name="uq_campaign_daily_metric"),
    )

    def __repr__(self) -> str:
        return f"<DailyMetric(day={self.day_number}, date={self.metric_date}, regs={self.registrations_count}, K={self.k_factor})>"


# ==============================================================================
# 10. BUDGET TRANSACTION MODEL (Strict Financial Cap)
# ==============================================================================
class BudgetTransaction(Base):
    """
    Audited financial ledger item enforcing the ₹2,000 budget cap.
    """
    __tablename__ = "budget_transactions"

    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_inr: Mapped[float] = mapped_column(Float, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)  # AMBASSADOR_INCENTIVE, REFERRAL_REWARD, COMMUNITY_BOOST, CONTINGENCY
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    recipient_name: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    receipt_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="budget_transactions")

    @validates("amount_inr")
    def validate_amount(self, key, amt):
        if float(amt) < 0:
            raise ValueError(f"Transaction amount cannot be negative: {amt}")
        return float(amt)

    def __repr__(self) -> str:
        return f"<BudgetTransaction(id={self.id}, amount=₹{self.amount_inr}, type='{self.transaction_type}')>"


# ==============================================================================
# 11. EXPERIMENT MODEL (A/B Testing & Growth Experiments)
# ==============================================================================
class Experiment(Base):
    """
    Growth A/B testing experiment configuration (Headline, CTA, Referral Incentives).
    """
    __tablename__ = "experiments"

    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    hypothesis: Mapped[str] = mapped_column(Text, nullable=False)

    # Phase 11 Experiment Fields
    category: Mapped[str] = mapped_column(String(50), default="Landing headline")
    # Categories: "Landing headline", "CTA wording", "Referral CTA", "WhatsApp message", "Poster copy", "Email subject"
    control_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    variant_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    variant_a_description: Mapped[str] = mapped_column(String(255), nullable=False)  # Control text mirror
    variant_b_description: Mapped[str] = mapped_column(String(255), nullable=False)  # Variant text mirror

    primary_metric: Mapped[str] = mapped_column(String(100), default="Conversion Rate")
    success_threshold: Mapped[float] = mapped_column(Float, default=5.0)  # Required relative lift %
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(String(30), default="RUNNING")  # DRAFT, RUNNING, CONCLUDED, ARCHIVED
    winner_variant: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="experiments")
    results: Mapped[List["ExperimentResult"]] = relationship("ExperimentResult", back_populates="experiment", cascade="all, delete-orphan")

    @property
    def control_label(self) -> str:
        return self.control_text or self.variant_a_description

    @property
    def variant_label(self) -> str:
        return self.variant_text or self.variant_b_description

    def __repr__(self) -> str:
        return f"<Experiment(id={self.id}, name='{self.name}', status='{self.status}', category='{self.category}')>"


# ==============================================================================
# 12. EXPERIMENT RESULT MODEL
# ==============================================================================
class ExperimentResult(Base):
    """
    Statistical results for an A/B test variant.
    """
    __tablename__ = "experiment_results"

    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    variant: Mapped[str] = mapped_column(String(10), nullable=False)  # 'A' or 'B'
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    conversions: Mapped[int] = mapped_column(Integer, default=0)
    conversion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    is_statistically_significant: Mapped[bool] = mapped_column(Boolean, default=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    experiment: Mapped["Experiment"] = relationship("Experiment", back_populates="results")

    __table_args__ = (
        UniqueConstraint("experiment_id", "variant", name="uq_exp_variant"),
    )

    def __repr__(self) -> str:
        return f"<ExperimentResult(variant='{self.variant}', cr={self.conversion_rate}%)>"


# ==============================================================================
# 13A. AUTOMATION RULE MODEL (Phase 12 Automation Center)
# ==============================================================================
class AutomationRule(Base):
    """
    Growth Automation definition (Registration Confirmation, Referral Reminder,
    Workshop Reminder, Final Reminder, Growth Alert).
    """
    __tablename__ = "automation_rules"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True, index=True)
    trigger: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    channel: Mapped[str] = mapped_column(String(50), default="WHATSAPP")  # WHATSAPP, EMAIL, SMS, WEBHOOK
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", index=True)  # ACTIVE, PAUSED, DRAFT
    template_body: Mapped[str] = mapped_column(Text, nullable=False)
    template_subject: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    webhook_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    last_triggered: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    trigger_count: Mapped[int] = mapped_column(Integer, default=0)
    is_mock_adapter: Mapped[bool] = mapped_column(Boolean, default=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    def __repr__(self) -> str:
        return f"<AutomationRule(name='{self.name}', trigger='{self.trigger}', status='{self.status}')>"


# ==============================================================================
# 13B. AUTOMATION EVENT MODEL
# ==============================================================================
class AutomationEvent(Base):
    """
    Audit log of automated actions: WhatsApp share links, webhook dispatches, milestone unlocks.
    """
    __tablename__ = "automation_events"

    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    student_id: Mapped[Optional[int]] = mapped_column(ForeignKey("students.id", ondelete="SET NULL"), nullable=True, index=True)
    payload: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="SUCCESS")  # SUCCESS, FAILED, RETRIED
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    student: Mapped[Optional["Student"]] = relationship("Student", back_populates="automation_events")

    def __repr__(self) -> str:
        return f"<AutomationEvent(type='{self.event_type}', status='{self.status}')>"


# ==============================================================================
# 14. AI INSIGHT MODEL
# ==============================================================================
class AIInsight(Base):
    """
    Actionable insights generated by the AI layer (virality diagnosis, hotspot detection).
    """
    __tablename__ = "ai_insights"

    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    topic: Mapped[str] = mapped_column(String(100), nullable=False)  # VIRALITY, COLLEGE_HOTSPOT, COPY_PERFORMANCE
    summary: Mapped[str] = mapped_column(String(255), nullable=False)
    detailed_insight: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_action: Mapped[str] = mapped_column(String(500), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.85)
    generated_by_provider: Mapped[str] = mapped_column(String(50), default="deterministic_fallback")
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="ai_insights")

    def __repr__(self) -> str:
        return f"<AIInsight(topic='{self.topic}', summary='{self.summary[:30]}...')>"


# ==============================================================================
# 15. GROWTH ALERT MODEL
# ==============================================================================
class GrowthAlert(Base):
    """
    Proactive system alerts (CAC threshold breaches, milestone achievements).
    """
    __tablename__ = "growth_alerts"

    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # CAC_BREACH, MILESTONE_HIT, VELOCITY_DROP
    severity: Mapped[str] = mapped_column(String(20), default="INFO")  # INFO, WARNING, CRITICAL
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    detected_metric: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    # Relationships
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="alerts")

    def __repr__(self) -> str:
        return f"<GrowthAlert(type='{self.alert_type}', severity='{self.severity}')>"


# ==============================================================================
# 16. SIMULATION STATE MODEL (Phase 13 Full Simulation Mode)
# ==============================================================================
class SimulationState(Base):
    """
    Tracks the runtime simulation engine state for hiring challenge demo mode.
    Manages current timeline day (Day 1-7), active testing scenario
    (Conservative, Base, Aggressive), days remaining, and injected telemetry counts.
    """
    __tablename__ = "simulation_states"

    current_day: Mapped[int] = mapped_column(Integer, default=1)
    scenario: Mapped[str] = mapped_column(String(50), default="BASE")  # CONSERVATIVE, BASE, AGGRESSIVE
    days_remaining: Mapped[int] = mapped_column(Integer, default=7)
    total_simulated_injected: Mapped[int] = mapped_column(Integer, default=0)
    whatsapp_injected: Mapped[int] = mapped_column(Integer, default=0)
    referral_injected: Mapped[int] = mapped_column(Integer, default=0)
    club_injected: Mapped[int] = mapped_column(Integer, default=0)
    email_injected: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_advanced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    def __repr__(self) -> str:
        return f"<SimulationState(day={self.current_day}, scenario='{self.scenario}', days_left={self.days_remaining})>"

