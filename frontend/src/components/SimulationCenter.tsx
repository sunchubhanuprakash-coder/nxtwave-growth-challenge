import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  RotateCcw,
  FastForward,
  MessageSquare,
  Users,
  Building2,
  Mail,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Brain,
  Calendar,
  Layers,
  ShieldAlert,
  RefreshCw,
  Activity,
  Compass,
  Zap
} from 'lucide-react';

export interface TimelineDay {
  day_number: number;
  day_label: string;
  date: string;
  registrations_today: number;
  cumulative_registrations: number;
  target: number;
  k_factor: number;
  top_channel: string;
  budget_spent: number;
  is_completed: boolean;
  is_current: boolean;
  is_future: boolean;
  status: string;
}

export interface ScenarioItem {
  name: string;
  projected_registrations: number;
  expected_cpr_inr: number;
  k_factor: number;
  conversion_rate_pct: number;
  status: string;
  risk_indicator: string;
  daily_run_rate_needed: number;
  probability_reaching_500: number;
  color: string;
}

export interface SimulationStateData {
  mode: string;
  disclaimer: string;
  current_day: number;
  days_remaining: number;
  scenario: string;
  is_active: boolean;
  last_advanced_at: string | null;
  telemetry: {
    total_registrations: number;
    verified_final_year: number;
    target_registrations: number;
    remaining_to_target: number;
    progress_percent: number;
    k_factor: number;
    total_simulated_injected: number;
    whatsapp_injected: number;
    referral_injected: number;
    club_injected: number;
    email_injected: number;
    channel_conversions: Record<string, number>;
  };
  timeline: TimelineDay[];
  scenarios: Record<string, ScenarioItem>;
}

interface SimulationCenterProps {
  onNavigateToView?: (view: string) => void;
}

const DEFAULT_SIMULATION_STATE = {
  current_day: 4,
  total_days: 7,
  total_registrations: 342,
  target: 500,
  verified_final_year: 308,
  k_factor: 1.15,
  budget_spent: 975,
  max_budget: 2000,
  active_scenario: "Base Scenario (Target 500)",
  timeline: [
    { day_number: 1, day_label: "Day 1", date: "2026-10-01", registrations_today: 48, cumulative_registrations: 48, target: 71, k_factor: 0.33, top_channel: "WhatsApp", budget_spent: 220, is_completed: true, is_current: false, is_future: false, status: "Completed" },
    { day_number: 2, day_label: "Day 2", date: "2026-10-02", registrations_today: 64, cumulative_registrations: 112, target: 142, k_factor: 0.78, top_channel: "Campus Clubs", budget_spent: 280, is_completed: true, is_current: false, is_future: false, status: "Completed" },
    { day_number: 3, day_label: "Day 3", date: "2026-10-03", registrations_today: 92, cumulative_registrations: 204, target: 213, k_factor: 1.00, top_channel: "Squad Pass", budget_spent: 260, is_completed: true, is_current: false, is_future: false, status: "Completed" },
    { day_number: 4, day_label: "Day 4", date: "2026-10-04", registrations_today: 138, cumulative_registrations: 342, target: 284, k_factor: 1.15, top_channel: "WhatsApp", budget_spent: 215, is_completed: false, is_current: true, is_future: false, status: "In Progress" },
    { day_number: 5, day_label: "Day 5", date: "2026-10-05", registrations_today: 0, cumulative_registrations: 342, target: 355, k_factor: 1.15, top_channel: "Pending", budget_spent: 0, is_completed: false, is_current: false, is_future: true, status: "Upcoming" },
    { day_number: 6, day_label: "Day 6", date: "2026-10-06", registrations_today: 0, cumulative_registrations: 342, target: 426, k_factor: 1.15, top_channel: "Pending", budget_spent: 0, is_completed: false, is_current: false, is_future: true, status: "Upcoming" },
    { day_number: 7, day_label: "Day 7", date: "2026-10-07", registrations_today: 0, cumulative_registrations: 342, target: 500, k_factor: 1.15, top_channel: "Pending", budget_spent: 0, is_completed: false, is_current: false, is_future: true, status: "Workshop Day" }
  ],
  scenarios: [
    { name: "Conservative", projected_registrations: 280, expected_cpr_inr: 6.61, k_factor: 0.4, conversion_rate_pct: 12.0, target_achieved: false },
    { name: "Base", projected_registrations: 512, expected_cpr_inr: 3.86, k_factor: 1.15, conversion_rate_pct: 18.5, target_achieved: true },
    { name: "Aggressive", projected_registrations: 740, expected_cpr_inr: 2.70, k_factor: 1.4, conversion_rate_pct: 24.0, target_achieved: true }
  ]
};

export const SimulationCenter: React.FC<SimulationCenterProps> = ({ onNavigateToView }) => {
  const [data, setData] = useState<SimulationStateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchSimulationState = async () => {
    try {
      const apiBase = ((import.meta as any).env?.VITE_API_URL || '');
      const res = await fetch(`${apiBase}/api/simulation/state`);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') && res.ok) {
        const stateData = await res.json();
        setData(stateData);
      } else {
        setData(DEFAULT_SIMULATION_STATE as any);
      }
    } catch (err) {
      setData(DEFAULT_SIMULATION_STATE as any);
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchSimulationState();
  }, []);

  const handleInject = async (channel: string, count: number, label: string) => {
    setActionLoading(`inject_${channel}`);
    try {
      const res = await fetch('/api/simulation/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, count })
      });
      if (res.ok) {
        const result = await res.json();
        showToast(`Simulated +${count} ${label}! Total registrations now: ${result.total_registrations_now}`);
        await fetchSimulationState();
      } else {
        const err = await res.json();
        showToast(`Injection failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error('Injection error:', err);
      showToast('Injection failed. Check server logs.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdvanceDay = async () => {
    setActionLoading('advance_day');
    try {
      const res = await fetch('/api/simulation/advance-day', {
        method: 'POST'
      });
      if (res.ok) {
        const result = await res.json();
        showToast(`Advanced timeline to Day ${result.current_day} of 7 (${result.days_remaining} days left)!`);
        await fetchSimulationState();
      } else {
        const err = await res.json();
        showToast(`Advance day failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error('Advance day error:', err);
      showToast('Advance day failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSwitchScenario = async (scenarioKey: string) => {
    setActionLoading(`scenario_${scenarioKey}`);
    try {
      const res = await fetch('/api/simulation/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioKey })
      });
      if (res.ok) {
        showToast(`Activated ${scenarioKey} testing scenario!`);
        await fetchSimulationState();
      } else {
        const err = await res.json();
        showToast(`Scenario switch failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error('Scenario switch error:', err);
      showToast('Scenario switch failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetCampaign = async () => {
    setActionLoading('reset_campaign');
    try {
      const res = await fetch('/api/simulation/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'growth_admin_secret_2026'
        },
        body: JSON.stringify({ confirm: true })
      });
      if (res.ok) {
        showToast('Campaign successfully reset to clean Day 1 state!');
        setShowResetConfirm(false);
        await fetchSimulationState();
      } else {
        const err = await res.json();
        showToast(`Reset failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error('Reset error:', err);
      showToast('Reset failed.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-16 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
        <span className="font-mono text-sm">Initializing DEMO / SIMULATION MODE Environment...</span>
      </div>
    );
  }

  const { telemetry, timeline, scenarios, current_day, days_remaining, scenario } = data;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 bg-slate-900 border border-cyan-500/60 text-white rounded-xl shadow-2xl shadow-cyan-500/20 text-sm font-medium animate-slideUp">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Prominent Demo Mode Title & Disclaimer */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border border-amber-600/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-amber-800/30 pb-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-mono mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>PHASE 13: HIRING CHALLENGE TESTBED</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              ## DEMO / SIMULATION MODE
            </h1>
            <p className="text-amber-200/80 text-xs sm:text-sm mt-1 max-w-3xl font-medium">
              Because this is a hiring challenge and not a live marketing campaign, this interactive simulation engine 
              lets evaluators inject realistic cohort bursts, advance the 7-day timeline, and test multi-scenario viral mechanics.
            </p>
          </div>

          {/* Quick Refresh & State Badge */}
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Current Day:</span>
              <strong className="text-cyan-400">Day {current_day} of 7</strong>
              <span className="text-slate-500">•</span>
              <span className="text-amber-400">{days_remaining}d Left</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Active Scenario: <strong className="text-white">{scenario}</strong>
            </span>
          </div>
        </div>

        {/* Prominent Red Disclaimer Box */}
        <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-900/50 flex items-start space-x-3 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-rose-300 uppercase tracking-wider font-mono mr-1">Mandatory Demarcation:</strong>
            Never represent simulated results as real campaign results. All synthetic registrations, cohorts, 
            and scenario projections are strictly isolated for hiring demonstration and architecture validation.
          </div>
        </div>
      </div>

      {/* Primary Simulation Quick Action Controls */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Interactive Simulation Triggers</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Instant downstream updates to Database, Funnel, Referral & Analytics
          </span>
        </div>

        {/* 6 Core Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* 1. +10 WhatsApp registrations */}
          <button
            onClick={() => handleInject('WHATSAPP', 10, 'WhatsApp registrations')}
            disabled={actionLoading !== null}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/60 hover:border-emerald-500 text-left transition group shadow-md disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                +10 Registrations
              </span>
            </div>
            <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
              +10 WhatsApp registrations
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Injects 10 class-group signups with peer attribution & final-year verification
            </div>
          </button>

          {/* 2. +10 Referral registrations */}
          <button
            onClick={() => handleInject('REFERRAL', 10, 'Referral registrations')}
            disabled={actionLoading !== null}
            className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-800/60 hover:border-cyan-500 text-left transition group shadow-md disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                +10 Registrations
              </span>
            </div>
            <div className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
              +10 Referral registrations
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Attributes 10 signups to existing student referrers and updates K-factor
            </div>
          </button>

          {/* 3. +5 Club registrations */}
          <button
            onClick={() => handleInject('CLUB', 5, 'Club registrations')}
            disabled={actionLoading !== null}
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/60 hover:border-indigo-500 text-left transition group shadow-md disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-800">
                +5 Registrations
              </span>
            </div>
            <div className="font-bold text-sm text-white group-hover:text-indigo-300 transition">
              +5 Club registrations
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Simulates campus coding club & technical society partner signups
            </div>
          </button>

          {/* 4. +5 Email registrations */}
          <button
            onClick={() => handleInject('EMAIL', 5, 'Email registrations')}
            disabled={actionLoading !== null}
            className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/60 to-slate-900 border border-violet-800/60 hover:border-violet-500 text-left transition group shadow-md disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-violet-400 bg-violet-950 px-2 py-0.5 rounded-full border border-violet-800">
                +5 Registrations
              </span>
            </div>
            <div className="font-bold text-sm text-white group-hover:text-violet-300 transition">
              +5 Email registrations
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Injects newsletter countdown conversions and updates email attribution
            </div>
          </button>

          {/* 5. Advance 1 day */}
          <button
            onClick={handleAdvanceDay}
            disabled={actionLoading !== null || current_day >= 7}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-800/60 hover:border-amber-500 text-left transition group shadow-md disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <FastForward className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-800">
                Day {current_day} → {Math.min(7, current_day + 1)}
              </span>
            </div>
            <div className="font-bold text-sm text-white group-hover:text-amber-300 transition">
              Advance 1 day
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Advances timeline, generates daily cohort metrics, and reduces days left
            </div>
          </button>

          {/* 6. Reset campaign */}
          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={actionLoading !== null}
            className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-800/60 hover:border-rose-500 text-left transition group shadow-md disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <RotateCcw className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-800">
                Clean State
              </span>
            </div>
            <div className="font-bold text-sm text-white group-hover:text-rose-300 transition">
              Reset campaign
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Restores clean baseline dataset and resets simulation back to Day 1
            </div>
          </button>
        </div>
      </div>

      {/* Downstream System Update Badges */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Every Simulation Event Automatically Updates:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-center">
          {[
            { name: "Database", desc: "SQL Models Updated", icon: Layers, view: undefined },
            { name: "Dashboard", desc: `${telemetry.total_registrations}/500 Pacing`, icon: BarChart3, view: 'growth_dashboard' },
            { name: "Funnel", desc: "Conversion Drops", icon: TrendingUp, view: 'growth_dashboard' },
            { name: "Referrals", desc: `K=${telemetry.k_factor} Virality`, icon: Users, view: 'dashboard' },
            { name: "Channels", desc: "Attribution Shares", icon: MessageSquare, view: 'attribution' },
            { name: "Forecast", desc: `${days_remaining}d Velocity Gap`, icon: Compass, view: 'budget' },
            { name: "AI Insights", desc: "Fresh Diagnostics", icon: Brain, view: 'ai_insights' },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => item.view && onNavigateToView && onNavigateToView(item.view)}
              className={`p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 transition ${
                item.view ? 'cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900' : ''
              }`}
            >
              <item.icon className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
              <div className="font-bold text-xs text-white truncate">{item.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Simulation Timeline */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">7-Day Campaign Simulation Timeline</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Target: 500 Verified Registrations Across 7 Days
          </span>
        </div>

        {/* Stepper Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {timeline.map((day) => {
            const isCompleted = day.is_completed;
            const isCurrent = day.is_current;

            return (
              <div
                key={day.day_number}
                className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-2 ${
                  isCurrent
                    ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10'
                    : isCompleted
                    ? 'bg-slate-900/90 border-emerald-800/60'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-bold ${isCurrent ? 'text-cyan-300' : isCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {day.day_label}
                  </span>
                  {isCompleted ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-mono font-bold">
                      DONE
                    </span>
                  ) : isCurrent ? (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-700 text-[9px] font-mono font-bold animate-pulse">
                      TODAY
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 text-[9px] font-mono">
                      PLANNED
                    </span>
                  )}
                </div>

                {/* Numbers */}
                <div>
                  <div className="text-lg font-extrabold text-white">
                    {day.cumulative_registrations}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">/ 500</span>
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400">
                    +{day.registrations_today} today
                  </div>
                </div>

                {/* Sub-meta */}
                <div className="pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400 space-y-0.5">
                  <div className="truncate" title={day.top_channel}>
                    Top: <span className="text-slate-300">{day.top_channel}</span>
                  </div>
                  <div>
                    K-factor: <strong className="text-slate-300">{day.k_factor}</strong>
                  </div>
                  <div>
                    Spend: <span className="text-slate-300">₹{day.budget_spent}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scenario Testing Suite */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Compass className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Scenario Testing Suite</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Compare growth velocity, viral coefficients, and CPR across 3 operating conditions
          </span>
        </div>

        {/* 3 Scenario Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Object.entries(scenarios).map(([key, sc]) => {
            const isActive = scenario === key;
            const isBase = key === 'BASE';
            const isAggressive = key === 'AGGRESSIVE';

            return (
              <div
                key={key}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                  isActive
                    ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isAggressive
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : isBase
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {sc.status}
                    </span>
                    {isActive && (
                      <span className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE SCENARIO
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{sc.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{sc.risk_indicator}</p>
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase">Projected Regs</div>
                    <div className="text-base font-extrabold text-white mt-0.5">{sc.projected_registrations}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase">Expected CPR</div>
                    <div className="text-base font-extrabold text-cyan-300 mt-0.5">₹{sc.expected_cpr_inr}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase">Virality K-Factor</div>
                    <div className="text-slate-200 mt-0.5 font-bold">{sc.k_factor}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase">Conversion %</div>
                    <div className="text-slate-200 mt-0.5 font-bold">{sc.conversion_rate_pct}%</div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleSwitchScenario(key)}
                  disabled={actionLoading !== null || isActive}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-gradient-to-r from-slate-800 to-slate-700 hover:from-cyan-500 hover:to-indigo-500 hover:text-black text-white shadow-md'
                  }`}
                >
                  <span>{isActive ? 'Scenario Active' : `Switch to ${sc.name}`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-rose-800/80 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Reset Campaign Database?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              This will reset the campaign back to clean Day 1 state, restoring initial baseline registrations, 
              zeroing injection counters, and clearing day progression.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResetCampaign}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-bold hover:from-rose-500 hover:to-red-500 shadow-md transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
