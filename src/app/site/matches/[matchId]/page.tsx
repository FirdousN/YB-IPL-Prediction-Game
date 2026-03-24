"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
}

interface Question {
  _id: string;
  id: string;
  text: string;
  type: string;
  options: string[];
}

interface Match {
  _id: string;
  teamA: Team;
  teamB: Team;
  startTime: string;
  status: string;
  isLocked: boolean;
  group?: string;
  venue?: string;
  questions: Question[];
}

export default function MatchDetailsPage({ params }: { params: Promise<{ matchId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Array of { questionId, value }
  const [answers, setAnswers] = useState<{questionId: string, value: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchMatch() {
      try {
        const res = await fetch(`/api/matches/${resolvedParams.matchId}`);
        if (!res.ok) throw new Error("Match not found or failed to load");
        const data = await res.json();
        setMatch(data);

        // Fetch prior predictions
        const predRes = await fetch(`/api/predictions/${resolvedParams.matchId}`);
        let existingAnswers: any[] = [];
        if (predRes.ok) {
          const predData = await predRes.json();
           if (predData.answers) existingAnswers = predData.answers;
        }

        // Initialize answers array mapping existing OR placing defaults
        const initialAnswers = data.questions?.map((q: any) => {
          const prior = existingAnswers.find(a => String(a.questionId) === String(q._id));
          return {
             questionId: q._id,
             value: prior ? prior.value : ""
          };
        }) || [];
        
        setAnswers(initialAnswers);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMatch();
  }, [resolvedParams.matchId]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, value } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    // Validate all answered
    if (answers.some(a => !a.value.trim())) {
      setError("Please answer all 5 questions before submitting.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: resolvedParams.matchId, answers })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit prediction");
      }

      alert("Predictions saved successfully!");
      router.push("/site/matches?tab=MY_PICKS");
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        router.push("/login");
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading Match Details...</div>;
  if (error && !match) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  if (!match) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Match Header */}
      <div className="bg-gradient-to-b from-[#1a233a] to-[#0a1122] rounded-3xl p-8 border border-blue-900/30 shadow-2xl relative overflow-hidden text-center">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

         <div className="relative z-10 flex justify-between items-center mt-4 mb-4">
            <div className="flex-1 text-right pr-6 md:pr-12">
               {match.teamA?.logoUrl ? (
                  <img src={match.teamA.logoUrl} alt="A" className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 bg-white ml-auto object-contain p-2 shadow-2xl" />
               ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 bg-gray-800 ml-auto flex items-center justify-center text-4xl font-black">{match.teamA?.shortName}</div>
               )}
               <h2 className="text-2xl font-black mt-4 text-white tracking-tight">{match.teamA?.name}</h2>
            </div>
            
            <div className="px-4 shrink-0 mt-[-2rem]">
               <div className="inline-block px-4 py-2 bg-black/40 backdrop-blur border border-white/10 rounded-2xl mb-4">
                 <span className="text-white font-bold">{new Date(match.startTime).toLocaleDateString()}</span>
               </div>
               <div><span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-400 to-gray-700 italic">VS</span></div>
            </div>

            <div className="flex-1 text-left pl-6 md:pl-12">
               {match.teamB?.logoUrl ? (
                  <img src={match.teamB.logoUrl} alt="B" className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 bg-white mr-auto object-contain p-2 shadow-2xl" />
               ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 bg-gray-800 mr-auto flex items-center justify-center text-4xl font-black">{match.teamB?.shortName}</div>
               )}
               <h2 className="text-2xl font-black mt-4 text-white tracking-tight">{match.teamB?.name}</h2>
            </div>
         </div>
      </div>

      {/* Prediction Form */}
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 md:p-10 shadow-xl space-y-10">
        
        <div className="border-b border-gray-800 pb-6 text-center">
            <h2 className="text-2xl font-black text-white">Your Predictions</h2>
            <p className="text-gray-400 mt-2">Answer all {match.questions?.length || 5} questions to submit your entry.</p>
        </div>

        {error && <div className="p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-xl font-bold text-center">{error}</div>}

        <div className="space-y-12">
          {match.questions?.map((q, index) => {
            const currentAnswer = answers.find(a => a.questionId === q._id)?.value || "";
            return (
              <div key={q._id} className="space-y-4">
                <h3 className="text-xl font-bold text-blue-400 leading-snug">
                  <span className="text-gray-500 mr-2">Q{index + 1}.</span> {q.text}
                </h3>
                
                {q.type === 'OPTIONS' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {q.options.map((option) => (
                      <button
                        type="button"
                        key={option}
                        disabled={match.isLocked}
                        onClick={() => handleAnswerChange(q._id, option)}
                        className={`p-4 rounded-xl text-lg font-bold transition-all border-2 text-left flex items-center justify-between
                          ${currentAnswer === option 
                            ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" 
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"}
                          ${match.isLocked ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        {option}
                        {currentAnswer === option && <span className="bg-blue-400 w-4 h-4 rounded-full ml-4 shadow-sm"></span>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <input 
                      type="text" 
                      value={currentAnswer}
                      disabled={match.isLocked}
                      onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full bg-gray-800 border-2 border-gray-700 focus:border-blue-500 rounded-xl px-5 py-4 text-white text-lg font-medium transition focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-8 border-t border-gray-800 text-center">
            {match.isLocked ? (
              <p className="text-red-400 font-bold bg-red-900/20 py-4 rounded-xl border border-red-900/50">
                LOCKED: Predictions for this match are closed.
              </p>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-blue-900/30 hover:shadow-blue-900/50 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center mx-auto"
              >
                {isSubmitting ? "Saving..." : "Lock In Predictions"}
              </button>
            )}
            {!match.isLocked && <p className="text-sm text-gray-500 mt-4">You can edit these until 30 minutes before the match starts.</p>}
        </div>

      </form>

    </div>
  );
}
