from analytics.engine import AnalyticsEngine


def test_growth_summary_empty():
    summary = AnalyticsEngine.calculate_growth_summary([])
    assert summary["total_registrations"] == 0
    assert summary["k_factor"] == 0.0
    assert summary["effective_cac_inr"] == 0.0


def test_growth_summary_with_data():
    sample_data = [
        {"id": 1, "is_final_year": True, "college_name": "CBIT", "referred_by": None, "utm_source": "whatsapp"},
        {"id": 2, "is_final_year": True, "college_name": "CBIT", "referred_by": "NXT001", "utm_source": "referral"},
        {"id": 3, "is_final_year": True, "college_name": "VNRVJIET", "referred_by": "NXT001", "utm_source": "referral"},
        {"id": 4, "is_final_year": False, "college_name": "CBIT", "referred_by": None, "utm_source": "linkedin"},
    ]
    summary = AnalyticsEngine.calculate_growth_summary(sample_data, total_budget_inr=2000.0)
    assert summary["total_registrations"] == 4
    assert summary["verified_final_year"] == 3
    # 2000 / 3 verified = 666.67
    assert summary["effective_cac_inr"] == 666.67
    # 2 referred / 2 direct = 1.0 K-factor
    assert summary["k_factor"] == 1.0
    assert len(summary["top_colleges"]) > 0
