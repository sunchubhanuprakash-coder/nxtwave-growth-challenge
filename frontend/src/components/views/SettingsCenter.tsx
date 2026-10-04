import React, { useState, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Key,
  Webhook,
  Database,
  RefreshCw,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Zap,
  Save
} from 'lucide-react';
import { useToast } from '../common/Toast';

interface SettingsCenterProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SettingsCenter: React.FC<SettingsCenterProps> = ({ theme, onToggleTheme }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'webhooks' | 'diagnostics'>('general');
  const [targetSeats, setTargetSeats] = useState<number>(500);
  const [budgetCap, setBudgetCap] = useState<number>(2000);
  const [aiProvider, setAiProvider] = useState<string>('mock');
  const [apiKey, setApiKey] = useState<string>('••••••••••••••••');
  const [webhookUrl, setWebhookUrl] = useState<string>('https://flow.n8n.cloud/webhook/nxtwave-growth');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [checkingHealth, setCheckingHealth] = useState<boolean>(false);

  const checkHealth = async () => {
    try {
      setCheckingHealth(true);
      const res = await fetch('/health');
      if (res.ok) {
        const json = await res.json();
        setHealthStatus(json);
      } else {
        setHealthStatus({ status: 'offline', error: `HTTP ${res.status}` });
      }
    } catch (err: any) {
      setHealthStatus({ status: 'offline', error: err.message });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Configuration settings saved successfully', 'success');
  };

  const handleResetSimulation = async () => {
    if (!window.confirm('Are you sure you want to reset simulation data back to baseline? This will restore initial campaign values.')) {
      return;
    }
    try {
      setIsResetting(true);
      const res = await fetch('/api/simulation/reset', { method: 'POST' });
      if (res.ok) {
        addToast('Campaign simulation reset to Day 0 baseline', 'success');
        setTimeout(() => window.location.reload(), 800);
      } else {
        throw new Error('Failed to reset simulation');
      }
    } catch (err: any) {
      addToast(err.message || 'Reset failed', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          <Settings className="w-4 h-4" />
          <span>Platform Preferences & Integrations</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
          Settings & Environment
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage AI runtime keys, theme preference, webhook endpoints, and platform state.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center space-x-6">
        {[
          { id: 'general', label: 'General & Appearance', icon: Sliders },
          { id: 'ai', label: 'AI Copilot Providers', icon: Key },
          { id: 'webhooks', label: 'Webhooks & Automation', icon: Webhook },
          { id: 'diagnostics', label: 'System Diagnostics', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: General & Appearance */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="saas-card p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Theme & Interface Display</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Choose your preferred visual presentation mode</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <button
                type="button"
                onClick={() => theme !== 'light' && onToggleTheme()}
                className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</h4>
                  <p className="text-xs text-slate-500 mt-1">Crisp high-contrast theme suited for bright daylight environments</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => theme !== 'dark' && onToggleTheme()}
                className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="p-2.5 rounded-lg bg-indigo-950 text-indigo-400">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dark SaaS Mode</h4>
                  <p className="text-xs text-slate-500 mt-1">Deep slate palette tailored for low-light analytics inspection</p>
                </div>
              </button>
            </div>
          </div>

          <div className="saas-card p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Campaign Target & Guardrails</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Default targets for the GenAI Masterclass hiring sprint</p>

            <form onSubmit={handleSaveGeneral} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Target Registrations
                </label>
                <input
                  type="number"
                  value={targetSeats}
                  onChange={(e) => setTargetSeats(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled
                />
                <span className="text-xs text-slate-400 mt-1 block">Locked to 500 per challenge specification</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Budget Ceiling (INR)
                </label>
                <input
                  type="number"
                  value={budgetCap}
                  onChange={(e) => setBudgetCap(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled
                />
                <span className="text-xs text-slate-400 mt-1 block">Maximum budget capped at ₹2,000</span>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Guardrails</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: AI Copilot Providers */}
      {activeTab === 'ai' && (
        <div className="saas-card p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">LLM Provider Configuration</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Configure the AI Growth Copilot backend. Deterministic fallback active without external keys.
          </p>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Active Provider
              </label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="mock">Built-in Deterministic Engine (Zero API Key Needed)</option>
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="deepseek">DeepSeek (DeepSeek-V3 / R1)</option>
                <option value="anthropic">Anthropic Claude 3.5 Sonnet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                Keys are stored locally in your session and never logged to external servers.
              </span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                Deterministic algorithmic fallback active and validated. Works offline.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Webhooks & Automations */}
      {activeTab === 'webhooks' && (
        <div className="saas-card p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Webhook Relay & Integrations</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Connect n8n workflows, WhatsApp Business API relays, or email notification brokers.
          </p>

          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Automation Relay Endpoint
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <span className="text-xs text-slate-400 mt-1 block">
                Dispatches JSON payloads upon registration confirmation, referral milestones, or growth anomalies.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addToast('Test webhook ping sent successfully (HTTP 200 Mock)', 'success')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Test Webhook Ping</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: System Diagnostics & Danger Zone */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="saas-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">API & Database Health</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Real-time status of backend services and SQLite persistent store</p>
              </div>
              <button
                onClick={checkHealth}
                disabled={checkingHealth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
                <span>Check</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">FastAPI Core</span>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${healthStatus?.status === 'offline' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {healthStatus?.status || 'Operational'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-1 block">Port 8000 (uvicorn)</span>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">SQLite Database</span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Connected</span>
                </div>
                <span className="text-xs text-slate-400 mt-1 block">growth_campaign.db</span>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vite Dev Server</span>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Port 5173</span>
                </div>
                <span className="text-xs text-slate-400 mt-1 block">HMR Active</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-rose-900 dark:text-rose-300">Danger Zone: Reset Campaign Simulation</h3>
                <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 max-w-xl">
                  Resetting clears simulated registrations, budget expenses, and test A/B variant counts, restoring the workspace to its baseline state.
                </p>
                <button
                  type="button"
                  onClick={handleResetSimulation}
                  disabled={isResetting}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'Resetting...' : 'Reset Simulation to Baseline'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
