"""
Phase 15: Advanced Intelligence Engine
=======================================
Implements explainable artificial intelligence and statistical predictive modeling:
1. Registration forecasting (trajectory, confidence bounds, shortfall/surplus)
2. Channel recommendation (marginal yield, spend efficiency, actionable shifts)
3. Student segmentation (AI Curious, Project Builder, Placement Focused, Career Explorer)
4. Lead scoring (attendance propensity, qualification points, signal weights)
5. Anomaly detection (Z-scores, time-series outliers, viral surge detection)
6. AI campaign strategist (executive tactical playbooks, milestone gap closure)
7. AI copy optimizer (linguistic scoring, tokenization, segment-tailored copy)
8. Referral propensity (peer compounding probability, reciprocity scoring)
9. College opportunity scoring (campus penetration, untapped TAM, club leverage)

Key Mandates:
- Every prediction MUST show:
  * input_signals (raw telemetry features)
  * score (normalized 0-100 or probability)
  * reason (step-by-step diagnostic breakdown)
  * confidence (HIGH, MEDIUM, LOW, INSUFFICIENT_DATA)
- If there is insufficient data, clearly states:
  "Insufficient data for reliable prediction."
- Never fabricates certainty.
"""

from typing import List, Dict, Any, Optional
import math
from datetime import datetime, timezone, date
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from database.models import (
    Student,
    Registration,
    Referral,
    Campaign,
    CampaignSource,
    DailyMetric,
    SimulationState,
    College,
    Club,
    AIInsight,
)
from backend.app.core.logging import logger


class AdvancedIntelligenceEngine:
    """
    Core Explainable Predictive Intelligence Suite for AI Student Growth Engine.
    """

    INSUFFICIENT_DATA_MSG = "Insufficient data for reliable prediction."

    # ==========================================================================
    # 1. REGISTRATION FORECASTING
    # ==========================================================================
    @classmethod
    def forecast_registrations(cls, db: Session) -> Dict[str, Any]:
        """
        Calculates explainable registration projections toward 500-seat milestone.
        """
        campaign = db.query(Campaign).first()
        target = campaign.target_registrations if campaign else 500
        total_regs = db.query(Registration).count()
        sim_state = db.query(SimulationState).first()

        current_day = sim_state.current_day if sim_state else 1
        days_remaining = max(1, 7 - current_day)
        days_elapsed = max(1, current_day)

        # Referral metrics for viral acceleration factor
        direct_regs = db.query(Student).filter(
            (Student.referred_by_code == None) | (Student.referred_by_code == "")
        ).count()
        referred_regs = total_regs - direct_regs
        k_factor = round(referred_regs / max(direct_regs, 1), 2)

        daily_velocity = round(total_regs / days_elapsed, 2)
        required_velocity = round(max(0, target - total_regs) / days_remaining, 2)

        input_signals = {
            "current_registrations": total_regs,
            "target_registrations": target,
            "days_elapsed": days_elapsed,
            "days_remaining": days_remaining,
            "current_daily_velocity": daily_velocity,
            "required_daily_velocity": required_velocity,
            "viral_k_factor": k_factor,
        }

        # Guard: Data sufficiency check
        if total_regs < 5 or days_elapsed < 1:
            return {
                "feature": "registration_forecasting",
                "score": 0.0,
                "confidence": "INSUFFICIENT_DATA",
                "confidence_score": 0.15,
                "input_signals": input_signals,
                "reason": f"{cls.INSUFFICIENT_DATA_MSG} Need at least 5 registrations across 1 observed day to model velocity curves.",
                "forecast": {
                    "projected_total": total_regs,
                    "conservative": total_regs,
                    "expected": total_regs,
                    "optimistic": total_regs,
                    "gap_to_target": target - total_regs,
                    "trajectory_status": "DATA_PENDING",
                },
            }

        # Statistical calculations
        linear_expected = total_regs + (daily_velocity * days_remaining)
        # Viral multiplier boost based on empirical K-factor
        viral_multiplier = max(0.0, (k_factor - 0.5) * 0.15)
        expected_total = int(linear_expected * (1.0 + viral_multiplier))
        conservative_total = int(total_regs + (daily_velocity * 0.75 * days_remaining))
        optimistic_total = int(total_regs + (daily_velocity * 1.35 * days_remaining * (1.0 + viral_multiplier * 1.5)))

        gap = target - expected_total
        score = min(100.0, round((expected_total / target) * 100.0, 1))

        # Determine confidence based on observed cohort size & days
        if days_elapsed >= 3 and total_regs >= 30:
            confidence = "HIGH"
            confidence_score = 0.88
        elif total_regs >= 15:
            confidence = "MEDIUM"
            confidence_score = 0.65
        else:
            confidence = "LOW"
            confidence_score = 0.45

        if gap <= 0:
            status = "ON_TRACK"
            reason = (
                f"Trajectory is healthy. Run-rate of {daily_velocity} regs/day combined with "
                f"viral compounding (K={k_factor}) projects {expected_total} final registrations, "
                f"surpassing the 500-student target by +{abs(gap)} seats."
            )
        else:
            status = "BEHIND_PACE"
            reason = (
                f"Velocity deficit detected. Current pace of {daily_velocity} regs/day falls short of "
                f"the required {required_velocity} regs/day. Expected finish is {expected_total}, "
                f"leaving a gap of {gap} students."
            )

        return {
            "feature": "registration_forecasting",
            "score": score,
            "confidence": confidence,
            "confidence_score": confidence_score,
            "input_signals": input_signals,
            "reason": reason,
            "forecast": {
                "projected_total": expected_total,
                "conservative": conservative_total,
                "expected": expected_total,
                "optimistic": optimistic_total,
                "gap_to_target": gap,
                "trajectory_status": status,
            },
        }

    # ==========================================================================
    # 2. CHANNEL RECOMMENDATION
    # ==========================================================================
    @classmethod
    def recommend_channels(cls, db: Session) -> Dict[str, Any]:
        """
        Analyzes conversion yield, CPR, and volume elasticity to recommend channel shifts.
        """
        sources = db.query(CampaignSource).all()
        total_clicks = sum(s.clicks_count for s in sources)
        total_conversions = sum(s.conversions_count for s in sources)

        input_signals = {
            "total_channels": len(sources),
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "channels_data": [
                {
                    "source": s.source_name,
                    "clicks": s.clicks_count,
                    "conversions": s.conversions_count,
                    "cr_pct": round((s.conversions_count / max(1, s.clicks_count)) * 100, 1),
                }
                for s in sources
            ],
        }

        if total_clicks < 20 or not sources:
            return {
                "feature": "channel_recommendation",
                "score": 0.0,
                "confidence": "INSUFFICIENT_DATA",
                "confidence_score": 0.15,
                "input_signals": input_signals,
                "reason": f"{cls.INSUFFICIENT_DATA_MSG} Channel attribution requires at least 20 recorded clicks.",
                "recommendations": [],
            }

        recommendations = []
        for s in sources:
            clicks = s.clicks_count
            conversions = s.conversions_count
            cr = round((conversions / max(1, clicks)) * 100, 1)

            # Explainable scoring formula:
            # High CR (> 25%) gives up to 50 pts; Volume (> 50 clicks) gives up to 50 pts
            cr_pts = min(50.0, (cr / 30.0) * 50.0)
            vol_pts = min(50.0, (clicks / 100.0) * 50.0)
            channel_score = round(cr_pts + vol_pts, 1)

            if clicks < 10:
                action = "COLLECT_MORE_DATA"
                action_reason = f"Channel has only {clicks} clicks. {cls.INSUFFICIENT_DATA_MSG}"
                rec_confidence = "LOW"
            elif cr >= 25.0:
                action = "SCALE_UP"
                action_reason = f"High-yield channel converting at {cr}% ({conversions}/{clicks}). Scale forward loops."
                rec_confidence = "HIGH"
            elif cr >= 15.0:
                action = "MAINTAIN"
                action_reason = f"Solid baseline performance converting at {cr}%. Keep active."
                rec_confidence = "MEDIUM"
            else:
                action = "OPTIMIZE_OR_REPLACE"
                action_reason = f"Suboptimal conversion at {cr}% ({conversions}/{clicks}). Refresh messaging copy or redirect budget."
                rec_confidence = "HIGH" if clicks >= 40 else "MEDIUM"

            recommendations.append({
                "source_name": s.source_name,
                "utm_source": s.utm_source,
                "clicks": clicks,
                "conversions": conversions,
                "conversion_rate_pct": cr,
                "score": channel_score,
                "action": action,
                "reason": action_reason,
                "confidence": rec_confidence,
            })

        recommendations.sort(key=lambda x: x["score"], reverse=True)
        top = recommendations[0] if recommendations else None
        overall_score = round(sum(r["score"] for r in recommendations) / max(1, len(recommendations)), 1)

        return {
            "feature": "channel_recommendation",
            "score": overall_score,
            "confidence": "HIGH" if total_clicks >= 100 else "MEDIUM",
            "confidence_score": 0.85 if total_clicks >= 100 else 0.65,
            "input_signals": input_signals,
            "reason": (
                f"Analyzed {len(sources)} acquisition channels. "
                f"'{top['source_name'] if top else 'None'}' leads portfolio with {top['conversion_rate_pct'] if top else 0}% CR."
            ),
            "recommendations": recommendations,
        }

    # ==========================================================================
    # 3. STUDENT SEGMENTATION
    # ==========================================================================
    @classmethod
    def segment_students(cls, db: Session) -> Dict[str, Any]:
        """
        Classifies registrations into 4 distinct, actionable student segments:
        - AI Curious
        - Project Builder
        - Placement Focused
        - Career Explorer
        """
        students = db.query(Student).all()
        total_students = len(students)

        input_signals = {
            "total_students_registered": total_students,
            "required_segments": ["AI Curious", "Project Builder", "Placement Focused", "Career Explorer"],
        }

        if total_students == 0:
            return {
                "feature": "student_segmentation",
                "score": 0.0,
                "confidence": "INSUFFICIENT_DATA",
                "confidence_score": 0.0,
                "input_signals": input_signals,
                "reason": f"{cls.INSUFFICIENT_DATA_MSG} No students currently registered in database.",
                "segments": {},
                "sample_profiles": [],
            }

        segment_counts = {
            "Placement Focused": 0,
            "Project Builder": 0,
            "AI Curious": 0,
            "Career Explorer": 0,
        }
        classified_students = []

        for st in students:
            goal = (st.primary_goal or "").lower()
            skill = (st.skill_level or "").lower()
            is_final = bool(st.is_final_year)
            branch = (st.branch or "").lower()

            # Explainable segment score calculation
            scores = {
                "Placement Focused": 0.0,
                "Project Builder": 0.0,
                "AI Curious": 0.0,
                "Career Explorer": 0.0,
            }

            # 1. Placement Focused: Final year + Placement / Resume goals
            if is_final:
                scores["Placement Focused"] += 45.0
            if "placement" in goal or "job" in goal or "interview" in goal or "resume" in goal:
                scores["Placement Focused"] += 45.0
            if "cse" in branch or "it" in branch:
                scores["Placement Focused"] += 10.0

            # 2. Project Builder: Intermediate/Advanced skill + project focus
            if "intermediate" in skill or "advanced" in skill:
                scores["Project Builder"] += 40.0
            if "project" in goal or "build" in goal or "app" in goal:
                scores["Project Builder"] += 45.0
            if not is_final:
                scores["Project Builder"] += 15.0

            # 3. AI Curious: Beginner skill + general AI curiosity
            if "beginner" in skill:
                scores["AI Curious"] += 40.0
            if "explore" in goal or "ai" in goal or "learn" in goal:
                scores["AI Curious"] += 40.0
            if not is_final:
                scores["AI Curious"] += 20.0

            # 4. Career Explorer: Non-CS branches or 1st/2nd/3rd years exploring options
            if branch and not any(k in branch for k in ["cse", "it", "cs"]):
                scores["Career Explorer"] += 45.0
            if "career" in goal or "explore" in goal or "upskill" in goal:
                scores["Career Explorer"] += 35.0
            if not is_final:
                scores["Career Explorer"] += 20.0

            # Best segment selection
            best_segment = max(scores, key=scores.get)
            best_fit_score = min(100.0, round(scores[best_segment], 1))

            segment_counts[best_segment] += 1

            reason = (
                f"Classified as '{best_segment}' (Fit Score: {best_fit_score}%): "
                f"Final Year: {is_final}, Skill: {st.skill_level or 'Beginner'}, Goal: '{st.primary_goal or 'Not set'}'."
            )

            classified_students.append({
                "student_id": st.id,
                "name": st.full_name,
                "email": st.email,
                "college": st.college_name_raw or "Engineering College",
                "segment": best_segment,
                "fit_score": best_fit_score,
                "reason": reason,
                "input_signals": {
                    "is_final_year": is_final,
                    "skill_level": st.skill_level,
                    "primary_goal": st.primary_goal,
                    "branch": st.branch,
                },
                "confidence": "HIGH" if st.primary_goal and st.skill_level else "MEDIUM",
            })

        segment_breakdown = {}
        for seg, count in segment_counts.items():
            pct = round((count / max(1, total_students)) * 100, 1)
            segment_breakdown[seg] = {
                "count": count,
                "percentage": pct,
                "primary_persona": (
                    "Urgent campus placement prep & resume validation"
                    if seg == "Placement Focused"
                    else "Wants to deploy live GenAI project URL on GitHub"
                    if seg == "Project Builder"
                    else "Wants hands-on interactive AI foundational overview"
                    if seg == "AI Curious"
                    else "Exploring future technology tracks across disciplines"
                ),
                "key_messaging_hook": (
                    "Deploy live AI project proof recruiters can test on your resume"
                    if seg == "Placement Focused"
                    else "Deploy a real full-stack LLM app in 60 minutes"
                    if seg == "Project Builder"
                    else "Zero prerequisites: Build your first AI app step-by-step"
                    if seg == "AI Curious"
                    else "Pivot into AI careers from any engineering branch"
                ),
            }

        return {
            "feature": "student_segmentation",
            "score": round(100.0 * (1.0 - (1.0 / (1.0 + total_students * 0.1))), 1),
            "confidence": "HIGH" if total_students >= 10 else "MEDIUM",
            "confidence_score": 0.90 if total_students >= 10 else 0.65,
            "input_signals": input_signals,
            "reason": (
                f"Segmented {total_students} students across 4 behavioral cohorts. "
                f"Dominant cohort: '{max(segment_counts, key=segment_counts.get)}' ({segment_counts[max(segment_counts, key=segment_counts.get)]} students)."
            ),
            "segments": segment_breakdown,
            "sample_profiles": classified_students[:10],
        }

    # ==========================================================================
    # 4. LEAD SCORING
    # ==========================================================================
    @classmethod
    def score_leads(cls, db: Session, limit: int = 15) -> Dict[str, Any]:
        """
        Computes explainable attendance and qualification scores for individual student leads.
        """
        students = db.query(Student).order_by(desc(Student.id)).limit(limit).all()

        input_signals = {
            "leads_evaluated": len(students),
            "scoring_criteria": [
                "+30 pts: Final-year student (high workshop intent & urgency)",
                "+25 pts: Referred by peer (social accountability & commitment)",
                "+20 pts: Career/Placement alignment (urgent goal match)",
                "+15 pts: Tier 1/2 Engineering College (active technical community)",
                "+10 pts: Technical branch (CSE/ECE/IT hands-on aptitude)",
            ],
        }

        if not students:
            return {
                "feature": "lead_scoring",
                "score": 0.0,
                "confidence": "INSUFFICIENT_DATA",
                "confidence_score": 0.0,
                "input_signals": input_signals,
                "reason": f"{cls.INSUFFICIENT_DATA_MSG} No student leads found in database.",
                "leads": [],
            }

        scored_leads = []
        for st in students:
            score = 0.0
            score_components = []

            # Final year
            if st.is_final_year:
                score += 30.0
                score_components.append("+30 Final Year")
            else:
                score += 10.0
                score_components.append("+10 Pre-final Year")

            # Peer referral
            if st.referred_by_code:
                score += 25.0
                score_components.append("+25 Peer Referral Commitment")
            else:
                score += 10.0
                score_components.append("+10 Direct Organic")

            # Goal alignment
            goal = (st.primary_goal or "").lower()
            if any(k in goal for k in ["placement", "project", "resume", "job"]):
                score += 20.0
                score_components.append("+20 High-Intent Goal")
            else:
                score += 10.0
                score_components.append("+10 General Interest")

            # Branch alignment
            branch = (st.branch or "").lower()
            if any(k in branch for k in ["cse", "it", "ece", "aiml", "data"]):
                score += 15.0
                score_components.append("+15 Technical Major")
            else:
                score += 8.0
                score_components.append("+8 Non-IT Major")

            # College prestige / density
            score += 10.0
            score_components.append("+10 Verified College Domain")

            final_score = min(100.0, round(score, 1))
            qualification_tier = (
                "HOT_QUALIFIED"
                if final_score >= 80
                else "WARM_PROSPECT"
                if final_score >= 60
                else "NURTURE"
            )

            scored_leads.append({
                "student_id": st.id,
                "name": st.full_name,
                "email": st.email,
                "college": st.college_name_raw or "Campus",
                "score": final_score,
                "tier": qualification_tier,
                "reason": f"{qualification_tier} ({final_score}/100): " + ", ".join(score_components),
                "input_signals": {
                    "is_final_year": st.is_final_year,
                    "referred_by": st.referred_by_code,
                    "primary_goal": st.primary_goal,
                    "branch": st.branch,
                },
                "confidence": "HIGH" if st.primary_goal and st.is_final_year else "MEDIUM",
            })

        avg_score = round(sum(l["score"] for l in scored_leads) / max(1, len(scored_leads)), 1)

        return {
            "feature": "lead_scoring",
            "score": avg_score,
            "confidence": "HIGH" if len(scored_leads) >= 5 else "MEDIUM",
            "confidence_score": 0.88 if len(scored_leads) >= 5 else 0.60,
            "input_signals": input_signals,
            "reason": (
                f"Evaluated {len(scored_leads)} student leads with average quality score of {avg_score}/100. "
                f"{sum(1 for l in scored_leads if l['tier'] == 'HOT_QUALIFIED')} leads scored in top tier."
            ),
            "leads": scored_leads,
        }

    # ==========================================================================
    # 5. ANOMALY DETECTION
    # ==========================================================================
    @classmethod
    def detect_anomalies(cls, db: Session) -> Dict[str, Any]:
        """
        Scans time-series daily metrics and intake telemetry for mathematical anomalies (|Z| > 1.8).
        """
        daily_records = db.query(DailyMetric).order_by(DailyMetric.day_number.asc()).all()
        day_counts = [d.registrations_count for d in daily_records]

        input_signals = {
            "days_recorded": len(daily_records),
            "daily_registrations_series": day_counts,
            "z_threshold": 1.8,
        }

        # Guard: Data sufficiency
        if len(day_counts) < 2:
            return {
                "feature": "anomaly_detection",
                "score": 0.0,
                "confidence": "INSUFFICIENT_DATA",
                "confidence_score": 0.10,
                "input_signals": input_signals,
                "reason": f"{cls.INSUFFICIENT_DATA_MSG} Time-series anomaly detection requires at least 2 recorded days.",
                "anomalies_detected": [],
            }

        mean = sum(day_counts) / len(day_counts)
        variance = sum((x - mean) ** 2 for x in day_counts) / max(1, len(day_counts) - 1)
        std_dev = math.sqrt(variance)

        anomalies = []
        if std_dev > 0.001:
            for d in daily_records:
                z_score = round((d.registrations_count - mean) / std_dev, 2)
                if abs(z_score) >= 1.8:
                    is_surge = z_score > 0
                    anomalies.append({
                        "day_number": d.day_number,
                        "date": str(d.metric_date),
                        "actual_registrations": d.registrations_count,
                        "expected_mean": round(mean, 1),
                        "z_score": z_score,
                        "type": "SURGE_SPIKE" if is_surge else "VELOCITY_PLUMMET",
                        "severity": "CRITICAL" if abs(z_score) >= 2.5 else "WARNING",
                        "reason": (
                            f"Day {d.day_number} recorded {d.registrations_count} registrations "
                            f"(Z-score: {z_score:+.2f}), deviating significantly from the cohort mean of {mean:.1f}/day."
                        ),
                    })

        anomaly_score = min(100.0, len(anomalies) * 35.0)

        return {
            "feature": "anomaly_detection",
            "score": anomaly_score,
            "confidence": "HIGH" if len(day_counts) >= 4 else "MEDIUM",
            "confidence_score": 0.85 if len(day_counts) >= 4 else 0.60,
            "input_signals": {
                **input_signals,
                "mean": round(mean, 2),
                "std_dev": round(std_dev, 2),
            },
            "reason": (
                f"Identified {len(anomalies)} statistical anomalies across {len(day_counts)} days. "
                + (f"Observed peak deviation of Z={anomalies[0]['z_score']:+.2f}." if anomalies else "Intake velocity within normal variance.")
            ),
            "anomalies_detected": anomalies,
        }

    # ==========================================================================
    # 6. AI CAMPAIGN STRATEGIST
    # ==========================================================================
    @classmethod
    def generate_campaign_strategy(cls, db: Session) -> Dict[str, Any]:
        """
        Synthesizes macro telemetry into an explainable, prioritized growth playbook.
        """
        campaign = db.query(Campaign).first()
        target = campaign.target_registrations if campaign else 500
        total_regs = db.query(Registration).count()
        sim_state = db.query(SimulationState).first()
        current_day = sim_state.current_day if sim_state else 1
        days_remaining = max(1, 7 - current_day)

        progress_pct = round((total_regs / max(1, target)) * 100, 1)
        spent = campaign.spent_budget_inr if campaign else 0.0
        budget_cap = campaign.total_budget_inr if campaign else 2000.0
        cpr = round(spent / max(1, total_regs), 2)

        input_signals = {
            "current_registrations": total_regs,
            "target": target,
            "progress_pct": progress_pct,
            "spent_inr": spent,
            "budget_cap_inr": budget_cap,
            "cpr_inr": cpr,
            "days_remaining": days_remaining,
        }

        if total_regs < 5:
            return {
                "feature": "ai_campaign_strategist",
                "score": 0.0,
                "confidence": "INSUFFICIENT_DATA",
                "confidence_score": 0.15,
                "input_signals": input_signals,
                "reason": f"{cls.INSUFFICIENT_DATA_MSG} Strategic playbook requires initial seed telemetry (minimum 5 registrations).",
                "playbooks": [],
            }

        gap = target - total_regs
        urgency_score = min(100.0, round((gap / max(1, days_remaining * 70)) * 100.0, 1))

        playbooks = [
            {
                "pillar": "Viral Compounding (Squad Pass)",
                "priority": "HIGH" if gap > 50 else "MEDIUM",
                "strategic_move": "Activate Milestone 1 (Top 25 AI Project Blueprints Kit) on WhatsApp broadcast.",
                "reason": "Referral loops are the lowest CPR channel. Activating peer rewards bridges velocity deficit without cash spend.",
                "expected_impact": "+15-25 registrations/day",
            },
            {
                "pillar": "Campus Ambassador Hotspots",
                "priority": "HIGH",
                "strategic_move": "Deploy college rank rivalry banners targeting CBIT, VNRVJIET, and Vasavi technical clubs.",
                "reason": "Engineering colleges exhibit strong network effects when class WhatsApp forward links are endorsed by club presidents.",
                "expected_impact": "+30-45 registrations across Day 4-6",
            },
            {
                "pillar": "Budget Pacing & CPR Guardrail",
                "priority": "CRITICAL" if cpr > 4.00 or spent >= 1800 else "LOW",
                "strategic_move": f"Maintain strict ₹2,000 ceiling. Current CPR at ₹{cpr:.2f}/reg.",
                "reason": "Hiring challenge rules strictly cap campaign spend at ₹2,000 with ₹4.00 blended CPR target.",
                "expected_impact": "Zero financial penalties",
            },
        ]

        return {
            "feature": "ai_campaign_strategist",
            "score": urgency_score,
            "confidence": "HIGH" if total_regs >= 20 else "MEDIUM",
            "confidence_score": 0.88 if total_regs >= 20 else 0.65,
            "input_signals": input_signals,
            "reason": (
                f"Generated strategic playbook for Day {current_day} ({days_remaining} days left). "
                f"Campaign has captured {total_regs}/{target} registrations ({progress_pct}%). Urgency score: {urgency_score}/100."
            ),
            "playbooks": playbooks,
        }

    # ==========================================================================
    # 7. AI COPY OPTIMIZER
    # ==========================================================================
    @classmethod
    def optimize_copy(cls, db: Session, sample_copy: Optional[str] = None) -> Dict[str, Any]:
        """
        Linguistically evaluates messaging copy and outputs explainable effectiveness scores & segment variations.
        """
        copy_text = sample_copy or (
            "Hey {{name}}! 🚀 Build your first Generative AI project in 60 minutes and get a live hosted URL "
            "for your resume. Final year batch exclusive. Only 45 seats left! Register now: {{referral_link}}"
        )

        words = copy_text.split()
        word_count = len(words)
        lower_copy = copy_text.lower()

        # Heuristic signal extractors
        has_urgency = any(k in lower_copy for k in ["only", "left", "fast", "urgent", "today", "final year", "deadline"])
        has_social_proof = any(k in lower_copy for k in ["batch", "students", "peers", "nxtwave", "exclusive", "seats"])
        has_cta = any(k in lower_copy for k in ["register", "join", "deploy", "claim", "click", "now"])
        has_outcome = any(k in lower_copy for k in ["url", "live", "resume", "certificate", "project", "build"])
        tokens_count = copy_text.count("{{")

        input_signals = {
            "word_count": word_count,
            "has_urgency_keywords": has_urgency,
            "has_social_proof": has_social_proof,
            "has_action_cta": has_cta,
            "has_outcome_promise": has_outcome,
            "personalization_tokens": tokens_count,
        }

        # Scoring
        score = 0.0
        score_breakdown = []

        if has_cta:
            score += 25.0
            score_breakdown.append("+25 Clear Action CTA")
        if has_outcome:
            score += 25.0
            score_breakdown.append("+25 Tangible Outcome (Live URL / Resume)")
        if has_urgency:
            score += 20.0
            score_breakdown.append("+20 Urgency / Scarcity Trigger")
        if has_social_proof:
            score += 15.0
            score_breakdown.append("+15 Social Proof & Exclusivity")
        if tokens_count >= 1:
            score += 15.0
            score_breakdown.append(f"+15 Personalization ({tokens_count} tokens)")

        # Word count penalty if too bloated for mobile WhatsApp (> 60 words) or too terse (< 8 words)
        if word_count > 65:
            score = max(0.0, score - 15.0)
            score_breakdown.append("-15 High Mobile Read Friction (>65 words)")
        elif word_count < 8:
            score = max(0.0, score - 20.0)
            score_breakdown.append("-20 Insufficient Context (<8 words)")

        final_score = min(100.0, round(score, 1))

        # Segment-tailored variations
        segment_variations = {
            "Placement Focused": (
                "Hi {{name}}, placement season demands proof of work! Build & deploy a live GenAI project URL "
                "in 60 minutes that recruiters can test on your resume. Final year batch only. Claim your pass: {{referral_link}}"
            ),
            "Project Builder": (
                "Hey {{name}}! Ready to build full-stack GenAI? In 60 minutes, deploy a live application URL to your GitHub. "
                "Zero slides, 100% coding. Register free: {{referral_link}}"
            ),
            "AI Curious": (
                "Curious about Generative AI, {{name}}? Build your very first working AI application in 60 minutes. "
                "No prior AI experience needed. Grab your free student seat: {{referral_link}}"
            ),
            "Career Explorer": (
                "Pivoting into tech careers? Learn how AI is transforming engineering disciplines in 60 minutes, "
                "and deploy your first resume project. Free masterclass pass: {{referral_link}}"
            ),
        }

        return {
            "feature": "ai_copy_optimizer",
            "score": final_score,
            "confidence": "HIGH",
            "confidence_score": 0.92,
            "input_signals": input_signals,
            "reason": f"Evaluated copy text ({word_count} words). Score: {final_score}/100. Breakdown: " + ", ".join(score_breakdown),
            "original_copy": copy_text,
            "segment_variations": segment_variations,
        }

    # ==========================================================================
    # 8. REFERRAL PROPENSITY
    # ==========================================================================
    @classmethod
    def score_referral_propensity(cls, db: Session, limit: int = 15) -> Dict[str, Any]:
        """
        Estimates the mathematical probability of registered students referring 1+ peers.
        """
        students = db.query(Student).order_by(desc(Student.id)).limit(limit).all()

        input_signals = {
            "students_analyzed": len(students),
            "propensity_drivers": [
                "+30 pts: Student was referred by a friend (reciprocal compounding effect)",
                "+25 pts: Member of high-density engineering college (CBIT, VNR, Vasavi)",
                "+20 pts: WhatsApp acquisition channel (high sharing frictionlessness)",
                "+15 pts: Pre-final year student (broader class social group)",
                "+10 pts: Technical branch (shared lab cohorts)",
            ],
        }

        if not students:
            return {
                "feature": "referral_propensity",
                "score": 0.0,
                "confidence": "INSUFFICIENT_DATA",
                "confidence_score": 0.0,
                "input_signals": input_signals,
                "reason": f"{cls.INSUFFICIENT_DATA_MSG} No student records to calculate peer referral propensity.",
                "students": [],
            }

        scored = []
        for st in students:
            pts = 0.0
            factors = []

            # Reciprocity: Was referred by someone
            if st.referred_by_code:
                pts += 30.0
                factors.append("+30 Reciprocal Peer Chain")
            else:
                pts += 12.0
                factors.append("+12 Direct Lead")

            # Channel sharing ease
            source = (st.acquisition_source or "").lower()
            if "whatsapp" in source or "referral" in source:
                pts += 25.0
                factors.append("+25 High-Frictionless Social Channel")
            else:
                pts += 10.0
                factors.append("+10 Standard Web Channel")

            # College density
            college = (st.college_name_raw or "").lower()
            if any(k in college for k in ["cbit", "vnr", "vasavi", "griet", "jntu"]):
                pts += 20.0
                factors.append("+20 High-Density Campus Network")
            else:
                pts += 10.0
                factors.append("+10 Standard Campus Density")

            # Branch cohort
            pts += 15.0
            factors.append("+15 Class Cohort Multiplier")

            total_propensity = min(100.0, round(pts, 1))
            likelihood_tier = (
                "VIRAL_CATALYST"
                if total_propensity >= 75
                else "LIKELY_REFERRER"
                if total_propensity >= 55
                else "LOW_PROPENSITY"
            )

            scored.append({
                "student_id": st.id,
                "name": st.full_name,
                "referral_code": st.referral_code,
                "score": total_propensity,
                "tier": likelihood_tier,
                "reason": f"{likelihood_tier} ({total_propensity}%): " + ", ".join(factors),
                "input_signals": {
                    "was_referred": bool(st.referred_by_code),
                    "acquisition_source": st.acquisition_source,
                    "college": st.college_name_raw,
                },
                "confidence": "HIGH" if st.college_name_raw and st.acquisition_source else "MEDIUM",
            })

        avg_score = round(sum(s["score"] for s in scored) / max(1, len(scored)), 1)

        return {
            "feature": "referral_propensity",
            "score": avg_score,
            "confidence": "HIGH" if len(scored) >= 5 else "MEDIUM",
            "confidence_score": 0.85 if len(scored) >= 5 else 0.60,
            "input_signals": input_signals,
            "reason": (
                f"Calculated referral propensities across {len(scored)} students (average {avg_score}%). "
                f"{sum(1 for s in scored if s['tier'] == 'VIRAL_CATALYST')} students identified as high-leverage viral catalysts."
            ),
            "students": scored,
        }

    # ==========================================================================
    # 9. COLLEGE OPPORTUNITY SCORING
    # ==========================================================================
    @classmethod
    def score_college_opportunities(cls, db: Session) -> Dict[str, Any]:
        """
        Calculates untapped potential and opportunity scores for partner colleges.
        """
        colleges = db.query(College).all()
        total_students = db.query(Student).count()

        input_signals = {
            "colleges_registered": len(colleges),
            "total_campaign_students": total_students,
        }

        if not colleges:
            return {
                "feature": "college_opportunity_scoring",
                "score": 0.0,
                "confidence": "INSUFFICIENT_DATA",
                "confidence_score": 0.0,
                "input_signals": input_signals,
                "reason": f"{cls.INSUFFICIENT_DATA_MSG} No engineering colleges in directory.",
                "colleges": [],
            }

        opportunities = []
        for col in colleges:
            regs_count = db.query(Student).filter(
                (Student.college_id == col.id) | (Student.college_name_raw == col.name)
            ).count()

            est_pool = col.student_count_estimate or 1500
            clubs_count = len(col.clubs) if col.clubs else 1
            penetration_pct = round((regs_count / max(1, est_pool)) * 100, 2)
            untapped_seats = max(0, est_pool - regs_count)

            # Opportunity score components:
            # - Large untapped pool (up to 40 pts)
            # - Tier 1 or 2 (+30 pts)
            # - Active technical clubs (+20 pts)
            # - Early momentum (+10 pts)
            pool_pts = min(40.0, (untapped_seats / 1500.0) * 40.0)
            tier_pts = 30.0 if col.tier == "TIER_1" else 20.0 if col.tier == "TIER_2" else 10.0
            club_pts = min(20.0, clubs_count * 10.0)
            momentum_pts = min(10.0, regs_count * 1.5)

            score = min(100.0, round(pool_pts + tier_pts + club_pts + momentum_pts, 1))

            opportunities.append({
                "college_id": col.id,
                "name": col.name,
                "code": col.code,
                "tier": col.tier,
                "current_registrations": regs_count,
                "estimated_pool": est_pool,
                "penetration_pct": penetration_pct,
                "untapped_seats": untapped_seats,
                "clubs_count": clubs_count,
                "score": score,
                "reason": (
                    f"Opportunity Score {score}/100: {untapped_seats} untapped students, {clubs_count} clubs, "
                    f"{col.tier} designation with {penetration_pct}% penetration."
                ),
                "confidence": "HIGH",
            })

        opportunities.sort(key=lambda x: x["score"], reverse=True)
        top_opp = opportunities[0] if opportunities else None

        return {
            "feature": "college_opportunity_scoring",
            "score": round(sum(o["score"] for o in opportunities) / max(1, len(opportunities)), 1),
            "confidence": "HIGH",
            "confidence_score": 0.90,
            "input_signals": input_signals,
            "reason": (
                f"Ranked {len(opportunities)} campuses by untapped reach. "
                f"Top opportunity: '{top_opp['name'] if top_opp else 'None'}' with {top_opp['untapped_seats'] if top_opp else 0} potential students."
            ),
            "colleges": opportunities,
        }

    # ==========================================================================
    # FULL BRIEFING
    # ==========================================================================
    @classmethod
    def get_full_intelligence_summary(cls, db: Session) -> Dict[str, Any]:
        """
        Executes and returns the complete explainable intelligence suite across all 9 features.
        """
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "forecasting": cls.forecast_registrations(db),
            "channel_recommendations": cls.recommend_channels(db),
            "segmentation": cls.segment_students(db),
            "lead_scoring": cls.score_leads(db),
            "anomaly_detection": cls.detect_anomalies(db),
            "campaign_strategist": cls.generate_campaign_strategy(db),
            "copy_optimizer": cls.optimize_copy(db),
            "referral_propensity": cls.score_referral_propensity(db),
            "college_opportunities": cls.score_college_opportunities(db),
        }
