import React, { useState, useEffect } from 'react';
import {
  Target,
  Users,
  TrendingUp,
  Zap,
  Clock,
  Share2,
  RefreshCw,
  Filter,
  Building2,
  AlertCircle,
  BarChart3,
  PieChart as PieIcon,
  RotateCcw,
  IndianRupee,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart
} from 'recharts';

interface PrimaryKPIs {
  target_registrations: number;
  current_registrations: number;
  remaining: number;
  progress_percent: number;
  days_remaining: number;
  referral_share: number;
  conversion_rate: number;
  estimated_cpr: number;
  growth_score: number;
}

interface RegistrationTrendPoint {
  day: string;
  date: string;
  actual_cumulative: number;
  target_cumulative: number;
}

interface DailyRegistrationPoint {
  day: string;
  date: string;
  total_registrations: number;
  verified_final_year: number;
  referral_registrations: number;
}

interface AcquisitionSourcePoint {
  source: string;
  registrations: number;
  verified_final_year: number;
  share_percent: number;
}

interface ReferralContributionPoint {
  day: string;
  direct_registrations: number;
  referral_registrations: number;
  k_factor: number;
}

interface FunnelStagePoint {
  stage: string;
  count: number;
  conversion_rate: number;
  dropoff_rate: number;
  description: string;
}

interface CollegePerformancePoint {
  college: string;
  college_code?: string;
  registrations: number;
  verified_final_year: number;
  share_percent: number;
}

interface BudgetMetricPoint {
  day: string;
  date: string;
  daily_spend_inr: number;
  cumulative_spend_inr: number;
  cumulative_cpr_inr: number;
  budget_cap_inr: number;
}

interface ForecastPoint {
  day: string;
  actual?: number;
  forecast: number;
  lower_bound: number;
  upper_bound: number;
  target: number;
}

interface DashboardFilterOptions {
  sources: string[];
  colleges: string[];
  date_ranges: string[];
}

interface DashboardData {
  kpis: PrimaryKPIs;
  charts: {
    registration_trend: RegistrationTrendPoint[];
    daily_registrations: DailyRegistrationPoint[];
    acquisition_source: AcquisitionSourcePoint[];
    referral_contribution: ReferralContributionPoint[];
    funnel: FunnelStagePoint[];
    college_performance: CollegePerformancePoint[];
    budget: BudgetMetricPoint[];
    forecast: ForecastPoint[];
  };
  filters_applied: {
    date_filter: string;
    source_filter: string;
    college_filter: string;
  };
  filter_options: DashboardFilterOptions;
  last_updated: string;
}

export const AdminGrowthDashboard: React.FC = () => {
  // Filter States
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');

  // Active Chart View Tab for secondary charts
  const [activeChartSection, setActiveChartSection] = useState<'velocity' | 'acquisition' | 'efficiency' | 'predictive'>('velocity');

  // Telemetry Data & Async States
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        date_filter: dateFilter,
        source_filter: sourceFilter,
        college_filter: collegeFilter,
      });

      const response = await fetch(`/api/admin/dashboard?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to fetch dashboard data`);
      }

      const json: DashboardData = await response.json();
      setData(json);
      setLastRefreshedTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      setError(err.message || 'Unable to connect to growth engine telemetry service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter, sourceFilter, collegeFilter]);

  const handleResetFilters = () => {
    setDateFilter('all');
    setSourceFilter('all');
    setCollegeFilter('all');
  };

  const isFiltered = dateFilter !== 'all' || sourceFilter !== 'all' || collegeFilter !== 'all';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* 1. Header Banner & Filter Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-800/50 text-cyan-300 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phase 7: SaaS Growth Executive Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              AI Student Growth Engine <span className="text-cyan-400 font-mono text-xl sm:text-2xl font-bold">Telemetry</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Real-time monitoring across 7-day sprint: 500 final-year student acquisition, ₹2,000 budget ledger, viral squad virality, and conversion pacing.
            </p>
          </div>

          {/* Quick Refresh & Controls */}
          <div className="flex items-center space-x-3">
            {lastRefreshedTime && (
              <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
                Updated {lastRefreshedTime}
              </span>
            )}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold mr-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Filters:</span>
            </div>

            {/* Date Range Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Timeframe: All 7 Days</option>
              <option value="last_3_days">Timeframe: Last 3 Days</option>
              <option value="today">Timeframe: Today (Day 7)</option>
            </select>

            {/* Acquisition Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Channel: All Acquisition Sources</option>
              <option value="whatsapp">WhatsApp Class Groups</option>
              <option value="ambassador_cbit">Campus Ambassador (CBIT)</option>
              <option value="ambassador_vnr">Campus Ambassador (VNR)</option>
              <option value="telegram">Telegram Placement Prep</option>
              <option value="linkedin">LinkedIn Organic</option>
            </select>

            {/* College Filter */}
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">Campus: All Colleges</option>
              <option value="CBIT">CBIT (Hyderabad)</option>
              <option value="VNRVJIET">VNR Vignana Jyothi</option>
              <option value="VCE">Vasavi College of Eng</option>
              <option value="JNTUH">JNTUH Hyderabad</option>
              <option value="GNITS">GNITS Women in Tech</option>
            </select>
          </div>

          {isFiltered && (
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filter Slices</span>
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-5 rounded-2xl bg-rose-950/80 border border-rose-800/60 text-rose-300 flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="font-bold text-sm">Telemetry Ingestion Error</div>
              <div className="text-xs text-rose-300/80 mt-0.5">{error}</div>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-1.5 rounded-xl bg-rose-900 hover:bg-rose-800 text-white text-xs font-bold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State Skeleton */}
      {loading && !data && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-900/60 rounded-2xl border border-slate-800"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800"></div>
        </div>
      )}

      {/* Empty State */}
      {data && data.kpis.current_registrations === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Registrations Match Filter Criteria</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            No student acquisition records match the combination of timeframe '{dateFilter}', channel '{sourceFilter}', and campus '{collegeFilter}'.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Main Telemetry & Visualizations */}
      {data && data.kpis.current_registrations > 0 && (
        <div className="space-y-8">
          {/* Target Progress Bar Callout */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl relative overflow-hidden shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-sm sm:text-base text-white">
                  Target Sprint Pacing: 500 Final-Year Engineering Students
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  {data.kpis.progress_percent}% Met
                </span>
              </div>
              <div className="text-xs font-mono text-slate-300">
                <strong className="text-cyan-400 font-bold text-sm">{data.kpis.current_registrations}</strong> / {data.kpis.target_registrations} Registrations ({data.kpis.remaining} Remaining)
              </div>
            </div>

            {/* Glowing Dual-Color Progress Bar */}
            <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-1000 shadow-md shadow-cyan-500/30"
                style={{ width: `${Math.min(100, data.kpis.progress_percent)}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 mt-2">
              <span>Day 1 Launch</span>
              <span className="text-emerald-400 font-bold">500 Registrations Target Passed</span>
              <span>Day 7 Concluded</span>
            </div>
          </div>

          {/* 2. Primary KPIs (9 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
            {/* KPI 1: Target Registrations */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Target Goal</span>
                <Target className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-extrabold text-white">{data.kpis.target_registrations}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Students</div>
            </div>

            {/* KPI 2: Current Registrations */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Current Regs</span>
                <Users className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl font-extrabold text-cyan-400">{data.kpis.current_registrations}</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Confirmed</div>
            </div>

            {/* KPI 3: Remaining */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Remaining</span>
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-extrabold text-amber-400">{data.kpis.remaining}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">To target</div>
            </div>

            {/* KPI 4: Progress % */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Progress %</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold text-emerald-400">{data.kpis.progress_percent}%</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Pacing pace</div>
            </div>

            {/* KPI 5: Days Remaining */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Days Left</span>
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-xl font-extrabold text-white">{data.kpis.days_remaining}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Sprint Window</div>
            </div>

            {/* KPI 6: Referral Share */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Referral %</span>
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-extrabold text-cyan-300">{data.kpis.referral_share}%</div>
              <div className="text-[10px] text-indigo-400 font-mono mt-0.5">Viral share</div>
            </div>

            {/* KPI 7: Conversion Rate */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Conv. Rate</span>
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold text-emerald-300">{data.kpis.conversion_rate}%</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Visits to Reg</div>
            </div>

            {/* KPI 8: Estimated CPR */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Est. CPR</span>
                <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-extrabold text-amber-300">₹{data.kpis.estimated_cpr}</div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">₹4.00 Budget Cap</div>
            </div>

            {/* KPI 9: Growth Score */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-700/50 hover:border-indigo-500 transition">
              <div className="flex items-center justify-between text-indigo-300 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">Growth Score</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-extrabold text-white">{data.kpis.growth_score}</div>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">/ 100 Index</div>
            </div>
          </div>

          {/* 3. Primary Charts Grid (Chart 1: Registration Trend & Chart 2: Daily Registrations) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Registration Trend (Cumulative vs Target 500 Pacing) */}
            <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Registration Trend vs 500 Target Benchmark</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cumulative student registrations pacing against linear target path to 500.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                  Target: 500
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.charts.registration_trend}>
                    <defs>
                      <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="actual_cumulative"
                      name="Actual Registrations"
                      stroke="#38BDF8"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#actualGrad)"
                    />
                    <Line
                      type="monotone"
                      dataKey="target_cumulative"
                      name="500 Target Pacing"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Daily Registrations Breakdown */}
            <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <span>Daily Registrations Velocity</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400">Total vs Verified Final-Year Engineering Students</p>
              </div>

              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.daily_registrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="total_registrations" name="Total Regs" fill="#818CF8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="verified_final_year" name="Verified Final-Year" fill="#34D399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 4. Secondary Deep-Dive Navigation & Section */}
          <div className="space-y-6">
            {/* Tabbed Nav for Deep-Dive Visualizations */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveChartSection('velocity')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                    activeChartSection === 'velocity'
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Referral Virality & Funnel</span>
                </button>

                <button
                  onClick={() => setActiveChartSection('acquisition')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                    activeChartSection === 'acquisition'
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Channels & Colleges</span>
                </button>

                <button
                  onClick={() => setActiveChartSection('efficiency')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                    activeChartSection === 'efficiency'
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Budget & CPR Pacing</span>
                </button>

                <button
                  onClick={() => setActiveChartSection('predictive')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                    activeChartSection === 'predictive'
                      ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Forecast & Projections</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                8 Integrated Real-Time Charts Active
              </span>
            </div>

            {/* TAB: VELOCITY (Chart 4: Referral Contribution & Chart 5: Funnel) */}
            {activeChartSection === 'velocity' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                {/* Chart 4: Referral Contribution */}
                <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      <span>Referral Contribution vs Direct Registrations</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Peer-to-peer viral multiplier acceleration by day with live K-Factor trajectory.
                    </p>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.charts.referral_contribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                        <Bar yAxisId="left" dataKey="direct_registrations" name="Direct / Partner" fill="#64748B" stackId="a" />
                        <Bar yAxisId="left" dataKey="referral_registrations" name="Peer Referral" fill="#38BDF8" stackId="a" />
                        <Line yAxisId="right" type="monotone" dataKey="k_factor" name="Viral K-Factor" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 5: Funnel Stages */}
                <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2 mb-1">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>5-Stage Acquisition Funnel</span>
                    </h3>
                    <p className="text-xs text-slate-400">Visitor-to-Registration dropoff telemetry</p>
                  </div>

                  <div className="space-y-3 my-auto pt-3">
                    {data.charts.funnel.map((stage, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-200">{stage.stage}</span>
                          <span className="font-mono text-cyan-300 font-bold">{stage.count} ({stage.conversion_rate}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
                            style={{ width: `${Math.max(8, stage.conversion_rate)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                          <span>{stage.description}</span>
                          {stage.dropoff_rate > 0 && <span className="text-rose-400">-{stage.dropoff_rate}% drop</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ACQUISITION (Chart 3: Acquisition Source & Chart 6: College Performance) */}
            {activeChartSection === 'acquisition' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                {/* Chart 3: Acquisition Source Breakdown */}
                <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <PieIcon className="w-4 h-4 text-cyan-400" />
                      <span>Registrations by Marketing Channel (`utm_source`)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Class WhatsApp groups vs Campus Ambassadors vs Telegram</p>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.charts.acquisition_source}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis dataKey="source" stroke="#64748B" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" height={45} />
                        <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }} />
                        <Bar dataKey="registrations" name="Total Regs" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="verified_final_year" name="Verified Final-Year" fill="#34D399" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 6: College Performance */}
                <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>Top Engineering College Penetration</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Verified final-year registrations by target institution</p>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={data.charts.college_performance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                        <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                        <YAxis type="category" dataKey="college_code" stroke="#64748B" fontSize={11} tickLine={false} width={70} />
                        <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }} />
                        <Bar dataKey="verified_final_year" name="Verified Final-Year" fill="#818CF8" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: EFFICIENCY (Chart 7: Budget Trajectory & CPR) */}
            {activeChartSection === 'efficiency' && (
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                      <IndianRupee className="w-4 h-4 text-amber-400" />
                      <span>Budget Burn vs ₹2,000 Cap & Cumulative CPR</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Strict compliance with ₹2,000 maximum budget constraint and unit economics tracking.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
                    Max Spend: ₹2,000.00 • Blended CPR: ₹{data.kpis.estimated_cpr}
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.charts.budget}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} label={{ value: 'Spend (₹)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} tickLine={false} label={{ value: 'CPR (₹)', angle: 90, position: 'insideRight', fill: '#F59E0B', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Bar yAxisId="left" dataKey="cumulative_spend_inr" name="Cumulative Spend (₹)" fill="#818CF8" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="left" type="monotone" dataKey="budget_cap_inr" name="Budget Cap (₹2,000)" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="cumulative_cpr_inr" name="Cumulative CPR (₹/student)" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB: PREDICTIVE (Chart 8: Forecast Trajectory) */}
            {activeChartSection === 'predictive' && (
              <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Predictive Pacing & Final Day 7 Forecast</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Statistical trajectory model factoring current registration velocity and viral referral K-Factor.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/40">
                    Confidence Interval: 95%
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.charts.forecast}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Area type="monotone" dataKey="upper_bound" name="Upper Confidence Bound (+10%)" stroke="none" fill="#38BDF8" fillOpacity={0.15} />
                      <Area type="monotone" dataKey="lower_bound" name="Lower Confidence Bound (-10%)" stroke="none" fill="#0F172A" fillOpacity={0.4} />
                      <Line type="monotone" dataKey="forecast" name="Projected Trajectory" stroke="#38BDF8" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="actual" name="Historical Confirmed" stroke="#34D399" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="target" name="500 Target Benchmark" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
