"use client";

import { useState, useEffect } from "react";

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site/ipl')
      .then(res => res.json())
      .then(data => {
        if (data.matches) {
           const uniqueTeams = new Map();
           data.matches.forEach((m: any) => {
              m.teamInfo?.forEach((t: any) => {
                 uniqueTeams.set(t.shortname, t);
              });
           });
           setTeams(Array.from(uniqueTeams.values()));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        <h1 className="text-2xl font-bold tracking-widest text-white uppercase px-2 border-l-4 border-blue-500">
          All Teams
        </h1>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center items-center space-x-3 text-gray-400">
          <div className="w-6 h-6 border-t-2 border-gray-400 rounded-full animate-spin"></div>
          <span className="font-bold tracking-wider">Gathering Team Data...</span>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center p-12 text-gray-400 font-bold border border-dashed border-gray-700 rounded-xl">
          No teams found for the active tournament.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {teams.map(t => (
            <div key={t.shortname} className="aspect-square bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 flex flex-col items-center justify-center space-y-4 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition cursor-pointer group hover:-translate-y-1">
              {t.img ? (
                 <img src={t.img} alt={t.shortname} className="w-16 h-16 rounded-full border-4 border-gray-700 group-hover:border-blue-500 transition object-contain bg-white shadow-lg p-1" />
              ) : (
                 <div className="w-16 h-16 rounded-full border-4 border-gray-700 group-hover:border-blue-500 bg-gray-700 group-hover:bg-blue-600 transition flex items-center justify-center text-xl font-black text-white shadow-lg">
                   {t.shortname[0]}
                 </div>
              )}
              <h3 className="font-bold text-lg text-gray-200 group-hover:text-white tracking-widest">{t.shortname}</h3>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
