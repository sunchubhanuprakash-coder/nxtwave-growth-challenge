import re
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator, ConfigDict


def mask_email(email: str) -> str:
    """Masks an email for privacy (e.g. ad***@example.com)."""
    if not email or "@" not in email:
        return "****"
    user, domain = email.split("@", 1)
    if len(user) <= 2:
        masked_user = user[0] + "*"
    else:
        masked_user = user[:2] + "*" * (len(user) - 2)
    return f"{masked_user}@{domain}"


def mask_phone(phone: str) -> str:
    """Masks phone number for privacy (e.g. ******3210)."""
    if not phone or len(phone) < 4:
        return "******"
    return "*" * (len(phone) - 4) + phone[-4:]


# ==============================================================================
# STUDENT & REGISTRATION SCHEMAS
# ==============================================================================
class StudentRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="Full Name of the student")
    email: EmailStr = Field(..., description="Student email address")
    phone_number: str = Field(..., description="10-digit Indian WhatsApp mobile number")
    college_name: str = Field(..., min_length=2, max_length=255, description="Engineering college name")
    branch: str = Field(..., min_length=2, max_length=100, description="Engineering branch/discipline (CSE, IT, ECE)")
    graduation_year: int = Field(..., ge=2020, le=2035, description="Expected graduation year (2025/2026 qualify for final year)")
    city: Optional[str] = Field("Hyderabad", max_length=100, description="Current city of residence")
    skill_level: Optional[str] = Field("Beginner", max_length=50, description="AI/Coding skill level: Beginner, Intermediate, Advanced")
    primary_goal: Optional[str] = Field("Placement & Resume Project", max_length=150, description="Primary goal: Placement & Resume Project, Capstone, Learn AI")
    acquisition_source: Optional[str] = Field("WhatsApp", max_length=100, description="How student heard about workshop")
    referred_by_code: Optional[str] = Field(None, max_length=50, description="Referral code of inviting student")
    
    # Optional UTM attribution & Club
    utm_source: Optional[str] = Field("direct_organic", max_length=100)
    utm_medium: Optional[str] = Field(None, max_length=100)
    utm_campaign: Optional[str] = Field("ai_workshop_oct", max_length=100)
    utm_term: Optional[str] = Field(None, max_length=100)
    utm_content: Optional[str] = Field(None, max_length=100)
    club_name: Optional[str] = Field(None, max_length=100, description="Campus club/society (e.g. coding_club, ieee_branch)")
    referrer_url: Optional[str] = Field(None, max_length=500)

    @model_validator(mode="before")
    @classmethod
    def normalize_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Support flexible aliases from diverse clients and UTM query strings
            if "phone" in data and "phone_number" not in data:
                data["phone_number"] = data["phone"]
            if "college" in data and "college_name" not in data:
                data["college_name"] = data["college"]
            if "referral_code" in data and "referred_by_code" not in data:
                data["referred_by_code"] = data["referral_code"]
            if "ref" in data and "referred_by_code" not in data:
                data["referred_by_code"] = data["ref"]
            if "club" in data and "club_name" not in data:
                data["club_name"] = data["club"]
            if "content" in data and "utm_content" not in data:
                data["utm_content"] = data["content"]
        return data

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = re.sub(r"[^\d]", "", v)
        if len(cleaned) < 10:
            raise ValueError("Phone number must have at least 10 digits")
        return cleaned[-10:]


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone_number: str
    college_name: str
    branch: str
    graduation_year: int
    is_final_year: bool
    city: Optional[str] = None
    skill_level: Optional[str] = None
    primary_goal: Optional[str] = None
    acquisition_source: Optional[str] = None
    referral_code: str
    referred_by_code: Optional[str] = None
    created_at: datetime


class AttributionDetail(BaseModel):
    source: Optional[str] = None
    medium: Optional[str] = None
    campaign: Optional[str] = None
    content: Optional[str] = None
    referral: Optional[str] = None
    college: Optional[str] = None
    club: Optional[str] = None


class RegistrationResponse(BaseModel):
    registration_id: int
    status: str
    student: StudentResponse
    event_title: str
    referral_code: str
    referral_link: str
    whatsapp_share_url: str
    tier_1_unlocked: bool
    tier_2_unlocked: bool
    is_existing: bool = False
    attribution: Optional[AttributionDetail] = None


# ==============================================================================
# REFERRAL SCHEMAS
# ==============================================================================
class ReferralCreateRequest(BaseModel):
    referrer_code: str = Field(..., description="Referral code of inviter")
    referee_name: str = Field(..., min_length=2, max_length=150)
    referee_email: EmailStr = Field(...)
    channel: str = Field("WHATSAPP", description="WHATSAPP, LINKEDIN, TELEGRAM, DIRECT")


class MilestoneDetail(BaseModel):
    target: int = Field(..., description="Target number of qualified referrals (1, 3, 5, 10)")
    title: str = Field(..., description="Milestone title")
    reward: str = Field(..., description="Deliverable or recognized achievement")
    unlocked: bool = Field(..., description="Whether student reached this milestone")
    progress_percent: float = Field(..., description="Progress percentage 0-100%")


class ReferralTrackResponse(BaseModel):
    referral_code: str
    referral_link: str = ""
    referrer_name: str
    friends_invited: int = 0
    successful_registrations: int = 0
    conversion_rate: float = 0.0
    rank: int = 1
    total_referrers: int = 1
    milestones: List[MilestoneDetail] = []
    
    # Milestone tier states
    tier_1_unlocked: bool = False
    tier_1_reward: str = ""
    tier_2_unlocked: bool = False
    tier_2_reward: str = ""
    tier_3_unlocked: bool = False
    tier_3_reward: str = ""
    tier_4_unlocked: bool = False
    tier_4_reward: str = ""
    next_reward_target: Any = 1
    next_milestone_target: Any = 1
    
    # Sharing links
    whatsapp_share_url: str = ""
    email_share_url: str = ""
    
    # Backward compatibility
    total_referrals: int = 0
    qualified_referrals: int = 0
    recent_referrals: List[Dict[str, Any]] = []


class LeaderboardEntry(BaseModel):
    rank: int
    referral_code: str
    student_name: str
    college_name: str
    branch: str
    successful_referrals: int
    friends_invited: int
    conversion_rate: float
    badges: List[str] = []


class LeaderboardResponse(BaseModel):
    total_participants: int
    total_referrals: int
    leaderboard: List[LeaderboardEntry]


class ReferralInviteActionRequest(BaseModel):
    referral_code: str
    channel: str = Field("WHATSAPP", description="WHATSAPP, EMAIL, LINKEDIN, DIRECT")
    action: str = Field("SHARE", description="SHARE, CLICK, INVITE")


# ==============================================================================
# DASHBOARD & ANALYTICS SCHEMAS
# ==============================================================================
class DashboardResponse(BaseModel):
    total_registrations: int
    verified_final_year: int
    target_registrations: int
    goal_progress_percent: float
    k_factor: float
    total_budget_inr: float
    spent_budget_inr: float
    remaining_budget_inr: float
    effective_cac_inr: float
    seats_remaining: int
    campaign_status: str
    recent_registrations: List[Dict[str, Any]]


class AnalyticsResponse(BaseModel):
    summary: Dict[str, Any]
    daily_velocity: List[Dict[str, Any]]
    channel_attribution: List[Dict[str, Any]]
    college_breakdown: List[Dict[str, Any]]
    branch_breakdown: List[Dict[str, Any]]
    # Phase 8 Reusable Analytics Suites
    acquisition: Optional[Dict[str, Any]] = None
    funnel: Optional[Dict[str, Any]] = None
    referral: Optional[Dict[str, Any]] = None
    colleges: Optional[Dict[str, Any]] = None
    budget: Optional[Dict[str, Any]] = None
    daily_trend: Optional[Dict[str, Any]] = None
    growth_score: Optional[float] = None


# ==============================================================================
# CHANNELS & COLLEGES SCHEMAS
# ==============================================================================
class ChannelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_name: str
    utm_source: str
    utm_medium: str
    clicks: int
    conversions: int
    conversion_rate: float
    budget_allocated_inr: float


class CollegeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    city: str
    state: str
    tier: str
    registered_students_count: int


# ==============================================================================
# EXPERIMENTS & ALERTS SCHEMAS (PHASE 11)
# ==============================================================================
class ExperimentCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    hypothesis: str = Field(..., min_length=5)
    category: str = Field("Landing headline", description="Category of experiment")
    # Allowed: Landing headline, CTA wording, Referral CTA, WhatsApp message, Poster copy, Email subject
    control: Optional[str] = Field(None, description="Control variant copy/description")
    variant: Optional[str] = Field(None, description="Test variant copy/description")
    variant_a_description: Optional[str] = Field(None, description="Backwards compatibility alias for control")
    variant_b_description: Optional[str] = Field(None, description="Backwards compatibility alias for variant")
    primary_metric: str = Field("Conversion Rate", max_length=100)
    success_threshold: float = Field(5.0, ge=0.0, le=100.0, description="Minimum relative lift % to declare variant winner")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str = Field("RUNNING", description="DRAFT, RUNNING, CONCLUDED, ARCHIVED")
    is_simulated: bool = Field(False, description="Flag for SIMULATED EXPERIMENT vs REAL EXPERIMENT")

    @model_validator(mode="after")
    def validate_variants(self):
        # Synchronize control / variant with variant_a_description / variant_b_description
        if not self.control and self.variant_a_description:
            self.control = self.variant_a_description
        if not self.variant and self.variant_b_description:
            self.variant = self.variant_b_description
        if not self.variant_a_description and self.control:
            self.variant_a_description = self.control
        if not self.variant_b_description and self.variant:
            self.variant_b_description = self.variant

        if not self.control or not self.variant:
            raise ValueError("Both 'control' and 'variant' descriptions are required.")
        return self


class ExperimentTelemetry(BaseModel):
    control_impressions: int
    control_conversions: int
    control_conversion_rate: float
    variant_impressions: int
    variant_conversions: int
    variant_conversion_rate: float
    lift: float
    difference: float
    z_score: float
    p_value: float
    confidence: float
    is_statistically_significant: bool
    sample_size_reached: bool
    min_sample_size: int
    success_threshold: float
    winner: str


class ExperimentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    hypothesis: str
    category: str = "Landing headline"
    control: str
    variant: str
    variant_a_description: str  # For backwards compatibility with existing Phase 3/API tests
    variant_b_description: str  # For backwards compatibility with existing Phase 3/API tests
    primary_metric: str = "Conversion Rate"
    success_threshold: float = 5.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: str = "RUNNING"
    winner_variant: Optional[str] = None
    is_simulated: bool = False
    experiment_type: str = "REAL EXPERIMENT"  # "SIMULATED EXPERIMENT" or "REAL EXPERIMENT"
    telemetry: Optional[ExperimentTelemetry] = None
    results: List[Dict[str, Any]] = []


class TrackExperimentEventRequest(BaseModel):
    variant: str = Field(..., description="'CONTROL' (or 'A') vs 'VARIANT' (or 'B')")
    event_type: str = Field(..., description="'IMPRESSION' or 'CONVERSION'")
    count: int = Field(1, ge=1, le=10000)


class SimulateTrafficRequest(BaseModel):
    visitors: int = Field(200, ge=10, le=50000, description="Total simulated visitors to split between Control and Variant")
    control_bias_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Optional custom conversion rate % for Control")
    variant_bias_pct: Optional[float] = Field(None, ge=0.0, le=100.0, description="Optional custom conversion rate % for Variant")


class ConcludeExperimentRequest(BaseModel):
    force_winner: Optional[str] = Field(None, description="Optional forced winner ('CONTROL', 'VARIANT', or 'NO_WINNER')")



class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alert_type: str
    severity: str
    title: str
    message: str
    detected_metric: Optional[str] = None
    reason: Optional[str] = None
    recommended_action: Optional[str] = None
    is_acknowledged: bool = False
    is_simulated: bool = False
    created_at: Optional[datetime] = None


class AlertSummaryResponse(BaseModel):
    total_alerts: int
    critical_count: int
    warning_count: int
    info_count: int
    unacknowledged_count: int
    evaluated_at: datetime
    alerts: List[AlertResponse]


class AlertAcknowledgeResponse(BaseModel):
    success: bool
    alert_id: int
    is_acknowledged: bool
    message: str



# ==============================================================================
# SIMULATION & AI SCHEMAS
# ==============================================================================
class SimulationEventRequest(BaseModel):
    event_type: str = Field("BATCHMATE_REFERRAL_SURGE", description="BATCHMATE_REFERRAL_SURGE, AMBASSADOR_BLAST, TELEGRAM_DROP")
    students_count: int = Field(5, ge=1, le=50, description="Number of simulated students to register")
    college_code: Optional[str] = Field("CBIT", description="College code for surge")


class SimulationResetRequest(BaseModel):
    confirm: bool = Field(True, description="Confirm complete database reset to seed data")


class AIAnalyzeRequest(BaseModel):
    topic: str = Field("VIRALITY", description="VIRALITY, COLLEGE_HOTSPOT, COPY_PERFORMANCE")
    custom_prompt: Optional[str] = None


# ==============================================================================
# PHASE 6: ACQUISITION ATTRIBUTION & ADMIN UTM BUILDER SCHEMAS
# ==============================================================================
class UTMBuilderRequest(BaseModel):
    source: str = Field(..., min_length=1, max_length=100, description="Acquisition source (e.g. whatsapp, linkedin, ambassador, telegram)")
    medium: str = Field(..., min_length=1, max_length=100, description="Marketing medium (e.g. college_group, organic_post, campus_rep)")
    campaign: str = Field("ai_workshop", min_length=1, max_length=100, description="Campaign identifier (e.g. ai_workshop, placement_sprint)")
    content: Optional[str] = Field(None, max_length=100, description="Creative variant (e.g. poster_a, poster_b, placement_hook)")
    college: Optional[str] = Field(None, max_length=150, description="Target college name or code (e.g. CBIT, VNRVJIET)")
    club: Optional[str] = Field(None, max_length=150, description="Target campus club/society (e.g. coding_club, ieee_branch)")
    referral_code: Optional[str] = Field(None, max_length=50, description="Optional referrer code (e.g. NXT123)")
    base_url: Optional[str] = Field(None, max_length=500, description="Base URL for registration")


class UTMBuilderResponse(BaseModel):
    tracking_url: str
    relative_url: str
    source: str
    medium: str
    campaign: str
    content: Optional[str] = None
    college: Optional[str] = None
    club: Optional[str] = None
    referral_code: Optional[str] = None
    qr_code_data_url: Optional[str] = None
    parameters: Dict[str, str]


class CollegeClubItem(BaseModel):
    college_id: int
    college_name: str
    college_code: str
    tier: str
    clubs: List[str]


class CollegeClubTreeResponse(BaseModel):
    colleges: List[CollegeClubItem]


class SourcePerformanceMetric(BaseModel):
    source: str
    medium: Optional[str] = None
    campaign: Optional[str] = None
    total_registrations: int = 0
    verified_final_year: int = 0
    verification_rate_percent: float = 0.0
    clicks: int = 0
    conversions: int = 0
    conversion_rate_percent: float = 0.0
    budget_allocated_inr: float = 0.0
    cac_inr: float = 0.0
    k_factor: float = 0.0


class ContentPerformanceMetric(BaseModel):
    content: str
    total_registrations: int = 0
    verified_final_year: int = 0
    verification_rate_percent: float = 0.0


class CollegeAttributionMetric(BaseModel):
    college: str
    total_registrations: int = 0
    verified_final_year: int = 0
    top_club: Optional[str] = None


class ClubAttributionMetric(BaseModel):
    club: str
    college: Optional[str] = None
    total_registrations: int = 0
    verified_final_year: int = 0


class AttributionPerformanceResponse(BaseModel):
    total_registrations: int = 0
    total_verified_final_year: int = 0
    total_referral_attributed: int = 0
    total_direct_attributed: int = 0
    total_partner_attributed: int = 0
    active_sources_count: int = 0
    active_clubs_count: int = 0
    top_source: Optional[str] = None
    top_content: Optional[str] = None
    top_college: Optional[str] = None
    sources: List[SourcePerformanceMetric] = []
    contents: List[ContentPerformanceMetric] = []
    colleges: List[CollegeAttributionMetric] = []
    clubs: List[ClubAttributionMetric] = []


class TrackClickRequest(BaseModel):
    source: str = Field(..., max_length=100)
    medium: Optional[str] = Field(None, max_length=100)
    campaign: Optional[str] = Field(None, max_length=100)


class TrackClickResponse(BaseModel):
    source: str
    clicks_count: int
    message: str


# ==============================================================================
# PHASE 7: SAAS ADMIN GROWTH DASHBOARD SCHEMAS
# ==============================================================================
class PrimaryKPIs(BaseModel):
    target_registrations: int = 500
    current_registrations: int
    remaining: int
    progress_percent: float
    days_remaining: int
    referral_share: float
    conversion_rate: float
    estimated_cpr: float
    growth_score: float


class RegistrationTrendPoint(BaseModel):
    day: str
    date: str
    actual_cumulative: int
    target_cumulative: int


class DailyRegistrationPoint(BaseModel):
    day: str
    date: str
    total_registrations: int
    verified_final_year: int
    referral_registrations: int


class AcquisitionSourcePoint(BaseModel):
    source: str
    registrations: int
    verified_final_year: int
    share_percent: float


class ReferralContributionPoint(BaseModel):
    day: str
    direct_registrations: int
    referral_registrations: int
    k_factor: float


class FunnelStagePoint(BaseModel):
    stage: str
    count: int
    conversion_rate: float
    dropoff_rate: float
    description: str


class CollegePerformancePoint(BaseModel):
    college: str
    college_code: Optional[str] = None
    registrations: int
    verified_final_year: int
    share_percent: float


class BudgetMetricPoint(BaseModel):
    day: str
    date: str
    daily_spend_inr: float
    cumulative_spend_inr: float
    cumulative_cpr_inr: float
    budget_cap_inr: float = 2000.0


class ForecastPoint(BaseModel):
    day: str
    actual: Optional[int] = None
    forecast: int
    lower_bound: int
    upper_bound: int
    target: int = 500


class DashboardFilterOptions(BaseModel):
    sources: List[str]
    colleges: List[str]
    date_ranges: List[str]


class AdminGrowthDashboardResponse(BaseModel):
    kpis: PrimaryKPIs
    charts: Dict[str, Any]
    filters_applied: Dict[str, str]
    filter_options: DashboardFilterOptions
    last_updated: datetime


# ==============================================================================
# PHASE 9: CAMPAIGN BUDGET ENGINE & FORECASTING SCHEMAS
# ==============================================================================
class ChannelAllocationItem(BaseModel):
    channel_id: int
    channel_name: str
    utm_source: str
    utm_medium: str
    allocated_inr: float
    spent_inr: float
    conversions_count: int
    cpr_inr: float


class BudgetOverviewResponse(BaseModel):
    max_budget_inr: float = 2000.0
    total_allocated_inr: float
    total_spent_inr: float
    remaining_budget_inr: float
    unallocated_budget_inr: float
    blended_cpr_inr: float
    verified_cpr_inr: float
    total_registrations: int
    verified_registrations: int
    target_registrations: int = 500
    budget_utilization_percent: float
    is_over_budget: bool
    channel_allocations: List[ChannelAllocationItem]


class ChannelAllocationUpdateItem(BaseModel):
    channel_id: int
    allocated_inr: float


class UpdateAllocationsRequest(BaseModel):
    allocations: List[ChannelAllocationUpdateItem]


class UpdateAllocationsResponse(BaseModel):
    success: bool
    message: str
    overview: BudgetOverviewResponse


class BudgetScenarioItem(BaseModel):
    scenario_name: str
    tag: str
    description: str
    expected_registrations: int
    expected_cost: float
    expected_cpr: float
    risk_indicator: str
    risk_color: str
    probability_percent: float
    assumptions: Dict[str, Any]
    is_estimate: bool = True


class BudgetScenariosResponse(BaseModel):
    target_registrations: int = 500
    max_budget_inr: float = 2000.0
    scenarios: List[BudgetScenarioItem]
    disclaimer: str = "Forecasts are mathematical estimates based on current campaign run rates and simulated parameters."


class VelocityForecastInput(BaseModel):
    current_registrations: int
    target: int = 500
    days_remaining: int
    daily_registration_rate: float
    channel_conversion: float
    referral_rate: float


class VelocityForecastResponse(BaseModel):
    inputs: Dict[str, Any]
    projected_registrations: int
    required_daily_registrations: float
    gap: int
    status: str  # ON TRACK | AT RISK | OFF TRACK
    status_color: str
    recommendation: str
    is_estimate: bool = True
    disclaimer: str


# ==============================================================================
# PHASE 10: AI GROWTH COPILOT SCHEMAS
# ==============================================================================
class AICopilotRecommendationItem(BaseModel):
    observation: str
    diagnosis: str
    action: str
    expected_impact: str
    priority: str  # HIGH | MEDIUM | LOW
    confidence: str  # HIGH | MEDIUM | LOW


class AICopilotExperimentItem(BaseModel):
    name: str
    hypothesis: str
    metric: str


class AICopilotAnalysisResponse(BaseModel):
    insight_id: Optional[int] = None
    status: str  # ON TRACK | AT RISK | OFF TRACK
    observations: List[str]
    diagnosis: List[str]
    recommendations: List[AICopilotRecommendationItem]
    experiments: List[AICopilotExperimentItem]
    risks: List[str]
    priority_actions: List[str]
    confidence: str  # HIGH | MEDIUM | LOW
    metric_snapshot: Dict[str, Any]
    provider_used: str
    created_at: str
    is_estimate: bool = True


class StoredInsightItem(BaseModel):
    id: int
    topic: str
    summary: str
    recommended_action: str
    confidence_score: float
    generated_by_provider: str
    created_at: str
    analysis: Optional[Dict[str, Any]] = None


class StoredInsightsListResponse(BaseModel):
    insights: List[StoredInsightItem]
    count: int


# ==============================================================================
# PHASE 12: GROWTH AUTOMATION CENTER SCHEMAS
# ==============================================================================
class AutomationRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    trigger: str
    action: str
    channel: str
    status: str
    template_body: str
    template_subject: Optional[str] = None
    webhook_url: Optional[str] = None
    last_triggered: Optional[str] = None
    trigger_count: int
    is_mock_adapter: bool = True
    is_simulated: bool = False
    sample_rendered_message: str


class AutomationRuleCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    trigger: str = Field(..., min_length=3, max_length=100)
    action: str = Field(..., min_length=3, max_length=100)
    channel: str = Field("WHATSAPP", description="WHATSAPP, EMAIL, SMS, WEBHOOK")
    status: str = Field("ACTIVE", description="ACTIVE, PAUSED, DRAFT")
    template_body: str = Field(..., min_length=10)
    template_subject: Optional[str] = None
    webhook_url: Optional[str] = None
    is_mock_adapter: bool = True


class AutomationRuleUpdateRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    template_body: Optional[str] = None
    template_subject: Optional[str] = None
    webhook_url: Optional[str] = None


class AutomationTriggerRequest(BaseModel):
    student_id: Optional[int] = None
    custom_context: Optional[Dict[str, Any]] = None


class AutomationTriggerResponse(BaseModel):
    rule_id: int
    rule_name: str
    trigger: str
    channel: str
    status: str
    recipient: str
    rendered_message: str
    rendered_subject: Optional[str] = None
    dispatch: Dict[str, Any]
    trigger_count: int
    last_triggered: Optional[str] = None
    audit_event_id: int


class AutomationAuditEventItem(BaseModel):
    id: int
    event_type: str
    student_id: Optional[int] = None
    status: str
    executed_at: Optional[str] = None
    payload: Dict[str, Any]


class AutomationWebhookTestRequest(BaseModel):
    webhook_url: str = Field(..., min_length=5)
    event_name: str = Field("TEST_WEBHOOK_PING")
    sample_context: Optional[Dict[str, Any]] = None


class AutomationWebhookTestResponse(BaseModel):
    success: bool
    channel: str
    webhook_url: str
    status_code: Optional[int] = None
    payload_dispatched: Dict[str, Any]
    details: Dict[str, Any]


# ==============================================================================
# PHASE 13: FULL SIMULATION & DEMO MODE SCHEMAS
# ==============================================================================
class SimulationStateResponse(BaseModel):
    mode: str
    disclaimer: str
    current_day: int
    days_remaining: int
    scenario: str
    is_active: bool
    last_advanced_at: Optional[str] = None
    telemetry: Dict[str, Any]
    timeline: List[Dict[str, Any]]
    scenarios: Dict[str, Any]


class SimulationInjectRequest(BaseModel):
    channel: str = Field("WHATSAPP", description="WHATSAPP (+10), REFERRAL (+10), CLUB (+5), EMAIL (+5)")
    count: int = Field(10, ge=1, le=50, description="Number of simulated registrations to inject")


class SimulationInjectResponse(BaseModel):
    success: bool
    channel: str
    injected_count: int
    total_registrations_now: int
    verified_final_year_now: int
    target_registrations: int
    remaining_to_target: int
    sample_created_students: List[Dict[str, Any]]
    disclaimer: str


class SimulationAdvanceDayResponse(BaseModel):
    success: bool
    previous_day: Optional[int] = None
    current_day: int
    days_remaining: int
    message: str
    disclaimer: str


class SimulationScenarioRequest(BaseModel):
    scenario: str = Field("BASE", description="CONSERVATIVE, BASE, AGGRESSIVE")


# ==============================================================================
# PHASE 15: ADVANCED INTELLIGENCE SCHEMAS
# ==============================================================================
class CopyOptimizeRequest(BaseModel):
    copy_text: Optional[str] = Field(None, description="Custom copy text to evaluate and optimize")


class IntelligenceFeatureResponse(BaseModel):
    feature: str
    score: float
    confidence: str
    confidence_score: float
    input_signals: Dict[str, Any]
    reason: str
    details: Optional[Dict[str, Any]] = None


class FullIntelligenceResponse(BaseModel):
    generated_at: str
    forecasting: Dict[str, Any]
    channel_recommendations: Dict[str, Any]
    segmentation: Dict[str, Any]
    lead_scoring: Dict[str, Any]
    anomaly_detection: Dict[str, Any]
    campaign_strategist: Dict[str, Any]
    copy_optimizer: Dict[str, Any]
    referral_propensity: Dict[str, Any]
    college_opportunities: Dict[str, Any]







