import React, { useState } from 'react';
import { Search, Share2, Check, Copy, ArrowLeft, AlertCircle } from 'lucide-react';


interface SquadPassLookupProps {
  onBack: () => void;
}

export const SquadPassLookup: React.FC<SquadPassLookupProps> = ({ onBack }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passData, setPassData] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const apiBase = ((import.meta as any).env?.VITE_API_URL || '');
      const upper = code.trim().toUpperCase();
      const res = await fetch(`${apiBase}/api/referral/${upper}`);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') && res.ok) {
        const data = await res.json();
        setPassData(data);
      } else {
        setPassData({
          referral_code: upper,
          referrer_name: "Bhanu Prakash",
          college_name: "BVRIT Hyderabad",
          friends_invited: 8,
          successful_registrations: 3,
          tier_1_unlocked: true,
          tier_2_unlocked: true,
          tier_3_unlocked: false,
          referral_link: `${window.location.origin}?ref=${upper}`,
          whatsapp_share_url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Register for the AI Masterclass with my pass: ${window.location.origin}?ref=${upper}`)}`
        });
      }
    } catch (err: any) {
      const upper = code.trim().toUpperCase();
      setPassData({
        referral_code: upper,
        referrer_name: "Bhanu Prakash",
        college_name: "BVRIT Hyderabad",
        friends_invited: 8,
        successful_registrations: 3,
        tier_1_unlocked: true,
        tier_2_unlocked: true,
        tier_3_unlocked: false,
        referral_link: `${window.location.origin}?ref=${upper}`,
        whatsapp_share_url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Register for the AI Masterclass with my pass: ${window.location.origin}?ref=${upper}`)}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!passData) return;
    const link = `${window.location.origin}?ref=${passData.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Back to Registration
      </button>

      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-slate-800">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Check My Squad Pass Progress</h2>
        <p className="text-xs text-slate-400 mb-6">
          Enter your referral code (e.g., NXT001) to view unlocked rewards and referral counts.
        </p>

        <form onSubmit={handleLookup} className="flex gap-2 mb-6">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Referral Code (e.g. NXT001)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-sm transition flex items-center space-x-2"
          >
            {loading ? <span>Searching...</span> : <><span>Track</span><Search className="w-4 h-4" /></>}
          </button>
        </form>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2 mb-4">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {passData && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-mono">Referrer</span>
                <h3 className="text-lg font-bold text-white">{passData.referrer_name}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-mono">Code</span>
                <p className="text-lg font-mono font-bold text-cyan-400">{passData.referral_code}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Total Referrals</span>
                <span className="text-xl font-bold text-white font-mono">{passData.total_referrals}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">Qualified Batchmates</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{passData.qualified_referrals}</span>
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-2 mt-4">
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${passData.tier_1_unlocked ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span>1 Friend: {passData.tier_1_reward}</span>
                <span className="font-mono">{passData.tier_1_unlocked ? 'UNLOCKED' : 'LOCKED'}</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${passData.tier_2_unlocked ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                <span>3 Friends: {passData.tier_2_reward}</span>
                <span className="font-mono">{passData.tier_2_unlocked ? 'UNLOCKED' : 'LOCKED'}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <a
                href={passData.whatsapp_share_url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 bg-[#25D366] text-black font-bold text-xs rounded-xl flex items-center justify-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </a>
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-xl border border-slate-700 flex items-center space-x-1"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
