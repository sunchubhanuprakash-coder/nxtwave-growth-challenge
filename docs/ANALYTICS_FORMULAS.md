# AI Student Growth Engine — Analytics Mathematical Specifications

This document outlines the mathematical formulas, behavioral rationale, boundary condition handling, and anti-vanity constraints governing the reusable analytics functions in **Phase 8**.

---

## 1. Core Principles: Eliminating Vanity Metrics

In acquisition challenges with hard constraints (500 final-year registrations, ₹2,000 budget cap, 7-day sprint), traditional marketing metrics (impressions, pageviews, generic signups) mislead decision-making. 

Our engine enforces **4 Anti-Vanity Principles**:
1. **ICP-Strict Quality Index**: Only final-year engineering students count toward target pacing. First-, second-, and third-year registrations are tracked as non-ICP spillover and excluded from goal progress.
2. **Blended & Verified CPR**: Cost Per Registration is computed against verifiable milestone completions, audited strictly against the ₹2,000 financial ledger.
3. **Virality Grounded in Downstream Conversions**: Referral coefficient ($K$) measures completed downstream registrations generated per direct user, not vanity social shares or link clicks.
4. **Statistical Trajectory Forecasting**: 95% confidence intervals and standard errors govern projections, preventing premature victory declarations during early sprint velocity spikes.

---

## 2. Reusable Calculation Functions & Mathematical Definitions

### 1. `calculate_conversion_rate(conversions, total_visitors)`
Measures bottom-of-funnel efficiency for converting visitors into confirmed workshop participants.

$$\text{Conversion Rate (\%)} = \left(\frac{C}{V}\right) \times 100$$

- **Variables**:
  - $C$: Completed, non-duplicate registrations.
  - $V$: Unique landing page visitors or attributed campaign clicks.
- **Boundary Handling**:
  - If $V \le 0 \implies 0.0\%$ (prevents zero division).
  - If $C < 0 \implies \text{ValueError}$.
  - Range clamped to $[0.0, 100.0]\%$.
  - Precision: Rounded to 2 decimal places.

---

### 2. `calculate_cost_per_registration(total_spend, total_registrations, verified_only=False, verified_registrations=0)`
Measures capital efficiency and unit economics against the ₹2,000 budget cap.

$$\text{Blended CPR (₹)} = \frac{S_{\text{total}}}{R_{\text{total}}}$$

$$\text{Verified CPR (₹)} = \frac{S_{\text{total}}}{R_{\text{verified}}}$$

- **Variables**:
  - $S_{\text{total}}$: Total spend drawn from audited ledger entries ($\le ₹2,000.00$).
  - $R_{\text{total}}$: Total registered students.
  - $R_{\text{verified}}$: Verified final-year engineering students.
- **Boundary Handling**:
  - If $S_{\text{total}} < 0 \implies \text{ValueError}$.
  - If denominator $\le 0 \implies 0.0$ (pre-spend or zero denominator).
  - Target benchmark: $\le ₹4.00$ per verified registration ($₹2,000 / 500$).

---

### 3. `calculate_referral_rate(referral_registrations, total_registrations, total_invites_sent=0)`
Quantifies peer-to-peer viral transmission and organic multiplication.

$$\text{Referral Share (\%)} = \left(\frac{R_{\text{ref}}}{R_{\text{total}}}\right) \times 100$$

$$\text{Viral Factor } K = \frac{R_{\text{ref}}}{\max(R_{\text{direct}}, 1)} \quad \text{where } R_{\text{direct}} = R_{\text{total}} - R_{\text{ref}}$$

$$\text{Invite Yield (\%)} = \left(\frac{R_{\text{ref}}}{I_{\text{total}}}\right) \times 100 \quad (I_{\text{total}} > 0)$$

$$\text{Amplification Multiplier} = \frac{1}{1 - \min(K, 0.95)}$$

- **Viral Loop Regimes**:
  - $K \ge 1.0$: Self-sustaining organic expansion (every batch generates an equal or larger downstream cohort).
  - $0.7 \le K < 1.0$: Strong word-of-mouth amplifier (adds 70–99% organic bonus on top of direct seeding).
  - $K < 0.5$: Sub-viral (relies primarily on ambassador and community seeding).

---

### 4. `calculate_channel_performance(sources_data)`
Evaluates each acquisition source (WhatsApp class groups, Campus Ambassadors, Telegram, LinkedIn) balancing volume, conversion rate, ICP fit, and cost efficiency.

$$\text{ICP Fit (\%)} = \left(\frac{R_{\text{verified}, i}}{R_{\text{total}, i}}\right) \times 100$$

$$\text{Channel CPR (₹)} = \frac{\text{Spend}_i}{\max(R_{\text{total}, i}, 1)}$$

$$\text{Efficiency Index} = \min\left(100.0, \text{CR}_i \times \frac{\text{ICP Fit}_i}{100} \times \frac{\max(1, 20 - \text{CPR}_i)}{15} \times 2.5\right)$$

- Output sorted descending by registrations, with ICP density and efficiency score.

---

### 5. `calculate_registration_velocity(daily_data, window_days=3)`
Measures acquisition momentum, run-rate, moving average, and acceleration.

$$\text{Overall Daily Average} = \frac{\sum_{t=1}^n R_t}{n}$$

$$\text{Moving Average Velocity} = \frac{\sum_{t=n-w+1}^n R_t}{w} \quad (w = \min(\text{window}, n))$$

$$\text{Acceleration } (\Delta v) = R_n - R_{n-1}$$

$$\text{Required Run-Rate} = \frac{\max(0, 500 - R_{\text{cumulative}})}{\max(7 - n, 1)}$$

- **Pacing Classification**:
  - `target_achieved`: $R_{\text{cumulative}} \ge 500$.
  - `ahead_of_schedule`: Current run-rate $\ge$ Required run-rate.
  - `on_track`: Current run-rate $\ge 0.85 \times$ Required run-rate.
  - `behind_schedule`: Current run-rate $< 0.85 \times$ Required run-rate.

---

### 6. `calculate_forecast(daily_history, target=500, total_campaign_days=7)`
Projects final registration volume and computes probability of hitting $\ge 500$ using linear regression and normal standard error bands.

$$\hat{y}(t) = m \cdot t + c$$

$$m = \frac{n \sum (t \cdot y) - \sum t \sum y}{n \sum t^2 - (\sum t)^2}, \quad c = \bar{y} - m \bar{t}$$

$$\text{Standard Error (SE)} = \sqrt{\frac{\sum_{t=1}^n (y_t - \hat{y}(t))^2}{\max(n - 2, 1)}}$$

$$\text{95\% Confidence Interval} = \hat{y}(t) \pm 1.96 \cdot \text{SE} \cdot \sqrt{1 + \frac{1}{n} + \frac{(t - \bar{t})^2}{\sum (t_i - \bar{t})^2}}$$

$$\text{Probability of Target Success} = \Phi\left(\frac{\hat{y}(\text{Day 7}) - 500}{\text{SE}}\right) = \frac{1}{2} \left[1 + \text{erf}\left(\frac{\hat{y}(\text{Day 7}) - 500}{\text{SE} \sqrt{2}}\right)\right]$$

---

### 7. `calculate_growth_score(kpis)`
An executive composite index (0.0 to 100.0) combining 4 balanced, observable growth dimensions:

$$\text{Growth Score} = 0.35 \cdot S_{\text{pacing}} + 0.25 \cdot S_{\text{virality}} + 0.20 \cdot S_{\text{budget}} + 0.20 \cdot S_{\text{quality}}$$

1. **Pacing Score ($S_{\text{pacing}}$)**:
   - Benchmark: Linear pacing $t \times (500 / 7) = t \times 71.4$.
   - $S_{\text{pacing}} = \min(100.0, (R_t / \text{Benchmark}_t) \times 100)$.
2. **Virality Score ($S_{\text{virality}}$)**:
   - Benchmark: 40% referral share.
   - $S_{\text{virality}} = \min(100.0, (\text{Referral Share \%} / 40.0) \times 100)$.
3. **Budget Efficiency Score ($S_{\text{budget}}$)**:
   - Benchmark: CPR $\le ₹4.00$.
   - If CPR $\le ₹4.00 \implies 100.0$.
   - If CPR $> ₹4.00 \implies \max(0.0, 100.0 - (\text{CPR} - 4.00) \times 15.0)$.
4. **Quality / ICP Fit Score ($S_{\text{quality}}$)**:
   - Benchmark: 90% verified final-year engineering students.
   - $S_{\text{quality}} = \min(100.0, (\text{Final-Year Ratio \%} / 90.0) \times 100)$.

---

### 8. `calculate_funnel_dropoff(stages)`
Pinpoints leaks between micro-conversions.

$$\text{Top Conversion (\%)} = \left(\frac{C_i}{C_1}\right) \times 100$$

$$\text{Step Conversion (\%)} = \left(\frac{C_i}{C_{i-1}}\right) \times 100$$

$$\text{Dropoff Rate (\%)} = \left(\frac{C_{i-1} - C_i}{C_{i-1}}\right) \times 100$$

- **Bottleneck Diagnostic**: Flags any stage where Dropoff Rate $> 50.0\%$.

---

### 9. `calculate_budget_efficiency(budget_transactions, total_registrations, budget_cap=2000.0)`
Audits ledger transactions against the challenge cap.

$$\text{Total Spend (₹)} = \sum_{j} A_j \le ₹2,000.00$$

$$\text{Utilization (\%)} = \left(\frac{\text{Total Spend}}{₹2,000.00}\right) \times 100$$

$$\text{Remaining Headroom (₹)} = \max(0.0, ₹2,000.00 - \text{Total Spend})$$

$$\text{Daily Burn Rate (₹/day)} = \frac{\text{Total Spend}}{\text{Active Spending Days}}$$

---

### 10. `calculate_college_performance(college_data, total_registrations)`
Ranks campuses by absolute volume, final-year ICP verification, and market concentration.

$$\text{Campus Share (\%)} = \left(\frac{R_{\text{college}}}{R_{\text{total}}}\right) \times 100$$

- **Penetration Classification**:
  - `Core Driver`: Share $\ge 25.0\%$ (e.g. CBIT).
  - `Strong Contributor`: $10.0\% \le \text{Share} < 25.0\%$ (e.g. VNRVJIET, Vasavi).
  - `Emerging Node`: $\text{Share} < 10.0\%$ (e.g. JNTUH, GNITS).

---

### 11. `calculate_daily_growth(daily_metrics, target=500, total_days=7)`
Tracks sprint pacing deltas day-by-day.

$$\text{Day-over-Day Growth (\%)} = \left(\frac{R_t - R_{t-1}}{R_{t-1}}\right) \times 100$$

$$\text{Daily Referral Share (\%)} = \left(\frac{R_{\text{ref}, t}}{R_t}\right) \times 100$$

$$\text{Pacing Delta}_t = R_{\text{cumulative}, t} - \left(t \times \frac{500}{7}\right)$$

---

## 3. The 6 Growth Analytics Suites

| Analytics Suite | Key Domain | Primary Outputs |
| :--- | :--- | :--- |
| **Acquisition** | Channel attribution & marketing efficiency | Paid vs Organic split, ICP yield per channel, CPR per channel |
| **Funnel** | Micro-conversion progression | 5-stage step conversions, dropoff bottlenecks, leak diagnostics |
| **Referral** | Viral loop mechanics | K-factor virality, milestone progression (1, 3, 5, 10), amplification multiplier |
| **Colleges** | Campus network penetration | Tier 1/2 distribution, top 3 institutional concentration, branch breakdown |
| **Budget** | Financial cap governance | ₹2,000 limit enforcement, blended & verified CPR, category spend split |
| **Daily Trend** | Sprint pacing & trajectory | Registration velocity, 3-day moving average, 95% CI forecast, growth score |
