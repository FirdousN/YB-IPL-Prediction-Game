export default function RewardsPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                <h1 className="text-2xl font-bold tracking-widest text-white uppercase px-2 border-l-4 border-purple-500">
                    Win Prizes
                </h1>
            </div>

            <div className="p-8 bg-gradient-to-br from-[#2a134a] to-[#0a1122] rounded-2xl border border-purple-800/40 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                    <svg className="w-64 h-64 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                </div>

                <h2 className="text-4xl font-extrabold text-white mb-4 relative z-10">Daily Predictor Jackpots</h2>
                <p className="text-lg text-purple-200 mb-8 max-w-lg mx-auto relative z-10">
                    Climb the leaderboard to win exclusive merch, tickets, and cash prizes every single day during the IPL 2026 Season!
                </p>

                <div className="inline-block px-8 py-3 bg-white/10 border border-white/20 rounded-full font-bold text-white relative z-10 animate-pulse">
                    Prize pool unlocks on March 28th
                </div>
            </div>
        </div>
    );
}
