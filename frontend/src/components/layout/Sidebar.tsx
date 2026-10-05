import React from 'react';
import {
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
  Award,
  Laptop,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  alertCounts: { critical: number; warning: number };
  totalRegistrations: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  alertCounts,
  totalRegistrations,
}) => {
  const NAV_GROUPS = [
    {
      title: 'CORE GROWTH',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: alertCounts.critical > 0 ? `${alertCounts.critical}` : null, badgeColor: 'bg-red-500 text-white' },
        { id: 'campaign', label: 'Campaign', icon: Sparkles, badge: `${totalRegistrations}/500`, badgeColor: 'bg-cyan-500/20 text-cyan-300' },
        { id: 'registrations', label: 'Registrations', icon: Users, badge: `${totalRegistrations}`, badgeColor: 'bg-slate-800 text-slate-300' },
        { id: 'referrals', label: 'Referrals', icon: Flame, badge: 'Squad Pass', badgeColor: 'bg-amber-500/20 text-amber-300' },
      ],
    },
    {
      title: 'ACQUISITION & CHANNELS',
      items: [
        { id: 'channels', label: 'Channels', icon: Radio },
        { id: 'colleges', label: 'Colleges', icon: Building },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'CHALLENGE ASSETS',
      items: [
        { id: 'evaluator', label: 'AI Project Evaluator', icon: Award, badge: 'Evaluation', badgeColor: 'bg-amber-400 text-black font-bold' },
        { id: 'workshop', label: 'Workshop Studio', icon: Laptop, badge: '60m Live', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
        { id: 'whatsapp_flow', label: 'WhatsApp Bot Flow', icon: MessageSquare, badge: 'Interactive', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
      ],
    },
    {
      title: 'OPTIMIZATION & AI',
      items: [
        { id: 'experiments', label: 'Experiments', icon: FlaskConical },
        { id: 'copilot', label: 'AI Copilot', icon: Brain },
        { id: 'automations', label: 'Automation', icon: Zap },
      ],
    },
    {
      title: 'FINANCIALS & PLATFORM',
      items: [
        { id: 'budget', label: 'Budget', icon: IndianRupee },
        { id: 'simulation', label: 'Simulation', icon: ShieldAlert, badge: 'Demo', badgeColor: 'bg-amber-400 text-black font-bold' },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#07090E] border-r border-[#151D2E] text-slate-300 select-none">
      {/* Brand Header */}
      <div className={`h-16 flex items-center px-4 border-b border-[#151D2E] ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div 
            onClick={() => onNavigate('dashboard')} 
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-emerald-400 flex items-center justify-center font-extrabold text-black text-base shadow-md shadow-cyan-500/20 group-hover:scale-105 transition">
              N
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm tracking-tight text-white">NxtWave</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">SaaS</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">Growth Engine v1.0</span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div 
            onClick={() => onNavigate('dashboard')}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-indigo-500 to-emerald-400 flex items-center justify-center font-extrabold text-black text-base shadow-md shadow-cyan-500/20 cursor-pointer"
            title="NxtWave Growth Engine"
          >
            N
          </div>
        )}

        {/* Desktop Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close mobile sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Group Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all duration-150 relative ${
                    isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 space-x-3'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/15 to-indigo-500/10 text-cyan-300 font-bold border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  {/* Left Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-400 rounded-r-full shadow-sm shadow-cyan-400"></span>
                  )}

                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />

                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Profile / Telemetry Chip */}
      <div className={`p-3 border-t border-[#151D2E] bg-slate-950/60 ${isCollapsed ? 'text-center' : ''}`}>
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-[11px]">
                NW
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">Growth Officer</div>
                <div className="text-[10px] text-emerald-400 flex items-center space-x-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>500 Target Live</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Open Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-7 h-7 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white text-[11px]">
            NW
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 transition-all duration-200 sticky top-0 h-screen z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop and Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#07090E] shadow-2xl z-10 animate-fadeIn">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
