import React, { useState } from 'react';
import {
  Flame,
  Trophy,
  Search
} from 'lucide-react';
import { StudentReferralDashboard } from '../StudentReferralDashboard';
import { ReferralLeaderboard } from '../ReferralLeaderboard';

interface ReferralsCenterProps {
  initialCode: string;
  onNavigateToRegister: () => void;
}

export const ReferralsCenter: React.FC<ReferralsCenterProps> = ({
  initialCode,
  onNavigateToRegister,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leaderboard'>('dashboard');
  const [selectedCode, setSelectedCode] = useState<string>(initialCode || 'NXT-BH7K29');
  const [lookupInput, setLookupInput] = useState<string>('');

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupInput.trim()) {
      setSelectedCode(lookupInput.trim().toUpperCase());
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Squad Pass Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white bg-slate-800/80'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Campus Leaderboard</span>
          </button>
        </div>

        {/* Lookup Bar */}
        <form onSubmit={handleLookup} className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lookup code (e.g. NXT-BH7K29)..."
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            Lookup
          </button>
        </form>
      </div>

      {/* Render Active View */}
      {activeTab === 'dashboard' ? (
        <StudentReferralDashboard
          initialCode={selectedCode}
          onNavigateToLeaderboard={() => setActiveTab('leaderboard')}
          onNavigateToRegister={onNavigateToRegister}
        />
      ) : (
        <ReferralLeaderboard
          highlightCode={selectedCode}
          onSelectStudentCode={(code) => {
            setSelectedCode(code);
            setActiveTab('dashboard');
          }}
          onNavigateBack={() => setActiveTab('dashboard')}
        />
      )}
    </div>
  );
};
