export default function LeaderboardPage() {
  const users = [
    { rank: 1, name: "Rahul Kumar", pts: 2450 },
    { rank: 2, name: "Sneha Reddy", pts: 2310 },
    { rank: 3, name: "Arjun Singh", pts: 2190 },
    { rank: 4, name: "Priya Patel", pts: 2005 },
    { rank: 5, name: "Vikram Mehta", pts: 1890 },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        <h1 className="text-2xl font-bold tracking-widest text-white uppercase px-2 border-l-4 border-green-500">
          Leaderboard
        </h1>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#1f2937] text-gray-500 dark:text-gray-400 text-xs tracking-wider uppercase">
                <th className="p-4 font-semibold text-center w-16">Rank</th>
                <th className="p-4 font-semibold">Predictor</th>
                <th className="p-4 font-semibold text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {users.map((u) => (
                <tr key={u.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition duration-150">
                  <td className="p-4 text-center font-black text-gray-400 dark:text-gray-600">
                    {u.rank === 1 ? <span className="text-yellow-500 text-xl">🥇</span> : 
                     u.rank === 2 ? <span className="text-gray-400 text-xl">🥈</span> : 
                     u.rank === 3 ? <span className="text-amber-600 text-xl">🥉</span> : 
                     `#${u.rank}`}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-800 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                        {u.name[0]}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right font-black text-green-600 dark:text-green-400 text-lg">
                    {u.pts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
