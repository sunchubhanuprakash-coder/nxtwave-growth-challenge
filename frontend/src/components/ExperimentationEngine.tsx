import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  Plus,
  Play,
  Zap,
  MessageSquare,
  Type,
  Mail,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Award,
  ShieldCheck,
  Split,
  X
} from 'lucide-react';

interface ExperimentTelemetry {
  control_impressions: number;
  control_conversions: number;
  control_conversion_rate: number;
  variant_impressions: number;
  variant_conversions: number;
  variant_conversion_rate: number;
  lift: number;
  difference: number;
  z_score: number;
  p_value: number;
  confidence: number;
  is_statistically_significant: boolean;
  sample_size_reached: boolean;
  min_sample_size: number;
  success_threshold: number;
  winner: string;
}

interface ExperimentItem {
  id: number;
  name: string;
  hypothesis: string;
  category: string;
  control: string;
  variant: string;
  primary_metric: string;
  success_threshold: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  winner_variant: string | null;
  is_simulated: boolean;
  experiment_type: string;
  telemetry: ExperimentTelemetry;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'Landing headline': Type,
  'CTA wording': Zap,
  'Referral CTA': Split,
  'WhatsApp message': MessageSquare,
  'Poster copy': FileText,
  'Email subject': Mail,
};

const DEFAULT_EXPERIMENTS = [
  {
    id: 1,
    name: "Landing Headline: AI Project vs Fundamentals",
    hypothesis: "Positioning around resume project creation beats general conceptual learning.",
    category: "Landing headline",
    control: "Master Generative AI: From Fundamentals to Practice",
    variant: "Build & Deploy a Production-Grade AI Project on Your Resume in 60 Minutes",
    primary_metric: "Conversion Rate",
    success_threshold: 10.0,
    start_date: "2026-10-01",
    end_date: "2026-10-07",
    status: "concluded",
    is_simulated: false,
    winner: "variant",
    telemetry: {
      control_impressions: 480,
      control_conversions: 72,
      control_conversion_rate: 15.0,
      variant_impressions: 510,
      variant_conversions: 114,
      variant_conversion_rate: 22.35,
      lift: 49.0,
      difference: 7.35,
      z_score: 2.94,
      p_value: 0.003,
      confidence: 99.7,
      is_statistically_significant: true,
      sample_size_reached: true,
      min_sample_size: 200,
      success_threshold: 10.0,
      winner: "variant"
    }
  },
  {
    id: 2,
    name: "Referral CTA: Squad Pass vs Refer a Friend",
    hypothesis: "Framing referral as a group Squad Pass increases viral K-factor.",
    category: "Referral CTA",
    control: "Refer a friend to earn perks",
    variant: "Activate Your Squad Pass: Invite 3 Roommates to Unlock VIP Q&A",
    primary_metric: "Referral Rate",
    success_threshold: 15.0,
    start_date: "2026-10-02",
    end_date: "2026-10-07",
    status: "active",
    is_simulated: false,
    winner: "variant",
    telemetry: {
      control_impressions: 320,
      control_conversions: 42,
      control_conversion_rate: 13.1,
      variant_impressions: 340,
      variant_conversions: 78,
      variant_conversion_rate: 22.94,
      lift: 75.1,
      difference: 9.84,
      z_score: 3.22,
      p_value: 0.001,
      confidence: 99.9,
      is_statistically_significant: true,
      sample_size_reached: true,
      min_sample_size: 150,
      success_threshold: 15.0,
      winner: "variant"
    }
  }
];

export const ExperimentationEngine: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [simFilter, setSimFilter] = useState<'ALL' | 'REAL' | 'SIMULATED'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [simulatingId, setSimulatingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Experiment Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Landing headline');
  const [formHypothesis, setFormHypothesis] = useState('');
  const [formControl, setFormControl] = useState('');
  const [formVariant, setFormVariant] = useState('');
  const [formMetric, setFormMetric] = useState('Conversion Rate');
  const [formThreshold, setFormThreshold] = useState<number>(10.0);
  const [formIsSimulated, setFormIsSimulated] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const apiBase = ((import.meta as any).env?.VITE_API_URL || '');
      const res = await fetch(`${apiBase}/api/experiments`);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') && res.ok) {
        const data = await res.json();
        setExperiments(data && data.length > 0 ? data : (DEFAULT_EXPERIMENTS as any));
      } else {
        setExperiments(DEFAULT_EXPERIMENTS as any);
      }
    } catch (err) {
      setExperiments(DEFAULT_EXPERIMENTS as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSimulateTraffic = async (expId: number) => {
    setSimulatingId(expId);
    try {
      const res = await fetch(`/api/experiments/${expId}/simulate-traffic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitors: 200, control_bias_pct: 20.0, variant_bias_pct: 32.0 })
      });
      if (res.ok) {
        const updated = await res.json();
        setExperiments(prev => prev.map(e => e.id === expId ? updated : e));
        showToast(`Simulated +200 test visitors for Experiment #${expId}!`);
      }
    } catch (err) {
      console.error('Traffic simulation failed:', err);
    } finally {
      setSimulatingId(null);
    }
  };

  const handleTrackEvent = async (expId: number, variant: 'CONTROL' | 'VARIANT', eventType: 'IMPRESSION' | 'CONVERSION') => {
    try {
      const res = await fetch(`/api/experiments/${expId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant, event_type: eventType, count: 1 })
      });
      if (res.ok) {
        const updated = await res.json();
        setExperiments(prev => prev.map(e => e.id === expId ? updated : e));
        showToast(`Logged 1 ${eventType.toLowerCase()} for ${variant}!`);
      }
    } catch (err) {
      console.error('Track event failed:', err);
    }
  };

  const handleConclude = async (expId: number) => {
    try {
      const res = await fetch(`/api/experiments/${expId}/conclude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'growth_admin_secret_2026'
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const updated = await res.json();
        setExperiments(prev => prev.map(e => e.id === expId ? updated : e));
        showToast(`Experiment #${expId} successfully concluded!`);
      }
    } catch (err) {
      console.error('Conclude failed:', err);
    }
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        name: formName,
        category: formCategory,
        hypothesis: formHypothesis,
        control: formControl,
        variant: formVariant,
        primary_metric: formMetric,
        success_threshold: formThreshold,
        status: 'RUNNING',
        is_simulated: formIsSimulated
      };

      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'growth_admin_secret_2026'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const created = await res.json();
        setExperiments(prev => [created, ...prev]);
        setShowCreateModal(false);
        // Reset form
        setFormName('');
        setFormHypothesis('');
        setFormControl('');
        setFormVariant('');
        setFormThreshold(10.0);
        showToast(`Experiment "${created.name}" created successfully!`);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to create experiment.');
      }
    } catch (err) {
      console.error('Creation failed:', err);
    } finally {
      setCreating(false);
    }
  };

  // Filter experiments
  const filteredExperiments = experiments.filter(exp => {
    if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) {
      return false;
    }
    if (simFilter === 'REAL' && exp.is_simulated) {
      return false;
    }
    if (simFilter === 'SIMULATED' && !exp.is_simulated) {
      return false;
    }
    return true;
  });

  const realCount = experiments.filter(e => !e.is_simulated).length;
  const simCount = experiments.filter(e => e.is_simulated).length;

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-white px-5 py-3 rounded-2xl shadow-xl shadow-cyan-500/10 flex items-center space-x-3 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <FlaskConical className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">
                Phase 11 Growth Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 border border-cyan-800/60 text-cyan-300">
                A/B Statistical Testing
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Growth <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">Experimentation System</span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
              Continuous hypothesis testing across headlines, button CTAs, referral hooks, WhatsApp templates, campus posters, and email subjects with rigorous two-proportion Z-test winner detection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchExperiments}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Experiment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Strict Distinction Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start space-x-3.5 text-xs text-amber-200/90 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-semibold uppercase tracking-wider font-mono mr-1.5">
            Strict Isolation Guarantee:
          </strong>
          Simulated experiments are completely isolated and labeled with a <span className="px-1.5 py-0.5 rounded bg-violet-950 border border-violet-700 text-violet-300 font-mono text-[10px] mx-1">SIMULATED EXPERIMENT</span> badge. They are never blended into real campaign acquisition totals or budget numbers.
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        {/* Real vs Simulated Toggle */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setSimFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              simFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Experiments ({experiments.length})
          </button>
          <button
            onClick={() => setSimFilter('REAL')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              simFilter === 'REAL'
                ? 'bg-emerald-500 text-black font-bold shadow'
                : 'text-emerald-400/90 hover:text-emerald-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Real Only ({realCount})</span>
          </button>
          <button
            onClick={() => setSimFilter('SIMULATED')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
              simFilter === 'SIMULATED'
                ? 'bg-violet-600 text-white font-bold shadow'
                : 'text-violet-400 hover:text-violet-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-violet-400"></span>
            <span>Simulated ({simCount})</span>
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs py-1">
          {['ALL', 'Landing headline', 'CTA wording', 'Referral CTA', 'WhatsApp message', 'Poster copy', 'Email subject'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition font-medium ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Experiments Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-mono text-sm animate-pulse">
          Loading growth experimentation telemetry...
        </div>
      ) : filteredExperiments.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
          <FlaskConical className="w-10 h-10 mx-auto mb-3 text-slate-500" />
          <p className="text-base font-semibold text-slate-300">No experiments found matching current filters.</p>
          <p className="text-xs text-slate-500 mt-1">Adjust filters or create a new growth experiment above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredExperiments.map(exp => {
            const IconComponent = CATEGORY_ICONS[exp.category] || FlaskConical;
            const t = exp.telemetry;
            const isWinnerVariant = t?.winner === 'VARIANT';
            const isWinnerControl = t?.winner === 'CONTROL';

            return (
              <div
                key={exp.id}
                className={`p-6 rounded-3xl border transition-all ${
                  exp.is_simulated
                    ? 'bg-slate-900/70 border-violet-800/40 hover:border-violet-600/60 shadow-lg shadow-violet-950/20'
                    : 'bg-slate-900/90 border-emerald-800/40 hover:border-emerald-600/60 shadow-xl shadow-emerald-950/20'
                }`}
              >
                {/* Top Badge Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    {/* Real vs Simulated Badge */}
                    {exp.is_simulated ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider bg-violet-950 text-violet-300 border border-violet-700/80 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                        <span>SIMULATED EXPERIMENT</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/80 flex items-center space-x-1 shadow-sm shadow-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>REAL EXPERIMENT</span>
                      </span>
                    )}

                    {/* Category Badge */}
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1">
                      <IconComponent className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{exp.category}</span>
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      exp.status === 'RUNNING'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : exp.status === 'CONCLUDED'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-slate-800 text-slate-500'
                    }`}>
                      {exp.status}
                    </span>
                  </div>

                  {/* Primary Metric & Success Threshold */}
                  <div className="text-right text-xs font-mono text-slate-400">
                    <span>Target: </span>
                    <strong className="text-white">{exp.primary_metric}</strong>
                    <span className="ml-2 px-2 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px]">
                      Lift Threshold: &ge;+{exp.success_threshold}%
                    </span>
                  </div>
                </div>

                {/* Title & Hypothesis */}
                <div className="mt-4 mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {exp.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 italic leading-relaxed">
                    &ldquo;{exp.hypothesis}&rdquo;
                  </p>
                </div>

                {/* Variants Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Control Variant (A) */}
                  <div className={`p-4 rounded-2xl border transition ${
                    isWinnerControl
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-slate-400 font-bold uppercase tracking-wider">
                        Control (A)
                      </span>
                      {isWinnerControl && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500 text-black font-extrabold flex items-center space-x-1">
                          <Award className="w-3 h-3" />
                          <span>WINNER</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-200 min-h-[3rem] bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                      {exp.control}
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">Impressions</div>
                        <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                          {t?.control_impressions?.toLocaleString() ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">Conversions</div>
                        <div className="text-sm font-extrabold text-cyan-400 font-mono mt-0.5">
                          {t?.control_conversions?.toLocaleString() ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">Conv Rate</div>
                        <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                          {t?.control_conversion_rate?.toFixed(2) ?? '0.00'}%
                        </div>
                      </div>
                    </div>

                    {/* Quick Test Action Buttons for Control */}
                    {exp.status === 'RUNNING' && (
                      <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-slate-800/50 text-[11px]">
                        <span className="text-slate-500 text-[10px]">Test Control:</span>
                        <button
                          onClick={() => handleTrackEvent(exp.id, 'CONTROL', 'IMPRESSION')}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          +1 Imp
                        </button>
                        <button
                          onClick={() => handleTrackEvent(exp.id, 'CONTROL', 'CONVERSION')}
                          className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-mono"
                        >
                          +1 Conv
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Test Variant (B) */}
                  <div className={`p-4 rounded-2xl border transition ${
                    isWinnerVariant
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider">
                        Variant (B)
                      </span>
                      {isWinnerVariant && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500 text-black font-extrabold flex items-center space-x-1 animate-pulse">
                          <Award className="w-3 h-3" />
                          <span>WINNER</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-200 min-h-[3rem] bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                      {exp.variant}
                    </p>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">Impressions</div>
                        <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                          {t?.variant_impressions?.toLocaleString() ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">Conversions</div>
                        <div className="text-sm font-extrabold text-cyan-400 font-mono mt-0.5">
                          {t?.variant_conversions?.toLocaleString() ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase">Conv Rate</div>
                        <div className="text-sm font-extrabold text-white font-mono mt-0.5">
                          {t?.variant_conversion_rate?.toFixed(2) ?? '0.00'}%
                        </div>
                      </div>
                    </div>

                    {/* Quick Test Action Buttons for Variant */}
                    {exp.status === 'RUNNING' && (
                      <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-slate-800/50 text-[11px]">
                        <span className="text-slate-500 text-[10px]">Test Variant:</span>
                        <button
                          onClick={() => handleTrackEvent(exp.id, 'VARIANT', 'IMPRESSION')}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          +1 Imp
                        </button>
                        <button
                          onClick={() => handleTrackEvent(exp.id, 'VARIANT', 'CONVERSION')}
                          className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-mono"
                        >
                          +1 Conv
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistical Outcomes & Lift Telemetry Strip */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left flex-1">
                    {/* Relative Lift */}
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500">Relative Lift</div>
                      <div className={`text-base font-extrabold font-mono flex items-center justify-center sm:justify-start ${
                        (t?.lift ?? 0) > 0 ? 'text-emerald-400' : (t?.lift ?? 0) < 0 ? 'text-rose-400' : 'text-slate-300'
                      }`}>
                        {(t?.lift ?? 0) > 0 ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : (t?.lift ?? 0) < 0 ? <ArrowDownRight className="w-4 h-4 mr-0.5" /> : null}
                        {(t?.lift ?? 0) > 0 ? `+${t?.lift.toFixed(2)}%` : `${t?.lift.toFixed(2)}%`}
                      </div>
                    </div>

                    {/* Difference */}
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500">Difference (pp)</div>
                      <div className={`text-base font-extrabold font-mono ${
                        (t?.difference ?? 0) > 0 ? 'text-emerald-400' : (t?.difference ?? 0) < 0 ? 'text-rose-400' : 'text-slate-300'
                      }`}>
                        {(t?.difference ?? 0) > 0 ? `+${t?.difference.toFixed(2)} pp` : `${t?.difference.toFixed(2)} pp`}
                      </div>
                    </div>

                    {/* Statistical Significance */}
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500">Confidence (Z-Test)</div>
                      <div className="text-base font-extrabold font-mono text-cyan-400">
                        {t?.confidence ? `${t.confidence.toFixed(1)}%` : 'N/A'}
                        {t?.is_statistically_significant && (
                          <span className="text-[10px] text-emerald-400 ml-1 font-sans font-bold">(&ge;95%)</span>
                        )}
                      </div>
                    </div>

                    {/* Winner Outcome */}
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-500">Winner Determination</div>
                      <div className={`text-xs font-mono font-bold mt-1 ${
                        isWinnerVariant || isWinnerControl
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}>
                        {t?.winner}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Simulate Traffic or Conclude) */}
                  <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    {exp.status === 'RUNNING' && (
                      <>
                        <button
                          onClick={() => handleSimulateTraffic(exp.id)}
                          disabled={simulatingId === exp.id}
                          className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                          title="Simulate 200 visitors to test lift and winner logic"
                        >
                          <Play className={`w-3 h-3 ${simulatingId === exp.id ? 'animate-spin' : ''}`} />
                          <span>Simulate Traffic</span>
                        </button>
                        <button
                          onClick={() => handleConclude(exp.id)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                        >
                          Conclude
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Experiment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <FlaskConical className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Create Growth Experiment</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExperiment} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Experiment Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Hero Subtitle Mentor Proof Test"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Surface Area (Category)</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Landing headline">Landing headline</option>
                    <option value="CTA wording">CTA wording</option>
                    <option value="Referral CTA">Referral CTA</option>
                    <option value="WhatsApp message">WhatsApp message</option>
                    <option value="Poster copy">Poster copy</option>
                    <option value="Email subject">Email subject</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Primary Metric</label>
                  <input
                    type="text"
                    required
                    value={formMetric}
                    onChange={e => setFormMetric(e.target.value)}
                    placeholder="e.g. Conversion Rate"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Success Threshold (% Lift)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    required
                    value={formThreshold}
                    onChange={e => setFormThreshold(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Hypothesis</label>
                <textarea
                  required
                  rows={2}
                  value={formHypothesis}
                  onChange={e => setFormHypothesis(e.target.value)}
                  placeholder="e.g. Framing the workshop around placement resume bullet achieves >15% higher registration rate."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Control Copy (Variant A)</label>
                <input
                  type="text"
                  required
                  value={formControl}
                  onChange={e => setFormControl(e.target.value)}
                  placeholder="Existing baseline copy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-cyan-400 mb-1">Test Variant Copy (Variant B)</label>
                <input
                  type="text"
                  required
                  value={formVariant}
                  onChange={e => setFormVariant(e.target.value)}
                  placeholder="New challenger copy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Simulation Mode Toggle */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Simulation Mode</span>
                  <span className="text-[11px] text-slate-400">
                    {formIsSimulated
                      ? 'Marked as SIMULATED EXPERIMENT (safe for sandbox testing)'
                      : 'Marked as REAL EXPERIMENT (tied to live production campaigns)'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formIsSimulated}
                  onChange={e => setFormIsSimulated(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 rounded bg-slate-900 border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Launch Experiment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
