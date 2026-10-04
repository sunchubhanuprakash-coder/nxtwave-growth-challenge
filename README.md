# AI Student Growth Engine 🚀

> **Official Submission for the NxtWave Growth Challenge**  
> **Campaign Goal:** 500 Verified Final-Year Engineering Student Registrations  
> **Campaign Window:** 7-Day Sprint | **Hard Budget Cap:** ₹2,000 INR (CPR $\le$ ₹4.00)  
> **Working Educational Asset:** 60-Minute Masterclass — *"Build Your First AI Project in 60 Minutes"*  

[![Pytest Test Suite](https://img.shields.io/badge/pytest-181%20passed-brightgreen.svg)](file:///C:/Users/Lenovo/.gemini/antigravity-ide/scratch/nxtwave-growth-challenge/tests/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 📑 Challenge Deliverables & Direct Documentation Links

All challenge documentation and operational playbooks are fully documented in the `/docs` directory:

1. 🎯 **[5-Slide Growth Plan](docs/GROWTH_PLAN_SLIDES.md)**: Executive growth strategy covering ICE channel prioritization, ₹2,000 budget unit economics, Squad Pass viral loop ($K \ge 1.0$), and the 7-day tactical timeline.
2. ⏱️ **[3-Minute Demo Walkthrough Script](docs/DEMO_SCRIPT.md)**: Second-by-second presentation script with visual cues, spoken script, and timestamped platform workflows.
3. 🧠 **[Learning Notes & Growth Psychology](docs/LEARNING_NOTES.md)**: Empirical takeaways on final-year placement anxiety, WhatsApp friction reduction, micro-incentive mechanics, and AI architecture lessons.
4. 🚀 **[Production Deployment Runbook](docs/DEPLOYMENT.md)**: Complete guide for Docker Compose, AWS/GCP container deployment, bare metal configuration, and health monitoring.
5. 📡 **[Full REST API Specification](docs/API_SPEC.md)**: Complete documentation for all 35+ endpoints spanning registrations, referrals, analytics, budget, copilot, and experiments.
6. 🛡️ **[Engineering & Security Audit](engineering_audit.md)**: Rigorous audit log covering 181 passing tests, input validation, SQL injection prevention, CORS security, and zero hardcoded credentials.

---

## 🌟 Platform Capabilities & Architecture

The **AI Student Growth Engine** is built as an enterprise-grade SaaS Growth Platform engineered to deliver 500 registrations on an extreme budget constraint (₹2,000). The platform comprises 13 dedicated navigation modules:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI STUDENT GROWTH ENGINE                        │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│ 1. Dashboard    │ 2. Campaign      │ 3. Registration │ 4. Referrals    │
│ Executive KPIs, │ ICP criteria,    │ Sub-second form,│ "Squad Pass"    │
│ CAC, K-Factor   │ value prop, deck │ gating, dedupe  │ loop & rewards  │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ 5. Channels     │ 6. Colleges      │ 7. Analytics    │ 8. Experiments  │
│ Attribution &   │ Campus & club    │ Full conversion │ Real & simulated│
│ yield tracking  │ network tracker  │ funnel metrics  │ A/B testing     │
├─────────────────┼──────────────────┼─────────────────┼─────────────────┤
│ 9. AI Copilot   │ 10. Automation   │ 11. Budget      │ 12. Simulation  │
│ Explainable     │ 5 trigger rules  │ Real-time ₹2k   │ 7-day timeline, │
│ intelligence    │ & webhook engine │ ledger & limits │ Monte Carlo run │
├─────────────────┴──────────────────┴─────────────────┴─────────────────┤
│ 13. System Alerts: Rule-based anomaly detection & velocity guardrails  │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Product Modules
* **Dynamic Landing & Registration:** Gated registration engine that validates graduation year (targeting 2025/2026 final-year engineering students), verifies phone/email, deduplicates records, and renders a 1-click WhatsApp Squad Pass.
* **Squad Pass Viral Loop:** Dynamic milestone gamification unlocking Tier 1 (Resume Review Prompt Pack at 1 referral), Tier 2 (VIP Q&A with Speaker at 3 referrals), and Tier 3 (Exclusive 1-on-1 GitHub AI Project Code Review at 5 referrals).
* **Multi-Touch Attribution:** Automated UTM generator with deep links tracking campus ambassadors, student clubs, and WhatsApp community groups down to individual clicks and conversions.
* **₹2,000 Budget Ledger:** Real-time financial enforcement engine ensuring total spend never exceeds ₹2,000. Tracks micro-bounty allocations to college club ambassadors and calculates live CPR ($\le$ ₹4.00).
* **Advanced Explainable Intelligence:** 9-dimensional AI engine providing transparent, metric-grounded forecasting, channel marginal yield, student segmentation, attendance lead scoring, time-series anomaly detection, and copy optimization.
* **Growth Automation Center:** Webhook-ready automation engine orchestrating instant registration confirmations, Squad Pass milestones, 24-hour and 1-hour workshop countdown reminders.
* **7-Day Simulation Engine:** Interactive simulation testing Conservative, Base, and Aggressive growth trajectories with batch event injection (`+10 WhatsApp`, `+10 Referral`, `+5 Club`, `+5 Email`) without contaminating production data.

---

## 🏗️ Technical Stack

| Layer | Technologies | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons | Responsive SaaS UI, sub-second interaction, dynamic modal dialogs, accessible design tokens |
| **Data Visualization** | Recharts | Multi-series velocity charts, conversion funnels, channel yield graphs |
| **Backend Gateway** | Python 3.11, FastAPI, Pydantic v2 | High-throughput async REST API, validation, gating, rate-limiting |
| **Database** | SQLite + SQLAlchemy 2.0 ORM | Relational persistence, transactional atomicity, non-destructive schema migrations |
| **Analytics Engine** | Pandas, NumPy | Statistical cohort analysis, Z-score anomaly detection, $K$-factor calculation |
| **AI Layer** | Deterministic Grounded Provider + OpenAI / Anthropic Adapter | Zero-cost local fallback resilience, explainable scoring, zero-hallucination guarantee |
| **Test Suite** | Pytest, HTTPX TestClient | 181 automated tests verifying end-to-end functionality |
| **DevOps** | Docker, Docker Compose | Containerized multi-service deployment with health checking |

---

## ⚡ Quickstart Guide

### Option 1: Docker Compose (Recommended for Production)

```bash
# Clone the repository
git clone https://github.com/your-username/nxtwave-growth-challenge.git
cd nxtwave-growth-challenge

# Configure environment
cp .env.example .env

# Launch frontend and backend services
docker compose up -d

# Check health
curl http://localhost:8000/health
```
* **Frontend Web Application:** `http://localhost:5173`
* **Interactive API Swagger Docs:** `http://localhost:8000/api/v1/docs`

---

### Option 2: Local Development Setup

#### Backend Setup
```bash
# 1. Activate Python virtual environment
# Windows:
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Start FastAPI server with live reloading
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Launch Vite development server
npm run dev
```

---

## 🧪 Comprehensive Test Suite (181 Passing Tests)

The platform includes a test suite covering all business logic, gating rules, database migrations, and security protections:

```bash
.\.venv\Scripts\pytest tests/ -v
```

### Test Coverage Summary:
* `tests/test_health.py`: Diagnostics, system readiness, version endpoints (2 tests)
* `tests/test_api_growth.py`: Core registration, duplicate detection, UTM attribution (10 tests)
* `tests/test_referrals.py`: Squad Pass generation, milestone tier unlocks, leaderboard sorting (10 tests)
* `tests/test_dashboard_analytics.py`: Real-time KPI summaries, velocity curves, funnel metrics (8 tests)
* `tests/test_attribution.py`: UTM URL builder, campaign tracking, college club attribution (9 tests)
* `tests/test_budget_engine.py`: ₹2,000 ledger limits, spend allocations, unit economics (9 tests)
* `tests/test_ai_copilot.py`: Explainable recommendations, metric grounding, fallback mode (9 tests)
* `tests/test_experiments.py`: A/B testing calculations, variant lift, simulated vs real flags (9 tests)
* `tests/test_automations.py`: Trigger lifecycle, variable substitution, webhook payloads (11 tests)
* `tests/test_simulation.py`: Timeline day advancement, batch injection, scenario resetting (12 tests)
* `tests/test_alerts.py`: Automatic growth alerts, threshold evaluations, acknowledgement (9 tests)
* `tests/test_intelligence.py`: Phase 15 explainable AI suite across all 9 features (18 tests)
* `tests/test_comprehensive_audit.py`: Full end-to-end integration across all 15 phases (12 tests)
* `tests/test_security_audit.py`: SQL injection prevention, input sanitization, CORS security, key verification (15 tests)
* `tests/test_analytics.py`, `tests/test_automation.py`, `tests/test_ai_fallback.py`, `tests/test_growth_simulator.py`: Math & algorithmic engine tests (38 tests)

**Total:** **181 tests passed** in **7.11 seconds**.

---

## 🔒 Security & Data Integrity
* **Zero Hardcoded Secrets:** All secrets, ports, and configuration keys are parameterized in `.env.example`.
* **Input Validation & Sanitization:** Strict Pydantic v2 schemas reject malformed email addresses, international phone prefixes, and XSS injection attempts.
* **SQL Injection Immunity:** All database queries utilize SQLAlchemy 2.0 ORM parameterized binding; zero raw string concatenation queries.
* **CORS Origin Protection:** Explicit allowlist configuration restricting browser requests to authorized client origins.
* **Transparent Grounding:** All AI recommendations, lead scores, and forecasts explicitly display input signals, calculation formulas, and confidence levels. If data is insufficient, the system returns `"Insufficient data for reliable prediction"`.

---

## 📈 Growth Strategy At A Glance

| Pillar | Strategy | Mechanism |
| :--- | :--- | :--- |
| **Audience** | Final-Year Engineering Students (2025/2026 Batch) | Overcoming placement anxiety via high-impact resume projects |
| **Asset** | *"Build Your First AI Project in 60 Minutes"* | Zero-fluff, hands-on workshop building a deployable AI app |
| **Budget** | ₹2,000 Hard Limit | Micro-incentives to 10 campus club leaders (₹150/club) + WhatsApp API credits (₹500) |
| **Virality** | "Squad Pass" Referral Loop | Target $K \ge 1.0$; unlocks exclusive GitHub review and interview prompt packs |
| **Execution** | 7-Day Sprint | Day 1-2: Seed Clubs $\to$ Day 3-4: Peer Loops $\to$ Day 5-6: Urgency & Scarcity $\to$ Day 7: Masterclass |

---

## 📜 License
Distributed under the MIT License. Developed for the NxtWave Growth Challenge.
