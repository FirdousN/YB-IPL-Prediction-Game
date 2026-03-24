"use client";

import { useState, useEffect } from "react";

export default function FixturesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site/ipl')
      .then(res => res.json())
      .then(data => {
        if (data.matches) {
          // Sort basically by date if needed, though API Usually returns in order
          setMatches(data.matches);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        <h1 className="text-2xl font-bold tracking-widest text-white uppercase px-2 border-l-4 border-blue-500">
          Fixtures & Results
        </h1>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center items-center space-x-3 text-gray-400">
          <div className="w-6 h-6 border-t-2 border-gray-400 rounded-full animate-spin"></div>
          <span className="font-bold tracking-wider">Loading Official Match Schedule...</span>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center p-12 text-gray-400 font-bold border border-dashed border-gray-700 rounded-xl">
          No matches found for the active tournament.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map(m => (
            <div key={m.id} className={`bg-gradient-to-br border rounded-2xl p-6 transition duration-300 relative overflow-hidden ${
                m.matchEnded 
                  ? 'from-gray-900/80 to-black/80 border-gray-800 hover:border-gray-600' 
                  : 'from-gray-800/80 to-gray-900/80 border-white/10 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]'
              }`}>
                 
                 {m.matchEnded && (
                   <div className="absolute top-0 right-0 bg-gray-800 text-gray-400 text-[10px] font-black tracking-widest px-3 py-1 rounded-bl-xl border-b border-l border-gray-700">
                     COMPLETED
                   </div>
                 )}

                 <div className="flex justify-between items-center mb-6 text-xs font-black tracking-wider pt-2">
                   <span className={m.matchEnded ? "text-gray-500" : "text-gray-300"}>{new Date(m.date).toLocaleDateString()}</span>
                   <span className={m.matchEnded ? "text-gray-600" : "text-blue-400"}>{m.venue?.split(",")[0] || "TBD"}</span>
                 </div>
                 
                 <div className="space-y-4 mb-6">
                   {m.teamInfo?.map((team: any, i: number) => (
                     <div key={team.shortname} className="flex justify-between items-center">
                       <div className="flex items-center space-x-3">
                         <img src={team.img} alt={team.shortname} className={`w-10 h-10 object-contain rounded-full shadow-sm bg-white border border-gray-200 p-1 ${m.matchEnded && m.status?.includes(team.name) ? "ring-2 ring-green-500" : ""}`} />
                         <span className="font-bold text-white tracking-wide text-lg">{team.shortname}</span>
                       </div>
                       
                       {m.score && m.score[i] && (
                          <span className="font-black text-gray-300 text-lg">
                            {m.score[i].r}/{m.score[i].w} <span className="text-xs text-gray-500">({m.score[i].o})</span>
                          </span>
                       )}
                       {(!m.score || !m.score[i]) && <span className="font-bold text-gray-600">-</span>}
                     </div>
                   ))}
                 </div>

                 <div className={`mt-4 pt-4 border-t ${m.matchEnded ? 'border-gray-800' : 'border-gray-700'}`}>
                   <p className={`text-center text-sm font-semibold ${m.matchEnded ? "text-green-500/80" : "text-blue-300"}`}>
                     {m.status || "Match Details Loading..."}
                   </p>
                 </div>
               </div>
          ))}
        </div>
      )}
    </div>
  );
}
