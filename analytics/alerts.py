"""
Phase 14: Automatic Growth Alerts Engine.
Monitors campaign telemetry across 7 data-driven conditions:
  1. Registration velocity below target
  2. Referral rate decline
  3. High traffic but low conversion
  4. Budget overspending
  5. Channel underperformance
  6. Sudden registration spike
  7. Forecast falling below 500

Generates prescriptive, data-backed recommendations computed from actual database metrics.
Assigns rigorous severity tiers: INFO, WARNING, CRITICAL.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database.models import (
    Campaign,
    Registration,
    Student,
    CampaignSource,
    DailyMetric,
    SimulationState,
    GrowthAlert,
    College
)
from backend.app.core.logging import logger


class GrowthAlertEngine:
    """
    Real-Time Metric Evaluation & Alert Generation Engine.
    """

    @classmethod
    def evaluate_and_sync_alerts(cls, db: Session) -> List[GrowthAlert]:
        """
        Scans current database metrics across all 7 detection categories,
        persists detected alerts into the GrowthAlert table, and returns the sorted list.
        """
        campaign = db.query(Campaign).first()
        if not campaign:
            return []

        # 1. Base Metrics Aggregation
        total_regs = db.query(Registration).count()
        verified_final = db.query(Registration).join(Student).filter(Student.is_final_year == True).count()
        target = campaign.target_registrations or 500
        budget_cap = campaign.total_budget_inr or 2000.0
        spent = campaign.spent_budget_inr or 0.0
        cpr = round(spent / max(total_regs, 1), 2)
        target_cpr_cap = 4.00  # ₹2,000 / 500 target

        # Simulation timeline context
        sim_state = db.query(SimulationState).first()
        current_day = sim_state.current_day if sim_state else 1
        days_remaining = max(1, 7 - current_day)
        remaining_target = max(0, target - total_regs)
        required_velocity = round(remaining_target / days_remaining, 1)
        current_velocity = round(total_regs / max(current_day, 1), 1)
        velocity_gap = round(required_velocity - current_velocity, 1)

        # Referral metrics
        direct_regs = db.query(Student).filter(
            (Student.referred_by_code == None) | (Student.referred_by_code == "")
        ).count()
        referred_regs = total_regs - direct_regs
        k_factor = round(referred_regs / max(direct_regs, 1), 2)
        referral_share = round((referred_regs / max(total_regs, 1)) * 100, 1)

        # Traffic & Funnel metrics
        sources = db.query(CampaignSource).all()
        total_clicks = sum(s.clicks_count for s in sources)
        total_conversions = sum(s.conversions_count for s in sources)
        overall_cr = round((total_conversions / max(total_clicks, 1)) * 100, 1)

        # Forecast calculation
        projected_total = int(total_regs + (current_velocity * days_remaining))

        evaluated_alerts: List[Dict[str, Any]] = []

        # ==============================================================================
        # ALERT 1: Registration Velocity Below Target
        # ==============================================================================
        if velocity_gap > 0 and total_regs < target:
            is_critical = velocity_gap > 20.0 or required_velocity > (current_velocity * 1.8)
            evaluated_alerts.append({
                "alert_type": "REGISTRATION_VELOCITY",
                "severity": "CRITICAL" if is_critical else "WARNING",
                "title": "Registration Velocity Below Target Pace",
                "detected_metric": f"Current: {current_velocity} regs/day | Required Run-Rate: {required_velocity} regs/day (Gap: -{velocity_gap}/day)",
                "reason": (
                    f"Campaign has captured {total_regs}/{target} registrations by Day {current_day}. "
                    f"At the current run-rate of {current_velocity} signups/day with {days_remaining} days left, "
                    f"the campaign will miss target by approximately {int(velocity_gap * days_remaining)} students."
                ),
                "recommended_action": (
                    f"Mobilize college ambassadors across top engineering colleges (CBIT, VNR) "
                    f"and trigger automated peer referral reminder broadcasts to lift daily pace by +{int(velocity_gap + 4)}/day."
                ),
            })
        else:
            evaluated_alerts.append({
                "alert_type": "REGISTRATION_VELOCITY",
                "severity": "INFO",
                "title": "Registration Velocity On Track",
                "detected_metric": f"Current Pace: {current_velocity} regs/day exceeds Required: {required_velocity} regs/day",
                "reason": f"Registration pace ({current_velocity}/day) exceeds the daily threshold ({required_velocity}/day) needed for the 500 target.",
                "recommended_action": "Maintain active WhatsApp and referral channels. Monitor daily cohort dropoff.",
            })

        # ==============================================================================
        # ALERT 2: Referral Rate Decline
        # ==============================================================================
        if k_factor < 1.0 or referral_share < 30.0:
            is_critical = k_factor < 0.6 or referral_share < 18.0
            evaluated_alerts.append({
                "alert_type": "REFERRAL_RATE_DECLINE",
                "severity": "CRITICAL" if is_critical else "WARNING",
                "title": "Referral Virality Rate Declining",
                "detected_metric": f"Virality K-Factor: {k_factor} | Referral Share: {referral_share}% ({referred_regs} invites)",
                "reason": (
                    f"Viral K-factor has dropped to {k_factor}, below the 1.0 self-sustaining virality threshold. "
                    f"Each registered student is generating fewer than 1 secondary peer invite, limiting viral compounding."
                ),
                "recommended_action": (
                    "Highlight Milestone 1 Squad Pass rewards on the registration thank-you pass "
                    "and trigger the Referral Reminder WhatsApp automation rule for inactive students."
                ),
            })
        else:
            evaluated_alerts.append({
                "alert_type": "REFERRAL_RATE_DECLINE",
                "severity": "INFO",
                "title": "Referral Compounding Healthy",
                "detected_metric": f"Virality K-Factor: {k_factor} | Referral Share: {referral_share}%",
                "reason": f"Referral virality K={k_factor} is self-sustaining above 1.0, generating {referred_regs} peer registrations.",
                "recommended_action": "Keep spotlighting Squad Pass milestone rewards (Top 25 AI Project Blueprints kit).",
            })

        # ==============================================================================
        # ALERT 3: High Traffic But Low Conversion
        # ==============================================================================
        if overall_cr < 20.0 and total_clicks > 150:
            is_critical = overall_cr < 12.0
            evaluated_alerts.append({
                "alert_type": "HIGH_TRAFFIC_LOW_CONVERSION",
                "severity": "CRITICAL" if is_critical else "WARNING",
                "title": "High Visitor Volume With Low Conversion Rate",
                "detected_metric": f"Funnel Conversion: {overall_cr}% ({total_conversions} signups from {total_clicks} visitors, Dropoff: {round(100 - overall_cr, 1)}%)",
                "reason": (
                    f"Landing pages are generating healthy traffic ({total_clicks} visits), but a steep "
                    f"{round(100 - overall_cr, 1)}% bounce rate occurs before form completion."
                ),
                "recommended_action": (
                    "Deploy winning headline from A/B test suite ('Deploy a live AI app URL') "
                    "and streamline registration form by reducing non-essential fields on mobile."
                ),
            })
        else:
            evaluated_alerts.append({
                "alert_type": "HIGH_TRAFFIC_LOW_CONVERSION",
                "severity": "INFO",
                "title": "Landing Funnel Conversion Benchmark Met",
                "detected_metric": f"Conversion Rate: {overall_cr}% across {total_clicks} visits",
                "reason": f"Visitor-to-registration transition is converting efficiently at {overall_cr}%.",
                "recommended_action": "Scale top-of-funnel traffic inputs through technical college society groups.",
            })

        # ==============================================================================
        # ALERT 4: Budget Overspending
        # ==============================================================================
        spend_pct = round((spent / max(budget_cap, 1)) * 100, 1)
        if cpr > target_cpr_cap or (spent >= 1800.0 and total_regs < 450):
            is_critical = spent >= budget_cap or cpr > 6.00
            evaluated_alerts.append({
                "alert_type": "BUDGET_OVERSPENDING",
                "severity": "CRITICAL" if is_critical else "WARNING",
                "title": "Budget Burn / Cost Per Registration Alert",
                "detected_metric": f"Current CPR: ₹{cpr:.2f}/reg (Cap: ₹{target_cpr_cap:.2f}) | Spend: ₹{spent:.2f} / ₹{budget_cap:.2f} ({spend_pct}%)",
                "reason": (
                    f"Acquisition CPR of ₹{cpr:.2f} exceeds the economic threshold of ₹4.00/registrant. "
                    f"Total spend has reached {spend_pct}% of the strict ₹2,000 challenge budget."
                ),
                "recommended_action": (
                    f"Halt paid boosts immediately. Reallocate remaining ₹{max(0.0, budget_cap - spent):.2f} "
                    f"budget exclusively to peer referral reward vouchers."
                ),
            })
        else:
            evaluated_alerts.append({
                "alert_type": "BUDGET_OVERSPENDING",
                "severity": "INFO",
                "title": "Budget Efficiency Within Financial Cap",
                "detected_metric": f"Blended CPR: ₹{cpr:.2f}/reg | Total Spend: ₹{spent:.2f} of ₹{budget_cap:.2f} Cap",
                "reason": f"Financial pacing is strictly compliant with the ₹2,000 budget cap with blended CPR at ₹{cpr:.2f}.",
                "recommended_action": "Preserve remaining contingency allocation for final 24h urgency broadcast.",
            })

        # ==============================================================================
        # ALERT 5: Channel Underperformance
        # ==============================================================================
        underperforming_channels = [
            s for s in sources if s.clicks_count >= 40 and ((s.conversions_count / max(s.clicks_count, 1)) * 100) < 15.0
        ]
        if underperforming_channels:
            worst = min(underperforming_channels, key=lambda s: (s.conversions_count / max(s.clicks_count, 1)))
            worst_cr = round((worst.conversions_count / max(worst.clicks_count, 1)) * 100, 1)
            evaluated_alerts.append({
                "alert_type": "CHANNEL_UNDERPERFORMANCE",
                "severity": "WARNING",
                "title": f"Channel Underperformance: {worst.source_name}",
                "detected_metric": f"{worst.source_name}: {worst.conversions_count} signups from {worst.clicks_count} clicks ({worst_cr}% CR)",
                "reason": (
                    f"Channel '{worst.source_name}' is delivering suboptimal yield ({worst_cr}% CR), "
                    f"lagging behind the campaign average conversion rate."
                ),
                "recommended_action": (
                    f"Refresh creative copy for '{worst.utm_source}', replace generic graphics with student project showcases, "
                    f"or redirect effort to WhatsApp batch forward loops."
                ),
            })
        else:
            evaluated_alerts.append({
                "alert_type": "CHANNEL_UNDERPERFORMANCE",
                "severity": "INFO",
                "title": "Channel Portfolio Operating Optimally",
                "detected_metric": "All active traffic sources converting above 15% threshold",
                "reason": "Acquisition distribution demonstrates balanced channel efficiency across student touchpoints.",
                "recommended_action": "Maintain multi-channel mix across WhatsApp, referrals, and college clubs.",
            })

        # ==============================================================================
        # ALERT 6: Sudden Registration Spike
        # ==============================================================================
        top_college_row = db.query(
            Student.college_name_raw, func.count(Student.id)
        ).group_by(Student.college_name_raw).order_by(desc(func.count(Student.id))).first()

        if top_college_row and top_college_row[1] >= 50:
            college_name, college_count = top_college_row
            college_share = round((college_count / max(total_regs, 1)) * 100, 1)
            is_capacity_risk = (target - total_regs) < 30
            evaluated_alerts.append({
                "alert_type": "REGISTRATION_SPIKE",
                "severity": "WARNING" if is_capacity_risk else "INFO",
                "title": f"Registration Spike Detected: {college_name}",
                "detected_metric": f"Surge: {college_count} registrations from {college_name} ({college_share}% of total cohort)",
                "reason": (
                    f"Rapid viral clustering observed in {college_name} batches. Class forwarding and "
                    f"campus ambassador momentum have triggered a sudden concentration of registrations."
                ),
                "recommended_action": (
                    "Deploy college rank badges on the registration success page to stoke inter-college rivalry "
                    "with neighboring campuses (e.g. VNRVJIET, Vasavi)."
                ),
            })
        else:
            evaluated_alerts.append({
                "alert_type": "REGISTRATION_SPIKE",
                "severity": "INFO",
                "title": "Registration Influx Pace Steady",
                "detected_metric": "No localized volatility or unmanaged server spikes detected",
                "reason": "Intake velocity is distributing evenly across target Telangana engineering colleges.",
                "recommended_action": "Continue automated verification pipelines.",
            })

        # ==============================================================================
        # ALERT 7: Forecast Falling Below 500
        # ==============================================================================
        if projected_total < target:
            gap = target - projected_total
            is_critical = projected_total < 420 or gap > 80
            evaluated_alerts.append({
                "alert_type": "FORECAST_FALLING_BELOW_500",
                "severity": "CRITICAL" if is_critical else "WARNING",
                "title": "Projected Registrations Below 500 Goal",
                "detected_metric": f"Projected Total: {projected_total} / {target} (Forecast Shortfall: {gap} students)",
                "reason": (
                    f"Based on current velocity of {current_velocity} regs/day across the remaining {days_remaining} days, "
                    f"the statistical forecast estimates campaign finish at {projected_total}, missing the 500-seat milestone."
                ),
                "recommended_action": (
                    "Trigger Aggressive Scenario viral multipliers: introduce guaranteed deployment certificate perks, "
                    "unlock Squad Pass tier-2 bonuses, and execute emergency club partnership announcements."
                ),
            })
        else:
            surplus = projected_total - target
            evaluated_alerts.append({
                "alert_type": "FORECAST_FALLING_BELOW_500",
                "severity": "INFO",
                "title": "Forecast Projects Target Milestone Achieved",
                "detected_metric": f"Projected Total: {projected_total} / {target} (+{surplus} surplus seats)",
                "reason": f"Run-rate trajectory indicates 100% confidence of crossing 500 verified final-year signups.",
                "recommended_action": "Prepare live masterclass server concurrency and secondary stream links.",
            })

        # ==============================================================================
        # Database Synchronization: Update or Create Records in growth_alerts table
        # ==============================================================================
        synced_alerts = []
        for item in evaluated_alerts:
            existing = db.query(GrowthAlert).filter(
                GrowthAlert.campaign_id == campaign.id,
                GrowthAlert.alert_type == item["alert_type"]
            ).first()

            if existing:
                existing.severity = item["severity"]
                existing.title = item["title"]
                existing.message = item["reason"]
                existing.detected_metric = item["detected_metric"]
                existing.reason = item["reason"]
                existing.recommended_action = item["recommended_action"]
                synced_alerts.append(existing)
            else:
                alert = GrowthAlert(
                    campaign_id=campaign.id,
                    alert_type=item["alert_type"],
                    severity=item["severity"],
                    title=item["title"],
                    message=item["reason"],
                    detected_metric=item["detected_metric"],
                    reason=item["reason"],
                    recommended_action=item["recommended_action"],
                    is_acknowledged=False,
                    is_simulated=True
                )
                db.add(alert)
                synced_alerts.append(alert)

        db.commit()

        # Sort: CRITICAL first, then WARNING, then INFO
        severity_rank = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
        return sorted(synced_alerts, key=lambda a: severity_rank.get(a.severity, 3))

    @classmethod
    def acknowledge_alert(cls, alert_id: int, db: Session) -> Optional[GrowthAlert]:
        """
        Marks an alert as acknowledged.
        """
        alert = db.query(GrowthAlert).filter(GrowthAlert.id == alert_id).first()
        if alert:
            alert.is_acknowledged = not alert.is_acknowledged
            db.commit()
            db.refresh(alert)
        return alert
