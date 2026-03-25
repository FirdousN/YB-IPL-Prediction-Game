"use client";

import { useState, useEffect } from "react";

export default function PointsTablePage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site/ipl/points')
      .then(res => res.json())
      .then(data => {
        if (data.points && Array.isArray(data.points)) {
          setTeams(data.points);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900/40 p-6 rounded-3xl backdrop-blur-xl border border-white/5 shadow-2xl space-y-4 md:space-y-0">
        <div className="flex flex-col">
           <h1 className="text-3xl font-black tracking-[0.2em] text-white uppercase px-4 border-l-4 border-blue-500 italic">
             OFFICIAL STANDINGS
           </h1>
           <p className="text-[10px] font-bold text-gray-500 tracking-[0.4em] uppercase mt-2 pl-4">Calculated from Official Match Results</p>
        </div>
        <div className="text-xs font-black text-blue-500 tracking-[0.3em] uppercase bg-blue-500/10 px-6 py-3 rounded-full border border-blue-500/20 italic">
          TATA IPL 2026
        </div>
      </div>

      <div className="bg-gradient-to-b from-gray-900 to-black rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="py-24 flex flex-col justify-center items-center space-y-4">
                <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                <span className="font-bold tracking-[0.3em] uppercase text-sm text-blue-400 animate-pulse">Calculating Standings...</span>
             </div>
          ) : teams.length === 0 ? (
             <div className="py-24 text-center">
                <div className="text-gray-600 font-black text-2xl tracking-[0.3em] uppercase mb-2">No Data Available</div>
                <p className="text-gray-500 font-medium tracking-widest text-sm max-w-xs mx-auto">Standings will appear once the first match of the season concludes.</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-gray-400 text-[10px] tracking-[0.2em] uppercase">
                  <th className="p-6 font-black">Team</th>
                  <th className="p-6 font-black text-center">P</th>
                  <th className="p-6 font-black text-center">W</th>
                  <th className="p-6 font-black text-center">L</th>
                  <th className="p-6 font-black text-center">NR</th>
                  <th className="p-6 font-black text-center">NRR</th>
                  <th className="p-6 font-black text-center bg-blue-600/10 text-blue-400">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teams.map((team, idx) => (
                  <tr key={team.shortname || idx} className="group hover:bg-white/[0.02] transition-colors duration-300">
                    <td className="p-6 whitespace-nowrap">
                      <div className="flex items-center space-x-5">
                        <span className="text-xs font-black text-gray-700 w-4 group-hover:text-blue-500 transition-colors">
                          {idx + 1}
                        </span>
                        {team.img ? (
                          <div className="relative">
                             <div className="absolute inset-0 bg-white rounded-full blur-sm opacity-10"></div>
                             <img src={team.img} className="w-10 h-10 rounded-full border border-white/10 bg-white object-contain p-1 relative z-10" alt={team.shortname}/>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-900 to-black flex items-center justify-center text-xs font-black border border-white/10 text-white">
                            {(team.shortname || team.teamname)?.[0] || "?"}
                          </div>
                        )}
                        <div className="flex flex-col">
                           <span className="font-black text-white tracking-wider text-sm uppercase group-hover:text-blue-400 transition-colors">
                              {team.shortname}
                           </span>
                           <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-none">
                              {team.teamname}
                           </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-center text-sm font-bold text-gray-400">{team.matches || 0}</td>
                    <td className="p-6 text-center text-sm font-black text-green-500/80">{team.wins || 0}</td>
                    <td className="p-6 text-center text-sm font-black text-red-500/80">{team.loss || 0}</td>
                    <td className="p-6 text-center text-sm font-bold text-gray-500">{team.nr || 0}</td>
                    <td className="p-6 text-center text-sm font-black text-blue-500/80 tabular-nums italic">
                       {team.nrrs || "0.000"}
                    </td>
                    <td className="p-6 text-center font-black text-white text-xl bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors tabular-nums">
                       {team.points || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Footer Legend */}
      <div className="flex justify-center space-x-8 py-4 opacity-50">
         <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
            <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase italic">Qualifiers Zone</span>
         </div>
         <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-700 rounded-full"></div>
            <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase italic">Elimination Zone</span>
         </div>
      </div>
    </div>
  );
}
