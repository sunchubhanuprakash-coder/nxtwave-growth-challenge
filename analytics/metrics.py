"""
Core Reusable Growth Analytics Functions
========================================
Statistically rigorous, non-vanity analytical calculation functions for the
AI Student Growth Engine (500 registrations, ₹2,000 budget, 7-day sprint).

Every metric is derived strictly from observable event telemetry, financial ledgers,
and verifiable ICP student attributes.
"""

from typing import List, Dict, Any, Optional
import math
import numpy as np
import pandas as pd


# ==============================================================================
# 1. CALCULATE CONVERSION RATE
# ==============================================================================
def calculate_conversion_rate(conversions: int, total_visitors: int) -> float:
    """
    Computes the percentage of unique visitors who completed workshop registration.

    Formula:
        Conversion Rate (%) = (Conversions / Total Visitors) * 100

    Parameters:
        conversions: Total successful registrations.
        total_visitors: Total unique visitors / impressions on the landing page.

    Returns:
        float: Conversion rate percentage rounded to 2 decimal places (0.0 to 100.0).

    Edge Cases:
        - If total_visitors <= 0, returns 0.0 (prevents division by zero).
        - If conversions < 0, raises ValueError.
        - Clamped to maximum 100.0% if conversions exceed recorded visitors.
    """
    if conversions < 0:
        raise ValueError(f"Conversions count cannot be negative: {conversions}")
    if total_visitors <= 0:
        return 0.0

    rate = (conversions / total_visitors) * 100.0
    return round(min(100.0, max(0.0, rate)), 2)


# ==============================================================================
# 2. CALCULATE COST PER REGISTRATION (CPR / CAC)
# ==============================================================================
def calculate_cost_per_registration(
    total_spend: float,
    total_registrations: int,
    verified_only: bool = False,
    verified_registrations: int = 0
) -> float:
    """
    Computes the acquisition cost per registered student in INR (₹).

    Formula:
        Blended CPR (₹) = Total Spend (INR) / Total Registrations
        Verified CPR (₹) = Total Spend (INR) / Verified Final-Year Registrations

    Parameters:
        total_spend: Total financial expenditure incurred (₹2,000 budget cap).
        total_registrations: Total registrations acquired.
        verified_only: If True, calculates CPR strictly against verified ICP final-year students.
        verified_registrations: Count of verified final-year students (used if verified_only is True).

    Returns:
        float: Cost per registration in ₹, rounded to 2 decimal places.

    Edge Cases:
        - If total_spend < 0, raises ValueError.
        - If denominator <= 0, returns 0.0 (zero cost base or pre-launch state).
    """
    if total_spend < 0:
        raise ValueError(f"Total spend cannot be negative: {total_spend}")

    denominator = verified_registrations if verified_only else total_registrations
    if denominator <= 0:
        return 0.0

    cpr = total_spend / float(denominator)
    return round(max(0.0, cpr), 2)


# ==============================================================================
# 3. CALCULATE REFERRAL RATE & VIRAL K-FACTOR
# ==============================================================================
def calculate_referral_rate(
    referral_registrations: int,
    total_registrations: int,
    total_invites_sent: int = 0
) -> Dict[str, Any]:
    """
    Evaluates peer-to-peer virality, referral share, and viral expansion coefficient.

    Formulas:
        Direct Registrations (D) = max(0, Total Registrations - Referral Registrations)
        Referral Share (%) = (Referral Registrations / Total Registrations) * 100
        Viral Factor (K) = Referral Registrations / max(Direct Registrations, 1)
        Invite Conversion (%) = (Referral Registrations / Total Invites Sent) * 100 (if invites > 0)

    Parameters:
        referral_registrations: Registrations attributed to a valid student referral code.
        total_registrations: Total registrations across all channels.
        total_invites_sent: Total peer invitations generated or shared (optional).

    Returns:
        dict containing:
            - referral_share_percent: float (0.0 to 100.0)
            - viral_k_factor: float (>= 0.0)
            - direct_registrations: int
            - referral_registrations: int
            - invite_conversion_percent: float
            - is_viral_loop_sustainable: bool (True if K >= 1.0)

    Edge Cases:
        - If total_registrations <= 0, returns 0.0 for rates and K-factor.
        - Clamps referral_registrations to total_registrations if greater.
    """
    if referral_registrations < 0 or total_registrations < 0:
        raise ValueError("Registration counts cannot be negative.")

    clamped_referrals = min(referral_registrations, total_registrations)
    direct_registrations = max(0, total_registrations - clamped_referrals)

    if total_registrations <= 0:
        return {
            "referral_share_percent": 0.0,
            "viral_k_factor": 0.0,
            "direct_registrations": 0,
            "referral_registrations": 0,
            "invite_conversion_percent": 0.0,
            "is_viral_loop_sustainable": False,
        }

    share_percent = round((clamped_referrals / total_registrations) * 100.0, 2)
    # Viral K-factor: how many downstream referrals each direct registrant generates
    k_factor = round(clamped_referrals / max(float(direct_registrations), 1.0), 3)
    invite_conv = round((clamped_referrals / total_invites_sent) * 100.0, 2) if total_invites_sent > 0 else 0.0

    return {
        "referral_share_percent": share_percent,
        "viral_k_factor": k_factor,
        "direct_registrations": direct_registrations,
        "referral_registrations": clamped_referrals,
        "invite_conversion_percent": min(100.0, invite_conv),
        "is_viral_loop_sustainable": k_factor >= 1.0,
    }


# ==============================================================================
# 4. CALCULATE CHANNEL PERFORMANCE
# ==============================================================================
def calculate_channel_performance(sources_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Ranks acquisition channels by volume, verified conversion rate, and cost efficiency.

    Formula:
        Conversion Rate (%) = (Registrations / Visitors) * 100
        ICP Fit (%) = (Verified Final-Year / Registrations) * 100
        Channel CPR (₹) = Spend (₹) / Registrations
        Efficiency Index = min(100.0, Conversion Rate * (ICP Fit / 100) * Cost Multiplier)

    Parameters:
        sources_data: List of dicts representing channel metrics with keys:
            - source: str (channel identifier)
            - visitors / clicks: int
            - registrations / conversions: int
            - verified_final_year: int
            - spend_inr: float (optional, defaults to 0.0)

    Returns:
        List of enriched channel records sorted by registrations descending.
    """
    if not sources_data:
        return []

    total_regs_across_channels = sum(int(s.get("registrations", s.get("conversions", 0))) for s in sources_data)

    results = []
    for item in sources_data:
        source_name = item.get("source", item.get("source_name", item.get("utm_source", "unknown")))
        visitors = max(0, int(item.get("visitors", item.get("clicks", item.get("clicks_count", 0)))))
        registrations = max(0, int(item.get("registrations", item.get("conversions", item.get("conversions_count", 0)))))
        verified = max(0, int(item.get("verified_final_year", item.get("verified_count", registrations))))
        spend = max(0.0, float(item.get("spend_inr", item.get("budget_allocated_inr", 0.0))))

        conv_rate = calculate_conversion_rate(registrations, visitors)
        icp_fit = round((verified / max(registrations, 1)) * 100.0, 2) if registrations > 0 else 0.0
        cpr = calculate_cost_per_registration(spend, registrations)
        share_pct = round((registrations / max(total_regs_across_channels, 1)) * 100.0, 2) if total_regs_across_channels > 0 else 0.0

        # Efficiency index: reward high conversion + high ICP fit + low CPR
        cost_multiplier = max(1.0, 20.0 - cpr) if spend > 0 else 15.0
        efficiency_score = round(min(100.0, (conv_rate * (icp_fit / 100.0) * (cost_multiplier / 15.0)) * 2.5), 1)

        results.append({
            "source": source_name,
            "visitors": visitors,
            "registrations": registrations,
            "verified_final_year": verified,
            "conversion_rate": conv_rate,
            "icp_fit_percent": icp_fit,
            "spend_inr": spend,
            "cpr_inr": cpr,
            "share_percent": share_pct,
            "efficiency_score": efficiency_score,
        })

    # Sort descending by registrations, then efficiency
    results.sort(key=lambda x: (x["registrations"], x["efficiency_score"]), reverse=True)
    return results


# ==============================================================================
# 5. CALCULATE REGISTRATION VELOCITY
# ==============================================================================
def calculate_registration_velocity(
    daily_data: List[Dict[str, Any]],
    window_days: int = 3,
    target_registrations: int = 500,
    total_campaign_days: int = 7
) -> Dict[str, Any]:
    """
    Computes registration run-rate, moving average momentum, and acceleration.

    Formulas:
        Daily Velocity = Total Registrations / Elapsed Days
        Moving Average (3-day) = sum(regs[latest 3]) / min(3, len(regs))
        Acceleration = Velocity(Day t) - Velocity(Day t-1)
        Required Run-rate = max(0, Target - Cumulative) / max(Remaining Days, 1)

    Parameters:
        daily_data: Chronologically ordered list of daily records with keys:
            - day_number: int (1 to 7)
            - registrations_count (or registrations): int
        window_days: Rolling window size (default: 3 days).
        target_registrations: Goal (500).
        total_campaign_days: Sprint duration (7 days).

    Returns:
        dict with overall_daily_average, moving_average_velocity, acceleration,
        current_run_rate_per_day, required_run_rate, pacing_status.
    """
    if not daily_data:
        return {
            "elapsed_days": 0,
            "days_remaining": total_campaign_days,
            "cumulative_registrations": 0,
            "overall_daily_average": 0.0,
            "moving_average_velocity": 0.0,
            "acceleration": 0.0,
            "current_run_rate_per_day": 0.0,
            "required_run_rate": round(target_registrations / float(total_campaign_days), 2),
            "pacing_status": "behind_schedule",
        }

    daily_counts = [
        int(d.get("registrations_count", d.get("registrations", d.get("new_registrations", 0))))
        for d in daily_data
    ]

    elapsed_days = len(daily_counts)
    cumulative_regs = sum(daily_counts)
    days_remaining = max(0, total_campaign_days - elapsed_days)

    overall_avg = round(cumulative_regs / float(elapsed_days), 2)

    # Rolling window moving average
    window_slice = daily_counts[-window_days:] if len(daily_counts) >= window_days else daily_counts
    moving_avg = round(sum(window_slice) / float(len(window_slice)), 2) if window_slice else 0.0

    # Acceleration: delta between last two days
    acceleration = 0.0
    if len(daily_counts) >= 2:
        acceleration = round(float(daily_counts[-1] - daily_counts[-2]), 2)

    # Current run rate (weighted: 60% latest day, 40% moving average)
    latest_day = daily_counts[-1] if daily_counts else 0
    current_run_rate = round((latest_day * 0.6) + (moving_avg * 0.4), 2)

    # Required rate to reach 500
    deficit = max(0, target_registrations - cumulative_regs)
    required_rate = round(deficit / float(max(days_remaining, 1)), 2) if days_remaining > 0 else 0.0

    # Pacing status determination
    if cumulative_regs >= target_registrations:
        pacing_status = "target_achieved"
    elif current_run_rate >= required_rate:
        pacing_status = "ahead_of_schedule"
    elif current_run_rate >= (required_rate * 0.85):
        pacing_status = "on_track"
    else:
        pacing_status = "behind_schedule"

    return {
        "elapsed_days": elapsed_days,
        "days_remaining": days_remaining,
        "cumulative_registrations": cumulative_regs,
        "overall_daily_average": overall_avg,
        "moving_average_velocity": moving_avg,
        "acceleration": acceleration,
        "current_run_rate_per_day": current_run_rate,
        "required_run_rate": required_rate,
        "pacing_status": pacing_status,
    }


# ==============================================================================
# 6. CALCULATE FORECAST & PROBABILITY OF TARGET
# ==============================================================================
def calculate_forecast(
    daily_history: List[Dict[str, Any]],
    target: int = 500,
    total_campaign_days: int = 7
) -> Dict[str, Any]:
    """
    Projects cumulative trajectory across the 7-day campaign using linear trend regression
    and statistical confidence bounds (95% CI).

    Formulas:
        Linear Regression: y_hat = m * x + c
        Standard Error (SE) = sqrt(sum((y - y_hat)^2) / max(n - 2, 1))
        95% Confidence Interval = y_hat +/- 1.96 * SE
        Target Probability: Normal CDF Z = (y_hat[Day 7] - target) / SE

    Parameters:
        daily_history: Cumulative or incremental daily records for past days.
        target: Challenge target (500).
        total_campaign_days: Total campaign duration (7 days).

    Returns:
        dict with projected_final_registrations, lower_bound_95, upper_bound_95,
        projected_day_milestone_reached, target_probability_percent, and daily points.
    """
    if not daily_history:
        return {
            "projected_final_registrations": 0,
            "lower_bound_95": 0,
            "upper_bound_95": 0,
            "projected_day_milestone_reached": None,
            "target_probability_percent": 0.0,
            "daily_forecast_points": [],
        }

    # Extract cumulative counts
    cumulative_vals = []
    running = 0
    for item in daily_history:
        if "actual_cumulative" in item:
            running = int(item["actual_cumulative"])
        elif "cumulative_registrations" in item:
            running = int(item["cumulative_registrations"])
        else:
            running += int(item.get("registrations_count", item.get("registrations", 0)))
        cumulative_vals.append(running)

    n = len(cumulative_vals)
    x = np.arange(1, n + 1, dtype=float)
    y = np.array(cumulative_vals, dtype=float)

    # Fit linear regression line
    if n >= 2:
        slope, intercept = np.polyfit(x, y, 1)
        residuals = y - (slope * x + intercept)
        se = float(np.sqrt(np.sum(residuals ** 2) / max(n - 2, 1))) if n > 2 else 15.0
        se = max(se, 10.0)  # Reasonable minimum variance
    else:
        slope = float(cumulative_vals[0])
        intercept = 0.0
        se = 25.0

    forecast_points = []
    milestone_day = None

    for day in range(1, total_campaign_days + 1):
        fitted_val = (slope * day) + intercept
        ci = 1.96 * se * np.sqrt(1.0 + (1.0 / n) + ((day - np.mean(x)) ** 2 / max(float(np.sum((x - np.mean(x)) ** 2)), 1.0)))

        is_actual = day <= n
        actual_val = cumulative_vals[day - 1] if is_actual else None
        point_val = actual_val if is_actual else int(round(fitted_val))

        lower = max(0, int(round(fitted_val - ci)))
        upper = int(round(fitted_val + ci))

        if point_val >= target and milestone_day is None:
            milestone_day = f"Day {day}"

        forecast_points.append({
            "day": f"Day {day}",
            "actual": actual_val,
            "forecast": point_val,
            "lower_bound": lower,
            "upper_bound": upper,
            "target": target,
        })

    final_forecast = forecast_points[-1]["forecast"]
    lower_final = forecast_points[-1]["lower_bound"]
    upper_final = forecast_points[-1]["upper_bound"]

    # Target Probability via Normal CDF
    z = (final_forecast - target) / float(se)
    norm_cdf = 0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))
    prob_percent = round(min(100.0, max(0.0, norm_cdf * 100.0)), 1)

    return {
        "projected_final_registrations": final_forecast,
        "lower_bound_95": lower_final,
        "upper_bound_95": upper_final,
        "projected_day_milestone_reached": milestone_day,
        "target_probability_percent": prob_percent,
        "daily_forecast_points": forecast_points,
    }


# ==============================================================================
# 7. CALCULATE GROWTH SCORE (Executive Composite Index)
# ==============================================================================
def calculate_growth_score(kpis: Dict[str, Any]) -> float:
    """
    Computes a balanced, executive growth health score (0.0 to 100.0).
    Directly reflects sustainable acquisition, viral power, financial efficiency,
    and ICP student quality while eliminating vanity metrics.

    Dimensions & Weights:
        1. Pacing & Milestone Achievement (35%):
           Pacing Ratio = Current Registrations / Expected Benchmark (day * 71.4)
        2. Referral Virality & K-Factor (25%):
           Benchmark is 40% referral share. Score = min(100, (Referral Share % / 40) * 100)
        3. Financial Efficiency (20%):
           Benchmark CPR is ₹4.00 (₹2,000 / 500). If CPR <= ₹4.00, score is 100;
           degrades gracefully if CPR exceeds ₹4.00.
        4. ICP Final-Year Quality Ratio (20%):
           Final-Year Ratio (%) = (Verified Final-Year / Total Registrations) * 100

    Formula:
        Growth Score = 0.35 * Pacing + 0.25 * Virality + 0.20 * Budget + 0.20 * Quality

    Parameters:
        kpis: Dict containing:
            - current_registrations: int
            - target_registrations: int (default 500)
            - days_elapsed: int (1 to 7, default 7)
            - referral_share: float (percentage)
            - estimated_cpr: float (in ₹)
            - verified_final_year: int (optional)

    Returns:
        float: Growth score between 0.0 and 100.0 rounded to 1 decimal place.
    """
    current_regs = max(0, int(kpis.get("current_registrations", 0)))
    target_regs = max(1, int(kpis.get("target_registrations", 500)))
    days_elapsed = max(1, min(7, int(kpis.get("days_elapsed", 7))))
    referral_share = max(0.0, float(kpis.get("referral_share", 0.0)))
    cpr = max(0.0, float(kpis.get("estimated_cpr", 0.0)))
    verified_regs = int(kpis.get("verified_final_year", current_regs))

    # 1. Pacing Score (35%)
    expected_benchmark = (target_regs / 7.0) * days_elapsed
    pacing_ratio = current_regs / max(expected_benchmark, 1.0)
    pacing_score = min(100.0, pacing_ratio * 100.0)

    # 2. Virality Score (25%) - 40% referral share is benchmark for 100 pts
    virality_score = min(100.0, (referral_share / 40.0) * 100.0)

    # 3. Budget Efficiency Score (20%) - ₹4.00 CPR is benchmark
    if cpr <= 0.0:
        budget_score = 100.0 if current_regs > 0 else 50.0
    elif cpr <= 4.00:
        budget_score = 100.0
    else:
        budget_score = max(0.0, 100.0 - ((cpr - 4.00) * 15.0))

    # 4. ICP Quality Score (20%) - Target is 90%+ final-year engineering students
    quality_ratio = (verified_regs / max(current_regs, 1)) * 100.0
    quality_score = min(100.0, (quality_ratio / 90.0) * 100.0)

    growth_score = (
        (0.35 * pacing_score) +
        (0.25 * virality_score) +
        (0.20 * budget_score) +
        (0.20 * quality_score)
    )

    return round(min(100.0, max(0.0, growth_score)), 1)


# ==============================================================================
# 8. CALCULATE FUNNEL DROPOFF
# ==============================================================================
def calculate_funnel_dropoff(stages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Performs stage-by-stage drop-off and conversion analysis across acquisition funnel.

    Stages typically include:
        1. Landing Page Visits
        2. Form Starts
        3. Completed Registrations
        4. Verified Final-Year Students
        5. Active Viral Squad Advocates

    Formulas:
        Top Conversion (%) = (Stage Count / Stage 1 Count) * 100
        Step Conversion (%) = (Stage Count_i / Stage Count_{i-1}) * 100
        Dropoff Count = max(0, Stage Count_{i-1} - Stage Count_i)
        Dropoff Rate (%) = (Dropoff Count / Stage Count_{i-1}) * 100
        Bottleneck Alert = True if Dropoff Rate > 50.0%

    Parameters:
        stages: List of dicts with 'stage' (str) and 'count' (int).

    Returns:
        List of enriched funnel stage objects with drop-off diagnostics.
    """
    if not stages:
        return []

    top_count = max(1, int(stages[0].get("count", 0)))
    results = []

    for i, item in enumerate(stages):
        stage_name = str(item.get("stage", f"Stage {i+1}"))
        count = max(0, int(item.get("count", 0)))

        top_conv = round((count / float(top_count)) * 100.0, 1)

        if i == 0:
            step_conv = 100.0
            dropoff_count = 0
            dropoff_rate = 0.0
        else:
            prev_count = max(1, int(stages[i - 1].get("count", 0)))
            step_conv = round((count / float(prev_count)) * 100.0, 1)
            dropoff_count = max(0, prev_count - count)
            dropoff_rate = round((dropoff_count / float(prev_count)) * 100.0, 1)

        # Bottleneck alert if drop-off exceeds 50% between sequential steps
        bottleneck = dropoff_rate > 50.0 and i > 0

        results.append({
            "stage": stage_name,
            "count": count,
            "conversion_from_top": top_conv,
            "conversion_from_previous": step_conv,
            "dropoff_count": dropoff_count,
            "dropoff_rate_percent": dropoff_rate,
            "bottleneck_alert": bottleneck,
        })

    return results


# ==============================================================================
# 9. CALCULATE BUDGET EFFICIENCY & LEDGER GOVERNANCE
# ==============================================================================
def calculate_budget_efficiency(
    budget_transactions: List[Dict[str, Any]],
    total_registrations: int,
    budget_cap: float = 2000.0
) -> Dict[str, Any]:
    """
    Audits the ₹2,000 financial cap and calculates category spend allocation.

    Formulas:
        Total Spend (₹) = sum(Transaction Amounts)
        Remaining Budget (₹) = max(0, Budget Cap - Total Spend)
        Budget Utilization (%) = (Total Spend / Budget Cap) * 100
        Blended CPR (₹) = Total Spend / max(Total Registrations, 1)
        Category Spend (%) = (Category Spend / Total Spend) * 100

    Parameters:
        budget_transactions: List of transaction dicts with 'amount_inr', 'transaction_type', 'transaction_date'.
        total_registrations: Registrations acquired.
        budget_cap: Financial cap (₹2,000.0).

    Returns:
        dict containing total_spend_inr, budget_cap_inr, budget_utilization_percent,
        remaining_budget_inr, is_over_budget, blended_cpr_inr, spend_by_category, category_percentages.
    """
    if budget_cap <= 0:
        raise ValueError(f"Budget cap must be positive: {budget_cap}")

    total_spend = 0.0
    spend_by_category: Dict[str, float] = {}
    distinct_dates = set()

    for tx in budget_transactions:
        amt = max(0.0, float(tx.get("amount_inr", tx.get("amount", 0.0))))
        tx_type = str(tx.get("transaction_type", tx.get("type", "MISCELLANEOUS")))
        tx_date = str(tx.get("transaction_date", tx.get("date", "")))

        total_spend += amt
        spend_by_category[tx_type] = spend_by_category.get(tx_type, 0.0) + amt
        if tx_date:
            distinct_dates.add(tx_date)

    total_spend = round(total_spend, 2)
    remaining = round(max(0.0, budget_cap - total_spend), 2)
    utilization_pct = round(min(100.0, (total_spend / budget_cap) * 100.0), 1)
    is_over = total_spend > budget_cap
    cpr = calculate_cost_per_registration(total_spend, total_registrations)

    # Category percentages
    category_percentages = {}
    for cat, amt in spend_by_category.items():
        category_percentages[cat] = round((amt / max(total_spend, 1.0)) * 100.0, 1)

    # Daily burn rate
    active_days = max(1, len(distinct_dates))
    daily_burn_rate = round(total_spend / float(active_days), 2)

    return {
        "total_spend_inr": total_spend,
        "budget_cap_inr": budget_cap,
        "budget_utilization_percent": utilization_pct,
        "remaining_budget_inr": remaining,
        "is_over_budget": is_over,
        "blended_cpr_inr": cpr,
        "spend_by_category": spend_by_category,
        "category_percentages": category_percentages,
        "daily_burn_rate_inr": daily_burn_rate,
        "active_spending_days": active_days,
    }


# ==============================================================================
# 10. CALCULATE COLLEGE PERFORMANCE & CAMPUS PENETRATION
# ==============================================================================
def calculate_college_performance(
    college_data: List[Dict[str, Any]],
    total_registrations: int
) -> List[Dict[str, Any]]:
    """
    Ranks institutions by student registration volume and final-year ICP density.

    Formulas:
        Share (%) = (College Registrations / Total Registrations) * 100
        ICP Fit (%) = (Verified Final-Year / College Registrations) * 100

    Parameters:
        college_data: List of dicts with 'college' (or 'college_name'), 'registrations', 'verified_final_year'.
        total_registrations: Total registrations across all colleges.

    Returns:
        List of college performance records sorted descending by registrations with rank and penetration class.
    """
    if not college_data:
        return []

    results = []
    for item in college_data:
        college_name = str(item.get("college", item.get("college_name", item.get("name", "Unknown College"))))
        regs = max(0, int(item.get("registrations", item.get("registrations_count", item.get("count", 0)))))
        verified = max(0, int(item.get("verified_final_year", item.get("verified_count", regs))))
        tier = str(item.get("tier", "TIER_1"))

        share_pct = round((regs / max(total_registrations, 1)) * 100.0, 1) if total_registrations > 0 else 0.0
        icp_fit = round((verified / max(regs, 1)) * 100.0, 1) if regs > 0 else 0.0

        if share_pct >= 25.0:
            penetration_class = "Core Driver"
        elif share_pct >= 10.0:
            penetration_class = "Strong Contributor"
        else:
            penetration_class = "Emerging Node"

        results.append({
            "college": college_name,
            "tier": tier,
            "registrations": regs,
            "verified_final_year": verified,
            "share_percent": share_pct,
            "icp_fit_percent": icp_fit,
            "penetration_class": penetration_class,
        })

    # Sort descending by registrations
    results.sort(key=lambda x: x["registrations"], reverse=True)

    # Assign 1-indexed rank
    for rank, entry in enumerate(results, start=1):
        entry["rank"] = rank

    return results


# ==============================================================================
# 11. CALCULATE DAILY GROWTH & SPRINT PACING
# ==============================================================================
def calculate_daily_growth(
    daily_metrics: List[Dict[str, Any]],
    target_registrations: int = 500,
    total_campaign_days: int = 7
) -> List[Dict[str, Any]]:
    """
    Computes day-over-day growth rates, daily referral share, and pacing delta.

    Formulas:
        Daily Growth Rate (%) = ((New_t - New_{t-1}) / New_{t-1}) * 100
        Daily Referral Share (%) = (Referrals_t / New_t) * 100
        Target Benchmark_t = (t / Total Days) * Target
        Pacing Delta_t = Cumulative_t - Target Benchmark_t (+ ahead, - behind)

    Parameters:
        daily_metrics: List of daily records (Day 1..7).
        target_registrations: Goal (500).
        total_campaign_days: Duration (7 days).

    Returns:
        List of enriched daily progression objects.
    """
    if not daily_metrics:
        return []

    results = []
    running_cumulative = 0
    prev_new = 0

    benchmark_step = target_registrations / float(total_campaign_days)

    for i, day_item in enumerate(daily_metrics):
        day_num = int(day_item.get("day_number", i + 1))
        day_label = str(day_item.get("day", f"Day {day_num}"))
        date_str = str(day_item.get("date", day_item.get("metric_date", "")))

        new_regs = max(0, int(day_item.get("registrations_count", day_item.get("new_registrations", day_item.get("registrations", 0)))))
        referral_regs = max(0, int(day_item.get("referral_registrations_count", day_item.get("referral_registrations", 0))))
        verified_regs = max(0, int(day_item.get("verified_final_year_count", day_item.get("verified_final_year", new_regs))))

        running_cumulative += new_regs

        # Day-over-day growth rate
        if i == 0:
            growth_rate_pct = 0.0
        else:
            growth_rate_pct = round(((new_regs - prev_new) / float(max(prev_new, 1))) * 100.0, 1)

        prev_new = new_regs

        # Daily referral share
        daily_ref_share = round((referral_regs / float(max(new_regs, 1))) * 100.0, 1) if new_regs > 0 else 0.0

        # Pacing delta against linear 71.4/day baseline
        expected_cumulative = round(day_num * benchmark_step, 1)
        pacing_delta = round(running_cumulative - expected_cumulative, 1)

        results.append({
            "day": day_label,
            "day_number": day_num,
            "date": date_str,
            "new_registrations": new_regs,
            "verified_final_year": verified_regs,
            "referral_registrations": referral_regs,
            "cumulative_registrations": running_cumulative,
            "growth_rate_percent": growth_rate_pct,
            "daily_referral_share": daily_ref_share,
            "target_benchmark": expected_cumulative,
            "pacing_delta": pacing_delta,
            "is_ahead_of_target": pacing_delta >= 0,
        })

    return results
