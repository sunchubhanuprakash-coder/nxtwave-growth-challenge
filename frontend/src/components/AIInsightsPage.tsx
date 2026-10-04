import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Brain,
  CheckCircle2,
  AlertCircle,
  Target,
  Play,
  Database,
  ShieldCheck,
  Layers,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock
} from 'lucide-react';

interface Recommendation {
  observation: string;
  diagnosis: string;
  action: string;
  expected_impact: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface Experiment {
  name: string;
  hypothesis: string;
  metric: string;
}

interface CopilotAnalysis {
  insight_id: number;
  status: 'ON TRACK' | 'AT RISK' | 'OFF TRACK';
  observations: string[];
  diagnosis: string[];
  recommendations: Recommendation[];
  experiments: Experiment[];
  risks: string[];
  priority_actions: string[];
  confidence: string;
  metric_snapshot: Record<string, any>;
  provider_used: string;
  created_at: string;
  is_estimate: boolean;
}

interface StoredInsight {
  id: number;
  topic: string;
  summary: string;
  recommended_action: string;
  confidence_score: number;
  generated_by_provider: string;
  created_at: string;
  analysis?: any;
}

export const AIInsightsPage: React.FC = () => {
  const [analysis, setAnalysis] = useState<CopilotAnalysis | null>(null);
  const [history, setHistory] = useState<StoredInsight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [showSnapshot, setShowSnapshot] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch: run copilot analysis or fetch stored insights
  const fetchCopilotData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Run Copilot Analysis
      const res = await fetch('/api/ai/copilot/analyze', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to run AI Growth Copilot analysis.');
      }
      const data: CopilotAnalysis = await res.json();
      setAnalysis(data);

      // 2. Fetch history
      const histRes = await fetch('/api/ai/copilot/insights?limit=10');
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.insights || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error executing AI Copilot');
    } finally {
      setLoading(false);
    }
  };

  const handleRunNewAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/copilot/analyze', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to refresh AI analysis.');
      }
      const data: CopilotAnalysis = await res.json();
      setAnalysis(data);

      // Refresh history
      const histRes = await fetch('/api/ai/copilot/insights?limit=10');
      if (histRes.ok) {
        const histData = await histRes.json();
        setHistory(histData.insights || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error executing new analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchCopilotData();
  }, []);

  if (loading && !analysis) {
    return (
      <div className="w-full max-w-7xl mx-auto py-16 text-center">
        <Brain className="w-10 h-10 text-cyan-400 animate-pulse mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">AI Growth Copilot is Analyzing Metrics...</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Extracting verified database snapshot across registration velocity, virality K-factor, channel attribution, and budget ledger.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-800/60 text-cyan-300 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phase 10: Verified Metric AI Growth Copilot</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>AI Growth Copilot</span>
              <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                No Hallucinations • 100% Verified Telemetry
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Autonomous strategic intelligence engine analyzing verified registration velocity, viral expansion coefficient, conversion drop-off, and ₹2,000 budget governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowSnapshot(!showSnapshot)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showSnapshot ? 'Hide Snapshot' : 'View Metric Snapshot'}</span>
              {showSnapshot ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
            </button>

            <button
              onClick={handleRunNewAnalysis}
              disabled={analyzing}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black text-xs font-bold transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${analyzing ? 'animate-spin' : ''}`} />
              <span>{analyzing ? 'Analyzing Telemetry...' : 'Run Copilot Audit'}</span>
            </button>
          </div>
        </div>

        {/* Engine Transparency Ribbon */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Engine: <strong className="text-slate-200">{analysis?.provider_used || 'deterministic_fallback'}</strong> (Zero-cost offline resilient)
            </span>
          </div>
          {analysis?.insight_id && (
            <div className="flex items-center space-x-1.5 text-slate-400">
              <span>Audit Record ID:</span>
              <span className="text-cyan-400 font-bold">#{analysis.insight_id}</span>
              <span>• Stored in SQLite</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-mono flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Verified Metric Snapshot Viewer (Collapsible) */}
      {showSnapshot && analysis?.metric_snapshot && (
        <div className="p-6 rounded-3xl bg-slate-950 border border-cyan-800/60 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-mono">
                Verified Observable Application Snapshot (Strict Anti-Hallucination Input)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800/60 px-2 py-0.5 rounded">
              Observable Telemetry
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[11px]">Current Registrations:</span>
              <div className="text-white font-bold text-base mt-0.5">
                {analysis.metric_snapshot.registration_progress?.current_registrations} / {analysis.metric_snapshot.target}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[11px]">Viral K-Factor:</span>
              <div className="text-cyan-400 font-bold text-base mt-0.5">
                {analysis.metric_snapshot.referral_rate?.viral_k_factor}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[11px]">Referral Share:</span>
              <div className="text-indigo-300 font-bold text-base mt-0.5">
                {analysis.metric_snapshot.referral_rate?.referral_share_percent}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[11px]">Total Spend / Cap:</span>
              <div className="text-emerald-400 font-bold text-base mt-0.5">
                ₹{analysis.metric_snapshot.budget?.total_spent_inr} / ₹{analysis.metric_snapshot.budget?.budget_cap_inr}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 max-h-48 overflow-y-auto">
            <pre className="text-[11px] font-mono text-cyan-300/90 whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(analysis.metric_snapshot, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 2. Strategic Health Status Banner */}
      {analysis && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  analysis.status === 'ON TRACK'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : analysis.status === 'AT RISK'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Strategic Health Assessment
                </div>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span
                    className={`text-xl font-extrabold ${
                      analysis.status === 'ON TRACK'
                        ? 'text-emerald-400'
                        : analysis.status === 'AT RISK'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    STATUS: {analysis.status}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {analysis.confidence} Confidence
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
              <div className="text-right">
                <span className="block text-[11px] text-slate-500">Evaluated At</span>
                <span className="text-slate-300 font-semibold">
                  {new Date(analysis.created_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Left: Observations */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Verified Observable Telemetry</span>
              </h3>
              <ul className="space-y-2">
                {analysis.observations.map((obs, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start space-x-2.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Diagnosis */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold flex items-center space-x-1.5">
                <Brain className="w-3.5 h-3.5" />
                <span>Root-Cause Growth Diagnosis</span>
              </h3>
              <ul className="space-y-2">
                {analysis.diagnosis.map((diag, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed flex items-start space-x-2.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></span>
                    <span>{diag}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. Strategic Recommendations (With all 6 required fields) */}
      {analysis && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Actionable Strategic Recommendations</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Prescriptive interventions formulated with Observation, Diagnosis, Action, Expected Impact, Priority, and Confidence.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-3 py-1 rounded-full">
              {analysis.recommendations.length} Action Items
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {analysis.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-white">{rec.action}</span>
                  </div>

                  <div className="flex items-center space-x-2 font-mono text-[10px]">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        rec.priority === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : rec.priority === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      Priority: {rec.priority}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        rec.confidence === 'HIGH'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                      }`}
                    >
                      {rec.confidence} Confidence
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[11px] font-mono text-slate-400 block font-semibold mb-1">
                      Observation:
                    </span>
                    <p className="text-slate-300 leading-relaxed">{rec.observation}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[11px] font-mono text-slate-400 block font-semibold mb-1">
                      Diagnosis:
                    </span>
                    <p className="text-slate-300 leading-relaxed">{rec.diagnosis}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-start space-x-2 text-xs">
                  <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-emerald-300 font-bold block text-[11px]">
                      Expected Impact:
                    </span>
                    <span className="text-slate-200">{rec.expected_impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Experiments Queue & Risk Matrix */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Growth Experiments */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Recommended Growth Experiments</h3>
            </div>

            <div className="space-y-3">
              {analysis.experiments.map((exp, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{exp.name}</span>
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/50">
                      {exp.metric}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{exp.hypothesis}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Risks & Priority Actions */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Critical Risks & Priority Actions</h3>
            </div>

            {/* Priority Actions */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">
                Immediate Execution Checklist:
              </span>
              <ul className="space-y-2 text-xs">
                {analysis.priority_actions.map((action, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Operational Risks */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                Monitored Vulnerabilities:
              </span>
              <ul className="space-y-2 text-xs">
                {analysis.risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5"></span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. Stored Insights History Drawer (Audit Trail) */}
      {history.length > 0 && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Historical AI Audits Archive (SQLite Backed)</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{history.length} Saved Records</span>
          </div>

          <div className="space-y-2.5">
            {history.slice(0, 5).map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-cyan-400 text-xs">#{item.id}</span>
                    <span className="font-semibold text-white">{item.summary}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Recommended: <span className="text-slate-300">{item.recommended_action}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 font-mono text-[11px] text-slate-500 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {item.generated_by_provider}
                  </span>
                  <span>{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
