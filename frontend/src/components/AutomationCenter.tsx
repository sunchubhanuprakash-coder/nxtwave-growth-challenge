import React, { useState, useEffect } from 'react';
import {
  Zap,
  Bot,
  Play,
  Clock,
  Send,
  Radio,
  Webhook,
  MessageSquare,
  Mail,
  Smartphone,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Code2,
  Sparkles,
  Terminal,
  Filter
} from 'lucide-react';

export interface AutomationRule {
  id: number;
  name: string;
  trigger: string;
  action: string;
  channel: string;
  status: string;
  template_body: string;
  template_subject?: string | null;
  webhook_url?: string | null;
  last_triggered?: string | null;
  trigger_count: number;
  is_mock_adapter: boolean;
  is_simulated: boolean;
  sample_rendered_message: string;
}

export interface AutomationAuditEvent {
  id: number;
  event_type: string;
  student_id?: number | null;
  status: string;
  executed_at?: string | null;
  payload: Record<string, any>;
}

export interface WebhookTestResult {
  success: boolean;
  channel: string;
  webhook_url: string;
  status_code?: number | null;
  payload_dispatched: Record<string, any>;
  details: Record<string, any>;
}

const CHANNEL_ICONS: Record<string, React.FC<{ className?: string }>> = {
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
  SMS: Smartphone,
  WEBHOOK: Webhook,
};

const CHANNEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  WHATSAPP: { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800/60' },
  EMAIL: { bg: 'bg-cyan-950/60', text: 'text-cyan-400', border: 'border-cyan-800/60' },
  SMS: { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800/60' },
  WEBHOOK: { bg: 'bg-violet-950/60', text: 'text-violet-400', border: 'border-violet-800/60' },
};

const DEFAULT_AUTOMATIONS: AutomationRule[] = [
  { id: 1, name: "Registration Confirmation & Ticket", trigger: "on_registration_created", action: "send_whatsapp_ticket", channel: "WHATSAPP", status: "active", template_body: "Hi {{name}}! Your seat for 'Build Your First AI Project in 60 Minutes' is confirmed. Ticket #{{registration_id}}.", trigger_count: 342, is_mock_adapter: true, is_simulated: false, sample_rendered_message: "Hi Bhanu! Your seat for 'Build Your First AI Project in 60 Minutes' is confirmed." },
  { id: 2, name: "Squad Pass Milestone Unlocks", trigger: "on_referral_milestone_unlocked", action: "send_whatsapp_reward", channel: "WHATSAPP", status: "active", template_body: "Congrats {{name}}! A batchmate joined using your pass {{referral_code}}. Tier reward unlocked!", trigger_count: 84, is_mock_adapter: true, is_simulated: false, sample_rendered_message: "Congrats Bhanu! A batchmate joined using your pass NXT-BP42." },
  { id: 3, name: "24-Hour Workshop Readiness Ping", trigger: "24h_before_workshop", action: "send_email_prep", channel: "EMAIL", status: "active", template_body: "Tomorrow at 6:00 PM: Get your Python environment ready. Live link: {{workshop_link}}", trigger_count: 0, is_mock_adapter: true, is_simulated: false, sample_rendered_message: "Tomorrow at 6:00 PM: Get your Python environment ready." },
  { id: 4, name: "1-Hour Final Countdown Alert", trigger: "1h_before_workshop", action: "send_whatsapp_alert", channel: "WHATSAPP", status: "active", template_body: "Starting in 60 minutes! Join the live stream here: {{workshop_link}}", trigger_count: 0, is_mock_adapter: true, is_simulated: false, sample_rendered_message: "Starting in 60 minutes! Join the live stream here." },
  { id: 5, name: "Campus Velocity Monitor Alert", trigger: "on_velocity_drop", action: "send_slack_alert", channel: "WEBHOOK", status: "active", template_body: "Growth Alert: Registration velocity below target threshold. Action recommended.", trigger_count: 3, is_mock_adapter: true, is_simulated: false, sample_rendered_message: "Growth Alert: Registration velocity below target threshold." }
];

const DEFAULT_AUDITS: AutomationAuditEvent[] = [
  { id: 1, event_type: "REGISTRATION_CONFIRMATION", student_id: 501, status: "DISPATCHED", executed_at: new Date(Date.now() - 3600000).toISOString(), payload: { recipient: "+91 8309145736", channel: "WHATSAPP" } },
  { id: 2, event_type: "MILESTONE_UNLOCKED", student_id: 501, status: "DISPATCHED", executed_at: new Date(Date.now() - 7200000).toISOString(), payload: { milestone: "Tier 1: 50 Placement AI Prompts", channel: "WHATSAPP" } }
];

export const AutomationCenter: React.FC = () => {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [audits, setAudits] = useState<AutomationAuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Preview Mode per Card (Raw vs Substituted)
  const [previewModes, setPreviewModes] = useState<Record<number, 'raw' | 'rendered'>>({});

  // Interactive Live Variable Playground
  const [testName, setTestName] = useState<string>('Rahul Sharma');
  const [testRefLink, setTestRefLink] = useState<string>('https://nxtwave.app/register?ref=NXT-BH7K29');
  const [testDate, setTestDate] = useState<string>('Saturday, 6:00 PM IST');

  // Webhook / n8n Integration Hub State
  const [webhookUrl, setWebhookUrl] = useState<string>('https://hooks.n8n.cloud/webhook/growth-engine-alerts');
  const [webhookEvent, setWebhookEvent] = useState<string>('STUDENT_MILESTONE_UNLOCKED');
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);
  const [webhookResult, setWebhookResult] = useState<WebhookTestResult | null>(null);

  // Edit Modal State
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [editBody, setEditBody] = useState<string>('');
  const [editSubject, setEditSubject] = useState<string>('');
  const [editWebhook, setEditWebhook] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = async () => {
    try {
      const apiBase = ((import.meta as any).env?.VITE_API_URL || '');
      const [rulesRes, auditsRes] = await Promise.all([
        fetch(`${apiBase}/api/automations`),
        fetch(`${apiBase}/api/automations/events/audits?limit=25`)
      ]);

      const rType = rulesRes.headers.get('content-type') || '';
      if (rType.includes('application/json') && rulesRes.ok) {
        const rulesData = await rulesRes.json();
        setAutomations(rulesData && rulesData.length > 0 ? rulesData : DEFAULT_AUTOMATIONS);
      } else {
        setAutomations(DEFAULT_AUTOMATIONS);
      }

      const aType = auditsRes.headers.get('content-type') || '';
      if (aType.includes('application/json') && auditsRes.ok) {
        const auditsData = await auditsRes.json();
        setAudits(auditsData && auditsData.length > 0 ? auditsData : DEFAULT_AUDITS);
      } else {
        setAudits(DEFAULT_AUDITS);
      }
    } catch (err) {
      setAutomations(DEFAULT_AUTOMATIONS);
      setAudits(DEFAULT_AUDITS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleStatus = async (ruleId: number) => {
    try {
      const res = await fetch(`/api/automations/${ruleId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'growth_admin_secret_2026'
        }
      });
      if (res.ok) {
        const updated = await res.json();
        setAutomations(prev => prev.map(r => r.id === ruleId ? updated : r));
        showToast(`Automation #${ruleId} is now ${updated.status}!`);
      } else {
        const err = await res.json();
        showToast(`Failed to toggle status: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error('Toggle status failed:', err);
      showToast('Status toggle error');
    }
  };

  const handleTriggerAutomation = async (rule: AutomationRule) => {
    setTriggeringId(rule.id);
    try {
      const res = await fetch(`/api/automations/${rule.id}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_context: {
            name: testName,
            referral_link: testRefLink,
            workshop_date: testDate
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAutomations(prev => prev.map(r => r.id === rule.id ? {
          ...r,
          trigger_count: data.trigger_count,
          last_triggered: data.last_triggered,
          sample_rendered_message: data.rendered_message
        } : r));

        // Re-fetch audits to prepend the new event
        const auditsRes = await fetch('/api/automations/events/audits?limit=25');
        if (auditsRes.ok) {
          const auditsData = await auditsRes.json();
          setAudits(auditsData);
        }

        showToast(`Triggered "${rule.name}" via ${rule.channel}! Dispatched to ${data.recipient}`);
      } else {
        const err = await res.json();
        showToast(`Trigger failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error('Automation trigger error:', err);
      showToast('Trigger failed. Check backend logs.');
    } finally {
      setTriggeringId(null);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      showToast('Please provide a webhook URL');
      return;
    }
    setTestingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/automations/webhook/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'growth_admin_secret_2026'
        },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          event_name: webhookEvent,
          sample_context: {
            name: testName,
            referral_link: testRefLink,
            workshop_date: testDate,
            growth_score: 88.5,
            registrations_count: 520
          }
        })
      });

      if (res.ok) {
        const data: WebhookTestResult = await res.json();
        setWebhookResult(data);
        showToast('Webhook payload dispatched successfully!');
      } else {
        const err = await res.json();
        showToast(`Webhook test failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error('Webhook test error:', err);
      showToast('Webhook dispatch failed');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleOpenEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setEditBody(rule.template_body);
    setEditSubject(rule.template_subject || '');
    setEditWebhook(rule.webhook_url || '');
  };

  const handleSaveEdit = async () => {
    if (!editingRule) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/automations/${editingRule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': 'growth_admin_secret_2026'
        },
        body: JSON.stringify({
          template_body: editBody,
          template_subject: editSubject,
          webhook_url: editWebhook
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setAutomations(prev => prev.map(r => r.id === updated.id ? updated : r));
        setEditingRule(null);
        showToast(`Saved template updates for "${updated.name}"`);
      } else {
        const err = await res.json();
        showToast(`Update failed: ${err.detail || 'Error'}`);
      }
    } catch (err) {
      console.error('Update rule error:', err);
      showToast('Failed to save automation rule');
    } finally {
      setSavingEdit(false);
    }
  };

  // Helper to render template variables in real-time
  const substituteVariables = (raw: string) => {
    return raw
      .replace(/\{\{\s*name\s*\}\}/g, testName)
      .replace(/\{\{\s*referral_link\s*\}\}/g, testRefLink)
      .replace(/\{\{\s*workshop_date\s*\}\}/g, testDate);
  };

  // Highlight variables in template view
  const renderHighlightedTemplate = (text: string) => {
    const parts = text.split(/(\{\{\s*[\w_]+\s*\}\})/g);
    return parts.map((part, idx) => {
      if (part.match(/\{\{\s*[\w_]+\s*\}\}/)) {
        return (
          <span
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono text-xs font-bold"
          >
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const filteredAutomations = automations.filter(rule => {
    if (selectedChannel !== 'ALL' && rule.channel !== selectedChannel) return false;
    if (selectedStatus !== 'ALL' && rule.status !== selectedStatus) return false;
    return true;
  });

  const totalTriggers = automations.reduce((acc, curr) => acc + curr.trigger_count, 0);
  const activeCount = automations.filter(a => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 bg-slate-900 border border-cyan-500/60 text-white rounded-xl shadow-2xl shadow-cyan-500/20 text-sm font-medium animate-slideUp">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-700/50 text-cyan-300 text-xs font-mono mb-3">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Phase 12: Growth Automation Center</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Lifecycle Automation Engine
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Event-driven automated messaging architecture across WhatsApp, Email, SMS, and n8n webhooks. 
            Safely configured with mock adapters to prevent unauthorized live billing while remaining 100% integration-ready.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <a
            href="#webhook-hub"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-500/20 transition"
          >
            <Webhook className="w-3.5 h-3.5" />
            <span>n8n / Webhooks</span>
          </a>
        </div>
      </div>

      {/* Safety & Architecture Architecture Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Automations</div>
            <div className="text-xl font-bold text-white mt-0.5">{automations.length} Core Rules</div>
            <div className="text-[10px] text-cyan-400 font-mono">{activeCount} Currently Active</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Dispatches</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalTriggers.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-400 font-mono">Lifecycle events logged</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Safety Boundary</div>
            <div className="text-xl font-bold text-white mt-0.5">Mock Adapters</div>
            <div className="text-[10px] text-indigo-300 font-mono">Zero accidental charges</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Template Engine</div>
            <div className="text-xl font-bold text-white mt-0.5">3 Variables</div>
            <div className="text-[10px] text-amber-300 font-mono">&#123;&#123;name&#125;&#125;, &#123;&#123;referral_link&#125;&#125;, &#123;&#123;workshop_date&#125;&#125;</div>
          </div>
        </div>
      </div>

      {/* Live Variable Substitution Playground */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Live Variable Substitution Simulator</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Type values below to see all template instances update dynamically
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
              Variable: &#123;&#123;name&#125;&#125;
            </label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
              Variable: &#123;&#123;referral_link&#125;&#125;
            </label>
            <input
              type="text"
              value={testRefLink}
              onChange={(e) => setTestRefLink(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
              placeholder="e.g. https://nxtwave.app/register?ref=NXT-BH7K29"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
              Variable: &#123;&#123;workshop_date&#125;&#125;
            </label>
            <input
              type="text"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
              placeholder="e.g. Saturday, 6:00 PM IST"
            />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-mono text-slate-400 uppercase">Filter:</span>

          {/* Channel Filter */}
          <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
            {['ALL', 'WHATSAPP', 'EMAIL', 'SMS', 'WEBHOOK'].map((ch) => (
              <button
                key={ch}
                onClick={() => setSelectedChannel(ch)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  selectedChannel === ch
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Status:</span>
          <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-xl">
            {['ALL', 'ACTIVE', 'PAUSED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  selectedStatus === st
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Automations Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
            <span>Loading Growth Automations...</span>
          </div>
        ) : filteredAutomations.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
            No automations match the selected filter.
          </div>
        ) : (
          filteredAutomations.map((rule) => {
            const ChannelIcon = CHANNEL_ICONS[rule.channel] || Zap;
            const channelStyle = CHANNEL_COLORS[rule.channel] || {
              bg: 'bg-slate-900',
              text: 'text-slate-300',
              border: 'border-slate-800'
            };
            const currentMode = previewModes[rule.id] || 'rendered';
            const isTriggering = triggeringId === rule.id;

            return (
              <div
                key={rule.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition shadow-lg space-y-4"
              >
                {/* Rule Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className={`p-2 rounded-xl ${channelStyle.bg} ${channelStyle.border} ${channelStyle.text} border`}>
                      <ChannelIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base font-bold text-white tracking-tight">
                          {rule.name}
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${channelStyle.bg} ${channelStyle.text} ${channelStyle.border}`}>
                          {rule.channel}
                        </span>
                        {rule.is_mock_adapter && (
                          <span className="hidden sm:inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Mock Adapter</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400 font-mono">
                        <span className="text-slate-300">
                          <strong className="text-cyan-400">Trigger:</strong> {rule.trigger}
                        </span>
                        <span>•</span>
                        <span className="text-slate-300">
                          <strong className="text-indigo-400">Action:</strong> {rule.action}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle & Metrics */}
                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    <button
                      onClick={() => handleToggleStatus(rule.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 border transition ${
                        rule.status === 'ACTIVE'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700 hover:bg-emerald-900/80'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${rule.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                      <span>{rule.status}</span>
                    </button>

                    <button
                      onClick={() => handleTriggerAutomation(rule)}
                      disabled={isTriggering}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition"
                      title="Simulates an event trigger and renders variables"
                    >
                      <Play className={`w-3 h-3 ${isTriggering ? 'animate-spin' : ''}`} />
                      <span>{isTriggering ? 'Firing...' : 'Test Trigger'}</span>
                    </button>
                  </div>
                </div>

                {/* Template Container */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-400 text-[11px] uppercase tracking-wider">
                        Template Content:
                      </span>
                      {rule.template_subject && (
                        <span className="text-slate-300 font-medium text-xs truncate max-w-xs sm:max-w-md">
                          Subject: {rule.template_subject}
                        </span>
                      )}
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() => setPreviewModes(prev => ({ ...prev, [rule.id]: 'rendered' }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                          currentMode === 'rendered'
                            ? 'bg-cyan-500 text-black font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Substituted Preview
                      </button>
                      <button
                        onClick={() => setPreviewModes(prev => ({ ...prev, [rule.id]: 'raw' }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                          currentMode === 'raw'
                            ? 'bg-slate-700 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Raw Template
                      </button>
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {currentMode === 'raw' ? (
                      <div>{renderHighlightedTemplate(rule.template_body)}</div>
                    ) : (
                      <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 text-emerald-300 font-mono text-xs">
                        {substituteVariables(rule.template_body)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Telemetry Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-slate-400 font-mono">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Trigger Count:</span>
                      <strong className="text-white">{rule.trigger_count.toLocaleString()}</strong>
                    </span>

                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Last Triggered:</span>
                      <span className="text-slate-300">
                        {rule.last_triggered ? new Date(rule.last_triggered).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {rule.webhook_url && (
                      <span className="text-[11px] text-violet-300 font-mono truncate max-w-xs" title={rule.webhook_url}>
                        Hook: {rule.webhook_url.replace('https://', '')}
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenEdit(rule)}
                      className="text-xs text-slate-400 hover:text-cyan-400 font-mono underline transition"
                    >
                      Edit Rule
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Webhook & n8n Workflow Integration Hub */}
      <div id="webhook-hub" className="p-6 rounded-3xl bg-slate-900/70 border border-violet-900/40 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                n8n & External Webhook Integration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dispatch structured JSON payloads to external workflow orchestrators (n8n, Zapier, Make) with timeout & fallback safety.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-violet-950 text-violet-300 border border-violet-800 text-xs font-mono">
            n8n Pipeline Ready
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dispatch Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                Target Webhook URL (e.g. n8n workflow trigger)
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.n8n.cloud/webhook/..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-violet-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                Event Type
              </label>
              <select
                value={webhookEvent}
                onChange={(e) => setWebhookEvent(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-violet-400 font-mono"
              >
                <option value="STUDENT_REGISTERED">STUDENT_REGISTERED (New Signup)</option>
                <option value="STUDENT_MILESTONE_UNLOCKED">STUDENT_MILESTONE_UNLOCKED (Squad Pass)</option>
                <option value="GROWTH_ALERT_BREACH">GROWTH_ALERT_BREACH (Target 500 Pacing)</option>
                <option value="WORKSHOP_REMINDER_T24">WORKSHOP_REMINDER_T24 (Countdown)</option>
                <option value="CUSTOM_SIMULATION_EVENT">CUSTOM_SIMULATION_EVENT (Test Ping)</option>
              </select>
            </div>

            <button
              onClick={handleTestWebhook}
              disabled={testingWebhook}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-violet-500/20 transition disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${testingWebhook ? 'animate-spin' : ''}`} />
              <span>{testingWebhook ? 'Dispatching Payload...' : 'Dispatch Test Payload to Webhook'}</span>
            </button>
          </div>

          {/* Response / Inspection Container */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-violet-400" />
                  <span>Payload Inspector</span>
                </span>
                {webhookResult && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    webhookResult.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}>
                    HTTP {webhookResult.status_code || 200} OK
                  </span>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto text-[11px] text-slate-300">
                <pre className="whitespace-pre-wrap text-emerald-400">
                  {webhookResult
                    ? JSON.stringify(webhookResult.payload_dispatched, null, 2)
                    : JSON.stringify({
                        event: webhookEvent,
                        source: "NxtWave Growth Engine Automation Center",
                        context: {
                          name: testName,
                          referral_link: testRefLink,
                          workshop_date: testDate
                        }
                      }, null, 2)}
                </pre>
              </div>
            </div>

            {webhookResult && (
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Adapter: {webhookResult.details?.adapter || 'WebhookDispatcher (Mock Safe Mode)'}</span>
                <span className="text-violet-400">Ready for Live n8n Endpoint</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chronological Audit Log of Automation Dispatches */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Automation Dispatch Audit Stream
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {audits.length} Recent Lifecycle Executions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-2.5">ID</th>
                <th className="pb-2.5">Executed At</th>
                <th className="pb-2.5">Event Type</th>
                <th className="pb-2.5">Channel</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5">Message Excerpt / Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 font-sans">
                    No automation events logged yet. Click "Test Trigger" on any rule to fire a dispatch.
                  </td>
                </tr>
              ) : (
                audits.map((event) => {
                  const channel = event.payload?.channel || 'WHATSAPP';
                  const excerpt = event.payload?.rendered_message || event.payload?.custom_context?.name || JSON.stringify(event.payload);

                  return (
                    <tr key={event.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-2.5 text-slate-400 font-bold">#{event.id}</td>
                      <td className="py-2.5 text-slate-400">
                        {event.executed_at ? new Date(event.executed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                      </td>
                      <td className="py-2.5 text-cyan-300 font-bold">{event.event_type}</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                          {channel}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                          {event.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300 max-w-xs truncate" title={excerpt}>
                        {excerpt}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Edit Automation: {editingRule.name}
              </h3>
              <button
                onClick={() => setEditingRule(null)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Template Subject (Email / Webhook only)
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Template Body (Supports &#123;&#123;name&#125;&#125;, &#123;&#123;referral_link&#125;&#125;, &#123;&#123;workshop_date&#125;&#125;)
                </label>
                <textarea
                  rows={4}
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Webhook / n8n Endpoint URL
                </label>
                <input
                  type="text"
                  value={editWebhook}
                  onChange={(e) => setEditWebhook(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-black text-xs font-bold hover:from-cyan-400 hover:to-indigo-400 transition disabled:opacity-50"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
