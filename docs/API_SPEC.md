# API Specification: AI Student Growth Engine 🚀

Base Path: `/api/v1` and `/api`  
Interactive Swagger UI: `http://localhost:8000/api/v1/docs`  
OpenAPI Specification JSON: `http://localhost:8000/api/v1/openapi.json`

---

## 1. System Health & Diagnostics

### `GET /health` or `GET /api/v1/health`
Returns system diagnostics, database connection status, active AI provider, and campaign targets.

**Response `200 OK`:**
```json
{
  "status": "healthy",
  "app_name": "AI Student Growth Engine",
  "version": "1.0.0",
  "environment": "development",
  "ai_provider": "deterministic_fallback",
  "campaign": {
    "target": 500,
    "budget_inr": 2000.0,
    "duration_days": 7,
    "workshop": "Build Your First AI Project in 60 Minutes"
  },
  "database": {
    "connected": true,
    "registrations_count": 528,
    "students_count": 528
  },
  "timestamp": "2026-10-04T19:22:00Z"
}
```

---

## 2. Registration & Eligibility Gating (Phase 2 & 15)

### `POST /api/register`
Registers a student for the masterclass. Performs duplicate detection (phone/email), graduation year gating (2025/2026 flags `is_final_year=True`), attribution extraction (UTM parameters, referral codes), and creates an individualized "Squad Pass" referral link.

**Request Body:**
```json
{
  "full_name": "Pooja Patel",
  "email": "pooja.patel@vbit.ac.in",
  "phone_number": "+919876543210",
  "college_name": "Vignana Bharathi Institute of Technology",
  "branch": "Computer Science and Engineering",
  "graduation_year": 2025,
  "referred_by_code": "NXTP7Q",
  "utm_source": "whatsapp_club",
  "utm_medium": "community",
  "utm_campaign": "masterclass_launch",
  "primary_goal": "Placement / Resume Project",
  "skill_level": "Beginner"
}
```

**Response `201 Created`:**
```json
{
  "registration_id": 529,
  "status": "confirmed",
  "student": {
    "id": 529,
    "full_name": "Pooja Patel",
    "email": "p***l@vbit.ac.in",
    "is_final_year": true,
    "referral_code": "NXTP9K",
    "referral_link": "http://localhost:5173/?ref=NXTP9K"
  },
  "workshop_details": {
    "title": "Build Your First AI Project in 60 Minutes",
    "scheduled_at": "2026-10-12T18:00:00Z",
    "duration_minutes": 60
  },
  "share_card": {
    "whatsapp_url": "https://api.whatsapp.com/send?text=...",
    "linkedin_url": "https://www.linkedin.com/sharing/share-offsite/?url=..."
  }
}
```

### `GET /api/registrations`
Returns paginated, searchable registration records with search query, final-year filtering, and referral filtering.

---

## 3. Referral Tracking & Viral Loop (Phase 3 & 4)

### `GET /api/referral/{code}`
Retrieves real-time referral telemetry for a student's referral code, including conversion counts, milestone tiers unlocked, and dynamically generated share prompts.

### `GET /api/referral/leaderboard` (or `/api/leaderboard`)
Returns the top campus peer referrers sorted by successful verified registrations.

### `POST /api/referral/track-action`
Logs social sharing events (`whatsapp_click`, `copy_link`, `telegram_click`) to measure intent and channel drop-off.

---

## 4. Growth Analytics & Attribution (Phase 5 & 10)

### `GET /api/dashboard` & `GET /api/admin/dashboard`
Returns primary KPIs:
- `total_registrations`, `verified_final_year_registrations`, `target_completion_pct`
- Viral coefficient ($K$-Factor) and effective Cost Per Acquisition (CPA $\le$ ₹4.00)
- 7-day registration velocity chart
- Channel attribution breakdown (WhatsApp, Campus Ambassadors, Discord/Telegram, Email, Organic)

### `GET /api/analytics`
Returns full funnel conversions: Landing Visitors $\to$ Form Started $\to$ Confirmed Registrations $\to$ Viral Shares $\to$ Peer Registrations.

### `GET /api/channels` & `GET /api/colleges`
Returns performance metrics grouped by marketing channels and engineering college campuses.

### `POST /api/attribution/utm-builder` & `GET /api/attribution/performance`
Generates tagged UTM URLs and reports click-through to conversion conversion rates by campaign source, medium, and campus club.

---

## 5. Budget & Unit Economics Engine (Phase 8)

### `GET /api/budget/overview`
Returns real-time ledger accounting for the ₹2,000 budget cap:
- Total Budget: ₹2,000.00
- Total Spent: e.g., ₹1,420.00
- Remaining: ₹580.00
- Cost Per Registration (CPR): e.g., ₹2.68
- Active spend allocations across Campus Ambassador Bounties, WhatsApp Business API micro-credits, and Creative Incentives.

### `POST /api/budget/allocations`
Updates spending category caps while enforcing `sum(allocations) <= 2000.00`.

### `GET /api/budget/scenarios`
Returns unit economic sensitivity models: Pessimistic, Base, and Target scenarios.

---

## 6. AI Copilot & Advanced Intelligence Suite (Phase 9 & 15)

### `POST /api/ai/copilot/analyze`
Generates real-time, metric-grounded strategic growth insights and automated diagnostic recommendations.

### `GET /api/intelligence/summary`
Returns the 9-dimensional explainable intelligence suite:
1. **Registration Forecasting:** Monte Carlo & run-rate trajectories with confidence intervals.
2. **Channel Recommendations:** Marginal yield, elasticity, and tactical playbooks.
3. **Student Segmentation:** AI Curious, Project Builder, Placement Focused, Career Explorer.
4. **Lead Scoring:** Attendance propensity with transparent signal weights.
5. **Anomaly Detection:** Time-series Z-score spike/drop anomaly alerts.
6. **Campaign Strategist:** Synthesis of macro telemetry into actionable playbooks.
7. **Copy Optimizer:** NLP scoring on urgency, relevance, and final-year placement triggers.
8. **Referral Propensity:** Compound viral potential per registered student.
9. **College Opportunity Scoring:** Untapped engineering campuses ranked by potential.

---

## 7. A/B Experimentation System (Phase 11)

### `GET /api/experiments`
Lists all active, drafted, and concluded A/B experiments across headlines, CTAs, referral hooks, and poster copy.

### `POST /api/experiments/{id}/track`
Logs impressions and conversions for control or variant arms.

### `POST /api/experiments/{id}/conclude`
Calculates conversion rates, relative lift %, statistical difference, and crowns winning variant.

---

## 8. Growth Automations (Phase 12)

### `GET /api/automations`
Lists the 5 critical growth automations:
1. Registration Confirmation & Calendar Invite
2. Referral Milestone ("Squad Pass") Reminder
3. 24-Hour Workshop Readiness Ping
4. 1-Hour Final Countdown
5. Velocity Alert Notification

### `POST /api/automations/{id}/trigger`
Executes simulated trigger or dispatches external webhook payload (n8n/Slack/Zapier compatible).

---

## 9. Simulation & Growth Scenarios (Phase 13)

### `GET /api/simulation/state`
Returns the current simulation timeline day (1–7), cumulative registrations, and simulated state flags.

### `POST /api/simulation/inject`
Injects batch events (`+10 WhatsApp`, `+10 Referral`, `+5 Club`, `+5 Email`) updating the database, analytics, funnel, and AI copilot.

### `POST /api/simulation/advance-day`
Advances the 7-day timeline by 24 hours and computes daily cohort metrics.

### `POST /api/simulation/reset`
Resets the campaign to the clean baseline state.

---

## 10. Automatic Growth Alerts (Phase 14)

### `GET /api/alerts` & `GET /api/alerts/summary`
Returns real-time rule-based alerts evaluated against active metrics:
- Velocity below daily run-rate
- Referral $K$-factor decline
- High traffic with low conversion drop
- Budget burn rate warnings
- Channel underperformance
- Spike anomaly detection
- Target completion risk

### `PATCH /api/alerts/{id}/acknowledge`
Marks an alert as reviewed and resolved by the growth operator.
