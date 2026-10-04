import React, { useState, useEffect } from 'react';
import { 
  Link2, 
  Copy, 
  Check, 
  ExternalLink, 
  Download, 
  MousePointerClick, 
  Building2, 
  Sparkles, 
  RefreshCw, 
  BarChart3, 
  Layers, 
  Tag, 
  QrCode as QrCodeIcon,
  PieChart as PieIcon,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import QRCode from 'qrcode';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid 
} from 'recharts';

interface CollegeClubItem {
  college_id: number;
  college_name: string;
  college_code: string;
  tier: string;
  clubs: string[];
}

interface SourceMetric {
  source: string;
  medium?: string;
  campaign?: string;
  total_registrations: number;
  verified_final_year: number;
  verification_rate_percent: number;
  clicks: number;
  conversions: number;
  conversion_rate_percent: number;
  budget_allocated_inr: number;
  cac_inr: number;
  k_factor: number;
}

interface ContentMetric {
  content: string;
  total_registrations: number;
  verified_final_year: number;
  verification_rate_percent: number;
}

interface CollegeMetric {
  college: string;
  total_registrations: number;
  verified_final_year: number;
}

interface ClubMetric {
  club: string;
  college?: string;
  total_registrations: number;
  verified_final_year: number;
}

interface AttributionPerformance {
  total_registrations: number;
  total_verified_final_year: number;
  total_referral_attributed: number;
  total_direct_attributed: number;
  total_partner_attributed: number;
  active_sources_count: number;
  active_clubs_count: number;
  top_source?: string;
  top_content?: string;
  top_college?: string;
  sources: SourceMetric[];
  contents: ContentMetric[];
  colleges: CollegeMetric[];
  clubs: ClubMetric[];
}

const PRESET_SOURCES = ['whatsapp', 'linkedin', 'ambassador', 'telegram', 'instagram', 'email'];
const PRESET_MEDIUMS = ['college_group', 'organic_post', 'campus_rep', 'community_post', 'story_link', 'newsletter'];
const PRESET_CONTENTS = ['poster_a', 'poster_b', 'placement_hook', 'architecture_teaser', 'curriculum_pdf'];

const PIE_COLORS = ['#38BDF8', '#818CF8', '#34D399', '#FBBF24', '#F472B6'];

export const AdminUTMBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'builder' | 'performance'>('builder');
  
  // UTM Form State
  const [source, setSource] = useState('whatsapp');
  const [medium, setMedium] = useState('college_group');
  const [campaign, setCampaign] = useState('ai_workshop');
  const [content, setContent] = useState('poster_a');
  const [selectedCollege, setSelectedCollege] = useState('Chaitanya Bharathi Institute of Technology');
  const [customCollege, setCustomCollege] = useState('');
  const [selectedClub, setSelectedClub] = useState('[SIMULATED] CBIT Open Source & Coding Club');
  const [customClub, setCustomClub] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  // Output & UI State
  const [trackingUrl, setTrackingUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [clickCount, setClickCount] = useState<number | null>(null);
  const [clickLoading, setClickLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Live Database Performance Data
  const [collegeDirectory, setCollegeDirectory] = useState<CollegeClubItem[]>([]);
  const [performance, setPerformance] = useState<AttributionPerformance | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // 1. Fetch Colleges & Clubs Directory
  useEffect(() => {
    fetch('/api/attribution/colleges-clubs')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.colleges) {
          setCollegeDirectory(data.colleges);
          if (data.colleges.length > 0 && !selectedCollege) {
            setSelectedCollege(data.colleges[0].college_name);
            if (data.colleges[0].clubs.length > 0) {
              setSelectedClub(data.colleges[0].clubs[0]);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Update clubs when selected college changes
  useEffect(() => {
    const matched = collegeDirectory.find(c => c.college_name === selectedCollege);
    if (matched && matched.clubs.length > 0) {
      setSelectedClub(matched.clubs[0]);
    }
  }, [selectedCollege, collegeDirectory]);

  // 2. Real-time URL Construction
  useEffect(() => {
    const origin = window.location.origin;
    const params = new URLSearchParams();

    if (source.trim()) params.set('utm_source', source.trim().toLowerCase());
    if (medium.trim()) params.set('utm_medium', medium.trim().toLowerCase());
    if (campaign.trim()) params.set('utm_campaign', campaign.trim().toLowerCase());
    if (content.trim()) params.set('utm_content', content.trim().toLowerCase());

    const activeCollege = selectedCollege === 'CUSTOM' ? customCollege.trim() : selectedCollege.trim();
    if (activeCollege) params.set('college', activeCollege);

    const activeClub = selectedClub === 'CUSTOM' ? customClub.trim() : selectedClub.trim();
    if (activeClub) params.set('club', activeClub);

    if (referralCode.trim()) params.set('ref', referralCode.trim().toUpperCase());

    const generated = `${origin}/register?${params.toString()}`;
    setTrackingUrl(generated);

    // Generate Client-Side QR Code
    QRCode.toDataURL(generated, {
      width: 280,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#FFFFFF',
      },
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [source, medium, campaign, content, selectedCollege, customCollege, selectedClub, customClub, referralCode]);

  // 3. Fetch Live Attribution Performance Data
  const fetchPerformance = () => {
    setPerfLoading(true);
    fetch('/api/attribution/performance')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setPerformance(data);
          setLastRefreshed(new Date().toLocaleTimeString());
        }
      })
      .catch(() => {})
      .finally(() => setPerfLoading(false));
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `nxtwave-qr-${source}-${content || 'track'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSimulateClick = async () => {
    setClickLoading(true);
    try {
      const res = await fetch('/api/attribution/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: source.trim().toLowerCase(),
          medium: medium.trim().toLowerCase(),
          campaign: campaign.trim().toLowerCase(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setClickCount(data.clicks_count);
        setSuccessToast(`Click registered in database! Total for '${source}': ${data.clicks_count}`);
        setTimeout(() => setSuccessToast(null), 3500);
        // Refresh performance data immediately
        fetchPerformance();
      }
    } catch {
      // Ignored
    } finally {
      setClickLoading(false);
    }
  };

  // Channel Distribution Data for Pie Chart
  const channelPieData = performance ? [
    { name: 'Referral (Peer)', value: performance.total_referral_attributed },
    { name: 'Direct / Organic', value: performance.total_direct_attributed },
    { name: 'Partner / Ambassador', value: performance.total_partner_attributed },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 p-6 sm:p-8 rounded-3xl border border-indigo-800/40 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Phase 6: Complete Acquisition Attribution System</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Admin UTM Builder & Attribution Telemetry
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl">
              Track source, medium, campaign, creative content, referral pass, college, and club society.
              <span className="text-cyan-300 font-medium ml-1">
                All metrics are computed dynamically from database events.
              </span>
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex bg-slate-950/90 border border-slate-800 p-1.5 rounded-2xl shrink-0 self-start md:self-center">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'builder'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>UTM Builder & QR</span>
            </button>
            <button
              onClick={() => { setActiveTab('performance'); fetchPerformance(); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'performance'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Database Performance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: UTM BUILDER & QR STUDIO                                         */}
      {/* ===================================================================== */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs Section */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-6 sm:p-7 rounded-3xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Tag className="w-5 h-5 text-cyan-400" />
                <span>Campaign Attribution Parameters</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure acquisition parameters to produce an attributed registration URL and print-ready QR code.
              </p>
            </div>

            {/* 1. Source */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>1. Source (`utm_source`) *</span>
                <span className="text-[10px] text-slate-500 font-mono">Platform / Channel</span>
              </label>
              <input
                type="text"
                value={source}
                onChange={e => setSource(e.target.value)}
                placeholder="e.g. whatsapp, linkedin, ambassador"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_SOURCES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSource(s)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                      source === s
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Medium */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>2. Medium (`utm_medium`) *</span>
                <span className="text-[10px] text-slate-500 font-mono">Distribution Mechanism</span>
              </label>
              <input
                type="text"
                value={medium}
                onChange={e => setMedium(e.target.value)}
                placeholder="e.g. college_group, organic_post, campus_rep"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_MEDIUMS.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMedium(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                      medium === m
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Campaign & Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  3. Campaign (`utm_campaign`)
                </label>
                <input
                  type="text"
                  value={campaign}
                  onChange={e => setCampaign(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  4. Content (`utm_content`)
                </label>
                <input
                  type="text"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="e.g. poster_a, placement_hook"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            {/* Content Preset Chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CONTENTS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setContent(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                    content === c
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* 5. College Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>5. College (`college`)</span>
                <span className="text-[10px] text-cyan-400 font-mono">From DB Directory</span>
              </label>
              <select
                value={selectedCollege}
                onChange={e => setSelectedCollege(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                {collegeDirectory.map(col => (
                  <option key={col.college_id} value={col.college_name}>
                    {col.college_name} ({col.college_code}) - {col.tier}
                  </option>
                ))}
                <option value="CUSTOM">-- Custom Engineering College --</option>
              </select>

              {selectedCollege === 'CUSTOM' && (
                <input
                  type="text"
                  value={customCollege}
                  onChange={e => setCustomCollege(e.target.value)}
                  placeholder="Enter full engineering college name"
                  className="w-full bg-slate-950 border border-cyan-800 rounded-xl px-3.5 py-2 text-sm text-white mt-2"
                />
              )}
            </div>

            {/* 6. Club Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>6. Club (`club`)</span>
                <span className="text-[10px] text-emerald-400 font-mono">Affiliated Student Society</span>
              </label>
              <select
                value={selectedClub}
                onChange={e => setSelectedClub(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              >
                {collegeDirectory
                  .find(c => c.college_name === selectedCollege)
                  ?.clubs.map((cl, idx) => (
                    <option key={idx} value={cl}>
                      {cl}
                    </option>
                  ))}
                <option value="[SIMULATED] Coding Club">General Coding Club</option>
                <option value="CUSTOM">-- Custom Club / Student Society --</option>
              </select>

              {selectedClub === 'CUSTOM' && (
                <input
                  type="text"
                  value={customClub}
                  onChange={e => setCustomClub(e.target.value)}
                  placeholder="Enter campus club / chapter name"
                  className="w-full bg-slate-950 border border-emerald-800 rounded-xl px-3.5 py-2 text-sm text-white mt-2"
                />
              )}
            </div>

            {/* 7. Optional Referral Code */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>7. Optional Referral Pass (`ref`)</span>
                <span className="text-[10px] text-slate-500 font-mono">Pre-attach inviter pass</span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={e => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. NXT123 or leave blank"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono uppercase"
              />
            </div>
          </div>

          {/* Generated Result & QR Studio */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-5 sticky top-24 shadow-2xl">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800/40">
                  Live Generated URL
                </span>
                <h3 className="text-base font-bold text-white mt-1">Ready-to-Share Tracking Link</h3>
              </div>

              {/* URL Display Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 break-all select-all leading-relaxed shadow-inner">
                {trackingUrl}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition shadow-md shadow-cyan-500/20"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied URL!' : 'Copy Link'}</span>
                </button>

                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Test URL</span>
                </a>
              </div>

              {/* QR Code Presentation */}
              <div className="border-t border-slate-800/80 pt-5 text-center">
                <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-300 font-semibold mb-3">
                  <QrCodeIcon className="w-4 h-4 text-cyan-400" />
                  <span>Poster & Flyer QR Code</span>
                </div>

                <div className="p-3 bg-white rounded-2xl inline-block shadow-xl shadow-black/60">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Campaign Tracking QR" className="w-48 h-48 rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs font-mono">
                      Generating QR...
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download QR PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateClick}
                    disabled={clickLoading}
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-xs font-semibold transition border border-indigo-700/50"
                  >
                    <MousePointerClick className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{clickLoading ? 'Logging...' : 'Simulate Click'}</span>
                  </button>
                </div>
                {clickCount !== null && (
                  <p className="text-[11px] text-emerald-400 font-mono mt-2">
                    Live clicks recorded in database: {clickCount}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: LIVE DATABASE PERFORMANCE TELEMETRY                             */}
      {/* ===================================================================== */}
      {activeTab === 'performance' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Database-Driven Events • No Hardcoded Metrics</span>
              {lastRefreshed && <span className="text-slate-500">• Updated {lastRefreshed}</span>}
            </div>

            <button
              onClick={fetchPerformance}
              disabled={perfLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 self-start sm:self-center"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${perfLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* Top KPI Cards */}
          {performance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono uppercase">Total Database Registrations</span>
                <div className="text-3xl font-extrabold text-white mt-1">{performance.total_registrations}</div>
                <div className="text-[11px] text-cyan-400 font-mono mt-1">Confirmed student records</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono uppercase">Verified Final-Year</span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1">{performance.total_verified_final_year}</div>
                <div className="text-[11px] text-emerald-400 font-mono mt-1">
                  {performance.total_registrations > 0
                    ? `${Math.round((performance.total_verified_final_year / performance.total_registrations) * 100)}% Qualified Audience`
                    : '100%'}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono uppercase">Referral Attributed</span>
                <div className="text-3xl font-extrabold text-amber-400 mt-1">{performance.total_referral_attributed}</div>
                <div className="text-[11px] text-amber-400 font-mono mt-1">
                  {performance.total_registrations > 0
                    ? `${Math.round((performance.total_referral_attributed / performance.total_registrations) * 100)}% Viral K-Factor share`
                    : '0%'}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono uppercase">Active Channels & Clubs</span>
                <div className="text-3xl font-extrabold text-indigo-400 mt-1">
                  {performance.active_sources_count} <span className="text-lg text-slate-500 font-normal">/</span> {performance.active_clubs_count}
                </div>
                <div className="text-[11px] text-indigo-400 font-mono mt-1">Sources / Campus Clubs</div>
              </div>
            </div>
          )}

          {/* Visual Breakdown Charts */}
          {performance && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Bar Chart: Registrations by Source */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Verified Registrations by Acquisition Source</span>
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performance.sources}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="source" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#38BDF8' }}
                      />
                      <Bar dataKey="verified_final_year" name="Verified Final-Year" fill="#38BDF8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart: Channel Type Attribution */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
                    <PieIcon className="w-4 h-4 text-indigo-400" />
                    <span>Channel Attribution Distribution</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Referral vs Direct Organic vs Campus Partners</p>
                </div>

                <div className="h-48 w-full my-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={65}
                        innerRadius={35}
                        paddingAngle={5}
                      >
                        {channelPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/80">
                  {channelPieData.map((item, idx) => (
                    <div key={idx} className="p-1">
                      <div className="text-[10px] text-slate-400 font-mono truncate">{item.name}</div>
                      <div className="text-sm font-bold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Table 1: Source Performance Breakdown */}
          {performance && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Acquisition Channel Performance</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live conversion rates, CAC efficiency, and peer K-factor by source.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800/40">
                  {performance.sources.length} Channels Active
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-950/90 text-slate-400 font-mono border-b border-slate-800">
                      <th className="py-3 px-4">Source / Medium</th>
                      <th className="py-3 px-3 text-right">Total Regs</th>
                      <th className="py-3 px-3 text-right">Verified</th>
                      <th className="py-3 px-3 text-right">Verification %</th>
                      <th className="py-3 px-3 text-right">Clicks</th>
                      <th className="py-3 px-3 text-right">CR %</th>
                      <th className="py-3 px-3 text-right">Budget (₹)</th>
                      <th className="py-3 px-3 text-right">CAC (₹)</th>
                      <th className="py-3 px-4 text-right">K-Factor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {performance.sources.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-xs">{s.source}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {s.medium || 'direct'} • {s.campaign || 'ai_workshop'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-white">{s.total_registrations}</td>
                        <td className="py-3.5 px-3 text-right font-bold text-emerald-400">{s.verified_final_year}</td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-300">{s.verification_rate_percent}%</td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-400">{s.clicks}</td>
                        <td className="py-3.5 px-3 text-right font-mono text-cyan-400 font-bold">{s.conversion_rate_percent}%</td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-300">₹{s.budget_allocated_inr}</td>
                        <td className="py-3.5 px-3 text-right font-mono text-amber-400 font-bold">
                          {s.cac_inr > 0 ? `₹${s.cac_inr}` : '₹0.00'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            s.k_factor >= 1.0 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {s.k_factor}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tables Row: Content Performance & College/Club Breakdown */}
          {performance && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Performance */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <span>Creative Content Performance (`utm_content`)</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-mono border-b border-slate-800">
                        <th className="pb-2">Creative Variant</th>
                        <th className="pb-2 text-right">Registrations</th>
                        <th className="pb-2 text-right">Verified</th>
                        <th className="pb-2 text-right">Qual. Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {performance.contents.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="py-2.5 font-bold text-cyan-300">{c.content}</td>
                          <td className="py-2.5 text-right text-white">{c.total_registrations}</td>
                          <td className="py-2.5 text-right text-emerald-400 font-bold">{c.verified_final_year}</td>
                          <td className="py-2.5 text-right text-slate-300">{c.verification_rate_percent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clubs Breakdown */}
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Student Society & Club Attribution (`club`)</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-mono border-b border-slate-800">
                        <th className="pb-2">Campus Club</th>
                        <th className="pb-2 text-right">Total Regs</th>
                        <th className="pb-2 text-right">Verified Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {performance.clubs.map((cl, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20">
                          <td className="py-2.5 text-slate-200 truncate max-w-xs">{cl.club}</td>
                          <td className="py-2.5 text-right text-white">{cl.total_registrations}</td>
                          <td className="py-2.5 text-right text-emerald-400 font-bold">{cl.verified_final_year}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
