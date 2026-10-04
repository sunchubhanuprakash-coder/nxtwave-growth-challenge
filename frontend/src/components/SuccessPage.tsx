import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Share2, 
  QrCode as QrCodeIcon, 
  Calendar, 
  Download, 
  Gift, 
  Unlock 
} from 'lucide-react';

interface SuccessPageProps {
  registrationData: {
    registration_id: number;
    status: string;
    student: {
      id: number;
      full_name: string;
      email: string;
      phone_number: string;
      college_name: string;
      branch: string;
      graduation_year: number;
      is_final_year: boolean;
      referral_code: string;
    };
    event_title: string;
    referral_code: string;
    referral_link: string;
    whatsapp_share_url: string;
    tier_1_unlocked: boolean;
    tier_2_unlocked: boolean;
    is_existing?: boolean;
  };
  onRegisterAnother: () => void;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({ registrationData, onRegisterAnother }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const { student, referral_code, referral_link, whatsapp_share_url, is_existing } = registrationData;


  // Generate QR Code
  useEffect(() => {
    if (referral_link) {
      QRCode.toDataURL(referral_link, {
        width: 256,
        margin: 2,
        color: {
          dark: '#080B14',
          light: '#00D4FF',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, [referral_link]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referral_link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDownloadCalendar = () => {
    const icsData = 
      "BEGIN:VCALENDAR\r\n" +
      "VERSION:2.0\r\n" +
      "PRODID:-//NxtWave//AI Masterclass//EN\r\n" +
      "BEGIN:VEVENT\r\n" +
      "SUMMARY:Build Your First AI Project in 60 Minutes - NxtWave\r\n" +
      "DESCRIPTION:Live workshop to build and deploy your first AI project with live URL for resumes.\r\n" +
      "STATUS:CONFIRMED\r\n" +
      "END:VEVENT\r\n" +
      "END:VCALENDAR\r\n";
    
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nxtwave-ai-masterclass.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fadeIn">
      {/* Success Hero Header */}
      <div className="glass-panel-glow rounded-3xl p-8 sm:p-10 border border-slate-800 text-center relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9 text-emerald-400" />
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-mono mb-3">
          <span>{is_existing ? "Existing Registration Retrieved" : "Seat Confirmed • Class of 2025/2026"}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Registration Confirmed! 🎉
        </h1>
        <p className="text-slate-300 text-base max-w-xl mx-auto mt-2">
          Welcome aboard, <strong className="text-white">{student.full_name.replace('[SIMULATED] ', '')}</strong>! Your seat for <span className="text-cyan-400 font-semibold">"Build Your First AI Project in 60 Minutes"</span> is reserved.
        </p>

        {/* Masterclass Details Pill */}
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-mono">
          <span className="flex items-center text-cyan-400">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Live Masterclass (60 Mins)
          </span>
          <span className="text-slate-600">•</span>
          <span>College: {student.college_name}</span>
          <span className="text-slate-600">•</span>
          <button 
            onClick={handleDownloadCalendar}
            className="text-indigo-400 hover:text-indigo-300 flex items-center underline"
          >
            Add to Calendar (.ics)
          </button>
        </div>
      </div>

      {/* SQUAD PASS: Viral Referral Engine Section */}
      <div className="glass-panel rounded-3xl p-8 sm:p-10 border border-slate-800 relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 text-xs font-mono mb-2">
              <Gift className="w-3.5 h-3.5" />
              <span>Your Exclusive Squad Pass</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Invite 3 Batchmates & Unlock Placement AI Kit
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Help your college batchmates add a live AI project to their resumes.
            </p>
          </div>
        </div>

        {/* Referral Code & URL Share Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Card A: Referral Code */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider mb-2">
              Your Referral Code
            </span>
            <div className="flex items-center justify-between bg-slate-950 px-4 py-3 rounded-xl border border-slate-800">
              <span className="text-xl font-mono font-extrabold text-cyan-400 tracking-wider">
                {referral_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 text-xs"
                title="Copy code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="font-mono">{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Card B: Unique Referral URL */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-mono uppercase text-slate-400 font-semibold tracking-wider mb-2">
              Your Direct Referral Link
            </span>
            <div className="flex items-center justify-between bg-slate-950 px-3 py-3 rounded-xl border border-slate-800 overflow-hidden">
              <span className="text-xs font-mono text-slate-300 truncate mr-2">
                {referral_link}
              </span>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition flex items-center space-x-1 text-xs flex-shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="font-mono">{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1-Click WhatsApp Share Trigger */}
        {/* 1-Click WhatsApp & Email Share Buttons */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={whatsapp_share_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.99]"
          >
            <Share2 className="w-4 h-4 text-black" />
            <span>WhatsApp Share</span>
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent("Join me for the Free AI Masterclass (Build an AI Project in 60 Mins)")}&body=${encodeURIComponent(`Hey!\n\nI just registered for the free workshop 'Build Your First AI Project in 60 Minutes'. We build a real project to showcase on our placement resumes. Grab your free seat here:\n${referral_link}`)}`}
            className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all transform active:scale-[0.99]"
          >
            <span>Email Invite</span>
          </a>
        </div>

        {/* QR Code & Mobile Scan Section */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-4">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="Squad Pass QR Code" 
                className="w-24 h-24 rounded-xl border border-cyan-500/40 p-1 bg-black shadow-md shadow-cyan-500/10 flex-shrink-0" 
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-slate-800 animate-pulse flex items-center justify-center">
                <QrCodeIcon className="w-8 h-8 text-slate-600" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-white text-sm flex items-center">
                <QrCodeIcon className="w-4 h-4 mr-1.5 text-cyan-400" />
                Scan to Join Your Squad
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Share this QR code in college status or group chats to automatically credit peers to your pass.
              </p>
            </div>
          </div>

          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`nxtwave-squad-pass-${referral_code}.png`}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center space-x-2 transition flex-shrink-0"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download QR</span>
            </a>
          )}
        </div>

        {/* Tiered Challenge Milestone Unlock Tracker (1, 3, 5, 10) */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center">
            <Unlock className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Squad Milestones (1, 3, 5, 10)
          </h3>

          {/* Milestone 1 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center font-mono text-cyan-300 font-bold text-xs">
                1
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">1 Peer Referred</h4>
                <p className="text-[11px] text-slate-400">Top 25 AI Project Prompts & Architecture Blueprints</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
              Target: 1
            </span>
          </div>

          {/* Milestone 3 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center font-mono text-indigo-300 font-bold text-xs">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">3 Peers Referred</h4>
                <p className="text-[11px] text-slate-400">Complete AI Starter Codebase & Certificate Priority Seat</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
              Target: 3
            </span>
          </div>

          {/* Milestone 5 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center font-mono text-purple-300 font-bold text-xs">
                5
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">5 Peers Referred</h4>
                <p className="text-[11px] text-slate-400">Exclusive Live Q&A Fast-Track Access with Lead Instructor</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
              Target: 5
            </span>
          </div>

          {/* Milestone 10 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center font-mono text-amber-300 font-bold text-xs">
                10
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">10 Peers Referred</h4>
                <p className="text-[11px] text-slate-400">Campus AI Ambassador Digital Badge & Hall of Fame Feature</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
              Target: 10
            </span>
          </div>
        </div>

        {/* Action Footers */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={onRegisterAnother}
            className="text-xs text-slate-400 hover:text-slate-200 transition underline font-medium"
          >
            ← Register another student
          </button>

          <span className="text-[11px] font-mono text-slate-500">
            NxtWave Growth Challenge Engine • Pass #{referral_code}
          </span>
        </div>
      </div>
    </div>
  );
};
