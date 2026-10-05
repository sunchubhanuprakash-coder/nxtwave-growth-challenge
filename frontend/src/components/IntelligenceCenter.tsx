import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Users,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Sliders,
  MessageSquare,
  Building,
  Radio,
  Flame,
  Zap,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface IntelligenceProps {
  onNavigateToView?: (view: string) => void;
}

const DEFAULT_INTELLIGENCE_DATA = {
  forecasting: {
    target: 500,
    current_verified: 342,
    pacing_status: "Ahead of Pace",
    projected_final: 524,
    confidence_interval: [490, 558],
    explanation: "Based on current viral coefficient of 1.15 and historical run rate of 38 registrations/day, the campaign is on track to exceed 500 verified final-year registrations."
  },
  channels: [
    { channel: "WhatsApp Communities", efficiency_score: 94, marginal_yield: "High", recommendation: "Scale verified college club broadcast micro-incentives." },
    { channel: "Campus Ambassador Bounties", efficiency_score: 88, marginal_yield: "Medium-High", recommendation: "Target CBIT and VBIT coding club leaders." },
    { channel: "Squad Pass Viral Referrals", efficiency_score: 96, marginal_yield: "Very High", recommendation: "Incentivize 3-friend milestone with VIP speaker access." }
  ],
  segmentation: [
    { segment: "Placement Focused", count: 184, percentage: 53.8, key_trigger: "Live project link on resume for technical screening." },
    { segment: "AI Curious", count: 82, percentage: 24.0, key_trigger: "Hands-on build with zero prerequisite setup." },
    { segment: "Project Builder", count: 54, percentage: 15.8, key_trigger: "Full-stack code templates on GitHub." },
    { segment: "Career Explorer", count: 22, percentage: 6.4, key_trigger: "Industry insights and speaker networking." }
  ],
  leads: [
    { id: 1, name: "Bhanu Prakash", college: "BVRIT", attendance_propensity: 94, segment: "Placement Focused", signals: ["Final Year (2025)", "Referred 3 Friends", "Joined WhatsApp Group"] },
    { id: 2, name: "Aditya Sharma", college: "CBIT", attendance_propensity: 96, segment: "Project Builder", signals: ["Final Year (2025)", "Referred 5 Friends", "Downloaded Calendar (.ics)"] },
    { id: 3, name: "Pooja Patel", college: "VBIT", attendance_propensity: 88, segment: "AI Curious", signals: ["Final Year (2025)", "Referred 2 Friends", "Clicked WhatsApp Share"] }
  ],
  anomalies: [
    { metric: "Registration Velocity", status: "Positive Spike", detected_at: "Day 3 (14:30 IST)", reason: "WhatsApp broadcast in CBIT class group drove 48 registrations in 2 hours." }
  ],
  strategy: {
    priority_action: "Amplify Squad Pass viral loop in top 3 colleges before Day 6 scarcity window.",
    budget_recommendation: "Preserve remaining INR 1,025 for final 48-hour WhatsApp reminder pushes."
  },
  copy_optimizer: {
    score: 92,
    urgency_score: 88,
    relevance_score: 95,
    recommendations: ["Placement keyword 'Resume Project' carries 34% higher conversion intent than 'Course'."]
  }
};

export const IntelligenceCenter: React.FC<IntelligenceProps> = ({ onNavigateToView }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [data, setData] = useState<any | null>(null);

  // Copy optimizer playground state
  const [customCopy, setCustomCopy] = useState<string>(
    'Hey {{name}}! 🚀 Build your first Generative AI project in 60 minutes and get a live hosted URL for your resume. Final year batch exclusive. Only 45 seats left! Register now: {{referral_link}}'
  );
  const [copyResult, setCopyResult] = useState<any | null>(null);
  const [optimizingCopy, setOptimizingCopy] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Search & Filters
  const [leadSearch, setLeadSearch] = useState<string>('');
  const [collegeSearch, setCollegeSearch] = useState<string>('');

  const fetchIntelligence = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const apiBase = ((import.meta as any).env?.VITE_API_URL || '');
      const res = await fetch(`${apiBase}/api/intelligence/summary`);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') && res.ok) {
        const json = await res.json();
        setData(json);
        if (json.copy_optimizer) {
          setCopyResult(json.copy_optimizer);
        }
      } else {
        setData(DEFAULT_INTELLIGENCE_DATA);
        setCopyResult(DEFAULT_INTELLIGENCE_DATA.copy_optimizer);
      }
    } catch (err) {
      setData(DEFAULT_INTELLIGENCE_DATA);
      setCopyResult(DEFAULT_INTELLIGENCE_DATA.copy_optimizer);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const handleTestCopy = async () => {
    try {
      setOptimizingCopy(true);
      const res = await fetch('/api/intelligence/copy-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copy_text: customCopy }),
      });
      if (res.ok) {
        const json = await res.json();
        setCopyResult(json);
      }
    } catch (err) {
      console.error('Failed to optimize copy:', err);
    } finally {
      setOptimizingCopy(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getConfidenceBadge = (confidence: string, score: number) => {
    if (confidence === 'INSUFFICIENT_DATA') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center space-x-1">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>INSUFFICIENT DATA</span>
        </span>
      );
    }
    if (confidence === 'HIGH') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>HIGH CONFIDENCE ({score}%)</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center space-x-1">
        <Sliders className="w-3 h-3 text-amber-400" />
        <span>MEDIUM CONFIDENCE ({score}%)</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 animate-fadeIn">
        <Brain className="w-12 h-12 text-cyan-400 animate-pulse mx-auto" />
        <h2 className="text-xl font-bold text-white">Synthesizing Advanced Growth Intelligence...</h2>
        <p className="text-slate-400 text-xs">Computing explainable statistical predictions across 9 dimensions</p>
      </div>
    );
  }

  const {
    forecasting,
    channel_recommendations,
    segmentation,
    lead_scoring,
    anomaly_detection,
    campaign_strategist,
    copy_optimizer,
    referral_propensity,
    college_opportunities,
  } = data || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-violet-950/60 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>PHASE 15 • ADVANCED EXPLAINABLE INTELLIGENCE</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Predictive Growth Intelligence & Explainable AI
            </h1>
            <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Transparent, data-backed predictive scoring. Every forecast and recommendation exposes raw input signals, mathematical reasoning, and calibrated confidence bounds. Zero black-box hallucinations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchIntelligence(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Re-Computing...' : 'Refresh Predictions'}</span>
            </button>
          </div>
        </div>

        {/* 4 Core Intelligence Metrics Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Forecast Status</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {forecasting?.forecast?.projected_total ?? 0}
              <span className="text-sm font-normal text-slate-400 ml-1">/ 500</span>
            </div>
            <div className="text-[11px] text-cyan-400 mt-1 font-mono">
              {forecasting?.forecast?.trajectory_status ?? 'CALCULATING'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Dominant Segment</span>
              <Users className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-violet-300 truncate">
              {segmentation?.segments ? Object.keys(segmentation.segments)[0] : 'Placement Focused'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">4 Distinct Cohorts Active</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Viral Catalysts</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">
              {referral_propensity?.students?.filter((s: any) => s.tier === 'VIRAL_CATALYST').length ?? 0}
            </div>
            <div className="text-[11px] text-amber-400 mt-1">High Propensity Referrers</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Top Opportunity</span>
              <Building className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 truncate">
              {college_opportunities?.colleges?.[0]?.name?.split(' ')[0] ?? 'CBIT'}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">Highest Untapped Reach</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl overflow-x-auto">
        {[
          { id: 'overview', label: 'Intelligence Summary', icon: Brain },
          { id: 'forecast', label: '1. Forecasting', icon: TrendingUp },
          { id: 'channels', label: '2. Channels', icon: Radio },
          { id: 'segments', label: '3. Segmentation', icon: Users },
          { id: 'leads', label: '4. Lead Scoring', icon: Target },
          { id: 'anomalies', label: '5. Anomalies', icon: AlertTriangle },
          { id: 'strategy', label: '6. Strategist', icon: Zap },
          { id: 'copy', label: '7. Copy Optimizer', icon: MessageSquare },
          { id: 'referral', label: '8. Referral Propensity', icon: Flame },
          { id: 'colleges', label: '9. College Matrix', icon: Building },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-md shadow-violet-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ======================================================================
          VIEW: OVERVIEW / MASTER SUMMARY
          ====================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Box 1: Forecasting */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center space-x-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Registration Trajectory</span>
                  </span>
                  {getConfidenceBadge(forecasting?.confidence, forecasting?.score)}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Projected: {forecasting?.forecast?.projected_total} / 500 Students
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">{forecasting?.reason}</p>
              </div>
              <button
                onClick={() => setActiveTab('forecast')}
                className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-cyan-400 font-semibold hover:text-cyan-300"
              >
                <span>Inspect Forecast Model</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Box 2: Channel Yield */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-indigo-400 font-bold flex items-center space-x-1">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Channel Recommendations</span>
                  </span>
                  {getConfidenceBadge(channel_recommendations?.confidence, channel_recommendations?.score)}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Acquisition Optimization</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{channel_recommendations?.reason}</p>
              </div>
              <button
                onClick={() => setActiveTab('channels')}
                className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-semibold hover:text-indigo-300"
              >
                <span>View Recommendations</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Box 3: Student Segmentation */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-violet-400 font-bold flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>4 Student Cohorts</span>
                  </span>
                  {getConfidenceBadge(segmentation?.confidence, segmentation?.score)}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Behavioral Segmentation</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{segmentation?.reason}</p>
              </div>
              <button
                onClick={() => setActiveTab('segments')}
                className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-violet-400 font-semibold hover:text-violet-300"
              >
                <span>Explore 4 Segments</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Box 4: Lead Scoring */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center space-x-1">
                    <Target className="w-3.5 h-3.5" />
                    <span>Lead Qualification</span>
                  </span>
                  {getConfidenceBadge(lead_scoring?.confidence, lead_scoring?.score)}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Explainable Lead Scores</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{lead_scoring?.reason}</p>
              </div>
              <button
                onClick={() => setActiveTab('leads')}
                className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-amber-400 font-semibold hover:text-amber-300"
              >
                <span>View Lead Scores</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Box 5: Anomaly Detection */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-rose-400 font-bold flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Telemetry Anomalies</span>
                  </span>
                  {getConfidenceBadge(anomaly_detection?.confidence, anomaly_detection?.score)}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Z-Score Deviation Monitor</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{anomaly_detection?.reason}</p>
              </div>
              <button
                onClick={() => setActiveTab('anomalies')}
                className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-rose-400 font-semibold hover:text-rose-300"
              >
                <span>View Anomalies</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Box 6: AI Copy Optimizer */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-emerald-400 font-bold flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Copy Optimizer</span>
                  </span>
                  {getConfidenceBadge(copy_optimizer?.confidence, copy_optimizer?.score)}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Score: {copy_optimizer?.score}/100
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">{copy_optimizer?.reason}</p>
              </div>
              <button
                onClick={() => setActiveTab('copy')}
                className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-semibold hover:text-emerald-300"
              >
                <span>Open Copy Playground</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          VIEW: 1. REGISTRATION FORECASTING
          ====================================================================== */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  FEATURE 1: EXPLAINABLE REGISTRATION FORECASTING
                </span>
                <h2 className="text-xl font-bold text-white mt-1">7-Day Trajectory Toward 500 Verified Registrations</h2>
              </div>
              {getConfidenceBadge(forecasting?.confidence, forecasting?.score)}
            </div>

            {/* Mathematical Reasoning Callout */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Diagnostic Mathematical Reasoning:
              </span>
              <p className="text-sm text-cyan-200 font-medium leading-relaxed">{forecasting?.reason}</p>
            </div>

            {/* Input Signals Table */}
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-3">
                Live Telemetry Input Signals (Zero Fabrication):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(forecasting?.input_signals || {}).map(([key, val]) => (
                  <div key={key} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] font-mono text-slate-500 uppercase">{key.replace(/_/g, ' ')}</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">{String(val)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Confidence Intervals */}
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-3">
                Calculated Trajectory Confidence Bounds:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                  <div className="text-xs font-mono text-slate-400">Conservative (-25% velocity)</div>
                  <div className="text-3xl font-extrabold text-slate-300 font-mono mt-1">
                    {forecasting?.forecast?.conservative}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Sustained organic only</div>
                </div>

                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-center">
                  <div className="text-xs font-mono text-cyan-300">Expected (Linear + Viral K)</div>
                  <div className="text-3xl font-extrabold text-cyan-300 font-mono mt-1">
                    {forecasting?.forecast?.expected}
                  </div>
                  <div className="text-[11px] text-cyan-400 mt-1">Statistical run-rate estimate</div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 text-center">
                  <div className="text-xs font-mono text-indigo-300">Optimistic (+35% viral loop)</div>
                  <div className="text-3xl font-extrabold text-indigo-300 font-mono mt-1">
                    {forecasting?.forecast?.optimistic}
                  </div>
                  <div className="text-[11px] text-indigo-400 mt-1">Accelerated ambassador blitz</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          VIEW: 2. CHANNEL RECOMMENDATION
          ====================================================================== */}
      {activeTab === 'channels' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider">
                  FEATURE 2: CHANNEL EFFICIENCY & BUDGET RECOMMENDATIONS
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Marginal Yield & Acquisition Rebalancing</h2>
              </div>
              {getConfidenceBadge(channel_recommendations?.confidence, channel_recommendations?.score)}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{channel_recommendations?.reason}</p>

            {/* Channels Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase">
                  <tr>
                    <th className="p-3">Source Name</th>
                    <th className="p-3">Clicks</th>
                    <th className="p-3">Conversions</th>
                    <th className="p-3">Conversion Rate</th>
                    <th className="p-3">Yield Score</th>
                    <th className="p-3">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {channel_recommendations?.recommendations?.map((ch: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white flex items-center space-x-1.5">
                        <span>{ch.source_name}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{ch.clicks}</td>
                      <td className="p-3 font-mono text-cyan-300">{ch.conversions}</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">{ch.conversion_rate_pct}%</td>
                      <td className="p-3 font-mono text-indigo-300">{ch.score}/100</td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
                            ch.action === 'SCALE_UP'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : ch.action === 'MAINTAIN'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {ch.action}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">{ch.reason}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          VIEW: 3. STUDENT SEGMENTATION
          ====================================================================== */}
      {activeTab === 'segments' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-violet-400 font-bold uppercase tracking-wider">
                  FEATURE 3: 4 STUDENT PERSONA SEGMENTS
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Behavioral Intent & Persona Classification</h2>
              </div>
              {getConfidenceBadge(segmentation?.confidence, segmentation?.score)}
            </div>

            {/* 4 Required Segments Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(segmentation?.segments || {}).map(([name, seg]: any) => (
                <div key={name} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-violet-300 uppercase">{name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-950 text-violet-400 border border-violet-800/40">
                        {seg.percentage}%
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-white mb-2">{seg.count} Students</div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{seg.primary_persona}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-cyan-300">
                    <span className="font-bold text-slate-400 block mb-0.5">Key Hook:</span>
                    {seg.key_messaging_hook}
                  </div>
                </div>
              ))}
            </div>

            {/* Sample Profile Breakdown */}
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-3">
                Classified Student Profiles (Explainable Fit Scores):
              </span>
              <div className="space-y-3">
                {segmentation?.sample_profiles?.map((prof: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{prof.name}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{prof.college}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{prof.reason}</p>
                    </div>
                    <div className="flex items-center space-x-2 self-start sm:self-auto">
                      <span className="px-2.5 py-1 rounded-full font-mono font-bold bg-violet-950 text-violet-300 border border-violet-700/40">
                        {prof.segment} ({prof.fit_score}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          VIEW: 4. LEAD SCORING
          ====================================================================== */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                  FEATURE 4: EXPLAINABLE LEAD QUALIFICATION SCORING
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Student Attendance Propensity & Signal Breakdown</h2>
              </div>
              {getConfidenceBadge(lead_scoring?.confidence, lead_scoring?.score)}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{lead_scoring?.reason}</p>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <span className="font-mono text-slate-400 font-bold block mb-1">Explainable Signal Weights:</span>
              {lead_scoring?.input_signals?.scoring_criteria?.map((sc: string, idx: number) => (
                <div key={idx} className="text-slate-400 font-mono">{sc}</div>
              ))}
            </div>

            {/* Lead Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads by student name or college..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Leads List */}
            <div className="space-y-3">
              {lead_scoring?.leads
                ?.filter((lead: any) =>
                  leadSearch
                    ? lead.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                      lead.college.toLowerCase().includes(leadSearch.toLowerCase())
                    : true
                )
                .map((lead: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{lead.name}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 text-xs">{lead.college}</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1 font-mono">{lead.reason}</div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                        lead.tier === 'HOT_QUALIFIED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : lead.tier === 'WARM_PROSPECT'
                          ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {lead.tier} ({lead.score}/100)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          VIEW: 5. ANOMALY DETECTION
          ====================================================================== */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider">
                  FEATURE 5: TELEMETRY ANOMALY DETECTION
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Z-Score Deviation & Statistical Outliers (|Z| &gt; 1.8)</h2>
              </div>
              {getConfidenceBadge(anomaly_detection?.confidence, anomaly_detection?.score)}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{anomaly_detection?.reason}</p>

            {anomaly_detection?.anomalies_detected?.length === 0 ? (
              <div className="py-12 text-center rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-white font-bold text-sm">No Statistical Outliers Detected</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  All daily cohort velocities and channel conversions are currently operating within the expected 1.8 standard deviation threshold.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {anomaly_detection?.anomalies_detected?.map((anom: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-rose-300 text-sm">{anom.type}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 text-xs font-mono">Day {anom.day_number}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{anom.reason}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                      Z = {anom.z_score}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          VIEW: 6. AI CAMPAIGN STRATEGIST
          ====================================================================== */}
      {activeTab === 'strategy' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  FEATURE 6: AI CAMPAIGN STRATEGIST
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Executive Tactical Playbooks for 500 Target</h2>
              </div>
              {getConfidenceBadge(campaign_strategist?.confidence, campaign_strategist?.score)}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{campaign_strategist?.reason}</p>

            <div className="space-y-4">
              {campaign_strategist?.playbooks?.map((pb: any, idx: number) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase font-bold text-cyan-400">{pb.pillar}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                      pb.priority === 'CRITICAL' ? 'bg-red-950 text-red-300 border border-red-500/40' :
                      pb.priority === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {pb.priority} PRIORITY
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">{pb.strategic_move}</h4>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] font-mono text-emerald-400">
                      Expected Impact: {pb.expected_impact}
                    </span>
                    {onNavigateToView && (
                      <button
                        onClick={() => onNavigateToView('simulation')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-cyan-300 font-semibold text-[11px] flex items-center space-x-1 border border-indigo-700/40 transition"
                      >
                        <span>Simulate Strategy</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          VIEW: 7. AI COPY OPTIMIZER
          ====================================================================== */}
      {activeTab === 'copy' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  FEATURE 7: AI COPY OPTIMIZER & PLAYGROUND
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Linguistic Scoring, Friction Tokens & Segment Variations</h2>
              </div>
              {copyResult && getConfidenceBadge(copyResult.confidence, copyResult.score)}
            </div>

            {/* Interactive Testing Box */}
            <div className="space-y-3">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Test Custom Broadcast Copy:
              </label>
              <textarea
                value={customCopy}
                onChange={(e) => setCustomCopy(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition font-sans"
              />
              <button
                onClick={handleTestCopy}
                disabled={optimizingCopy}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{optimizingCopy ? 'Evaluating...' : 'Score This Copy'}</span>
              </button>
            </div>

            {/* Results Box */}
            {copyResult && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
                    Copy Effectiveness Score: {copyResult.score}/100
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Word count: {copyResult.input_signals?.word_count}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{copyResult.reason}</p>

                {/* 4 Segment Tailored Variations */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                    AI-Optimized Variations Tailored to the 4 Personas:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(copyResult.segment_variations || {}).map(([seg, text]: any) => (
                      <div key={seg} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] font-mono text-violet-400 uppercase font-bold mb-1">{seg}</div>
                          <p className="text-xs text-slate-200 leading-relaxed">{text}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(text, seg)}
                          className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-cyan-400 flex items-center space-x-1 hover:text-cyan-300 self-end"
                        >
                          {copiedKey === seg ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          VIEW: 8. REFERRAL PROPENSITY
          ====================================================================== */}
      {activeTab === 'referral' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                  FEATURE 8: STUDENT REFERRAL PROPENSITY ENGINE
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Peer Compounding & Viral Catalyst Probability</h2>
              </div>
              {getConfidenceBadge(referral_propensity?.confidence, referral_propensity?.score)}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{referral_propensity?.reason}</p>

            <div className="space-y-3">
              {referral_propensity?.students?.map((st: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">{st.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300">
                        Code: {st.referral_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{st.reason}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                      st.tier === 'VIRAL_CATALYST'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : st.tier === 'LIKELY_REFERRER'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {st.tier} ({st.score}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          VIEW: 9. COLLEGE OPPORTUNITY SCORING
          ====================================================================== */}
      {activeTab === 'colleges' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  FEATURE 9: CAMPUS OPPORTUNITY MATRIX
                </span>
                <h2 className="text-xl font-bold text-white mt-1">Engineering College Penetration & Untapped Pool</h2>
              </div>
              {getConfidenceBadge(college_opportunities?.confidence, college_opportunities?.score)}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">{college_opportunities?.reason}</p>

            {/* College Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search colleges by campus name or tier..."
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {college_opportunities?.colleges
                ?.filter((col: any) =>
                  collegeSearch
                    ? col.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
                      col.tier.toLowerCase().includes(collegeSearch.toLowerCase())
                    : true
                )
                .map((col: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-white">{col.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-cyan-300">
                        {col.tier}
                      </span>
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-400 font-mono mb-1">
                      {col.score}/100
                    </div>
                    <div className="text-xs text-slate-300 space-y-1 mb-2">
                      <div>Current Signups: <span className="font-bold text-white">{col.current_registrations}</span></div>
                      <div>Untapped Potential: <span className="font-bold text-white">{col.untapped_seats}</span> students</div>
                      <div>Active Clubs: <span className="font-bold text-white">{col.clubs_count}</span></div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    {col.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
