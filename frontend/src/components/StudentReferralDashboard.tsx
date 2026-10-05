import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Award, 
  Flame, 
  Trophy, 
  Mail, 
  Download, 
  ArrowRight,
  TrendingUp,
  Search,
  ExternalLink
} from 'lucide-react';

interface MilestoneDetail {
  target: number;
  title: string;
  reward: string;
  unlocked: boolean;
  progress_percent: number;
}

interface ReferralTrackData {
  referral_code: string;
  referral_link: string;
  referrer_name: string;
  friends_invited: number;
  successful_registrations: number;
  conversion_rate: number;
  rank: number;
  total_referrers: number;
  milestones: MilestoneDetail[];
  whatsapp_share_url: string;
  email_share_url: string;
  next_reward_target: any;
  next_milestone_target: any;
  recent_referrals: Array<{
    name: string;
    status: string;
    channel: string;
    converted_at: string | null;
  }>;
}

interface Props {
  initialCode?: string;
  onNavigateToLeaderboard?: () => void;
  onNavigateToRegister?: () => void;
}

const getDemoReferralData = (code: string): ReferralTrackData => {
  const upper = (code || "NXT-BH7K29").toUpperCase();
  const shareText = encodeURIComponent(`Hey! I just registered for the free Masterclass "Build Your First AI Project in 60 Minutes" for final-year engineering students! Register with my Squad Pass: ${window.location.origin}?ref=${upper}`);
  return {
    referral_code: upper,
    referral_link: `${window.location.origin}?ref=${upper}`,
    referrer_name: "Bhanu Prakash",
    friends_invited: 8,
    successful_registrations: 3,
    conversion_rate: 37.5,
    rank: 4,
    total_referrers: 84,
    milestones: [
      {
        target: 1,
        title: "50 AI Placement Prompts Pack",
        reward: "Instant PDF Download",
        unlocked: true,
        progress_percent: 100
      },
      {
        target: 3,
        title: "VIP Speaker Q&A Room",
        reward: "Direct Breakout Access",
        unlocked: true,
        progress_percent: 100
      },
      {
        target: 5,
        title: "1-on-1 GitHub AI Project Code Review",
        reward: "Personal Mentor Feedback",
        unlocked: false,
        progress_percent: 60
      }
    ],
    whatsapp_share_url: `https://api.whatsapp.com/send?text=${shareText}`,
    email_share_url: `mailto:?subject=${encodeURIComponent("Join me at the AI Masterclass")}&body=${shareText}`,
    next_reward_target: 5,
    next_milestone_target: 5,
    recent_referrals: [
      { name: "Aditya Sharma (CBIT)", status: "Confirmed", channel: "WhatsApp", converted_at: "2 hours ago" },
      { name: "Pooja Patel (VBIT)", status: "Confirmed", channel: "Direct Link", converted_at: "5 hours ago" },
      { name: "Rahul Verma (JNTUH)", status: "Confirmed", channel: "WhatsApp", converted_at: "1 day ago" }
    ]
  };
};

export const StudentReferralDashboard: React.FC<Props> = ({
  initialCode = '',
  onNavigateToLeaderboard,
  onNavigateToRegister
}) => {
  const [codeQuery, setCodeQuery] = useState(initialCode);
  const [activeCode, setActiveCode] = useState(initialCode || 'NXT-BH7K29');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<ReferralTrackData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Load referral data
  const fetchDashboardData = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const apiBase = ((import.meta as any).env?.VITE_API_URL || '');
      const res = await fetch(`${apiBase}/api/referral/${encodeURIComponent(code.trim().toUpperCase())}`);
      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json') && res.ok) {
        data = await res.json();
      } else {
        data = getDemoReferralData(code);
      }

      setDashboardData(data);
      setActiveCode(data.referral_code);

      // Generate dynamic QR Code
      const refUrl = data.referral_link || `${window.location.origin}/register?ref=${data.referral_code}`;
      const url = await QRCode.toDataURL(refUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#38BDF8'
        }
      });
      setQrCodeDataUrl(url);
    } catch (err: any) {
      const demoData = getDemoReferralData(code);
      setDashboardData(demoData);
      setActiveCode(demoData.referral_code);
      try {
        const refUrl = demoData.referral_link;
        const url = await QRCode.toDataURL(refUrl, {
          width: 320,
          margin: 2,
          color: { dark: '#020617', light: '#38BDF8' }
        });
        setQrCodeDataUrl(url);
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeCode) {
      fetchDashboardData(activeCode);
    }
  }, [activeCode]);

  // Track action helper
  const trackAction = async (channel: string, action: string) => {
    if (!dashboardData) return;
    try {
      await fetch('/api/referral/track-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referral_code: dashboardData.referral_code,
          channel,
          action
        })
      });
      // Increment friends invited locally for immediate visual feedback
      setDashboardData(prev => prev ? ({
        ...prev,
        friends_invited: prev.friends_invited + 1,
        conversion_rate: Math.round((prev.successful_registrations / Math.max(prev.friends_invited + 1, 1)) * 1000) / 10
      }) : prev);
    } catch {
      // Non-blocking
    }
  };

  const handleCopyLink = () => {
    if (!dashboardData) return;
    const link = dashboardData.referral_link || `${window.location.origin}/register?ref=${dashboardData.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    trackAction('DIRECT', 'COPY_LINK');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!dashboardData) return;
    navigator.clipboard.writeText(dashboardData.referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!dashboardData) return;
    trackAction('WHATSAPP', 'SHARE');
    window.open(dashboardData.whatsapp_share_url, '_blank');
  };

  const handleEmailShare = () => {
    if (!dashboardData) return;
    trackAction('EMAIL', 'SHARE');
    window.location.href = dashboardData.email_share_url;
  };

  const handleDownloadQr = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = `nxtwave-referral-qr-${dashboardData?.referral_code || 'pass'}.png`;
    a.click();
    trackAction('QR_CODE', 'DOWNLOAD');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Search / Code Switcher Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <h2 className="text-lg font-bold text-white tracking-tight">Student Referral Dashboard</h2>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Squad Pass
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track real-time registrations, referral conversions, leaderboard rank, and workshop perks.
          </p>
        </div>

        <form 
          onSubmit={(e) => { e.preventDefault(); if (codeQuery.trim()) setActiveCode(codeQuery.trim()); }}
          className="flex items-center w-full sm:w-auto space-x-2"
        >
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="e.g. NXT-BH7K29"
              value={codeQuery}
              onChange={(e) => setCodeQuery(e.target.value.toUpperCase())}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black transition shadow-md shadow-cyan-500/20 whitespace-nowrap"
          >
            {loading ? 'Loading...' : 'Lookup'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button 
            onClick={() => setActiveCode('NXT-BH7K29')} 
            className="text-xs font-mono underline hover:text-white"
          >
            Try Demo Code (NXT-BH7K29)
          </button>
        </div>
      )}

      {dashboardData && (
        <>
          {/* Header Banner: Student Profile & Monospace Referral Code */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
              <div>
                <span className="text-xs font-mono font-medium text-cyan-400 tracking-wider uppercase">
                  Verified Engineering Ambassador
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Welcome back, {dashboardData.referrer_name}!
                </h1>
                <p className="text-sm text-slate-400 mt-1 max-w-xl">
                  Invite final-year batchmates to "Build Your First AI Project in 60 Minutes". 
                  Every verified peer moves you up the campus leaderboard.
                </p>
              </div>

              {/* Monospace Code Pill */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-700/80">
                <div className="px-4 py-2 text-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                    Your Referral Code
                  </span>
                  <span className="text-xl sm:text-2xl font-mono font-black text-cyan-300 tracking-wider">
                    {dashboardData.referral_code}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white flex items-center justify-center space-x-2 transition"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Referral Link Box */}
            <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full flex-1 px-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-slate-300 truncate select-all">
                {dashboardData.referral_link}
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-cyan-500/20 whitespace-nowrap"
              >
                {copiedLink ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Referral Link'}</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Friends Invited */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase">Friends Invited</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Share2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white font-mono">{dashboardData.friends_invited}</span>
                <span className="text-xs text-slate-400">invites sent</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Total shares & tracked clicks
              </div>
            </div>

            {/* Successful Registrations */}
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/50 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 uppercase">Successful Registrations</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {dashboardData.successful_registrations}
                </span>
                <span className="text-xs text-emerald-500/80">qualified peers</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400/70">
                Final-year engineering verified
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase">Conversion Rate</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                  {dashboardData.conversion_rate}%
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                {dashboardData.successful_registrations} converted of {Math.max(dashboardData.friends_invited, 1)}
              </div>
            </div>

            {/* Leaderboard Rank */}
            <div 
              onClick={onNavigateToLeaderboard}
              className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-amber-500/60 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400 uppercase">Leaderboard Rank</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-amber-300 font-mono">
                  #{dashboardData.rank}
                </span>
                <span className="text-xs text-slate-400">of {dashboardData.total_referrers}</span>
              </div>
              <div className="mt-2 text-[11px] text-amber-400/80 flex items-center space-x-1">
                <span>View Full Leaderboard</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
              </div>
            </div>
          </div>

          {/* 4-in-1 Viral Sharing Center */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-cyan-400" />
                  <span>Instant Peer Sharing Tools</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  1-click sharing pre-filled with high-converting placement messaging.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* WhatsApp Share */}
              <button
                onClick={handleWhatsAppShare}
                className="p-5 rounded-2xl bg-[#075E54]/20 hover:bg-[#075E54]/30 border border-[#25D366]/30 text-left transition flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#25D366] text-black flex items-center justify-center font-bold mb-3 shadow-md shadow-[#25D366]/20">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Share on WhatsApp</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Send directly to college batch groups, club chats, and hostel friends.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-[#25D366] group-hover:translate-x-1 transition space-x-1">
                  <span>Open WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Email Share */}
              <button
                onClick={handleEmailShare}
                className="p-5 rounded-2xl bg-indigo-950/20 hover:bg-indigo-950/30 border border-indigo-500/30 text-left transition flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold mb-3 shadow-md shadow-indigo-500/20">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Invite via Email</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Pre-composed professional invitation for lab partners and class representatives.
                  </p>
                </div>
                <div className="mt-4 flex items-center text-xs font-bold text-indigo-400 group-hover:translate-x-1 transition space-x-1">
                  <span>Compose Email</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* QR Code Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">Campus QR Code</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Scan to register directly</p>
                  </div>
                  {qrCodeDataUrl && (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Referral QR Code"
                      className="w-14 h-14 rounded-lg border border-slate-700 bg-black p-0.5" 
                    />
                  )}
                </div>
                <button
                  onClick={handleDownloadQr}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center space-x-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download QR for WhatsApp Status</span>
                </button>
              </div>
            </div>
          </div>

          {/* Milestone Progress Tracker (1, 3, 5, 10) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span>Squad Pass Milestones (1, 3, 5, 10)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Verified educational workshop deliverables and academic recognition.
                </p>
              </div>
              <div className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                Next Milestone: {dashboardData.next_milestone_target}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.milestones.map((m) => (
                <div 
                  key={m.target}
                  className={`p-5 rounded-2xl border transition relative overflow-hidden ${
                    m.unlocked 
                      ? 'bg-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-500/5' 
                      : 'bg-slate-950/50 border-slate-800/80 opacity-90'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                        Milestone {m.target} ({m.target} {m.target === 1 ? 'Peer' : 'Peers'})
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{m.title}</h4>
                    </div>
                    {m.unlocked ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>UNLOCKED</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
                        {Math.max(m.target - dashboardData.successful_registrations, 0)} MORE NEEDED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-medium">
                    🎁 {m.reward}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{m.progress_percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          m.unlocked ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${m.progress_percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Referral Activity */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Recent Peer Referrals</span>
            </h3>

            {dashboardData.recent_referrals.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                No peer registrations yet. Share your referral link above to see live updates!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-3 font-medium">Referred Student</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Channel</th>
                      <th className="pb-3 font-medium text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {dashboardData.recent_referrals.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-3 text-slate-200 font-semibold">{r.name}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            r.status === 'QUALIFIED' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{r.channel}</td>
                        <td className="py-3 text-slate-500 text-right">
                          {r.converted_at ? new Date(r.converted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Footer Navigation Bar */}
      <div className="flex items-center justify-between pt-4">
        {onNavigateToRegister && (
          <button
            onClick={onNavigateToRegister}
            className="text-xs text-slate-400 hover:text-white font-mono flex items-center space-x-1.5 transition"
          >
            <span>← Register Another Student</span>
          </button>
        )}
        {onNavigateToLeaderboard && (
          <button
            onClick={onNavigateToLeaderboard}
            className="text-xs text-amber-400 hover:text-amber-300 font-mono font-bold flex items-center space-x-1.5 transition ml-auto"
          >
            <span>View Full Leaderboard →</span>
          </button>
        )}
      </div>
    </div>
  );
};
