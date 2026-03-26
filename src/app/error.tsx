'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0505] flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
      {/* Red Background Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -ml-64 -mt-64"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px] -mr-64 -mb-64"></div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="relative mb-12 transform hover:rotate-2 transition-transform duration-500">
          <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full"></div>
          <img
            src="/error-cricket.png"
            alt="Stumped"
            className="w-full max-w-md mx-auto relative z-10 drop-shadow-[0_0_50px_rgba(239,68,68,0.5)]"
          />
        </div>

        <h1 className="text-8xl font-black text-white mb-4 tracking-tighter italic uppercase text-red-500">How's That!</h1>
        <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-widest">Hit a Wicket</h2>

        <p className="text-gray-400 text-xl mb-10 font-medium leading-relaxed">
          The umpire has signaled an error! <br />
          Something went wrong in the middle of our innings.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black text-xl rounded-2xl transition-all shadow-2xl hover:bg-gray-200 active:scale-95 uppercase tracking-wider"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-10 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-xl rounded-2xl transition-all shadow-2xl shadow-red-900/40 hover:shadow-red-900/60 active:scale-95 uppercase tracking-wider"
          >
            Leave the Pitch
          </Link>
        </div>
      </div>

      <div className="absolute bottom-10 right-0 w-full text-gray-900 font-black text-[15rem] leading-none opacity-5 pointer-events-none select-none italic text-red-100">
        ERROR CODE
      </div>
    </div>
  );
}
