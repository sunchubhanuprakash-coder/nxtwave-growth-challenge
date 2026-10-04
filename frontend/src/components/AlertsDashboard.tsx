import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ArrowRight,
  ShieldAlert,
  Search,
  Check,
  Eye,
  Sparkles,
  Layers,
  Activity
} from 'lucide-react';

export interface GrowthAlertItem {
  id: number;
  alert_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  detected_metric?: string;
  reason?: string;
  recommended_action?: string;
  is_acknowledged: boolean;
  is_simulated: boolean;
  created_at?: string;
}

export interface AlertSummaryData {
  total_alerts: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  unacknowledged_count: number;
  evaluated_at: string;
  alerts: GrowthAlertItem[];
}

interface AlertsDashboardProps {
  onNavigateToView?: (view: string) => void;
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    bg: 'bg-red-950/40',
    border: 'border-red-500/60',
    badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
    icon: AlertOctagon,
    iconColor: 'text-red-400',
    glow: 'shadow-red-500/10'
  },
  WARNING: {
    bg: 'bg-amber-950/30',
    border: 'border-amber-500/50',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    glow: 'shadow-amber-500/10'
  },
  INFO: {
    bg: 'bg-cyan-950/20',
    border: 'border-cyan-500/40',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    icon: CheckCircle2,
    iconColor: 'text-cyan-400',
    glow: 'shadow-cyan-500/10'
  }
};

const ALERT_CATEGORIES: Record<string, { label: string; viewTarget?: string; targetLabel?: string }> = {
  REGISTRATION_VELOCITY: {
    label: 'Registration Velocity',
    viewTarget: 'simulation',
    targetLabel: 'Simulate Velocity'
  },
  REFERRAL_RATE_DECLINE: {
    label: 'Referral Virality',
    viewTarget: 'automations',
    targetLabel: 'Referral Reminders'
  },
  HIGH_TRAFFIC_LOW_CONVERSION: {
    label: 'Traffic & Conversion',
    viewTarget: 'experiments',
    targetLabel: 'A/B Test Headlines'
  },
  BUDGET_OVERSPENDING: {
    label: 'Budget Pacing',
    viewTarget: 'budget',
    targetLabel: 'Manage Budget'
  },
  CHANNEL_UNDERPERFORMANCE: {
    label: 'Channel Attribution',
    viewTarget: 'attribution',
    targetLabel: 'UTM Builder'
  },
  REGISTRATION_SPIKE: {
    label: 'Registration Surge',
    viewTarget: 'growth_dashboard',
    targetLabel: 'Cohort Dashboard'
  },
  FORECAST_FALLING_BELOW_500: {
    label: '500-Seat Milestone Forecast',
    viewTarget: 'simulation',
    targetLabel: 'Run Scenario'
  }
};

export const AlertsDashboard: React.FC<AlertsDashboardProps> = ({ onNavigateToView }) => {
  const [alerts, setAlerts] = useState<GrowthAlertItem[]>([]);
  const [summary, setSummary] = useState<AlertSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [unacknowledgedOnly, setUnacknowledgedOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);

  // Load summary and alerts
  const fetchAlertsData = async (manualEvaluate = false) => {
    try {
      if (manualEvaluate) {
        setEvaluating(true);
        const res = await fetch('/api/alerts/evaluate', { method: 'POST' });
        if (res.ok) {
          const data: AlertSummaryData = await res.json();
          setSummary(data);
          setAlerts(data.alerts);
        }
      } else {
        setLoading(true);
        const res = await fetch('/api/alerts/summary?auto_evaluate=true');
        if (res.ok) {
          const data: AlertSummaryData = await res.json();
          setSummary(data);
          setAlerts(data.alerts);
        }
      }
    } catch (err) {
      console.error('Failed to load growth alerts:', err);
    } finally {
      setLoading(false);
      setEvaluating(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, []);

  // Handle acknowledge toggle
  const handleAcknowledge = async (alertId: number) => {
    try {
      setAcknowledgingId(alertId);
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PATCH' });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, is_acknowledged: !a.is_acknowledged } : a))
        );
        if (summary) {
          const target = alerts.find((a) => a.id === alertId);
          const wasAck = target?.is_acknowledged;
          setSummary({
            ...summary,
            unacknowledged_count: wasAck
              ? summary.unacknowledged_count + 1
              : Math.max(0, summary.unacknowledged_count - 1)
          });
        }
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== 'ALL' && alert.severity !== severityFilter) {
      return false;
    }
    if (unacknowledgedOnly && alert.is_acknowledged) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = alert.title.toLowerCase().includes(term);
      const matchMetric = alert.detected_metric?.toLowerCase().includes(term) ?? false;
      const matchReason = alert.reason?.toLowerCase().includes(term) ?? false;
      const matchAction = alert.recommended_action?.toLowerCase().includes(term) ?? false;
      return matchTitle || matchMetric || matchReason || matchAction;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/60 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-red-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-3">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>PHASE 14 • AUTOMATIC GROWTH ALERTS ENGINE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Proactive Growth Guardrails & Telemetry Alerts
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Continuous mathematical detection of velocity deficits, referral compounding decay, funnel conversion leaks, budget burns, channel decay, and registration spikes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchAlertsData(true)}
              disabled={evaluating}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
              <span>{evaluating ? 'Evaluating Telemetry...' : 'Re-Evaluate Real Metrics'}</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Monitored Guardrails</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {summary?.total_alerts ?? 7}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">7 Core Detection Categories</div>
          </div>

          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40">
            <div className="text-red-300 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Critical Breaches</span>
              <AlertOctagon className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-400">
              {summary?.critical_count ?? 0}
            </div>
            <div className="text-[11px] text-red-300/80 mt-1">Requires immediate intervention</div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40">
            <div className="text-amber-300 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Warnings Pending</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
              {summary?.warning_count ?? 0}
            </div>
            <div className="text-[11px] text-amber-300/80 mt-1">Suboptimal run-rate pacing</div>
          </div>

          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40">
            <div className="text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Healthy Guardrails</span>
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300">
              {summary?.info_count ?? 0}
            </div>
            <div className="text-[11px] text-cyan-300/80 mt-1">Operating above threshold</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
        {/* Severity Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => {
            const isActive = severityFilter === sev;
            const count =
              sev === 'ALL'
                ? summary?.total_alerts ?? alerts.length
                : sev === 'CRITICAL'
                ? summary?.critical_count ?? 0
                : sev === 'WARNING'
                ? summary?.warning_count ?? 0
                : summary?.info_count ?? 0;

            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  isActive
                    ? sev === 'CRITICAL'
                      ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                      : sev === 'WARNING'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : sev === 'INFO'
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <span>{sev === 'ALL' ? 'All Alerts' : sev}</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30 font-mono">
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setUnacknowledgedOnly(!unacknowledgedOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              unacknowledgedOnly
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Unacknowledged Only</span>
            {summary && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/30 font-mono">
                {summary.unacknowledged_count}
              </span>
            )}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search metric, condition, action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Evaluating real campaign database metrics...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Alerts Match Your Active Filter</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Try resetting your search or severity filters to view all 7 automated growth guardrails.
          </p>
          <button
            onClick={() => {
              setSeverityFilter('ALL');
              setUnacknowledgedOnly(false);
              setSearchTerm('');
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredAlerts.map((alert, index) => {
            const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
            const Icon = config.icon;
            const categoryMeta = ALERT_CATEGORIES[alert.alert_type] || {
              label: alert.alert_type.replace(/_/g, ' ')
            };

            return (
              <div
                key={alert.id || index}
                className={`rounded-2xl border ${config.border} ${config.bg} p-6 transition-all duration-200 hover:border-slate-600 ${config.glow} relative overflow-hidden`}
              >
                {/* Header Row: Category, Severity Badge, Acknowledge Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl ${config.badgeBg}`}>
                      <Icon className={`w-5 h-5 ${config.iconColor}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                          {categoryMeta.label}
                        </span>
                        {alert.is_simulated && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                            Telemetry Guardrail
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                        {alert.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase border ${config.badgeBg} flex items-center space-x-1.5`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                      <span>{alert.severity}</span>
                    </span>

                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={acknowledgingId === alert.id}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 border ${
                        alert.is_acknowledged
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                      title={alert.is_acknowledged ? 'Click to mark unacknowledged' : 'Mark as acknowledged'}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{alert.is_acknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
                    </button>
                  </div>
                </div>

                {/* 3 Core Data Blocks: Detected Metric, Reason, Recommended Action */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
                  {/* Block 1: Detected Metric */}
                  <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Detected Metric (Live Telemetry)</span>
                      </div>
                      <div className="font-mono text-xs sm:text-sm font-semibold text-cyan-300 bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-800/40 leading-relaxed break-words">
                        {alert.detected_metric || alert.message}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-3">
                      Computed from active database events & run-rate telemetry
                    </div>
                  </div>

                  {/* Block 2: Reason / Diagnosis */}
                  <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reason & Telemetry Diagnosis</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {alert.reason || alert.message}
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-3">
                      Trigger rule evaluated against 500-seat milestone threshold
                    </div>
                  </div>

                  {/* Block 3: Recommended Action */}
                  <div className="rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-950/80 border border-indigo-700/40 p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Recommended Action (Metric-Driven)</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                        {alert.recommended_action ||
                          'Monitor daily cohort pace and review channel acquisition allocations.'}
                      </p>
                    </div>

                    {categoryMeta.viewTarget && onNavigateToView && (
                      <div className="mt-4 pt-3 border-t border-indigo-900/40 flex justify-end">
                        <button
                          onClick={() => onNavigateToView(categoryMeta.viewTarget!)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center space-x-1 shadow-md shadow-indigo-600/20"
                        >
                          <span>{categoryMeta.targetLabel || 'Take Action'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Architecture & Methodology Callout */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 text-xs text-slate-400 leading-relaxed space-y-3">
        <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span>Automated Growth Alert Architecture (Phase 14)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-mono text-cyan-400 font-bold block mb-1">1. Velocity & Pacing</span>
            Compares live registrations/day against required run-rate to reach 500 verified final-year students before Day 7 deadline.
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-mono text-amber-400 font-bold block mb-1">2. Viral Compounding</span>
            Calculates student-to-student K-factor. Flags decay below 1.0 threshold when secondary peer invitations taper off.
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="font-mono text-red-400 font-bold block mb-1">3. Budget & CPR Cap</span>
            Guarantees total spend remains under ₹2,000 cap and cost per registration (CPR) does not exceed ₹4.00/student.
          </div>
        </div>
      </div>
    </div>
  );
};
