import React, { useState, useEffect } from 'react';
import {
  Search,
  LayoutDashboard,
  Sparkles,
  Users,
  Flame,
  Radio,
  Building,
  BarChart3,
  FlaskConical,
  Brain,
  Zap,
  IndianRupee,
  ShieldAlert,
  Settings,
  ArrowRight,
  PlusCircle,
  Play
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onQuickRegister: () => void;
  onQuickSimulate: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onQuickRegister,
  onQuickSimulate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const NAVIGATION_ITEMS = [
    { id: 'dashboard', name: 'Dashboard', desc: 'Executive growth KPIs, target progress & alerts', icon: LayoutDashboard, category: 'Core Growth' },
    { id: 'campaign', name: 'Campaign', desc: 'Masterclass syllabus, capacity & register flow', icon: Sparkles, category: 'Core Growth' },
    { id: 'registrations', name: 'Registrations', desc: 'Searchable student directory & lead qualification', icon: Users, category: 'Core Growth' },
    { id: 'referrals', name: 'Referrals', desc: 'Squad Pass milestones, leaderboard & viral K-factor', icon: Flame, category: 'Core Growth' },
    { id: 'channels', name: 'Channels', desc: 'Acquisition attribution & Admin UTM builder', icon: Radio, category: 'Acquisition' },
    { id: 'colleges', name: 'Colleges', desc: 'Campus penetration matrix & club networks', icon: Building, category: 'Acquisition' },
    { id: 'analytics', name: 'Analytics', desc: 'Funnel dropoff, velocity, CPR & trends', icon: BarChart3, category: 'Acquisition' },
    { id: 'experiments', name: 'Experiments', desc: 'A/B headline testing & z-test significance', icon: FlaskConical, category: 'Optimization' },
    { id: 'copilot', name: 'AI Copilot', desc: 'Strategic diagnosis & predictive intelligence hub', icon: Brain, category: 'Optimization' },
    { id: 'automations', name: 'Automation', desc: 'Lifecycle triggers, WhatsApp templates & webhooks', icon: Zap, category: 'Optimization' },
    { id: 'budget', name: 'Budget', desc: '₹2,000 budget engine & CPR pacing guardrails', icon: IndianRupee, category: 'Financials' },
    { id: 'simulation', name: 'Simulation', desc: 'Phase 13 hiring challenge 7-day timeline demo', icon: ShieldAlert, category: 'Simulation' },
    { id: 'settings', name: 'Settings', desc: 'Theme switch, API keys & platform configuration', icon: Settings, category: 'Platform' },
  ];

  const filteredItems = NAVIGATION_ITEMS.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Palette Surface */}
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-10 animate-fadeIn">
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or navigate to... (e.g. Budget, Channels, Leads)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Quick Actions Ribbon */}
        <div className="p-2 border-b border-slate-800 bg-slate-950/30 flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              onClose();
              onQuickRegister();
            }}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 flex items-center space-x-1.5 transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Student Registration</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onQuickSimulate();
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/40 flex items-center space-x-1.5 transition"
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate +10 Signups</span>
          </button>
        </div>

        {/* List of Navigation & Actions */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching pages or actions found for "{query}".
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-800/80 text-left flex items-center justify-between transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-slate-300 group-hover:text-cyan-400 group-hover:bg-slate-700/60 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>{item.name}</span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{item.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/70 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <span>Use &uarr; &darr; to navigate, Enter to select</span>
          <span>NxtWave Growth SaaS Platform</span>
        </div>
      </div>
    </div>
  );
};
