import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  PlusCircle,
  AlertOctagon,
  X
} from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onOpenMobileMenu: () => void;
  onOpenCommandPalette: () => void;
  onOpenRegisterModal: () => void;
  onNavigate: (view: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  stats: {
    total_registrations: number;
    target_registrations: number;
    seats_remaining: number;
  };
  alertCounts: {
    critical: number;
    warning: number;
  };
}

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Growth Cockpit', subtitle: 'Target run-rate, conversion health & live telemetry' },
  campaign: { title: 'Masterclass Campaign', subtitle: '60-Minute AI Workshop seat allocation & syllabus' },
  registrations: { title: 'Student Directory', subtitle: 'Verified final-year registrations & lead qualification' },
  referrals: { title: 'Referral Engine & Squad Pass', subtitle: 'Viral K-factor, student milestones & leaderboard' },
  channels: { title: 'Acquisition Channels', subtitle: 'Attribution yields, UTM builder & conversion tracking' },
  colleges: { title: 'College Network Matrix', subtitle: 'Campus penetration, student TAM & club partnerships' },
  analytics: { title: 'Growth Analytics Deep-Dive', subtitle: 'Funnel dropoff, CPR, velocity & econometric models' },
  experiments: { title: 'A/B Experimentation Engine', subtitle: 'Statistical z-test significance & variant testing' },
  copilot: { title: 'AI Growth Copilot', subtitle: 'Predictive modeling, copy optimizer & strategic advice' },
  automations: { title: 'Automation Center', subtitle: 'Lifecycle triggers, templates & webhook integrations' },
  budget: { title: 'Budget Pacing Engine', subtitle: '₹2,000 challenge ceiling & CPR guardrails' },
  simulation: { title: 'Demo Simulation Hub', subtitle: 'Phase 13 hiring challenge 7-day timeline testing' },
  settings: { title: 'Platform Settings', subtitle: 'System preferences, telemetry & API credentials' },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobileMenu,
  onOpenCommandPalette,
  onOpenRegisterModal,
  onNavigate,
  theme,
  onToggleTheme,
  stats,
  alertCounts,
}) => {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const viewMeta = VIEW_TITLES[currentView] || { title: currentView, subtitle: 'NxtWave Growth Engine' };
  const progressPct = Math.min(100, Math.round((stats.total_registrations / maxNum(stats.target_registrations, 1)) * 100));

  function maxNum(a: number, b: number) {
    return a > b ? a : b;
  }

  return (
    <header className="h-16 border-b border-[#151D2E] bg-[#07090E]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & View Title */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
              {viewMeta.title}
            </h1>
            <span className="hidden lg:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
              Phase 15 Active
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 mt-0.5 truncate max-w-md">
            {viewMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Live Seat Progress Pill */}
        <div 
          onClick={() => onNavigate('campaign')}
          className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
          title="Click to view Campaign seat allocation"
        >
          <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-white">
            {stats.total_registrations} <span className="text-slate-500">/ 500</span>
          </span>
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition text-xs font-medium"
          title="Open Command Palette (Cmd + K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Quick Jump...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* Theme Switcher Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Alerts Bell & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition relative"
            title="System Alerts & Guardrails"
            aria-label="System Alerts"
          >
            <Bell className="w-4 h-4" />
            {alertCounts.critical > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </button>

          {/* Quick Alerts Dropdown Sheet */}
          {isAlertsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <AlertOctagon className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Growth Guardrails
                  </h4>
                </div>
                <button
                  onClick={() => setIsAlertsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                    <span className="text-slate-300 font-medium">Critical Breaches</span>
                  </div>
                  <span className="font-mono font-bold text-red-400">{alertCounts.critical} Active</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span className="text-slate-300 font-medium">Pacing Warnings</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300">{alertCounts.warning} Pending</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAlertsOpen(false);
                  onNavigate('dashboard');
                }}
                className="w-full py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/40 text-cyan-300 font-bold text-xs transition"
              >
                Inspect All Guardrails in Dashboard &rarr;
              </button>
            </div>
          )}
        </div>

        {/* Primary CTA: Register Student Button */}
        <button
          onClick={onOpenRegisterModal}
          className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-cyan-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-extrabold text-xs sm:text-xs flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Registration</span>
          <span className="sm:hidden">Register</span>
        </button>
      </div>
    </header>
  );
};
