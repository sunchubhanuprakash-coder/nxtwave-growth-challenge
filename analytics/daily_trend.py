"""
Daily Trend Analytics Module
============================
Time-series trajectory tracking, registration velocity, moving average momentum,
and milestone forecasting toward the 500 final-year registration target.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.models import DailyMetric
from analytics.metrics import (
    calculate_daily_growth,
    calculate_registration_velocity,
    calculate_forecast,
    calculate_growth_score
)


class DailyTrendAnalytics:
    """
    Computes day-by-day velocity, acceleration inflection points, and statistical forecasting.
    """

    @staticmethod
    def analyze_daily_trends(
        daily_records: List[Dict[str, Any]],
        target_registrations: int = 500,
        total_campaign_days: int = 7,
        total_budget_inr: float = 2000.0
    ) -> Dict[str, Any]:
        """
        Pure calculation function evaluating time-series growth curves.
        """
        daily_growth = calculate_daily_growth(
            daily_metrics=daily_records,
            target_registrations=target_registrations,
            total_campaign_days=total_campaign_days
        )

        velocity = calculate_registration_velocity(
            daily_data=daily_records,
            window_days=3,
            target_registrations=target_registrations,
            total_campaign_days=total_campaign_days
        )

        forecast = calculate_forecast(
            daily_history=daily_growth,
            target=target_registrations,
            total_campaign_days=total_campaign_days
        )

        # Composite Growth Score
        latest_cpr = 0.0
        if daily_growth:
            total_regs = daily_growth[-1]["cumulative_registrations"]
            latest_cpr = round(total_budget_inr / max(total_regs, 1), 2)
            referral_share = daily_growth[-1]["daily_referral_share"]
            verified_count = daily_growth[-1]["verified_final_year"]
        else:
            total_regs = 0
            referral_share = 0.0
            verified_count = 0

        growth_score = calculate_growth_score({
            "current_registrations": total_regs,
            "target_registrations": target_registrations,
            "days_elapsed": len(daily_growth),
            "referral_share": referral_share,
            "estimated_cpr": latest_cpr,
            "verified_final_year": verified_count,
        })

        # Find viral inflection point (day with greatest positive acceleration)
        inflection_day = None
        max_growth_jump = 0.0
        for day in daily_growth[1:]:
            jump = day["growth_rate_percent"]
            if jump > max_growth_jump:
                max_growth_jump = jump
                inflection_day = day["day"]

        return {
            "daily_progression": daily_growth,
            "velocity": velocity,
            "forecast": forecast,
            "growth_score": growth_score,
            "inflection_point_day": inflection_day,
            "target_registrations": target_registrations,
            "current_registrations": total_regs,
            "target_progress_percent": round(min(100.0, (total_regs / float(target_registrations)) * 100.0), 1),
        }

    @classmethod
    def from_db(cls, db: Session) -> Dict[str, Any]:
        """
        Extracts daily telemetry points directly from the DailyMetric table.
        """
        metrics = db.query(DailyMetric).order_by(DailyMetric.day_number).all()

        daily_records = []
        for m in metrics:
            daily_records.append({
                "day": f"Day {m.day_number}",
                "day_number": m.day_number,
                "date": m.metric_date.isoformat(),
                "registrations_count": m.registrations_count,
                "verified_final_year_count": m.verified_final_year_count,
                "referral_registrations_count": m.referral_registrations_count,
            })

        return cls.analyze_daily_trends(daily_records)
