export default function TeamsPage() {
  const teams = ["CSK", "DC", "GT", "KKR", "LSG", "MI", "PBKS", "RR", "RCB", "SRH"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        <h1 className="text-2xl font-bold tracking-widest text-white uppercase px-2 border-l-4 border-blue-500">
          All Teams
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {teams.map(t => (
          <div key={t} className="aspect-square bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 flex flex-col items-center justify-center space-y-4 hover:border-blue-500 transition cursor-pointer group hover:-translate-y-1">
            <div className="w-16 h-16 rounded-full bg-gray-700 group-hover:bg-blue-600 transition flex items-center justify-center text-xl font-black">
              {t[0]}
            </div>
            <h3 className="font-bold text-lg text-gray-200 group-hover:text-white">{t}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
