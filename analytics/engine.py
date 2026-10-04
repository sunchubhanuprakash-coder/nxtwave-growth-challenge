"""
Analytics Engine
================
High-performance analytical computing engine powered by Pandas, NumPy,
and statistically validated growth modeling functions.

Provides a unified facade across:
1. Acquisition Analytics
2. Funnel Analytics
3. Referral Analytics
4. College Analytics
5. Budget Analytics
6. Daily Trend Analytics
"""

from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

# Import individual analytical suites
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


class AnalyticsEngine:
    """
    Unified growth intelligence engine coordinating all 6 analytical suites
    and exposing individual reusable calculation functions.
    """

    # Expose calculation functions as static methods for direct access
    calculate_conversion_rate = staticmethod(calculate_conversion_rate)
    calculate_cost_per_registration = staticmethod(calculate_cost_per_registration)
    calculate_referral_rate = staticmethod(calculate_referral_rate)
    calculate_channel_performance = staticmethod(calculate_channel_performance)
    calculate_registration_velocity = staticmethod(calculate_registration_velocity)
    calculate_forecast = staticmethod(calculate_forecast)
    calculate_growth_score = staticmethod(calculate_growth_score)
    calculate_funnel_dropoff = staticmethod(calculate_funnel_dropoff)
    calculate_budget_efficiency = staticmethod(calculate_budget_efficiency)
    calculate_college_performance = staticmethod(calculate_college_performance)
    calculate_daily_growth = staticmethod(calculate_daily_growth)

    # Sub-engines
    acquisition = AcquisitionAnalytics
    funnel = FunnelAnalytics
    referral = ReferralAnalytics
    colleges = CollegeAnalytics
    budget = BudgetAnalytics
    daily_trend = DailyTrendAnalytics

    # --------------------------------------------------------------------------
    # Backwards Compatibility Methods (for existing callers & tests)
    # --------------------------------------------------------------------------
    @staticmethod
    def calculate_growth_summary(
        registrations_data: List[Dict[str, Any]],
        total_budget_inr: float = 2000.0
    ) -> Dict[str, Any]:
        """
        Computes the complete growth scorecard from raw registration records.
        Preserves compatibility with initial test suites while utilizing new metrics.
        """
        if not registrations_data:
            return {
                "total_registrations": 0,
                "verified_final_year": 0,
                "target_goal": 500,
                "goal_progress_percent": 0.0,
                "k_factor": 0.0,
                "effective_cac_inr": 0.0,
                "top_colleges": [],
                "channel_breakdown": {}
            }

        df = pd.DataFrame(registrations_data)
        total_regs = len(df)
        verified_count = int(df["is_final_year"].sum()) if "is_final_year" in df.columns else total_regs
        progress_pct = round((verified_count / 500.0) * 100, 2)

        # Effective CAC / CPR
        cac = calculate_cost_per_registration(
            total_spend=total_budget_inr,
            total_registrations=total_regs,
            verified_only=True,
            verified_registrations=verified_count
        )

        # K-Factor estimation: (referral_conversions / direct_registrations)
        if "referred_by" in df.columns:
            direct_count = int((df["referred_by"].isna() | (df["referred_by"] == "")).sum())
            referred_count = total_regs - direct_count
            ref_calc = calculate_referral_rate(referred_count, total_regs)
            k_factor = ref_calc["viral_k_factor"]
        else:
            k_factor = 0.0

        # Top colleges
        top_colleges = []
        if "college_name" in df.columns:
            college_counts = df["college_name"].value_counts().head(5).to_dict()
            top_colleges = [{"college": k, "count": int(v)} for k, v in college_counts.items()]

        # Channel attribution
        channel_breakdown = {}
        if "utm_source" in df.columns:
            channels = df["utm_source"].fillna("direct_organic").value_counts().to_dict()
            channel_breakdown = {k: int(v) for k, v in channels.items()}

        return {
            "total_registrations": total_regs,
            "verified_final_year": verified_count,
            "target_goal": 500,
            "goal_progress_percent": progress_pct,
            "k_factor": k_factor,
            "effective_cac_inr": cac,
            "top_colleges": top_colleges,
            "channel_breakdown": channel_breakdown
        }

    @staticmethod
    def calculate_velocity_curve(timestamps: List[str]) -> Dict[str, Any]:
        """
        Calculates registration velocity (run-rate per hour / day) from timestamps.
        """
        if not timestamps:
            return {"hourly_rate": 0.0, "projected_7day_total": 0}

        ts_series = pd.to_datetime(timestamps)
        ts_sorted = ts_series.sort_values()
        time_span_hours = max((ts_sorted.iloc[-1] - ts_sorted.iloc[0]).total_seconds() / 3600.0, 1.0)
        hourly_rate = round(len(ts_sorted) / time_span_hours, 2)
        projected_7day = int(hourly_rate * 24 * 7)

        return {
            "hourly_rate": hourly_rate,
            "time_span_hours": round(time_span_hours, 1),
            "projected_7day_total": projected_7day
        }

    # --------------------------------------------------------------------------
    # Complete End-to-End Analytics Report from Database
    # --------------------------------------------------------------------------
    @classmethod
    def generate_full_report(cls, db: Session) -> Dict[str, Any]:
        """
        Executes a synchronized analytical audit across all 6 growth domains
        using stored database events and models.
        """
        acquisition_data = cls.acquisition.from_db(db)
        funnel_data = cls.funnel.from_db(db)
        referral_data = cls.referral.from_db(db)
        college_data = cls.colleges.from_db(db)
        budget_data = cls.budget.from_db(db)
        daily_trend_data = cls.daily_trend.from_db(db)

        # Primary summary
        current_regs = daily_trend_data["current_registrations"]
        target = daily_trend_data["target_registrations"]
        cpr = budget_data["blended_cpr_inr"]
        k_factor = referral_data["viral_k_factor"]
        growth_score = daily_trend_data["growth_score"]

        return {
            "overview": {
                "target_registrations": target,
                "current_registrations": current_regs,
                "progress_percent": daily_trend_data["target_progress_percent"],
                "remaining": max(0, target - current_regs),
                "growth_score": growth_score,
                "blended_cpr_inr": cpr,
                "viral_k_factor": k_factor,
                "conversion_rate": funnel_data["overall_conversion_rate"],
            },
            "acquisition": acquisition_data,
            "funnel": funnel_data,
            "referral": referral_data,
            "colleges": college_data,
            "budget": budget_data,
            "daily_trend": daily_trend_data,
        }
