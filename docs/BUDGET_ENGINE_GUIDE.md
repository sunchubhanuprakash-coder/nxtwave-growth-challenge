# Campaign Budget & Velocity Forecasting Engine (Phase 9)

This document provides the operational, mathematical, and architectural reference for the **Campaign Budget Engine** in the *AI Student Growth Engine*.

---

## 1. Core Financial Constraint: The Strict ₹2,000 Budget Cap

The challenge imposes a strict maximum budget limit of **₹2,000.00** across the 7-day acquisition campaign to achieve 500 verified final-year engineering registrations.

```
       TOTAL CAMPAIGN FINANCIAL CEILING: ₹2,000.00
┌─────────────────────────────────────────────────────────────┐
│ Allocated across channels:  ≤ ₹2,000.00                     │
│ Audited ledger expenditure: ≤ ₹2,000.00                     │
│ Target Unit Economics (CPR): ≤ ₹4.00 per verified student   │
└─────────────────────────────────────────────────────────────┘
```

### Enforcement Rules:
1. **Zero-Overrun Guarantee**: Any proposed allocation or transaction that would cause total allocated budget across channels to exceed ₹2,000.00 is blocked immediately at both API layer (HTTP 400 Bad Request) and UI layer (button disabled with excess warning).
2. **Double-Entry Ledger Integrity**: Every spend transaction is recorded in `BudgetTransaction` with amount, category, description, and timestamp.
3. **Headroom Transparency**: The engine continuously computes `remaining_budget_inr = max(0, 2000 - spent)` and `unallocated_budget_inr = max(0, 2000 - allocated)`.

---

## 2. Channel Allocation Model

Budget is allocated across marketing channels based on expected yield and viral leverage:

| Channel / Category | Initial Allocation | Actual Spend | Role in Campaign |
| :--- | :---: | :---: | :--- |
| **WhatsApp Class Groups** | ₹0.00 | ₹0.00 | Organic peer distribution (zero media spend) |
| **Campus Ambassador (CBIT)** | ₹600.00 | ₹600.00 | Micro-bounty milestone incentives for 50+ batchmates |
| **Campus Ambassador (VNR)** | ₹600.00 | ₹600.00 | Micro-bounty milestone incentives for 50+ batchmates |
| **Telegram Placement Prep** | ₹500.00 | ₹500.00 | High-intent final-year student community pin boost |
| **LinkedIn Organic Post** | ₹0.00 | ₹0.00 | Organic placement officer & alumni distribution |
| **Contingency / Reward Fund** | ₹300.00 | ₹300.00 | Milestone reward infrastructure & emergency reserve |
| **TOTAL** | **₹2,000.00** | **₹2,000.00** | **100.0% Cap Adherence (₹0 Overrun)** |

---

## 3. Strategic Scenarios (Estimates & Risk Modeling)

The engine models 3 distinct scenarios to guide growth decision-making:

### Scenario 1: Conservative (Defense Baseline)
- **Objective**: Mitigate low word-of-mouth adoption and slower channel conversion.
- **Assumptions**: Viral $K = 0.60$, Channel Conversion = $18.0\%$, Referral Share = $37.5\%$.
- **Expected Registrations**: **440 students**
- **Expected Spend**: **₹1,800.00**
- **Expected CPR**: **₹4.09**
- **Risk Assessment**: `Moderate Risk` (68% probability of hitting 500 target).

### Scenario 2: Base (Target Calibration)
- **Objective**: Operational sprint benchmark matching observed historical performance.
- **Assumptions**: Viral $K = 1.08$, Channel Conversion = $28.4\%$, Referral Share = $51.9\%$.
- **Expected Registrations**: **520 students** (Target Achieved)
- **Expected Spend**: **₹2,000.00** (Full deployment)
- **Expected CPR**: **₹3.85**
- **Risk Assessment**: `Low Risk` (92.5% probability of hitting $\ge 500$).

### Scenario 3: Aggressive (Viral Hypergrowth)
- **Objective**: Capitalize on compounding viral loops and campus-wide ambassador momentum.
- **Assumptions**: Viral $K = 1.35$, Channel Conversion = $36.0\%$, Referral Share = $57.5\%$.
- **Expected Registrations**: **635 students**
- **Expected Spend**: **₹2,000.00**
- **Expected CPR**: **₹3.15**
- **Risk Assessment**: `High Upside` (84.0% probability of super-viral expansion).

> **Disclaimer**: All scenarios are simulated mathematical projections based on observable run rates and parameter sensitivities.

---

## 4. Registration Velocity Forecasting Engine

### Inputs:
- $R_{\text{current}}$: Current verified registrations
- $T$: Target (500)
- $D_{\text{rem}}$: Days remaining in campaign sprint ($0 \dots 7$)
- $V_{\text{daily}}$: Current daily registration rate (run-rate)
- $C_{\text{channel}}$: Channel conversion rate (%)
- $K_{\text{ref}}$: Referral rate (%)

### Mathematical Formulation:

1. **Required Daily Registrations**:
   $$\text{Required Daily} = \frac{\max(0, T - R_{\text{current}})}{\max(D_{\text{rem}}, 1)}$$

2. **Projected Final Registrations**:
   If $D_{\text{rem}} = 0 \implies R_{\text{projected}} = R_{\text{current}}$
   
   If $D_{\text{rem}} > 0$:
   $$M_{\text{conv}} = \text{clamp}\left(0.5, 1.8, \frac{C_{\text{channel}}}{25.0}\right)$$
   $$M_{\text{ref}} = \text{clamp}\left(0.5, 2.0, 1.0 + \frac{K_{\text{ref}}}{100.0}\right)$$
   $$V_{\text{effective}} = V_{\text{daily}} \times (0.6 + 0.2 M_{\text{conv}} + 0.2 M_{\text{ref}})$$
   $$R_{\text{projected}} = R_{\text{current}} + \text{round}(V_{\text{effective}} \times D_{\text{rem}})$$

3. **Pacing Gap**:
   $$\text{Gap} = R_{\text{projected}} - T$$
   - Positive indicates projected registration surplus.
   - Negative indicates projected registration shortfall.

### Status Criteria:

| Status | Threshold Condition | Visual Pill | Strategic Directive |
| :--- | :--- | :---: | :--- |
| **ON TRACK** | $R_{\text{projected}} \ge T$ | Emerald Glowing | Maintain current channel run-rate. Target achieved. |
| **AT RISK** | $0.85 \times T \le R_{\text{projected}} < T$ | Amber Warning | Pacing lag. Boost WhatsApp community seeding and ambassador incentives. |
| **OFF TRACK** | $R_{\text{projected}} < 0.85 \times T$ | Rose Critical | Critical deficit. Activate emergency campus reps and high-yield student societies. |

---

## 5. API Endpoints

- `GET /api/budget/overview`: Returns current allocated, spent, remaining, CPR, and channel breakdowns.
- `POST /api/budget/allocations`: Updates channel allocations with strict $\le ₹2,000$ validation.
- `GET /api/budget/scenarios`: Returns the 3 strategic scenario models with risk indicators.
- `POST /api/budget/velocity-forecast`: Runs dynamic velocity forecasting based on input sliders.
