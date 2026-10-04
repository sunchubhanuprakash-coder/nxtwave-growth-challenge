import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Award,
  ArrowRight,
  Code2
} from 'lucide-react';
import { RegistrationForm } from '../RegistrationForm';

interface CampaignCenterProps {
  onRegistrationSuccess: (data: any) => void;
  onOpenRegisterModal: () => void;
  stats: {
    total_registrations: number;
    target_registrations: number;
    seats_remaining: number;
  };
}

export const CampaignCenter: React.FC<CampaignCenterProps> = ({
  onRegistrationSuccess,
  onOpenRegisterModal,
  stats,
}) => {
  const [showEmbeddedForm, setShowEmbeddedForm] = useState(false);

  const AGENDA_MODULES = [
    {
      time: '00 - 15 Mins',
      title: 'GenAI Foundations & Live Cloud Architecture',
      desc: 'Understand LLM API integrations, prompt engineering structures, and modern cloud deployment pipelines.',
      icon: Code2,
    },
    {
      time: '15 - 35 Mins',
      title: 'Full-Stack Application Development',
      desc: 'Build a working Python + React application connecting frontend UI components to LLM endpoints.',
      icon: Zap,
    },
    {
      time: '35 - 50 Mins',
      title: 'Prompt Optimization & Context Guardrails',
      desc: 'Implement few-shot formatting, latency optimizations, and production error fallbacks.',
      icon: Sparkles,
    },
    {
      time: '50 - 60 Mins',
      title: 'Live Cloud Deployment & Resume URL',
      desc: 'Deploy the app live to a public URL. Generate project verification credentials for LinkedIn & resumes.',
      icon: Award,
    },
  ];

  const progressPct = Math.min(100, Math.round((stats.total_registrations / Math.max(1, stats.target_registrations)) * 100));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Campaign Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/70 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EXCLUSIVE FINAL-YEAR AI MASTERCLASS</span>
          </div>

          <h1 className="text-2xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Build Your First <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">AI Project</span> in 60 Minutes
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Walk away with a <strong>live, hosted Generative AI application URL</strong> ready to paste on your resume and LinkedIn. Designed exclusively for final-year engineering students preparing for technical interviews.
          </p>

          {/* Seat Capacity Progress */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-lg space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-mono">Cohort Seat Capacity:</span>
              <span className="font-mono font-bold text-cyan-300">
                {stats.total_registrations} / {stats.target_registrations} Filled ({progressPct}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Zero Prerequisites</span>
              <span className="text-emerald-400 font-bold">{stats.seats_remaining} Seats Remaining</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setShowEmbeddedForm(!showEmbeddedForm)}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs sm:text-sm flex items-center space-x-2 transition shadow-lg shadow-cyan-500/20"
            >
              <span>{showEmbeddedForm ? 'Hide Registration Form' : 'Register Free Seat Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenRegisterModal}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition"
            >
              Open in Modal Window
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Registration Form (Toggleable) */}
      {showEmbeddedForm && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 animate-fadeIn">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white">Student Masterclass Registration</h3>
              <p className="text-xs text-slate-400 mt-1">Fill the form to receive your exclusive Squad Pass & referral code</p>
            </div>
            <RegistrationForm onSuccess={onRegistrationSuccess} />
          </div>
        </div>
      )}

      {/* 60-Minute Masterclass Agenda Breakdown */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
            HANDS-ON WORKSHOP SYLLABUS
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">60-Minute Rapid Build Curriculum</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENDA_MODULES.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start space-x-4 hover:border-slate-700 transition"
              >
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase">{mod.time}</div>
                  <h4 className="text-sm font-bold text-white mt-0.5">{mod.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
