import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/common/Toast';
import { Modal } from './components/common/Modal';
import { CommandPalette } from './components/common/CommandPalette';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// 13 Navigation Views
import { AdminGrowthDashboard } from './components/AdminGrowthDashboard';
import { CampaignCenter } from './components/views/CampaignCenter';
import { RegistrationsManager } from './components/views/RegistrationsManager';
import { ReferralsCenter } from './components/views/ReferralsCenter';
import { ChannelsCenter } from './components/views/ChannelsCenter';
import { CollegesCenter } from './components/views/CollegesCenter';
import { AnalyticsCenter } from './components/views/AnalyticsCenter';
import { ExperimentationEngine } from './components/ExperimentationEngine';
import { IntelligenceCenter } from './components/IntelligenceCenter';
import { AutomationCenter } from './components/AutomationCenter';
import { BudgetEngine } from './components/BudgetEngine';
import { SimulationCenter } from './components/SimulationCenter';
import { SettingsCenter } from './components/views/SettingsCenter';

// Shared Forms
import { RegistrationForm } from './components/RegistrationForm';
import { SuccessPage } from './components/SuccessPage';

const AppContent: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('nxtwave_growth_theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  const [registrationData, setRegistrationData] = useState<any | null>(null);
  const [userReferralCode, setUserReferralCode] = useState<string>('NXT-BH7K29');
  const [alertCounts, setAlertCounts] = useState<{ critical: number; warning: number }>({ critical: 0, warning: 0 });
  const [stats, setStats] = useState({
    total_registrations: 30,
    verified_final_year: 24,
    target_registrations: 500,
    seats_remaining: 470,
    k_factor: 1.15
  });

  // Apply theme class to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('nxtwave_growth_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Synchronize URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const refParam = params.get('ref') || params.get('referral');

    if (refParam) {
      setUserReferralCode(refParam.toUpperCase());
    }

    const VIEW_ALIAS_MAP: Record<string, string> = {
      dashboard: 'dashboard',
      admin: 'dashboard',
      campaign: 'campaign',
      masterclass: 'campaign',
      registrations: 'registrations',
      leads: 'registrations',
      students: 'registrations',
      referrals: 'referrals',
      pass: 'referrals',
      squad: 'referrals',
      channels: 'channels',
      utm: 'channels',
      colleges: 'colleges',
      campus: 'colleges',
      analytics: 'analytics',
      funnel: 'analytics',
      experiments: 'experiments',
      ab: 'experiments',
      copilot: 'copilot',
      ai: 'copilot',
      intelligence: 'copilot',
      automation: 'automations',
      automations: 'automations',
      budget: 'budget',
      simulation: 'simulation',
      demo: 'simulation',
      settings: 'settings',
    };

    if (viewParam && VIEW_ALIAS_MAP[viewParam.toLowerCase()]) {
      setCurrentView(VIEW_ALIAS_MAP[viewParam.toLowerCase()]);
    } else if (window.location.pathname.includes('/register') || refParam) {
      setIsRegisterModalOpen(true);
    }
  }, []);

  // Fetch campaign metrics and alert telemetry
  const refreshTelemetry = () => {
    fetch('/api/dashboard')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setStats({
            total_registrations: data.total_registrations ?? 30,
            verified_final_year: data.verified_final_year ?? 24,
            target_registrations: data.target_registrations ?? 500,
            seats_remaining: data.seats_remaining ?? 470,
            k_factor: data.k_factor ?? 1.15
          });
        }
      })
      .catch(() => {});

    fetch('/api/alerts/summary')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setAlertCounts({
            critical: data.critical_count ?? 0,
            warning: data.warning_count ?? 0,
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshTelemetry();
    const interval = setInterval(refreshTelemetry, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegistrationSuccess = (data: any) => {
    setRegistrationData(data);
    if (data?.referral_code) {
      setUserReferralCode(data.referral_code);
    }
    refreshTelemetry();
  };

  const handleRegisterAnother = () => {
    setRegistrationData(null);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterModalOpen(false);
    setRegistrationData(null);
  };

  // Render active view component
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminGrowthDashboard />;
      case 'campaign':
        return (
          <CampaignCenter
            onRegistrationSuccess={handleRegistrationSuccess}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            stats={stats}
          />
        );
      case 'registrations':
        return (
          <RegistrationsManager
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
            onNavigateToReferral={(code) => {
              setUserReferralCode(code);
              setCurrentView('referrals');
            }}
          />
        );
      case 'referrals':
        return (
          <ReferralsCenter
            initialCode={userReferralCode}
            onNavigateToRegister={() => setIsRegisterModalOpen(true)}
          />
        );
      case 'channels':
        return <ChannelsCenter />;
      case 'colleges':
        return <CollegesCenter />;
      case 'analytics':
        return <AnalyticsCenter />;
      case 'experiments':
        return <ExperimentationEngine />;
      case 'copilot':
        return <IntelligenceCenter />;
      case 'automations':
        return <AutomationCenter />;
      case 'budget':
        return <BudgetEngine />;
      case 'simulation':
        return <SimulationCenter />;
      case 'settings':
        return <SettingsCenter theme={theme} onToggleTheme={toggleTheme} />;
      default:
        return <AdminGrowthDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#07090E] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        alertCounts={alertCounts}
        totalRegistrations={stats.total_registrations}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <Header
          currentView={currentView}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
          stats={stats}
          alertCounts={alertCounts}
        />

        {/* Dynamic View Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fadeIn">
          {renderCurrentView()}
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span className="font-mono">
              NxtWave Growth Engine &copy; 2026 &bull; B2B SaaS Growth Platform
            </span>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Engine Nominal
              </span>
              <button
                onClick={() => handleNavigate('simulation')}
                className="hover:underline font-mono text-indigo-600 dark:text-indigo-400"
              >
                Simulation Mode
              </button>
              <button
                onClick={() => handleNavigate('settings')}
                className="hover:underline"
              >
                Settings
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleNavigate}
        onQuickRegister={() => setIsRegisterModalOpen(true)}
        onQuickSimulate={() => handleNavigate('simulation')}
      />

      {/* Global Registration / Squad Pass Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={handleCloseRegisterModal}
        title={registrationData ? '🎉 Registration Confirmed!' : 'Fast-Track Student Registration'}
        description={
          registrationData
            ? 'Your GenAI Masterclass access pass and unique Squad Pass code are ready.'
            : 'Register for the 60-Minute Masterclass & unlock immediate Squad Pass viral perks.'
        }
        maxWidth={registrationData ? 'xl' : '2xl'}
      >
        {registrationData ? (
          <SuccessPage
            registrationData={registrationData}
            onRegisterAnother={handleRegisterAnother}
          />
        ) : (
          <RegistrationForm
            onSuccess={handleRegistrationSuccess}
          />
        )}
      </Modal>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;

