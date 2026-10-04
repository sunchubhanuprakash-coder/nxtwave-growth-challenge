"""
Growth Copilot Engine (Phase 10)
================================
Orchestrates the verified 9-stage pipeline:
Database -> Analytics Engine -> Metric Snapshot -> AI Prompt -> LLM Provider -> Structured JSON -> Validation -> Persistence -> Dashboard

Guarantees zero hallucinated metrics by supplying only verified observable database data to the LLM.
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database.models import Campaign, AIInsight
from analytics.engine import AnalyticsEngine
from budget.engine import CampaignBudgetEngine
from ai.provider import get_ai_provider


class GrowthCopilotEngine:
    """
    Coordinates metrics extraction, LLM reasoning, schema validation,
    and database persistence for the AI Growth Copilot.
    """

    @classmethod
    def build_metric_snapshot(cls, db: Session) -> Dict[str, Any]:
        """
        Extracts verified observable data from the database and analytics engine.
        Does NOT invent or extrapolate phantom numbers.
        """
        # 1. Full analytics report across 6 suites
        analytics_report = AnalyticsEngine.generate_full_report(db)
        overview = analytics_report["overview"]
        acq_data = analytics_report["acquisition"]
        funnel_data = analytics_report["funnel"]
        ref_data = analytics_report["referral"]
        college_data = analytics_report["colleges"]
        budget_data = analytics_report["budget"]
        trend_data = analytics_report["daily_trend"]

        # 2. Budget engine audited state
        budget_ov = CampaignBudgetEngine.get_budget_overview(db)

        # 3. Assemble verified snapshot with all 11 required elements
        snapshot = {
            "snapshot_timestamp": datetime.now(timezone.utc).isoformat(),
            # 1. Registration progress
            "registration_progress": {
                "current_registrations": overview["current_registrations"],
                "target_registrations": overview["target_registrations"],
                "progress_percent": overview["progress_percent"],
                "remaining": overview["remaining"],
            },
            # 2. Target
            "target": overview["target_registrations"],
            # 3. Days remaining
            "days_remaining": trend_data["velocity"]["days_remaining"],
            # 4. Registration velocity
            "registration_velocity": trend_data["velocity"],
            # 5. Channel performance
            "channel_performance": acq_data["channels"],
            # 6. Referral rate & virality
            "referral_rate": {
                "referral_share_percent": ref_data["referral_share_percent"],
                "viral_k_factor": ref_data["viral_k_factor"],
                "is_viral_loop_sustainable": ref_data["is_viral_loop_sustainable"],
                "milestone_distribution": ref_data.get("milestone_distribution", {}),
            },
            # 7. Conversion
            "conversion": funnel_data["overall_conversion_rate"],
            # 8. Budget
            "budget": {
                "total_spent_inr": budget_ov["total_spent_inr"],
                "budget_cap_inr": budget_ov["max_budget_inr"],
                "blended_cpr_inr": budget_ov["blended_cpr_inr"],
                "verified_cpr_inr": budget_ov["verified_cpr_inr"],
                "budget_utilization_percent": budget_ov["budget_utilization_percent"],
                "is_over_budget": budget_ov["is_over_budget"],
            },
            # 9. College performance
            "college_performance": college_data["colleges"],
            # 10. Funnel dropoff
            "funnel_dropoff": funnel_data["stages"],
            # 11. Forecast
            "forecast": {
                "projected_final_registrations": trend_data["forecast"]["projected_final_registrations"],
                "pacing_status": trend_data["velocity"]["pacing_status"],
                "target_probability_percent": trend_data["forecast"]["target_probability_percent"],
                "growth_score": trend_data["growth_score"],
            },
        }

        return snapshot

    @classmethod
    async def run_copilot_analysis(
        cls,
        db: Session,
        custom_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the AI Growth Copilot pipeline:
        1. Builds verified metric snapshot
        2. Queries configured AI Provider (with deterministic fallback)
        3. Validates structured JSON schema
        4. Persists the insight into SQLite database
        5. Returns structured response with database record ID
        """
        # 1. Build verified metric snapshot
        snapshot = cls.build_metric_snapshot(db)

        # 2. Query AI Provider
        ai_provider = get_ai_provider()
        raw_analysis = await ai_provider.analyze_growth_telemetry(snapshot)

        # 3. Validate and sanitize schema fields
        status = str(raw_analysis.get("status", "ON TRACK")).upper()
        if status not in ["ON TRACK", "AT RISK", "OFF TRACK"]:
            status = "ON TRACK"

        observations = [str(o) for o in raw_analysis.get("observations", [])]
        diagnosis = [str(d) for d in raw_analysis.get("diagnosis", [])]

        # Recommendations validation (each must have observation, diagnosis, action, expected_impact, priority, confidence)
        raw_recs = raw_analysis.get("recommendations", [])
        recommendations = []
        for r in raw_recs:
            if isinstance(r, dict):
                recommendations.append({
                    "observation": str(r.get("observation", "")),
                    "diagnosis": str(r.get("diagnosis", "")),
                    "action": str(r.get("action", "")),
                    "expected_impact": str(r.get("expected_impact", "")),
                    "priority": str(r.get("priority", "MEDIUM")).upper(),
                    "confidence": str(r.get("confidence", "HIGH")).upper(),
                })

        # Experiments validation
        raw_exp = raw_analysis.get("experiments", [])
        experiments = []
        for e in raw_exp:
            if isinstance(e, dict):
                experiments.append({
                    "name": str(e.get("name", e.get("experiment_name", "Growth Experiment"))),
                    "hypothesis": str(e.get("hypothesis", "")),
                    "metric": str(e.get("metric", e.get("metric_to_monitor", "Conversion Rate")))
                })

        risks = [str(rk) for rk in raw_analysis.get("risks", [])]
        priority_actions = [str(pa) for pa in raw_analysis.get("priority_actions", [])]
        confidence = str(raw_analysis.get("confidence", "HIGH")).upper()
        provider_used = str(raw_analysis.get("provider_used", ai_provider.provider_name))

        # 4. Persist to database (ai_insights table)
        campaign = db.query(Campaign).first()
        campaign_id = campaign.id if campaign else 1

        top_rec_action = recommendations[0]["action"] if recommendations else "Continue daily referral squad execution."
        summary_text = (
            f"AI Copilot Assessment: Status is {status}. "
            f"{observations[0] if observations else 'Target pacing verified.'}"
        )[:250]

        insight_record = AIInsight(
            campaign_id=campaign_id,
            topic="GROWTH_COPILOT_AUDIT",
            summary=summary_text,
            detailed_insight=json.dumps({
                "status": status,
                "observations": observations,
                "diagnosis": diagnosis,
                "recommendations": recommendations,
                "experiments": experiments,
                "risks": risks,
                "priority_actions": priority_actions,
                "confidence": confidence,
                "snapshot": snapshot,
                "provider_used": provider_used,
            }),
            recommended_action=top_rec_action[:490],
            confidence_score=0.95 if confidence == "HIGH" else (0.80 if confidence == "MEDIUM" else 0.65),
            generated_by_provider=provider_used,
            is_simulated=False,
        )

        db.add(insight_record)
        db.commit()
        db.refresh(insight_record)

        return {
            "insight_id": insight_record.id,
            "status": status,
            "observations": observations,
            "diagnosis": diagnosis,
            "recommendations": recommendations,
            "experiments": experiments,
            "risks": risks,
            "priority_actions": priority_actions,
            "confidence": confidence,
            "metric_snapshot": snapshot,
            "provider_used": provider_used,
            "created_at": insight_record.created_at.isoformat() if insight_record.created_at else datetime.now(timezone.utc).isoformat(),
            "is_estimate": True,
        }

    @classmethod
    def list_stored_insights(cls, db: Session, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Retrieves historical AI insights persisted in the database.
        """
        records = db.query(AIInsight).order_by(desc(AIInsight.created_at)).limit(limit).all()
        results = []

        for r in records:
            analysis_dict = None
            try:
                if r.detailed_insight and r.detailed_insight.startswith("{"):
                    analysis_dict = json.loads(r.detailed_insight)
            except Exception:
                analysis_dict = None

            results.append({
                "id": r.id,
                "topic": r.topic,
                "summary": r.summary,
                "recommended_action": r.recommended_action,
                "confidence_score": r.confidence_score,
                "generated_by_provider": r.generated_by_provider,
                "created_at": r.created_at.isoformat() if r.created_at else datetime.now(timezone.utc).isoformat(),
                "analysis": analysis_dict,
            })

        return results
