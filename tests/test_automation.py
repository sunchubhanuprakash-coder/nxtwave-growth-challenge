from automation.engine import AutomationEngine
from simulation.growth_simulator import GrowthSimulator


def test_whatsapp_share_url():
    url = AutomationEngine.generate_whatsapp_share_url("NXT123", "Bhanu")
    assert "https://api.whatsapp.com/send?text=" in url
    assert "NXT123" in url
    assert "Build%20Your%20First%20AI%20Project" in url or "Build+Your+First+AI+Project" in url


def test_referral_milestones():
    # 0 referrals
    res0 = AutomationEngine.evaluate_referral_milestones(0)
    assert res0["tier_1_unlocked"] is False
    assert res0["tier_2_unlocked"] is False
    assert res0["next_target"] == 1

    # 1 referral
    res1 = AutomationEngine.evaluate_referral_milestones(1)
    assert res1["tier_1_unlocked"] is True
    assert res1["tier_2_unlocked"] is False
    assert res1["next_target"] == 3

    # 3 referrals
    res3 = AutomationEngine.evaluate_referral_milestones(3)
    assert res3["tier_1_unlocked"] is True
    assert res3["tier_2_unlocked"] is True
    assert res3["next_target"] == "All Rewards Unlocked"


def test_growth_simulator():
    result = GrowthSimulator.simulate_7day_trajectory(
        daily_direct_signups=25,
        viral_invite_rate=1.8,
        invite_conversion_rate=0.4,
        simulations=20
    )
    assert result["simulations_run"] == 20
    assert result["target_threshold"] == 500
    assert "success_probability_percent" in result
    assert "projected_mean_registrations" in result
