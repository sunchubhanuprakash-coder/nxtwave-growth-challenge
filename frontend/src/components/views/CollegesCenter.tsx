import React, { useState, useEffect } from 'react';
import {
  Building,
  Search,
  RefreshCw
} from 'lucide-react';

const DEFAULT_COLLEGES = [
  { college_id: 1, college_name: "Chaitanya Bharathi Institute of Technology", college_code: "CBIT", city: "Hyderabad", tier: "Tier-1", clubs: ["CBIT Coding Club", "IEEE Student Chapter", "ACM Student Chapter"] },
  { college_id: 2, college_name: "Vignana Bharathi Institute of Technology", college_code: "VBIT", city: "Hyderabad", tier: "Tier-2", clubs: ["VBIT AI Club", "ISTE Chapter", "Robotics Club"] },
  { college_id: 3, college_name: "BVRIT Hyderabad College of Engineering", college_code: "BVRIT", city: "Hyderabad", tier: "Tier-2", clubs: ["BVRIT Dev Club", "Google Developer Student Club"] },
  { college_id: 4, college_name: "JNTUH University College of Engineering", college_code: "JNTUH", city: "Hyderabad", tier: "Tier-1", clubs: ["JNTUH Tech Club", "CSI Chapter"] },
  { college_id: 5, college_name: "Vasavi College of Engineering", college_code: "VCE", city: "Hyderabad", tier: "Tier-1", clubs: ["VCE Developers Group", "AI Enthusiasts"] },
  { college_id: 6, college_name: "CVR College of Engineering", college_code: "CVR", city: "Hyderabad", tier: "Tier-2", clubs: ["CVR CodeCraft", "Innovation Cell"] }
];

const DEFAULT_OPPORTUNITIES = [
  { code: "CBIT", score: 94, penetration_rate: 27.5, key_recommendation: "Scale WhatsApp micro-bounties with ACM chapter." },
  { code: "VBIT", score: 88, penetration_rate: 24.0, key_recommendation: "Activate IT hostel group ambassadors." },
  { code: "BVRIT", score: 91, penetration_rate: 22.0, key_recommendation: "Deploy GDSC placement prep webinar teaser." },
  { code: "JNTUH", score: 86, penetration_rate: 19.9, key_recommendation: "Hostel representative referral drive." },
  { code: "VCE", score: 82, penetration_rate: 15.8, key_recommendation: "Peer coding circle WhatsApp blitz." },
  { code: "CVR", score: 79, penetration_rate: 12.8, key_recommendation: "Final-year lab session pass distribution." }
];

export const CollegesCenter: React.FC = () => {
  const [colleges, setColleges] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  const fetchCollegeData = async () => {
    try {
      setLoading(true);
      const apiBase = ((import.meta as any).env?.VITE_API_URL || '');
      const [treeRes, oppRes] = await Promise.all([
        fetch(`${apiBase}/api/attribution/colleges-clubs`),
        fetch(`${apiBase}/api/intelligence/colleges`),
      ]);

      const treeType = treeRes.headers.get('content-type') || '';
      if (treeType.includes('application/json') && treeRes.ok) {
        const treeData = await treeRes.json();
        setColleges(treeData.colleges || DEFAULT_COLLEGES);
      } else {
        setColleges(DEFAULT_COLLEGES);
      }

      const oppType = oppRes.headers.get('content-type') || '';
      if (oppType.includes('application/json') && oppRes.ok) {
        const oppData = await oppRes.json();
        setOpportunities(oppData.colleges || DEFAULT_OPPORTUNITIES);
      } else {
        setOpportunities(DEFAULT_OPPORTUNITIES);
      }
    } catch (err) {
      setColleges(DEFAULT_COLLEGES);
      setOpportunities(DEFAULT_OPPORTUNITIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeData();
  }, []);

  const filteredColleges = colleges.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.college_name.toLowerCase().includes(q) ||
      c.college_code.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.tier.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
            CAMPUS NETWORK DIRECTORY
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Engineering College Partnerships & Club Networks
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Targeting Telangana Tier 1 & 2 engineering colleges with active ACM, IEEE, and Coding Club ambassador networks.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campus or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
          <button
            onClick={fetchCollegeData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Refresh campus data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* College Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-2" />
            <span>Loading college network directory...</span>
          </div>
        ) : filteredColleges.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <Building className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-white font-bold">No engineering colleges match "{search}"</p>
          </div>
        ) : (
          filteredColleges.map((col) => {
            const opp = opportunities.find((o) => o.code === col.college_code);
            return (
              <div
                key={col.college_id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-cyan-400">{col.college_code}</span>
                      <h3 className="text-base font-bold text-white mt-0.5">{col.college_name}</h3>
                      <div className="text-[11px] text-slate-400">{col.city}, Telangana</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {col.tier}
                    </span>
                  </div>

                  {opp && (
                    <div className="my-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Opportunity Score:</span>
                        <span className="font-mono font-bold text-emerald-400">{opp.score}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Untapped Potential:</span>
                        <span className="font-mono text-white">{opp.untapped_seats} students</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Penetration:</span>
                        <span className="font-mono text-cyan-300">{opp.penetration_pct}%</span>
                      </div>
                    </div>
                  )}

                  {/* Active Clubs */}
                  <div className="mt-3">
                    <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                      Partner Technical Clubs ({col.clubs?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {col.clubs?.map((club: any) => (
                        <span
                          key={club.club_id}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-950 text-indigo-300 border border-slate-800"
                        >
                          {club.club_name} ({club.member_count} members)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Batch Est: {col.student_count_estimate || 1500}</span>
                  <span className="text-emerald-400 font-bold">Priority Target</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
