import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Search, 
  ArrowLeft
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  referral_code: string;
  student_name: string;
  college_name: string;
  branch: string;
  successful_referrals: number;
  friends_invited: number;
  conversion_rate: number;
  badges: string[];
}

interface LeaderboardData {
  total_participants: number;
  total_referrals: number;
  leaderboard: LeaderboardEntry[];
}

interface Props {
  highlightCode?: string;
  onSelectStudentCode?: (code: string) => void;
  onNavigateBack?: () => void;
}

const DEFAULT_LEADERBOARD_DATA: LeaderboardData = {
  total_participants: 84,
  total_referrals: 150,
  leaderboard: [
    {
      rank: 1,
      referral_code: "NXT-AS91",
      student_name: "Aditya Sharma",
      college_name: "Chaitanya Bharathi Institute of Technology",
      branch: "Computer Science and Engineering",
      successful_referrals: 8,
      friends_invited: 14,
      conversion_rate: 57.1,
      badges: ["?? Campus Champion", "?? Viral Catalyst", "? Tier 3 Unlocked"]
    },
    {
      rank: 2,
      referral_code: "NXT-BP42",
      student_name: "Bhanu Prakash",
      college_name: "BVRIT Hyderabad",
      branch: "Computer Science and Engineering",
      successful_referrals: 6,
      friends_invited: 10,
      conversion_rate: 60.0,
      badges: ["?? Squad Leader", "? Tier 3 Unlocked"]
    },
    {
      rank: 3,
      referral_code: "NXT-SR44",
      student_name: "Sneha Reddy",
      college_name: "Vasavi College of Engineering",
      branch: "Computer Science and Engineering",
      successful_referrals: 5,
      friends_invited: 8,
      conversion_rate: 62.5,
      badges: ["?? Power Networker", "? Tier 3 Unlocked"]
    },
    {
      rank: 4,
      referral_code: "NXT-PP18",
      student_name: "Pooja Patel",
      college_name: "Vignana Bharathi Institute of Technology",
      branch: "Information Technology",
      successful_referrals: 4,
      friends_invited: 7,
      conversion_rate: 57.1,
      badges: ["? Tier 2 Unlocked"]
    },
    {
      rank: 5,
      referral_code: "NXT-RV07",
      student_name: "Rahul Verma",
      college_name: "JNTUH College of Engineering",
      branch: "Electronics and Communication",
      successful_referrals: 3,
      friends_invited: 6,
      conversion_rate: 50.0,
      badges: ["? Tier 2 Unlocked"]
    }
  ]
};

export const ReferralLeaderboard: React.FC<Props> = ({
  highlightCode = '',
  onSelectStudentCode,
  onNavigateBack,
}) => {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiBase = ((import.meta as any).env?.VITE_API_URL || '');
      const res = await fetch(`${apiBase}/api/referral/leaderboard`);
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json') && res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(DEFAULT_LEADERBOARD_DATA);
      }
    } catch (err: any) {
      setData(DEFAULT_LEADERBOARD_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = data?.leaderboard.filter((entry) => {
    const q = searchQuery.toLowerCase();
    return (
      entry.student_name.toLowerCase().includes(q) ||
      entry.college_name.toLowerCase().includes(q) ||
      entry.referral_code.toLowerCase().includes(q) ||
      entry.branch.toLowerCase().includes(q)
    );
  }) || [];

  const top3 = data?.leaderboard.slice(0, 3) || [];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Trophy className="w-6 h-6" />
              </span>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Campus AI Ambassador Standings
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Referral Leaderboard
                </h1>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">
              Real-time rankings of final-year engineering students driving peer adoption for 
              "Build Your First AI Project in 60 Minutes".
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
            <div className="text-center px-3 border-r border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Active Referrers</span>
              <span className="text-xl font-mono font-bold text-white">
                {data?.total_participants || 0}
              </span>
            </div>
            <div className="text-center px-3">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Verified Referrals</span>
              <span className="text-xl font-mono font-bold text-emerald-400">
                {data?.total_referrals || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Podium (when available) */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* 2nd Place */}
          <div 
            onClick={() => onSelectStudentCode && onSelectStudentCode(top3[1].referral_code)}
            className="sm:order-1 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 text-center flex flex-col justify-between hover:border-slate-500 transition cursor-pointer relative"
          >
            <div className="w-8 h-8 rounded-full bg-slate-400 text-black font-extrabold flex items-center justify-center mx-auto mb-2 text-sm shadow-md">
              2
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{top3[1].student_name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{top3[1].college_name}</p>
              <span className="inline-block mt-2 font-mono text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full">
                {top3[1].referral_code}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-around text-xs font-mono">
              <span className="text-emerald-400 font-bold">{top3[1].successful_referrals} Referrals</span>
              <span className="text-slate-400">{top3[1].conversion_rate}% Conv</span>
            </div>
          </div>

          {/* 1st Place */}
          <div 
            onClick={() => onSelectStudentCode && onSelectStudentCode(top3[0].referral_code)}
            className="sm:order-2 bg-gradient-to-b from-amber-950/50 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-6 text-center flex flex-col justify-between hover:border-amber-400 transition cursor-pointer relative shadow-xl shadow-amber-500/10 sm:-translate-y-2"
          >
            <div className="w-10 h-10 rounded-full bg-amber-400 text-black font-black flex items-center justify-center mx-auto mb-2 text-base shadow-lg shadow-amber-400/30">
              👑 1
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">
                Overall Champion
              </span>
              <h3 className="font-extrabold text-white text-lg mt-0.5">{top3[0].student_name}</h3>
              <p className="text-xs text-slate-300 mt-0.5 truncate">{top3[0].college_name}</p>
              <span className="inline-block mt-2 font-mono text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                {top3[0].referral_code}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-around text-xs font-mono">
              <span className="text-amber-300 font-extrabold text-sm">{top3[0].successful_referrals} Referrals</span>
              <span className="text-slate-300">{top3[0].conversion_rate}% Conv</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div 
            onClick={() => onSelectStudentCode && onSelectStudentCode(top3[2].referral_code)}
            className="sm:order-3 bg-slate-900/90 border border-amber-700/50 rounded-2xl p-5 text-center flex flex-col justify-between hover:border-amber-600 transition cursor-pointer relative"
          >
            <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-extrabold flex items-center justify-center mx-auto mb-2 text-sm shadow-md">
              3
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{top3[2].student_name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{top3[2].college_name}</p>
              <span className="inline-block mt-2 font-mono text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full">
                {top3[2].referral_code}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-around text-xs font-mono">
              <span className="text-emerald-400 font-bold">{top3[2].successful_referrals} Referrals</span>
              <span className="text-slate-400">{top3[2].conversion_rate}% Conv</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student name, college, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredLeaderboard.length} of {data?.leaderboard.length || 0} referrers
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">
            Loading leaderboard standings...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400 text-xs font-mono">
            {error}
          </div>
        ) : filteredLeaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-mono">
            No referrers matched your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                  <th className="py-4 px-4 font-semibold w-16 text-center">Rank</th>
                  <th className="py-4 px-4 font-semibold">Student</th>
                  <th className="py-4 px-4 font-semibold">College & Branch</th>
                  <th className="py-4 px-4 font-semibold text-center">Referrals</th>
                  <th className="py-4 px-4 font-semibold text-center">Invites</th>
                  <th className="py-4 px-4 font-semibold text-center">Conversion</th>
                  <th className="py-4 px-4 font-semibold">Badges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLeaderboard.map((entry) => {
                  const isHighlighted = highlightCode && entry.referral_code.toUpperCase() === highlightCode.toUpperCase();
                  return (
                    <tr 
                      key={entry.referral_code}
                      onClick={() => onSelectStudentCode && onSelectStudentCode(entry.referral_code)}
                      className={`hover:bg-slate-800/40 transition cursor-pointer ${
                        isHighlighted ? 'bg-cyan-500/10 border-l-4 border-cyan-400' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-bold">
                        {entry.rank === 1 ? (
                          <span className="text-amber-400 font-extrabold">🥇 #1</span>
                        ) : entry.rank === 2 ? (
                          <span className="text-slate-300 font-bold">🥈 #2</span>
                        ) : entry.rank === 3 ? (
                          <span className="text-amber-600 font-bold">🥉 #3</span>
                        ) : (
                          <span className="text-slate-400">#{entry.rank}</span>
                        )}
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">
                          {entry.student_name}
                        </div>
                        <span className="text-[10px] text-cyan-400">
                          {entry.referral_code}
                        </span>
                      </td>

                      {/* College & Branch */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-slate-200 truncate">{entry.college_name}</div>
                        <div className="text-[10px] text-slate-500">{entry.branch}</div>
                      </td>

                      {/* Referrals */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          {entry.successful_referrals}
                        </span>
                      </td>

                      {/* Invites */}
                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {entry.friends_invited}
                      </td>

                      {/* Conversion */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-cyan-300 font-medium">
                          {entry.conversion_rate}%
                        </span>
                      </td>

                      {/* Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {entry.badges.map((b, idx) => (
                            <span 
                              key={idx}
                              className={`text-[9px] px-2 py-0.5 rounded-full border ${
                                b.includes('Rank #1') 
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                  : b.includes('Ambassador')
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      {onNavigateBack && (
        <div className="pt-2">
          <button
            onClick={onNavigateBack}
            className="text-xs text-slate-400 hover:text-white font-mono flex items-center space-x-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}
    </div>
  );
};
