import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  AlertCircle, 
  Share2, 
  Send, 
  User, 
  Mail, 
  Phone, 
  GraduationCap, 
  Building2, 
  MapPin, 
  Target, 
  Code2, 
  Compass, 
  Ticket 
} from 'lucide-react';


interface RegistrationFormProps {
  onSuccess: (data: any) => void;
}

const TOP_COLLEGES = [
  "Chaitanya Bharathi Institute of Technology (CBIT)",
  "VNR Vignana Jyothi Institute of Engineering & Tech (VNRVJIET)",
  "Vasavi College of Engineering (VCE)",
  "Jawaharlal Nehru Technological University (JNTUH)",
  "G. Narayanamma Institute of Technology & Science (GNITS)",
  "Osmania University College of Engineering (OUCE)",
  "BVRIT Hyderabad College of Engineering for Women"
];

const BRANCHES = [
  "Computer Science and Engineering (CSE)",
  "Information Technology (IT)",
  "Computer Science (AI & ML)",
  "Computer Science (Data Science)",
  "Electronics and Communication (ECE)",
  "Electrical and Electronics (EEE)",
  "Mechanical Engineering",
  "Civil Engineering",
  "Other Engineering Stream"
];

const SKILL_LEVELS = [
  { id: "Beginner", label: "Beginner", desc: "Basic Python / C++ syntax" },
  { id: "Intermediate", label: "Intermediate", desc: "Built simple web/ML apps" },
  { id: "Advanced", label: "Advanced", desc: "Familiar with APIs & Git" }
];

const PRIMARY_GOALS = [
  "Placement Resume Project (Immediate hiring)",
  "Final-Year Capstone Project / Major Project",
  "Learn Generative AI & LLM Orchestration",
  "Add Live Hosted AI URL to LinkedIn / GitHub"
];

const ACQUISITION_SOURCES = [
  "College WhatsApp Group",
  "Friend / Batchmate Referral",
  "Campus Ambassador",
  "LinkedIn Post",
  "Telegram Placement Prep Group",
  "Instagram / Social Media",
  "Other"
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    college_name: '',
    club_name: '',
    branch: 'Computer Science and Engineering (CSE)',
    graduation_year: 2025,
    city: 'Hyderabad',
    skill_level: 'Beginner',
    primary_goal: 'Placement Resume Project (Immediate hiring)',
    acquisition_source: 'College WhatsApp Group',
    referred_by_code: '',
  });

  const [utmParams, setUtmParams] = useState({
    utm_source: 'direct_organic',
    utm_medium: '',
    utm_campaign: 'ai_workshop_oct',
    utm_term: '',
    utm_content: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFinalYearNote, setIsFinalYearNote] = useState(true);

  // Extract query parameters on mount (e.g. ?ref=NXT001&utm_source=whatsapp&college=CBIT&club=coding_club)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('referral') || '';
    const source = params.get('utm_source') || (ref ? 'referral_link' : 'direct_organic');
    const medium = params.get('utm_medium') || '';
    const campaign = params.get('utm_campaign') || 'ai_workshop_oct';
    const content = params.get('utm_content') || '';
    const collegeParam = params.get('college') || params.get('utm_college') || '';
    const clubParam = params.get('club') || params.get('utm_club') || '';

    setFormData(prev => ({ 
      ...prev, 
      college_name: collegeParam || prev.college_name,
      club_name: clubParam || prev.club_name,
      ...(ref ? {
        referred_by_code: ref.toUpperCase(),
        acquisition_source: 'Friend / Batchmate Referral'
      } : {})
    }));

    setUtmParams({
      utm_source: source,
      utm_medium: medium,
      utm_campaign: campaign,
      utm_term: params.get('utm_term') || '',
      utm_content: content,
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'graduation_year') {
      const yr = parseInt(value, 10);
      setIsFinalYearNote(yr === 2025 || yr === 2026);
    }
  };

  const handleCollegeSelect = (college: string) => {
    setFormData(prev => ({ ...prev, college_name: college }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation
    if (!formData.full_name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const cleanPhone = formData.phone_number.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit WhatsApp number.");
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setErrorMessage("Please enter a valid college or personal email address.");
      return;
    }

    if (!formData.college_name.trim()) {
      setErrorMessage("Please select or enter your engineering college name.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: cleanPhone.slice(-10),
        college_name: formData.college_name.trim(),
        club_name: formData.club_name.trim() || undefined,
        branch: formData.branch,
        graduation_year: Number(formData.graduation_year),
        city: formData.city.trim() || "Hyderabad",
        skill_level: formData.skill_level,
        primary_goal: formData.primary_goal,
        acquisition_source: formData.acquisition_source,
        referred_by_code: formData.referred_by_code.trim() || undefined,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium || undefined,
        utm_campaign: utmParams.utm_campaign,
        utm_term: utmParams.utm_term || undefined,
        utm_content: utmParams.utm_content || undefined,
        referrer_url: window.location.href,
      };

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        let msg = "Registration failed. Please check details and try again.";
        if (typeof data.detail === 'string') {
          msg = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          msg = data.detail[0].msg || JSON.stringify(data.detail[0]);
        }
        throw new Error(msg);
      }

      onSuccess(data);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Registration Form Card */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        {/* Form Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-mono">
              <Ticket className="w-3.5 h-3.5" />
              <span>Free Final-Year Seat Reservation</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-medium flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-ping"></span>
              485 / 500 Seats Claimed
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Reserve Your Free Masterclass Pass
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            "Build Your First AI Project in 60 Minutes" • Live Hands-on Masterclass for Final-Year Engineers.
          </p>

          {formData.referred_by_code && (
            <div className="mt-4 p-3 rounded-xl bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-between text-xs text-indigo-300">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Invited by peer with referral pass: <strong className="text-white font-mono">{formData.referred_by_code}</strong></span>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-900 font-mono text-[10px] text-cyan-300">Reward Track Active</span>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Aditya Sharma"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="aditya@example.com"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>
          </div>

          {/* Section 2: Contact & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                WhatsApp Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-sm text-slate-500 font-mono">+91</span>
                <input
                  type="tel"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="98765 43210"
                  maxLength={14}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-14 pr-4 py-3 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Workshop access link & project templates sent here.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                City *
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Hyderabad, Bengaluru"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>
          </div>

          {/* Section 3: College Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
              Engineering College Name *
            </label>
            <input
              type="text"
              name="college_name"
              required
              value={formData.college_name}
              onChange={handleChange}
              placeholder="Type your college name or click suggestions below"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
            {/* Quick College Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {TOP_COLLEGES.slice(0, 4).map((col, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleCollegeSelect(col)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
                >
                  {col.split('(')[1]?.replace(')', '') || col.slice(0, 15)}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Academic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Branch / Discipline *
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition cursor-pointer"
              >
                {BRANCHES.map((b, idx) => (
                  <option key={idx} value={b} className="bg-slate-900 text-white">{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                Year of Graduation *
              </label>
              <select
                name="graduation_year"
                value={formData.graduation_year}
                onChange={handleChange}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition cursor-pointer"
              >
                <option value={2025} className="bg-slate-900 text-white">2025 (Final Year - Placement Qualified)</option>
                <option value={2026} className="bg-slate-900 text-white">2026 (Pre-Final Year / Early Placement)</option>
                <option value={2027} className="bg-slate-900 text-white">2027 (2nd Year)</option>
                <option value={2024} className="bg-slate-900 text-white">2024 (Recent Graduate)</option>
              </select>
              {!isFinalYearNote && (
                <p className="text-[11px] text-amber-400/90 mt-1">
                  Note: Final-year 2025/2026 batch receives priority cohort seats.
                </p>
              )}
            </div>
          </div>

          {/* Section 5: Goal & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <Code2 className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Coding / AI Skill Level
              </label>
              <select
                name="skill_level"
                value={formData.skill_level}
                onChange={handleChange}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition cursor-pointer"
              >
                {SKILL_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id} className="bg-slate-900 text-white">
                    {lvl.label} ({lvl.desc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <Target className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                Primary Goal
              </label>
              <select
                name="primary_goal"
                value={formData.primary_goal}
                onChange={handleChange}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition cursor-pointer"
              >
                {PRIMARY_GOALS.map((goal, idx) => (
                  <option key={idx} value={goal} className="bg-slate-900 text-white">{goal}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 6: Acquisition Channel & Referral Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <Compass className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                How did you hear about us?
              </label>
              <select
                name="acquisition_source"
                value={formData.acquisition_source}
                onChange={handleChange}
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 transition cursor-pointer"
              >
                {ACQUISITION_SOURCES.map((src, idx) => (
                  <option key={idx} value={src} className="bg-slate-900 text-white">{src}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center">
                <Share2 className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                Referral Code (Optional)
              </label>
              <input
                type="text"
                name="referred_by_code"
                value={formData.referred_by_code}
                onChange={handleChange}
                placeholder="e.g. NXT001"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-extrabold text-base tracking-wide flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Confirming Free Pass...</span>
                </>
              ) : (
                <>
                  <span>Claim My Free AI Project Pass</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-500 mt-3">
              100% Free Masterclass • Verified Certificate • Zero Card Details Required
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
