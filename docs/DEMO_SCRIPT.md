# 3-Minute Product Walkthrough Video Script

**Target Time:** 180 Seconds (3 Minutes)  
**Speaker:** Growth Engineer / Candidate  
**Application URL:** `http://localhost:5173` (or production host)  
**Objective:** Showcase the full-stack AI Student Growth Engine delivering 500 registrations on a ₹2,000 budget.

---

### [0:00 – 0:35] Part 1: Problem Statement & Value Proposition Hook
- **Visual:** Open browser on the **Campaign Center** (`/campaign`) view. Show the hero headline *"Build Your First AI Project in 60 Minutes"* and the live seat meter.
- **Narration:**
  > *"Hi everyone! In tech recruitment, acquisition challenges often fail because paid ads are too expensive. For NxtWave’s challenge—acquiring 500 verified final-year engineering students across premier Telangana colleges in 7 days on a strict ₹2,000 budget—standard Google or Meta ads would blow through our entire capital in under 50 clicks.*  
  > *To solve this mathematically, I engineered the **AI Student Growth Engine**: a high-converting, sub-second web platform paired with an organic viral referral loop ('Squad Pass') and real-time algorithmic telemetry."*

---

### [0:35 – 1:15] Part 2: Fast-Track Registration & The Viral Squad Pass
- **Visual:** Click **"+ New Registration"** in the header. Fill in a sample student (`Arjun Reddy`, `arjun@cbit.ac.in`, `9876543210`, `CBIT`, `CSE`, `2025`). Click **Submit**. Instant transition to **Success Page** with Squad Pass Code (`NXT-BH7K29`), QR code, and 1-Click WhatsApp share button.
- **Narration:**
  > *"Let's look at the student experience. A student visits from a campus WhatsApp broadcast. The form is streamlined—auto-detecting final-year engineering eligibility and college affiliation.  
  > In less than 300 milliseconds, registration is confirmed. Instead of a dead-end thank-you page, the student receives their **Squad Pass**.  
  > We turn every registrant into an ambassador: inviting 1 friend unlocks the starter codebase; 3 friends unlocks the VIP Mentor breakout room; and 10 friends unlocks a 1-on-1 resume review.  
  > One click on this WhatsApp button pre-populates a targeted invite message with their unique tracking link. This creates a viral K-factor greater than 1.0, generating organic registrations with zero additional media spend."*

---

### [1:15 – 1:55] Part 3: Executive Growth Dashboard & Reusable Analytics
- **Visual:** Navigate to **Dashboard** (`/dashboard`). Point out the primary KPI cards: Target (500), Verified Registrations, Days Remaining, Referral Share %, CPR (₹3.85), and Growth Score (84/100 Grade A). Toggle date and college slice filters. Then open **Analytics** (`/analytics`) showing the conversion waterfall.
- **Narration:**
  > *"Now switching to the growth executive's view: our **Growth Cockpit**.  
  > Notice the primary KPIs: we are tracking progress directly toward our 500 target. Every single metric is dynamically computed from database events—no fake static values.  
  > Our Cost Per Registration is ₹3.85, staying strictly under the challenge ceiling of ₹4.00.  
  > Over on the Analytics tab, our drop-off waterfall analyzes the transition from visitor to verified final-year student to active viral advocate, helping us diagnose bottlenecks instantly."*

---

### [1:55 – 2:30] Part 4: Budget Guardrails & AI Growth Copilot
- **Visual:** Switch to **Budget** (`/budget`). Show the ₹2,000 budget ceiling guardrail. Demonstrate the channel allocation sliders. Switch to **AI Copilot** (`/copilot`). Show the metric snapshot and explainable lead scores.
- **Narration:**
  > *"Financial discipline is non-negotiable. In the **Budget Engine**, the ₹2,000 ceiling is strictly enforced in code. If an admin tries to allocate ₹2,001 across channels, the backend rejects it with an HTTP 400.  
  > Our **AI Growth Copilot** isn't a generic chatbot. It takes a verified 11-point snapshot of live database metrics, passes it through our provider abstraction layer, and outputs structured, prioritized recommendations with expected impact and confidence scores. Even without an external API key, our deterministic algorithmic fallback ensures 100% operational uptime."*

---

### [2:30 – 3:00] Part 5: Demo Simulation Mode & Conclusion
- **Visual:** Navigate to **Simulation** (`/simulation`). Click **"+10 WhatsApp Registrations"** and **"Advance 1 Day"**. Show metrics instantly update. Point to the header banner clearly marked `## DEMO / SIMULATION MODE`.
- **Narration:**
  > *"Because this is a sprint challenge, I built a dedicated **Simulation Mode** clearly labeled so simulated tests are never confused with real data.  
  > With one click, I can inject a batch of 10 WhatsApp registrations, advance the timeline to Day 3, and watch the entire dashboard, velocity forecast, and automated growth alerts respond in real time.  
  > With 181 automated tests, Docker deployment, and strict OWASP security hardening, the AI Student Growth Engine proves that viral engineering and rigorous analytics can achieve 500 registrations on a ₹2,000 budget. Thank you!"*
