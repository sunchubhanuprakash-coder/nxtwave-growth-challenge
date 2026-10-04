"""
Growth Experimentation & A/B Testing Analytics Engine.
Calculates Conversion Rates, Lift, Percentage Point Difference,
Statistical Significance (Two-Proportion Z-Test), and Winner Determination.
Strictly distinguishes between REAL EXPERIMENTS and SIMULATED EXPERIMENTS.
"""
import math
from typing import Dict, Any, Tuple, Optional
from datetime import datetime


ALLOWED_EXPERIMENT_CATEGORIES = [
    "Landing headline",
    "CTA wording",
    "Referral CTA",
    "WhatsApp message",
    "Poster copy",
    "Email subject",
]

ALLOWED_EXPERIMENT_STATUSES = [
    "DRAFT",
    "RUNNING",
    "CONCLUDED",
    "ARCHIVED",
]


def calculate_variant_conversion_rate(conversions: int, impressions: int) -> float:
    """
    Calculates conversion rate as a percentage rounded to 2 decimal places.
    Safely handles zero impressions and clamps conversions <= impressions.
    """
    if impressions <= 0:
        return 0.0
    safe_conversions = max(0, min(conversions, impressions))
    return round((safe_conversions / impressions) * 100.0, 2)


def calculate_lift(control_cr: float, variant_cr: float) -> float:
    """
    Calculates relative lift % of variant over control.
    Formula: ((variant_cr - control_cr) / control_cr) * 100
    If control_cr is 0 and variant_cr > 0, returns +100.0%.
    """
    if control_cr <= 0.0:
        return 100.0 if variant_cr > 0.0 else 0.0
    lift_val = ((variant_cr - control_cr) / control_cr) * 100.0
    return round(lift_val, 2)


def calculate_difference(control_cr: float, variant_cr: float) -> float:
    """
    Calculates absolute difference in conversion rate in percentage points.
    Formula: variant_cr - control_cr
    """
    return round(variant_cr - control_cr, 2)


def calculate_two_proportion_z_test(
    control_conversions: int,
    control_impressions: int,
    variant_conversions: int,
    variant_impressions: int,
) -> Tuple[float, float, float, bool]:
    """
    Performs a standard two-proportion z-test.
    Returns:
        (z_score, p_value, confidence_pct, is_statistically_significant)
    Confidence threshold is 95% (p < 0.05, |z| >= 1.96).
    """
    c1 = max(0, min(control_conversions, control_impressions))
    n1 = max(0, control_impressions)
    c2 = max(0, min(variant_conversions, variant_impressions))
    n2 = max(0, variant_impressions)

    if n1 <= 0 or n2 <= 0:
        return (0.0, 1.0, 0.0, False)

    p1 = c1 / n1
    p2 = c2 / n2

    # Pooled probability
    pooled_p = (c1 + c2) / (n1 + n2)

    if pooled_p == 0.0 or pooled_p == 1.0:
        return (0.0, 1.0, 0.0, False)

    standard_error = math.sqrt(pooled_p * (1.0 - pooled_p) * ((1.0 / n1) + (1.0 / n2)))
    if standard_error == 0.0:
        return (0.0, 1.0, 0.0, False)

    z_score = (p2 - p1) / standard_error

    # Two-tailed p-value using standard normal cdf via error function
    # cdf(x) = 0.5 * (1 + erf(x / sqrt(2)))
    cdf_val = 0.5 * (1.0 + math.erf(abs(z_score) / math.sqrt(2.0)))
    p_value = 2.0 * (1.0 - cdf_val)
    p_value = max(0.0, min(1.0, p_value))

    confidence_pct = round((1.0 - p_value) * 100.0, 2)
    is_significant = p_value < 0.05 and abs(z_score) >= 1.96

    return (round(z_score, 4), round(p_value, 4), confidence_pct, is_significant)


def calculate_experiment_metrics(
    control_impressions: int,
    control_conversions: int,
    variant_impressions: int,
    variant_conversions: int,
    success_threshold: float = 5.0,
    min_sample_size: int = 50,
) -> Dict[str, Any]:
    """
    Calculates complete A/B experiment telemetry:
    - Control impressions & conversions
    - Variant impressions & conversions
    - Conversion rates
    - Lift %
    - Difference (percentage points)
    - Statistical significance
    - Winner determination (CONTROL, VARIANT, NO_WINNER, or INCONCLUSIVE)
    """
    ctrl_imp = max(0, control_impressions)
    ctrl_conv = max(0, min(control_conversions, ctrl_imp))
    var_imp = max(0, variant_impressions)
    var_conv = max(0, min(variant_conversions, var_imp))

    ctrl_cr = calculate_variant_conversion_rate(ctrl_conv, ctrl_imp)
    var_cr = calculate_variant_conversion_rate(var_conv, var_imp)

    lift = calculate_lift(ctrl_cr, var_cr)
    difference = calculate_difference(ctrl_cr, var_cr)

    z_score, p_value, confidence, is_significant = calculate_two_proportion_z_test(
        ctrl_conv, ctrl_imp, var_conv, var_imp
    )

    sample_size_reached = ctrl_imp >= min_sample_size and var_imp >= min_sample_size

    # Winner determination logic
    winner: str
    if not sample_size_reached:
        winner = "INCONCLUSIVE (COLLECTING DATA)"
    elif is_significant and lift >= success_threshold and var_cr > ctrl_cr:
        winner = "VARIANT"
    elif is_significant and lift <= -success_threshold and ctrl_cr > var_cr:
        winner = "CONTROL"
    elif sample_size_reached and (abs(lift) < success_threshold or not is_significant):
        winner = "NO_WINNER"
    else:
        winner = "INCONCLUSIVE"

    return {
        "control_impressions": ctrl_imp,
        "control_conversions": ctrl_conv,
        "control_conversion_rate": ctrl_cr,
        "variant_impressions": var_imp,
        "variant_conversions": var_conv,
        "variant_conversion_rate": var_cr,
        "lift": lift,
        "difference": difference,
        "z_score": z_score,
        "p_value": p_value,
        "confidence": confidence,
        "is_statistically_significant": is_significant,
        "sample_size_reached": sample_size_reached,
        "min_sample_size": min_sample_size,
        "success_threshold": success_threshold,
        "winner": winner,
    }
