"""
Analytics Package Exports
=========================
"""

from analytics.metrics import (
    calculate_conversion_rate,
    calculate_cost_per_registration,
    calculate_referral_rate,
    calculate_channel_performance,
    calculate_registration_velocity,
    calculate_forecast,
    calculate_growth_score,
    calculate_funnel_dropoff,
    calculate_budget_efficiency,
    calculate_college_performance,
    calculate_daily_growth,
)
from analytics.acquisition import AcquisitionAnalytics
from analytics.funnel import FunnelAnalytics
from analytics.referral import ReferralAnalytics
from analytics.colleges import CollegeAnalytics
from analytics.budget import BudgetAnalytics
from analytics.daily_trend import DailyTrendAnalytics
from analytics.engine import AnalyticsEngine
from analytics.experiments import (
    calculate_experiment_metrics,
    calculate_lift,
    calculate_difference,
    calculate_variant_conversion_rate,
    calculate_two_proportion_z_test,
    ALLOWED_EXPERIMENT_CATEGORIES,
    ALLOWED_EXPERIMENT_STATUSES,
)

from analytics.alerts import GrowthAlertEngine
from analytics.intelligence import AdvancedIntelligenceEngine

__all__ = [
    "calculate_conversion_rate",
    "calculate_cost_per_registration",
    "calculate_referral_rate",
    "calculate_channel_performance",
    "calculate_registration_velocity",
    "calculate_forecast",
    "calculate_growth_score",
    "calculate_funnel_dropoff",
    "calculate_budget_efficiency",
    "calculate_college_performance",
    "calculate_daily_growth",
    "calculate_experiment_metrics",
    "calculate_lift",
    "calculate_difference",
    "calculate_variant_conversion_rate",
    "calculate_two_proportion_z_test",
    "ALLOWED_EXPERIMENT_CATEGORIES",
    "ALLOWED_EXPERIMENT_STATUSES",
    "AcquisitionAnalytics",
    "FunnelAnalytics",
    "ReferralAnalytics",
    "CollegeAnalytics",
    "BudgetAnalytics",
    "DailyTrendAnalytics",
    "AnalyticsEngine",
    "GrowthAlertEngine",
    "AdvancedIntelligenceEngine",
]


