import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060b1a] flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-64 -mt-64 text-blue-100"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="relative mb-12 transform hover:scale-105 transition-transform duration-500">
          <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full"></div>
          <img
            src="/404-cricket.png"
            alt="Clean Bowled"
            className="w-full max-w-md mx-auto relative z-10 drop-shadow-[0_0_50px_rgba(59,130,246,0.5)]"
          />
        </div>

        <h1 className="text-8xl font-black text-white mb-4 tracking-tighter italic">OU<span className="text-blue-500 underline decoration-blue-500/30">T</span>!</h1>
        <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-widest">Clean Bowled 404</h2>

        <p className="text-gray-400 text-xl mb-10 font-medium leading-relaxed">
          Looks like you've been sent back to the pavilion. <br />
          The page you're looking for was <span className="text-blue-400 font-bold uppercase">stumped</span> or never made it to the crease.
        </p>

        <Link
          href="/"
          className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-xl rounded-2xl transition-all shadow-2xl shadow-blue-900/40 hover:shadow-blue-900/60 active:scale-95 uppercase tracking-wider"
        >
          Back to Home Base
        </Link>
      </div>

      <div className="absolute bottom-10 left-0 w-full text-gray-800 font-black text-[15rem] leading-none opacity-5 pointer-events-none select-none italic text-blue-100">
        NOT FOUND
      </div>
    </div>
  );
}
