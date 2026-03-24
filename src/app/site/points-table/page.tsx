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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        <h1 className="text-2xl font-bold tracking-widest text-white uppercase px-2 border-l-4 border-blue-500">
          Points Table
        </h1>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="p-12 flex justify-center items-center space-x-3 text-gray-500 dark:text-gray-400">
                <div className="w-6 h-6 border-t-2 border-gray-500 rounded-full animate-spin"></div>
                <span className="font-bold tracking-wider">Loading Official Standings...</span>
             </div>
          ) : teams.length === 0 ? (
             <div className="p-12 text-center text-gray-400 font-bold tracking-wider">
                Tournament hasn't started or points table is currently unavailable.
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#1f2937] text-gray-500 dark:text-gray-400 text-xs tracking-wider uppercase">
                  <th className="p-4 font-semibold">Team</th>
                  <th className="p-4 font-semibold text-center">P</th>
                  <th className="p-4 font-semibold text-center">W</th>
                  <th className="p-4 font-semibold text-center">L</th>
                  <th className="p-4 font-semibold text-center">NR</th>
                  <th className="p-4 font-semibold text-center">NRR</th>
                  <th className="p-4 font-semibold text-center">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {teams.map((team, idx) => (
                  <tr key={team.shortname || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition duration-150">
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {team.img ? (
                          <img src={team.img} className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white object-contain" alt={team.shortname}/>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-900 to-gray-800 flex items-center justify-center text-xs font-bold border border-gray-700 text-white">
                            {(team.shortname || team.teamname)?.[0] || "?"}
                          </div>
                        )}
                        <span className="font-bold text-gray-900 dark:text-gray-100">{team.teamname || team.shortname}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center text-gray-600 dark:text-gray-400">{team.matches || 0}</td>
                    <td className="p-4 text-center text-green-600 font-bold">{team.wins || 0}</td>
                    <td className="p-4 text-center text-red-600 font-bold">{team.loss || 0}</td>
                    <td className="p-4 text-center text-gray-600 dark:text-gray-400">{team.nr || team.ties || 0}</td>
                    <td className="p-4 text-center text-blue-600 font-bold">{team.nrrs || "0.000"}</td>
                    <td className="p-4 text-center font-black text-gray-900 dark:text-white text-lg">{team.points || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
