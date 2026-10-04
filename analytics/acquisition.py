"""
Acquisition Analytics Module
============================
Deep telemetry into multi-channel student acquisition across WhatsApp,
Campus Ambassadors, Telegram, and Organic LinkedIn networks.
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from database.models import CampaignSource, Registration, Student, BudgetTransaction
from analytics.metrics import calculate_conversion_rate, calculate_cost_per_registration, calculate_channel_performance


class AcquisitionAnalytics:
    """
    Analyzes acquisition performance, attribution parameters, and channel efficiency.
    """

    @staticmethod
    def analyze_channels(sources_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Pure calculation function: processes a list of channel telemetry dictionaries.
        """
        if not sources_data:
            return {
                "channels": [],
                "total_visitors": 0,
                "total_registrations": 0,
                "blended_conversion_rate": 0.0,
                "paid_registrations": 0,
                "organic_registrations": 0,
                "paid_share_percent": 0.0,
                "organic_share_percent": 0.0,
                "top_performing_channel": None,
            }

        ranked_channels = calculate_channel_performance(sources_data)

        total_visitors = sum(c["visitors"] for c in ranked_channels)
        total_regs = sum(c["registrations"] for c in ranked_channels)
        blended_conv = calculate_conversion_rate(total_regs, total_visitors)

        # Distinguish paid/incentivized vs organic
        paid_regs = sum(c["registrations"] for c in ranked_channels if c["spend_inr"] > 0)
        organic_regs = total_regs - paid_regs

        paid_share = round((paid_regs / max(total_regs, 1)) * 100.0, 1) if total_regs > 0 else 0.0
        organic_share = round((organic_regs / max(total_regs, 1)) * 100.0, 1) if total_regs > 0 else 0.0

        top_channel = ranked_channels[0]["source"] if ranked_channels else None

        return {
            "channels": ranked_channels,
            "total_visitors": total_visitors,
            "total_registrations": total_regs,
            "blended_conversion_rate": blended_conv,
            "paid_registrations": paid_regs,
            "organic_registrations": organic_regs,
            "paid_share_percent": paid_share,
            "organic_share_percent": organic_share,
            "top_performing_channel": top_channel,
        }

    @classmethod
    def from_db(cls, db: Session) -> Dict[str, Any]:
        """
        Extracts channel records and actual registrations from database tables.
        """
        sources = db.query(CampaignSource).all()
        raw_sources = []

        for s in sources:
            # Count actual registrations attributed to this campaign source
            actual_regs = db.query(func.count(Registration.id)).filter(
                Registration.campaign_source_id == s.id
            ).scalar() or 0

            # Verified final-year students
            verified_count = db.query(func.count(Registration.id)).join(
                Student, Registration.student_id == Student.id
            ).filter(
                Registration.campaign_source_id == s.id,
                Student.is_final_year.is_(True)
            ).scalar() or 0

            raw_sources.append({
                "source": s.source_name,
                "utm_source": s.utm_source,
                "visitors": s.clicks_count,
                "registrations": max(actual_regs, s.conversions_count),
                "verified_final_year": verified_count,
                "spend_inr": s.budget_allocated_inr,
            })

        return cls.analyze_channels(raw_sources)
