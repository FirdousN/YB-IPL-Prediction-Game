"use client";

import { useState, useEffect } from "react";

export default function FixturesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Fixtures' | 'Results'>('Fixtures');

  useEffect(() => {
    fetch('/api/site/ipl')
      .then(res => res.json())
      .then(data => {
        if (data.matches) {
          setMatches(data.matches);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredMatches = matches.filter(m => {
    if (activeTab === 'Fixtures') return !m.matchEnded;
    return m.matchEnded;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900/40 p-6 rounded-3xl backdrop-blur-xl border border-white/5 shadow-2xl space-y-4 md:space-y-0">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-[0.2em] text-white uppercase px-4 border-l-4 border-blue-500 italic">
            OFFICIAL TATA IPL 2026
          </h1>
          <p className="text-[10px] font-bold text-gray-500 tracking-[0.4em] uppercase mt-2 pl-4">Synchronized with Official BCCI Schedule</p>
        </div>

        {/* Premium Tab Switcher */}
        <div className="bg-black/50 p-1 rounded-2xl border border-white/5 flex">
          {['Fixtures', 'Results'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-8 py-2 rounded-xl text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 ${activeTab === tab
                  ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col justify-center items-center space-y-4">
          <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
          <span className="font-bold tracking-[0.3em] uppercase text-sm text-blue-400 animate-pulse">Syncing Schedule...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-24 bg-gray-900/20 rounded-[3rem] border-2 border-dashed border-gray-800">
          <div className="text-gray-600 font-black text-2xl tracking-[0.3em] uppercase mb-2">No {activeTab} Found</div>
          <p className="text-gray-500 font-medium tracking-widest text-sm">Stay tuned for official updates from the BCCI.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMatches.map(m => (
            <div key={m.id} className="group relative">
              {/* Glowing Background Effect */}
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className={`relative bg-gradient-to-br from-gray-900 via-gray-900 to-black border rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500 overflow-hidden ${m.matchEnded
                  ? 'border-white/5 hover:border-white/20'
                  : 'border-white/5 hover:border-blue-500/30'
                }`}>

                {/* Match Info Bar */}
                <div className="flex justify-between items-center mb-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase mb-1">
                      {new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                      {new Date(m.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                  <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase italic">
                      {m.venue?.split(",")[0] || "TBD"}
                    </span>
                  </div>
                </div>

                {/* Teams / Score Section */}
                <div className="space-y-8">
                  {m.teamInfo?.map((team: any, i: number) => (
                    <div key={team.shortname} className="flex justify-between items-center group/team">
                      <div className="flex items-center space-x-5">
                        <div className="relative">
                          <div className="absolute inset-0 bg-white rounded-full blur-md opacity-0 group-hover/team:opacity-20 transition-opacity"></div>
                          <img src={team.img} alt={team.shortname} className="w-14 h-14 object-contain rounded-full shadow-2xl bg-white border-2 border-gray-800 p-2 relative z-10" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-white tracking-[0.15em] text-xl uppercase group-hover/team:text-blue-400 transition-colors">
                            {team.shortname}
                          </span>
                          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{team.name}</span>
                        </div>
                      </div>

                      {/* Results / Live Scores */}
                      {m.matchEnded && m.score && m.score[i] && (
                        <div className="text-right">
                          <div className="font-black text-white text-2xl tracking-tighter">
                            {m.score[i].r}/{m.score[i].w}
                          </div>
                          <div className="text-[10px] font-black text-gray-500 tracking-widest uppercase">
                            ({m.score[i].o})
                          </div>
                        </div>
                      )}
                      {!m.matchEnded && (
                        <div className="w-8 h-px bg-gray-800"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Status / Result Bar */}
                <div className={`mt-10 pt-6 border-t border-white/5 flex flex-col items-center justify-center space-y-2`}>
                  {m.matchEnded ? (
                    <>
                      <div className="px-6 py-2 bg-green-500/10 rounded-2xl border border-green-500/20">
                        <p className="text-center text-[11px] font-black tracking-widest text-green-400 uppercase italic">
                          {m.status}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center space-x-3 text-blue-500/50 group-hover:text-blue-400 transition-colors">
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse"></div>
                      <p className="text-[10px] font-black tracking-[0.4em] uppercase">
                        Match Scheduled
                      </p>
                    </div>
                  )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-600 shadow-[0_0_100px_rgba(37,99,235,0.2)] rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-3xl"></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
