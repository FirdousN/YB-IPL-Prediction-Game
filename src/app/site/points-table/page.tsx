"use client";

export default function PointsTablePage() {
  const teams = [
    { name: "CSK", p: 0, w: 0, l: 0, nr: 0, nrr: "0.000", pts: 0 },
    { name: "DC", p: 0, w: 0, l: 0, nr: 0, nrr: "0.000", pts: 0 },
    { name: "GT", p: 0, w: 0, l: 0, nr: 0, nrr: "0.000", pts: 0 },
    { name: "KKR", p: 0, w: 0, l: 0, nr: 0, nrr: "0.000", pts: 0 },
    { name: "LSG", p: 0, w: 0, l: 0, nr: 0, nrr: "0.000", pts: 0 },
    { name: "MI", p: 0, w: 0, l: 0, nr: 0, nrr: "0.000", pts: 0 },
    { name: "PBKS", p: 0, w: 0, l: 0, nr: 0, nrr: "0.000", pts: 0 },
    { name: "RR", p: 0, w: 0, l: 0, nr: 0, nrr: "0.000", pts: 0 },
    { name: "RCB", p: 0, w: 0, l: 0, nr: 0, nrr: "0.000", pts: 0 },
    { name: "SRH", p: 0, w: 0, l: 0, nr: 0, nrr: "0.000", pts: 0 }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        <h1 className="text-2xl font-bold tracking-widest text-white uppercase px-2 border-l-4 border-blue-500">
          Points Table
        </h1>
      </div>

      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
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
                <tr key={team.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition duration-150">
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-900 to-gray-800 flex items-center justify-center text-xs font-bold border border-gray-700">
                        {team.name[0]}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-gray-100">{team.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">{team.p}</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">{team.w}</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">{team.l}</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">{team.nr}</td>
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">{team.nrr}</td>
                  <td className="p-4 text-center font-bold text-gray-900 dark:text-white">{team.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
