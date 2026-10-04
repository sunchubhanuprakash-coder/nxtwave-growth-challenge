import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Download,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Flame,
  Award,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { Drawer } from '../common/Modal';

interface StudentRecord {
  registration_id: number;
  status: string;
  registered_at: string;
  student_id: number;
  full_name: string;
  email: string;
  phone_number: string;
  college_name: string;
  branch: string;
  graduation_year: number;
  is_final_year: boolean;
  referral_code: string;
  referred_by_code?: string | null;
  acquisition_source: string;
  primary_goal: string;
  skill_level: string;
  referral_count: number;
}

interface RegistrationsManagerProps {
  onOpenRegisterModal: () => void;
  onNavigateToReferral?: (code: string) => void;
}

export const RegistrationsManager: React.FC<RegistrationsManagerProps> = ({
  onOpenRegisterModal,
  onNavigateToReferral,
}) => {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterFinalYear, setFilterFinalYear] = useState<boolean | null>(null);
  const [filterReferredOnly, setFilterReferredOnly] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const toast = useToast();

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/registrations?limit=100');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
      toast.error('Failed to load student registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Referral Code Copied', code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (filterFinalYear !== null && r.is_final_year !== filterFinalYear) {
      return false;
    }
    if (filterReferredOnly && !r.referred_by_code) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchName = r.full_name.toLowerCase().includes(q);
      const matchEmail = r.email.toLowerCase().includes(q);
      const matchCollege = r.college_name.toLowerCase().includes(q);
      const matchRef = r.referral_code.toLowerCase().includes(q);
      return matchName || matchEmail || matchCollege || matchRef;
    }
    return true;
  });

  const exportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.warning('No records to export');
      return;
    }

    const headers = ['Registration ID', 'Name', 'Email', 'Phone', 'College', 'Branch', 'Year', 'Final Year', 'Referral Code', 'Referred By', 'Source', 'Goal', 'Skill', 'Referrals Made'];
    const rows = filteredRecords.map((r) => [
      r.registration_id,
      `"${r.full_name}"`,
      r.email,
      r.phone_number,
      `"${r.college_name}"`,
      `"${r.branch}"`,
      r.graduation_year,
      r.is_final_year ? 'YES' : 'NO',
      r.referral_code,
      r.referred_by_code || '',
      r.acquisition_source,
      `"${r.primary_goal}"`,
      r.skill_level,
      r.referral_count,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nxtwave_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export Successful', `Exported ${filteredRecords.length} records to CSV.`);
  };

  const finalYearCount = records.filter((r) => r.is_final_year).length;
  const referredCount = records.filter((r) => r.referred_by_code).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Signups</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">{records.length}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Database records</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Final-Year Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">{finalYearCount}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">
            {records.length > 0 ? Math.round((finalYearCount / records.length) * 100) : 0}% Target Audience
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Viral Referrals</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300">{referredCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-1 font-mono">Peer-attributed invites</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Target Progress</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white">
            {records.length} <span className="text-sm font-normal text-slate-400">/ 500</span>
          </div>
          <div className="text-[11px] text-cyan-400 mt-1 font-mono">
            {Math.max(0, 500 - records.length)} seats remaining
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setFilterFinalYear(null); setFilterReferredOnly(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filterFinalYear === null && !filterReferredOnly
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All Signups ({records.length})
          </button>

          <button
            onClick={() => setFilterFinalYear(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              filterFinalYear === true
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Final-Year Only ({finalYearCount})</span>
          </button>

          <button
            onClick={() => setFilterReferredOnly(!filterReferredOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              filterReferredOnly
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Peer Referred ({referredCount})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, college, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <button
            onClick={exportCSV}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Export filtered records to CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={fetchRegistrations}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Student</th>
                <th className="p-3.5">College & Branch</th>
                <th className="p-3.5">Batch</th>
                <th className="p-3.5">Referral Code</th>
                <th className="p-3.5">Attribution Source</th>
                <th className="p-3.5">Invites Made</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span>Loading student records from growth database...</span>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-white font-bold">No student registrations match your filter</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting search or click below to register a new student.</p>
                    <button
                      onClick={onOpenRegisterModal}
                      className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition"
                    >
                      + Register Student
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.registration_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <span>{r.full_name}</span>
                        {r.is_final_year && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                            Final Yr
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{r.email}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-slate-200 font-medium">{r.college_name}</div>
                      <div className="text-[11px] text-slate-400">{r.branch}</div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-300">
                      {r.graduation_year}
                    </td>

                    <td className="p-3.5">
                      <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-cyan-300 font-bold">
                        <span>{r.referral_code}</span>
                        <button
                          onClick={() => handleCopyCode(r.referral_code)}
                          className="text-slate-500 hover:text-white transition"
                          title="Copy referral code"
                        >
                          {copiedCode === r.referral_code ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {r.referred_by_code && (
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                          via {r.referred_by_code}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                        {r.acquisition_source}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono font-bold text-cyan-400">
                      {r.referral_count} invites
                    </td>

                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedStudent(r)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="View complete student profile"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.full_name || 'Student Profile'}
        subtitle={`Registered on ${selectedStudent?.registered_at ? selectedStudent.registered_at.split('T')[0] : 'Today'}`}
      >
        {selectedStudent && (
          <div className="space-y-5 text-xs text-slate-300 font-sans">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{selectedStudent.full_name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${selectedStudent.is_final_year ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                  {selectedStudent.is_final_year ? 'VERIFIED FINAL-YEAR' : 'PRE-FINAL YEAR'}
                </span>
              </div>
              <div className="font-mono text-cyan-300">{selectedStudent.email}</div>
              <div className="font-mono text-slate-400">{selectedStudent.phone_number}</div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">College:</span>
                <span className="font-bold text-white">{selectedStudent.college_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Branch & Batch:</span>
                <span className="text-white">{selectedStudent.branch} ({selectedStudent.graduation_year})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Primary Goal:</span>
                <span className="text-cyan-300 font-medium">{selectedStudent.primary_goal}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Self-Reported Skill:</span>
                <span className="text-white">{selectedStudent.skill_level}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Referral Code:</span>
                <span className="font-mono text-amber-300 font-bold">{selectedStudent.referral_code}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Referred By Code:</span>
                <span className="font-mono text-slate-300">{selectedStudent.referred_by_code || 'None (Direct Organic)'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Friends Invited:</span>
                <span className="font-mono font-bold text-cyan-400">{selectedStudent.referral_count} students</span>
              </div>
            </div>

            {onNavigateToReferral && (
              <button
                onClick={() => {
                  onNavigateToReferral(selectedStudent.referral_code);
                  setSelectedStudent(null);
                }}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition flex items-center justify-center space-x-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Open Student Squad Pass Dashboard &rarr;</span>
              </button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
