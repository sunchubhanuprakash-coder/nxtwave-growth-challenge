import random
from typing import Dict, Any, List


class GrowthSimulator:
    """
    Parametric Monte Carlo Growth Simulator.
    Simulates the 7-day registration trajectory of the NxtWave AI Masterclass
    under stochastic viral coefficients and college network effects.
    """

    @staticmethod
    def simulate_7day_trajectory(
        daily_direct_signups: int = 25,
        viral_invite_rate: float = 1.8,
        invite_conversion_rate: float = 0.38,
        budget_boost_day: int = 3,
        budget_boost_signups: int = 60,
        simulations: int = 100
    ) -> Dict[str, Any]:
        """
        Runs multiple Monte Carlo runs across 7 days to estimate probability
        of hitting the 500-student milestone.
        """
        k_factor = viral_invite_rate * invite_conversion_rate
        all_final_totals = []
        sample_trajectories = []

        for sim_idx in range(simulations):
            daily_signups = []
            cumulative = 0
            current_day_referred = 0

            for day in range(1, 8):
                # Baseline direct signups with Poisson/Normal noise
                base = max(int(random.gauss(daily_direct_signups, daily_direct_signups * 0.15)), 5)
                
                # Paid/Ambassador Boost on targeted day
                boost = budget_boost_signups if day == budget_boost_day else 0
                
                # Viral referrals compounding from previous day's cohort
                viral = int(current_day_referred * k_factor * random.uniform(0.85, 1.15))
                
                day_total = base + boost + viral
                cumulative += day_total
                daily_signups.append(day_total)
                
                # Update next day's referring pool
                current_day_referred = day_total

            all_final_totals.append(cumulative)
            if sim_idx < 3:
                sample_trajectories.append(daily_signups)

        successful_runs = sum(1 for total in all_final_totals if total >= 500)
        success_probability = round((successful_runs / simulations) * 100, 1)
        mean_total = int(sum(all_final_totals) / simulations)

        return {
            "simulations_run": simulations,
            "k_factor_configured": round(k_factor, 3),
            "target_threshold": 500,
            "success_probability_percent": success_probability,
            "projected_mean_registrations": mean_total,
            "confidence_interval_95": [
                int(sorted(all_final_totals)[int(simulations * 0.025)]),
                int(sorted(all_final_totals)[int(simulations * 0.975)])
            ],
            "sample_trajectory_day_by_day": sample_trajectories[0] if sample_trajectories else []
        }
