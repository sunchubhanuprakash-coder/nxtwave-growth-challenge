import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Wallet,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sliders,
  Sparkles,
  Calculator,
  ShieldCheck,
  AlertCircle,
  Gauge,
  Layers,
  Save,
  RotateCcw
} from 'lucide-react';

interface ChannelAllocation {
  channel_id: number;
  channel_name: string;
  utm_source: string;
  utm_medium: string;
  allocated_inr: number;
  spent_inr: number;
  conversions_count: number;
  cpr_inr: number;
}

interface BudgetOverview {
  max_budget_inr: number;
  total_allocated_inr: number;
  total_spent_inr: number;
  remaining_budget_inr: number;
  unallocated_budget_inr: number;
  blended_cpr_inr: number;
  verified_cpr_inr: number;
  total_registrations: number;
  verified_registrations: number;
  target_registrations: number;
  budget_utilization_percent: number;
  is_over_budget: boolean;
  channel_allocations: ChannelAllocation[];
}

interface BudgetScenario {
  scenario_name: string;
  tag: string;
  description: string;
  expected_registrations: number;
  expected_cost: number;
  expected_cpr: number;
  risk_indicator: string;
  risk_color: string;
  probability_percent: number;
  assumptions: Record<string, any>;
  is_estimate: boolean;
}

interface VelocityForecastResult {
  inputs: Record<string, any>;
  projected_registrations: number;
  required_daily_registrations: number;
  gap: number;
  status: 'ON TRACK' | 'AT RISK' | 'OFF TRACK';
  status_color: string;
  recommendation: string;
  is_estimate: boolean;
  disclaimer: string;
}

const DEFAULT_BUDGET_OVERVIEW: BudgetOverview = {
  max_budget_inr: 2000.0,
  total_allocated_inr: 2000.0,
  total_spent_inr: 975.0,
  remaining_budget_inr: 1025.0,
  unallocated_budget_inr: 0.0,
  blended_cpr_inr: 2.85,
  verified_cpr_inr: 3.16,
  total_registrations: 342,
  verified_registrations: 308,
  target_registrations: 500,
  budget_utilization_percent: 48.8,
  is_over_budget: false,
  channel_allocations: [
    { channel_id: 1, channel_name: "Campus Ambassador Bounties", utm_source: "campus_clubs", utm_medium: "community", allocated_inr: 1500, spent_inr: 720, conversions_count: 104, cpr_inr: 6.92 },
    { channel_id: 2, channel_name: "WhatsApp Business API Tier", utm_source: "whatsapp", utm_medium: "message", allocated_inr: 500, spent_inr: 255, conversions_count: 146, cpr_inr: 1.75 }
  ]
};

const DEFAULT_SCENARIOS: BudgetScenario[] = [
  { scenario_name: "Pessimistic Scenario", tag: "Conservative", description: "Low club turnout, K-factor drops to 0.4.", expected_registrations: 280, expected_cost: 1850, expected_cpr: 6.61, risk_indicator: "High Risk", risk_color: "text-rose-400", probability_percent: 15, assumptions: { k_factor: 0.4 }, is_estimate: true },
  { scenario_name: "Base Scenario", tag: "Baseline", description: "Target club turnout, K-factor steady at 1.0.", expected_registrations: 512, expected_cost: 1975, expected_cpr: 3.86, risk_indicator: "Healthy", risk_color: "text-emerald-400", probability_percent: 70, assumptions: { k_factor: 1.0 }, is_estimate: true },
  { scenario_name: "Aggressive Scenario", tag: "Viral", description: "High peer viral compounding, K-factor reaches 1.4.", expected_registrations: 740, expected_cost: 2000, expected_cpr: 2.70, risk_indicator: "Very Low Risk", risk_color: "text-cyan-400", probability_percent: 15, assumptions: { k_factor: 1.4 }, is_estimate: true }
];

export const BudgetEngine: React.FC = () => {
  // Budget Overview State
  const [overview, setOverview] = useState<BudgetOverview | null>(null);
  const [editableAllocations, setEditableAllocations] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Scenarios State
  const [scenarios, setScenarios] = useState<BudgetScenario[]>([]);

  // Velocity Forecasting Interactive State
  const [forecastInputs, setForecastInputs] = useState({
    current_registrations: 520,
    target: 500,
    days_remaining: 2,
    daily_registration_rate: 65,
    channel_conversion: 28.4,
    referral_rate: 51.9,
  });

  const [forecastResult, setForecastResult] = useState<VelocityForecastResult | null>(null);

  // Fetch initial budget overview and scenarios
  const fetchData = async () => {
    setLoading(true);
    setSaveMessage(null);
    try {
      const apiBase = ((import.meta as any).env?.VITE_API_URL || '');
      const [ovRes, scRes] = await Promise.all([
        fetch(`${apiBase}/api/budget/overview`),
        fetch(`${apiBase}/api/budget/scenarios`)
      ]);

      const ovType = ovRes.headers.get('content-type') || '';
      let ovData: BudgetOverview = DEFAULT_BUDGET_OVERVIEW;
      if (ovType.includes('application/json') && ovRes.ok) {
        ovData = await ovRes.json();
      }
      setOverview(ovData);

      const initialMap: Record<number, number> = {};
      ovData.channel_allocations.forEach(ch => {
        initialMap[ch.channel_id] = ch.allocated_inr;
      });
      setEditableAllocations(initialMap);

      setForecastInputs(prev => ({
        ...prev,
        current_registrations: ovData.total_registrations || 342
      }));

      const scType = scRes.headers.get('content-type') || '';
      if (scType.includes('application/json') && scRes.ok) {
        const scData = await scRes.json();
        setScenarios(scData.scenarios || DEFAULT_SCENARIOS);
      } else {
        setScenarios(DEFAULT_SCENARIOS);
      }
    } catch (err) {
      setOverview(DEFAULT_BUDGET_OVERVIEW);
      setScenarios(DEFAULT_SCENARIOS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute total of currently proposed allocations
  const currentProposedTotal = Object.values(editableAllocations).reduce(
    (acc, val) => acc + (Number(val) || 0),
    0
  );
  const isAllocationOverCap = currentProposedTotal > 2000.0;
  const allocationHeadroom = Math.max(0, 2000.0 - currentProposedTotal);

  // Handle allocation change
  const handleAllocationChange = (channelId: number, value: string) => {
    const num = parseFloat(value);
    setEditableAllocations(prev => ({
      ...prev,
      [channelId]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  // Save allocations to backend API
  const handleSaveAllocations = async () => {
    if (isAllocationOverCap) {
      setSaveMessage({
        type: 'error',
        text: `Cannot save: Total allocations (₹${currentProposedTotal.toFixed(2)}) exceed the ₹2,000 maximum budget cap!`
      });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const payload = {
        allocations: Object.entries(editableAllocations).map(([chId, amt]) => ({
          channel_id: parseInt(chId),
          allocated_inr: amt
        }))
      };

      const res = await fetch('/api/budget/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update allocations');
      }

      setOverview(data.overview);
      setSaveMessage({
        type: 'success',
        text: 'Budget allocations successfully updated and audited within ₹2,000 cap!'
      });
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: err.message || 'Error updating allocations'
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset allocations to current database values
  const handleResetAllocations = () => {
    if (!overview) return;
    const initialMap: Record<number, number> = {};
    overview.channel_allocations.forEach(ch => {
      initialMap[ch.channel_id] = ch.allocated_inr;
    });
    setEditableAllocations(initialMap);
    setSaveMessage(null);
  };

  // Recalculate velocity forecast dynamically
  const runVelocityForecast = async () => {
    try {
      const res = await fetch('/api/budget/velocity-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forecastInputs)
      });
      if (res.ok) {
        const data: VelocityForecastResult = await res.json();
        setForecastResult(data);
      }
    } catch (err) {
      console.error('Error running velocity forecast:', err);
    }
  };

  // Run forecast automatically when inputs change
  useEffect(() => {
    runVelocityForecast();
  }, [
    forecastInputs.current_registrations,
    forecastInputs.target,
    forecastInputs.days_remaining,
    forecastInputs.daily_registration_rate,
    forecastInputs.channel_conversion,
    forecastInputs.referral_rate
  ]);

  if (loading && !overview) {
    return (
      <div className="w-full max-w-7xl mx-auto py-16 text-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">Loading Campaign Budget Engine...</h3>
        <p className="text-xs text-slate-400 mt-1">Auditing ledger transactions and scenario projections</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* 1. Executive Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-800/50 text-emerald-300 text-xs font-mono mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phase 9: Strict ₹2,000 Budget Cap Engine</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Campaign Budget & Velocity Engine</span>
              <span className="text-emerald-400 font-mono text-xl sm:text-2xl font-bold bg-emerald-950/80 border border-emerald-800/60 px-3 py-0.5 rounded-xl">
                ₹2,000 Cap
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Strict financial ceiling enforcement, live channel allocation adjustments, scenario modeling (Conservative, Base, Aggressive), and velocity forecasting.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* Global Estimate Disclaimer Alert */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-2 text-xs text-amber-300/90 font-mono">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            <strong>ESTIMATE DISCLAIMER:</strong> All scenario models and velocity forecasts are mathematical projections based on observable run rates.
          </span>
        </div>
      </div>

      {/* 2. Primary KPI Cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Budget Cap */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Budget Cap</span>
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              ₹{overview.max_budget_inr.toLocaleString()}
            </div>
            <div className="text-[11px] text-cyan-400 font-mono mt-1">Strict Limit</div>
          </div>

          {/* Total Allocated */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Allocated</span>
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              ₹{overview.total_allocated_inr.toLocaleString()}
            </div>
            <div className="text-[11px] text-indigo-300 font-mono mt-1">
              {((overview.total_allocated_inr / 2000) * 100).toFixed(0)}% of cap
            </div>
          </div>

          {/* Total Spent */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Spent</span>
              <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">
              ₹{overview.total_spent_inr.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-300/80 font-mono mt-1">
              {overview.budget_utilization_percent}% utilized
            </div>
          </div>

          {/* Remaining Headroom */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Remaining Budget</span>
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              ₹{overview.remaining_budget_inr.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">Unspent balance</div>
          </div>

          {/* Blended CPR */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Blended CPR</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400">
              ₹{overview.blended_cpr_inr.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              ₹{overview.total_spent_inr} / {overview.total_registrations} regs
            </div>
          </div>

          {/* Verified ICP CPR */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Verified CPR</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">
              ₹{overview.verified_cpr_inr.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              {overview.verified_registrations} final-year
            </div>
          </div>
        </div>
      )}

      {/* Budget Utilization Progress Bar */}
      {overview && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <span>Cap Utilization:</span>
              <span className="text-emerald-400 font-bold">₹{overview.total_spent_inr} / ₹2,000.00</span>
            </span>
            <span className={overview.is_over_budget ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {overview.budget_utilization_percent}% Deployed
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overview.is_over_budget
                  ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                  : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 shadow-md shadow-emerald-500/30'
              }`}
              style={{ width: `${Math.min(100, overview.budget_utilization_percent)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 3. Editable Channel Allocations Section */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Channel Budget Allocation & Spend Audit</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Adjust budget limits per marketing channel. The engine strictly blocks allocations exceeding ₹2,000.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetAllocations}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSaveAllocations}
              disabled={saving || isAllocationOverCap}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black text-xs font-bold transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Saving...' : 'Save Allocations'}</span>
            </button>
          </div>
        </div>

        {/* Live Proposed Total Status Bar */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
            isAllocationOverCap
              ? 'bg-rose-950/60 border-rose-700/60 text-rose-300'
              : 'bg-slate-950/80 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isAllocationOverCap ? (
              <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>
              <strong>Proposed Total Allocation:</strong> ₹{currentProposedTotal.toFixed(2)} / ₹2,000.00
            </span>
          </div>
          <div>
            {isAllocationOverCap ? (
              <span className="font-bold text-rose-400 animate-pulse">
                Excess: +₹{(currentProposedTotal - 2000.0).toFixed(2)} (REJECTED)
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">
                Available Unallocated: ₹{allocationHeadroom.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Success / Error Notification */}
        {saveMessage && (
          <div
            className={`p-3 rounded-xl border text-xs font-mono flex items-center space-x-2 ${
              saveMessage.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/70 border-rose-800/60 text-rose-300'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        {/* Channels Grid / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-3 px-3">Channel / Source</th>
                <th className="py-3 px-3">UTM Source</th>
                <th className="py-3 px-3 text-right">Allocated (₹)</th>
                <th className="py-3 px-3 text-right">Actual Spent (₹)</th>
                <th className="py-3 px-3 text-right">Registrations</th>
                <th className="py-3 px-3 text-right">CPR (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {overview?.channel_allocations.map(channel => (
                <tr key={channel.channel_id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-3 font-sans font-semibold text-white">
                    {channel.channel_name}
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px]">
                      {channel.utm_source}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="inline-flex items-center space-x-1">
                      <span className="text-slate-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        max="2000"
                        step="50"
                        value={editableAllocations[channel.channel_id] ?? channel.allocated_inr}
                        onChange={e => handleAllocationChange(channel.channel_id, e.target.value)}
                        className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-cyan-300 font-bold focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-400 font-bold">
                    ₹{channel.spent_inr.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-slate-200">
                    {channel.conversions_count}
                  </td>
                  <td className="py-3.5 px-3 text-right text-amber-400">
                    ₹{channel.cpr_inr.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Three Strategic Scenarios Section */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Strategic Scenario Modeling</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Three calibrated campaign projections comparing registrations, cost, CPR, and risk under different virality regimes.
            </p>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2.5 py-1 rounded-full">
            Target: 500 Registrations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {scenarios.map((sc, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                sc.scenario_name === 'Base'
                  ? 'bg-gradient-to-b from-slate-900 to-indigo-950/50 border-indigo-700/60 shadow-lg shadow-indigo-500/10'
                  : sc.scenario_name === 'Aggressive'
                  ? 'bg-gradient-to-b from-slate-900 to-cyan-950/40 border-cyan-800/50'
                  : 'bg-gradient-to-b from-slate-900 to-amber-950/30 border-amber-900/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    {sc.tag}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      sc.risk_color === 'emerald'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : sc.risk_color === 'cyan'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                        : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                    }`}
                  >
                    {sc.risk_indicator}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white flex items-center justify-between">
                  <span>{sc.scenario_name}</span>
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    {sc.probability_percent}% Prob
                  </span>
                </h3>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed min-h-[48px]">
                  {sc.description}
                </p>

                {/* Primary Metrics Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80 font-mono text-center">
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Expected Regs</div>
                    <div className="text-base font-extrabold text-white mt-0.5">
                      {sc.expected_registrations}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Total Cost</div>
                    <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                      ₹{sc.expected_cost.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-[10px] text-slate-400">Est. CPR</div>
                    <div className="text-base font-extrabold text-amber-400 mt-0.5">
                      ₹{sc.expected_cpr.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Key Assumptions */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5 text-[11px] font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Viral K-Factor:</span>
                    <span className="text-slate-200 font-bold">{sc.assumptions.viral_k_factor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Channel Conv Rate:</span>
                    <span className="text-slate-200 font-bold">{sc.assumptions.channel_conversion_percent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Referral Share:</span>
                    <span className="text-slate-200 font-bold">{sc.assumptions.referral_share_percent}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/40 text-[10px] font-mono text-slate-500 italic text-center">
                * Projected estimate based on simulated parameters
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Registration Velocity Forecasting Engine */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Interactive Registration Velocity Forecaster</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Adjust live run-rate inputs to compute projected final registrations, pacing gap, and status.
            </p>
          </div>

          {forecastResult && (
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center space-x-1.5 ${
                forecastResult.status === 'ON TRACK'
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : forecastResult.status === 'AT RISK'
                  ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                  : 'bg-rose-950/80 border-rose-700 text-rose-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full animate-ping mr-1 bg-current"></span>
              <span>STATUS: {forecastResult.status}</span>
            </div>
          )}
        </div>

        {/* Inputs & Interactive Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Current Registrations */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Current Registrations</span>
              <span className="text-cyan-400 font-mono font-bold">{forecastInputs.current_registrations}</span>
            </div>
            <input
              type="range"
              min="0"
              max="700"
              value={forecastInputs.current_registrations}
              onChange={e =>
                setForecastInputs(prev => ({
                  ...prev,
                  current_registrations: parseInt(e.target.value) || 0
                }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Target */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Campaign Target</span>
              <span className="text-white font-mono font-bold">{forecastInputs.target}</span>
            </div>
            <input
              type="number"
              min="100"
              max="2000"
              value={forecastInputs.target}
              onChange={e =>
                setForecastInputs(prev => ({
                  ...prev,
                  target: parseInt(e.target.value) || 500
                }))
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white font-mono"
            />
          </div>

          {/* Days Remaining */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Days Remaining</span>
              <span className="text-indigo-400 font-mono font-bold">{forecastInputs.days_remaining} Days</span>
            </div>
            <input
              type="range"
              min="0"
              max="7"
              value={forecastInputs.days_remaining}
              onChange={e =>
                setForecastInputs(prev => ({
                  ...prev,
                  days_remaining: parseInt(e.target.value) || 0
                }))
              }
              className="w-full accent-indigo-400 cursor-pointer"
            />
          </div>

          {/* Daily Registration Rate */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Daily Reg Rate (Run-rate)</span>
              <span className="text-emerald-400 font-mono font-bold">{forecastInputs.daily_registration_rate}/day</span>
            </div>
            <input
              type="range"
              min="5"
              max="150"
              value={forecastInputs.daily_registration_rate}
              onChange={e =>
                setForecastInputs(prev => ({
                  ...prev,
                  daily_registration_rate: parseFloat(e.target.value) || 0
                }))
              }
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Channel Conversion % */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Channel Conversion Rate</span>
              <span className="text-amber-400 font-mono font-bold">{forecastInputs.channel_conversion}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="0.5"
              value={forecastInputs.channel_conversion}
              onChange={e =>
                setForecastInputs(prev => ({
                  ...prev,
                  channel_conversion: parseFloat(e.target.value) || 0
                }))
              }
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Referral Rate % */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Referral Rate (Virality)</span>
              <span className="text-cyan-400 font-mono font-bold">{forecastInputs.referral_rate}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              step="0.5"
              value={forecastInputs.referral_rate}
              onChange={e =>
                setForecastInputs(prev => ({
                  ...prev,
                  referral_rate: parseFloat(e.target.value) || 0
                }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Forecast Result Card */}
        {forecastResult && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-950/50 border border-slate-800 shadow-md">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Projected Registrations</div>
                <div className="text-2xl font-extrabold text-white mt-1">
                  {forecastResult.projected_registrations}
                </div>
                <div className="text-[10px] text-cyan-400 mt-0.5">Estimated Final</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Required Daily Rate</div>
                <div className="text-2xl font-extrabold text-indigo-300 mt-1">
                  {forecastResult.required_daily_registrations}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">regs / day</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Pacing Gap</div>
                <div
                  className={`text-2xl font-extrabold mt-1 ${
                    forecastResult.gap >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {forecastResult.gap >= 0 ? `+${forecastResult.gap}` : forecastResult.gap}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">vs 500 target</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-center">
                <div className="text-[11px] text-slate-400">Calculated Status</div>
                <div
                  className={`text-lg font-extrabold mt-1 ${
                    forecastResult.status === 'ON TRACK'
                      ? 'text-emerald-400'
                      : forecastResult.status === 'AT RISK'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {forecastResult.status}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-mono">
                <strong>Strategic Pacing Note:</strong> {forecastResult.recommendation}
              </span>
              <span className="text-[11px] text-amber-400/90 font-mono bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                * Mathematical Estimate
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
