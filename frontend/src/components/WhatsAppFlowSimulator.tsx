import React, { useState } from 'react';
import {
  MessageSquare,
  Send,

  Phone,
  Video,
  MoreVertical,
  CheckCheck,
  Flame,



  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useToast } from './common/Toast';

interface ChatMessage {
  id: number;
  sender: 'bot' | 'user';
  text: string;
  time: string;
  isMedia?: boolean;
  mediaTitle?: string;
  mediaDesc?: string;
  mediaActionText?: string;
}

export const WhatsAppFlowSimulator: React.FC = () => {
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'bot',
      text: '?? Hi Bhanu! Congratulations on reserving your free seat for "Build Your First AI Project in 60 Minutes"!\n\n?? Date: Saturday, Oct 12 at 6:00 PM IST\n?? Zoom/Classroom Link: https://nxtwave.in/live-room-742\n\nReply SQUAD to activate your referral Squad Pass and unlock exclusive placement assets!',
      time: '10:02 AM',
      isMedia: true,
      mediaTitle: 'Ticket #NXT-9428 Confirmed',
      mediaDesc: 'Masterclass Calendar Invite (.ics attached)',
      mediaActionText: 'Add to Google Calendar'
    }
  ]);

  const handleStep1 = () => {
    setCurrentStep(1);
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: '?? Hi Bhanu! Congratulations on reserving your free seat for "Build Your First AI Project in 60 Minutes"!\n\n?? Date: Saturday, Oct 12 at 6:00 PM IST\n?? Zoom/Classroom Link: https://nxtwave.in/live-room-742\n\nReply SQUAD to activate your referral Squad Pass and unlock exclusive placement assets!',
        time: '10:02 AM',
        isMedia: true,
        mediaTitle: 'Ticket #NXT-9428 Confirmed',
        mediaDesc: 'Masterclass Calendar Invite (.ics attached)',
        mediaActionText: 'Add to Google Calendar'
      }
    ]);
    toast.success('Simulated Step 1', 'Registration confirmation & ticket sent.');
  };

  const handleStep2 = () => {
    setCurrentStep(2);
    setMessages((prev) => [
      ...prev,
      {
        id: 2,
        sender: 'user',
        text: 'SQUAD',
        time: '10:03 AM'
      },
      {
        id: 3,
        sender: 'bot',
        text: '? Squad Pass Activated! Your unique invite code is NXT-BP42.\n\nInvite 1 friend: ?? 50 Placement AI Prompt Pack\nInvite 3 friends: ?? VIP Speaker Q&A & Project Review\nInvite 5 friends: ?? 1-on-1 GitHub Code Review\n\nForward this message to your college or hostel group with 1 tap:\n?? https://nxtwave-growth-challenge-black.vercel.app?ref=NXT-BP42',
        time: '10:03 AM',
        isMedia: true,
        mediaTitle: 'Your Squad Pass: NXT-BP42',
        mediaDesc: 'Current Tier: Unlocked 0 / 3 Friends',
        mediaActionText: 'Forward to WhatsApp Group'
      }
    ]);
    toast.success('Simulated Step 2', 'Squad Pass issued to student.');
  };

  const handleStep3 = () => {
    setCurrentStep(3);
    setMessages((prev) => [
      ...prev,
      {
        id: 4,
        sender: 'bot',
        text: '?? SQUAD ALERT! Aditya Sharma from CBIT just registered using your Squad Pass!\n\n?? Milestone 1 Unlocked! You have earned the "50 Technical Placement AI Prompts (PDF Pack)".\n\n?? Download Link: https://nxtwave.in/assets/prompts-tier1.pdf\n\nInvite 2 more friends to unlock the VIP Speaker Q&A Room!',
        time: '02:15 PM',
        isMedia: true,
        mediaTitle: 'Tier 1 Reward Unlocked ??',
        mediaDesc: 'Download 50 Technical AI Prompts',
        mediaActionText: 'Download Prompt PDF'
      }
    ]);
    toast.success('Simulated Step 3', 'Friend conversion registered & milestone rewarded!');
  };

  const handleStep4 = () => {
    setCurrentStep(4);
    setMessages((prev) => [
      ...prev,
      {
        id: 5,
        sender: 'bot',
        text: '? 60-MINUTE COUNTDOWN: The Masterclass starts at 6:00 PM IST today!\n\nJoin 10 minutes early to test your Python audio and get your starter code repository ready.\n\n?? Direct Session Link: https://nxtwave.in/live-room-742\n\nSee you inside, Bhanu!',
        time: '05:00 PM'
      }
    ]);
    toast.success('Simulated Step 4', '1-hour pre-workshop urgency reminder dispatched.');
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-emerald-900/40 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Challenge Asset 2: Conversational WhatsApp Flow</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Interactive WhatsApp Flow Simulator
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Simulate the 2-way WhatsApp automation engineered to onboard engineering students, activate the viral Squad Pass, and drive live workshop attendance with zero drop-off.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <Flame className="w-8 h-8 text-emerald-400" />
            <div>
              <div className="text-xs text-slate-400 font-medium">WhatsApp Open Rate</div>
              <div className="text-base font-bold text-emerald-400 font-mono">76.2% Read Rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Smartphone Mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-slate-950 rounded-[40px] border-[6px] border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
            {/* Top Phone Speaker / Camera Notch */}
            <div className="bg-slate-950 h-6 flex justify-center items-center">
              <div className="w-24 h-4 bg-slate-900 rounded-b-xl" />
            </div>

            {/* WhatsApp Header */}
            <div className="bg-[#1F2C34] text-white p-3.5 flex items-center justify-between border-b border-slate-700/60 shadow">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 flex items-center justify-center font-bold text-black text-sm">
                    N
                  </div>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#1F2C34]" />
                </div>
                <div>
                  <div className="text-sm font-bold leading-tight">NxtWave AI Workshop Bot</div>
                  <div className="text-[11px] text-emerald-400">Online ? Verified Business</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-slate-300">
                <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
              </div>
            </div>

            {/* Chat Body Wallpaper */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0B141A] text-xs">
              <div className="text-center my-1">
                <span className="bg-[#182229] text-slate-400 px-3 py-1 rounded-lg text-[10px] uppercase font-mono shadow-sm">
                  Messages are end-to-end encrypted
                </span>
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-md relative space-y-2 ${
                      m.sender === 'user'
                        ? 'bg-[#005C4B] text-white rounded-tr-none'
                        : 'bg-[#202C33] text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed text-[12px]">{m.text}</p>

                    {m.isMedia && (
                      <div className="bg-[#111B21] p-3 rounded-xl border border-slate-700/60 space-y-2 mt-2">
                        <div className="font-bold text-cyan-300 text-xs">{m.mediaTitle}</div>
                        <div className="text-[11px] text-slate-400">{m.mediaDesc}</div>
                        <button className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition">
                          {m.mediaActionText}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end space-x-1 text-[10px] text-slate-400 pt-1">
                      <span>{m.time}</span>
                      {m.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Fake Input Bar */}
            <div className="bg-[#202C33] p-3 flex items-center space-x-2 border-t border-slate-700/60">
              <input
                type="text"
                disabled
                placeholder="Type a message..."
                className="flex-1 bg-[#2A3942] rounded-full px-4 py-2 text-xs text-slate-300 focus:outline-none cursor-not-allowed opacity-80"
              />
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <Send className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Trigger Controls & Strategy Analytics */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Simulate Conversational Triggers</span>
              </h3>
              <p className="text-xs text-slate-400">Click each trigger below to experience the automated WhatsApp journey.</p>
            </div>

            <div className="space-y-3">
              {[
                { step: 1, title: 'Trigger 1: Registration Confirmation & Ticket', desc: 'Instant post-registration receipt with calendar attachment', action: handleStep1 },
                { step: 2, title: 'Trigger 2: Activate Squad Pass ("SQUAD")', desc: 'Generates custom referral code & 1-click group forwarding link', action: handleStep2 },
                { step: 3, title: 'Trigger 3: Friend Joins (Tier 1 Reward)', desc: 'Real-time peer conversion alert & asset download link', action: handleStep3 },
                { step: 4, title: 'Trigger 4: 1-Hour Pre-Workshop Countdown', desc: 'Urgency reminder driving 85%+ live workshop attendance', action: handleStep4 }
              ].map((item) => (
                <button
                  key={item.step}
                  onClick={item.action}
                  className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between group ${
                    currentStep === item.step
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${currentStep === item.step ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      <span>{item.title}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 pl-4">{item.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
                </button>
              ))}
            </div>

            <button
              onClick={handleStep1}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center space-x-2 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset WhatsApp Simulation</span>
            </button>
          </div>

          {/* Performance Telemetry Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Why WhatsApp Outperforms Email 10x</h4>
            <div className="grid grid-cols-2 gap-3 font-mono text-center">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-xl font-bold text-emerald-400">98.4%</div>
                <div className="text-[11px] text-slate-400 mt-1">Delivery Rate</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-xl font-bold text-cyan-400">76.2%</div>
                <div className="text-[11px] text-slate-400 mt-1">Read within 15m</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-xl font-bold text-amber-400">54.1%</div>
                <div className="text-[11px] text-slate-400 mt-1">Squad Pass Shares</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="text-xl font-bold text-indigo-400">?3.90</div>
                <div className="text-[11px] text-slate-400 mt-1">Effective CPR</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
