export default function StatsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/5">
        <h1 className="text-2xl font-bold tracking-widest text-white uppercase px-2 border-l-4 border-blue-500">
          Overall Stats
        </h1>
      </div>

      <div className="text-center py-20 bg-gray-800/30 rounded-2xl border border-dashed border-gray-700">
        <h2 className="text-3xl font-black text-gray-500 dark:text-gray-600 tracking-wider">COMING SOON</h2>
        <p className="text-gray-400 mt-4 max-w-md mx-auto">
          Tournament statistics including Orange Cap, Purple Cap, Most Sixes, and Highest Scores will be available once the IPL 2026 season begins.
        </p>
      </div>
    </div>
  );
}
