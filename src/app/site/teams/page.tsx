"use client";

import { useState, useEffect } from "react";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    fetch('/api/site/ipl')
      .then(res => res.json())
      .then(data => {
        if (data.matches) {
          const uniqueTeams = new Map();
          data.matches.forEach((m: any) => {
            m.teamInfo?.forEach((t: any) => {
              // Ensure we have an ID for fetching players
              uniqueTeams.set(t.shortname, { ...t, id: t.id || t._id });
            });
          });
          setTeams(Array.from(uniqueTeams.values()));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchPlayers = (team: any) => {
    setSelectedTeam(team);
    setLoadingPlayers(true);
    fetch(`/api/site/teams/${team.id}/players`)
      .then(res => res.json())
      .then(data => {
        setPlayers(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoadingPlayers(false));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center bg-gray-900/40 p-5 rounded-2xl backdrop-blur-md border border-white/5 shadow-2xl">
        <h1 className="text-3xl font-black tracking-[0.2em] text-white uppercase px-4 border-l-4 border-blue-500 italic">
          ALL TEAMS
        </h1>
        <div className="text-xs font-bold text-gray-500 tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full border border-white/5">
          IPL 2026 Season
        </div>
      </div>

      {loading ? (
        <div className="p-20 flex flex-col justify-center items-center space-y-4 text-blue-400">
          <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
          <span className="font-bold tracking-[0.3em] uppercase text-sm animate-pulse">Analyzing Rosters...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center p-20 text-gray-500 font-black tracking-widest border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/20">
          NO TEAMS REGISTERED FOR THIS TOURNAMENT.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {teams.map(t => (
            <button
              key={t.shortname}
              onClick={() => fetchPlayers(t)}
              className="aspect-square bg-gradient-to-br from-gray-800/80 to-black rounded-[2rem] border border-white/5 flex flex-col items-center justify-center space-y-4 hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] transition-all duration-500 cursor-pointer group hover:-translate-y-2 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              {t.img ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-white rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <img src={t.img} alt={t.shortname} className="w-20 h-20 rounded-full border-4 border-gray-800 group-hover:border-blue-500 transition-all duration-500 object-contain bg-white shadow-2xl p-2 relative z-10" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-gray-800 group-hover:border-blue-500 bg-gradient-to-br from-blue-900 to-black group-hover:from-blue-600 group-hover:to-blue-900 transition-all duration-500 flex items-center justify-center text-3xl font-black text-white shadow-2xl relative z-10">
                  {t.shortname[0]}
                </div>
              )}
              <h3 className="font-black text-xl text-gray-400 group-hover:text-white tracking-[0.2em] transition-colors">{t.shortname}</h3>
              <div className="text-[10px] font-bold text-blue-500/50 group-hover:text-blue-400 tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0 uppercase">View Squad</div>
            </button>
          ))}
        </div>
      )}

      {/* Squad Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedTeam(null)}></div>
          <div className="bg-gradient-to-b from-gray-900 to-black w-full max-w-4xl rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-8 pb-4 flex justify-between items-start border-b border-white/5">
              <div className="flex items-center space-x-6">
                {selectedTeam.img ? (
                  <img src={selectedTeam.img} className="w-16 h-16 rounded-full bg-white p-2 border-2 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]" alt={selectedTeam.shortname} />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-black border-2 border-white/20 shadow-xl">{selectedTeam.shortname[0]}</div>
                )}
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-white">{selectedTeam.name}</h2>
                  <p className="text-blue-500 font-bold tracking-[0.3em] uppercase text-xs mt-1">Official Squad Listing</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="p-2 hover:bg-white/10 rounded-full transition text-gray-500 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 pt-6">
              {loadingPlayers ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                  <div className="text-xs font-bold text-gray-500 tracking-widest uppercase">Fetching Players...</div>
                </div>
              ) : players.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="text-gray-600 font-black text-xl tracking-widest uppercase opacity-50 mb-2">No Player Data</div>
                  <p className="text-gray-500 text-sm max-w-xs mx-auto">The squad roster for this team hasn't been finalized in our system yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['Batsman', 'WK-Batsman', 'All-rounder', 'Bowler'].map(role => {
                    const rolePlayers = players.filter(p => p.role === role);
                    if (rolePlayers.length === 0) return null;
                    return (
                      <div key={role} className="space-y-3">
                        <h4 className="text-[10px] font-black text-blue-500/70 tracking-[0.4em] uppercase pl-4">{role}s</h4>
                        <div className="space-y-2">
                          {rolePlayers.map(p => (
                            <div key={p.id || p._id} className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl flex items-center justify-between group transition-all duration-300 border border-transparent hover:border-white/10">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  {p.name[0]}
                                </div>
                                <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{p.name}</span>
                              </div>
                              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{p.role}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-8 pt-4 bg-black/40 border-t border-white/5 flex justify-center">
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center max-w-md">Data sourced from official IPL 2026 auction results and team announcements.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
