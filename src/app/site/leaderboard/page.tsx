import { useEffect, useState } from "react";

interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/site/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        <h1 className="text-2xl font-bold tracking-widest text-white uppercase px-2 border-l-4 border-green-500">
          Leaderboard
        </h1>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          {users.length === 0 ? (
            <div className="text-center py-20">
               <p className="text-gray-500 font-bold uppercase tracking-widest">No Predictions Yet</p>
               <p className="text-xs text-gray-600 mt-2 uppercase tracking-tighter">Ranking will start once IPL 2026 begins</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#1f2937] text-gray-500 dark:text-gray-400 text-xs tracking-wider uppercase">
                  <th className="p-4 font-semibold text-center w-16">Rank</th>
                  <th className="p-4 font-semibold">Predictor</th>
                  <th className="p-4 font-semibold text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {users.map((u, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition duration-150">
                    <td className="p-4 text-center font-black text-gray-400 dark:text-gray-600">
                      {i === 0 ? <span className="text-yellow-500 text-xl">🥇</span> : 
                       i === 1 ? <span className="text-gray-400 text-xl">🥈</span> : 
                       i === 2 ? <span className="text-amber-600 text-xl">🥉</span> : 
                       `#${i + 1}`}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-800 flex items-center justify-center text-xs font-bold text-white shadow-sm uppercase">
                          {u.name[0]}
                        </div>
                        <span className="font-bold text-gray-900 dark:text-gray-100">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-black text-green-600 dark:text-green-400 text-lg">
                      {u.points}
                    </td>
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
