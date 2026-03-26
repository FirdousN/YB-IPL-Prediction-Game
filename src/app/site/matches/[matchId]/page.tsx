"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import PlayerSearchSelect from "@/src/components/PlayerSearchSelect";
import ErrorModal from "@/src/components/ErrorModal";
import { X, Trophy, Calendar, MapPin, Lock, CheckCircle2 } from "lucide-react";

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
  result?: string;
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
  players?: string[];
}

export default function MatchDetailsPage({ params }: { params: Promise<{ matchId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);

  const [answers, setAnswers] = useState<{ questionId: string, value: string, points?: number }[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSessionValid, setIsSessionValid] = useState(true);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function fetchMatch() {
      try {
        const res = await fetch(`/api/matches/${resolvedParams.matchId}`);
        if (!res.ok) throw new Error("Match archive not accessible or expired.");
        const data = await res.json();
        setMatch(data);

        // Fetch prior predictions - Middleware ensures session exists for /site paths
        const predRes = await fetch(`/api/predictions/${resolvedParams.matchId}`);
        let existingAnswers: any[] = [];
        if (predRes.ok) {
          const predData = await predRes.json();
          if (predData.prediction) {
            setPrediction(predData.prediction);
            existingAnswers = predData.prediction.answers || [];
          }
        } else if (predRes.status === 401) {
          setIsSessionValid(false);
        }

        const initialAnswers = data.questions?.map((q: any) => {
          const prior = existingAnswers.find(a => String(a.questionId) === String(q._id));
          return {
            questionId: q._id,
            value: prior ? prior.value : "",
            points: prior ? prior.points : 0
          };
        }) || [];

        setAnswers(initialAnswers);

      } catch (err: any) {
        setError(err.message);
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMatch();
  }, [resolvedParams.matchId]);

  const isMatchToday = (isoString: string) => {
    const today = new Date();
    const matchDate = new Date(isoString);
    return today.getFullYear() === matchDate.getFullYear() &&
      today.getMonth() === matchDate.getMonth() &&
      today.getDate() === matchDate.getDate();
  };

  // 1 Minute Pre-Match Lock Calculation
  const isLockedByTime = match ? (new Date().getTime() > new Date(match.startTime).getTime() - 60000) : false;
  const isCompleted = match?.status?.toUpperCase() === "COMPLETED";
  const isPredictionLocked = match?.isLocked || match?.status?.toUpperCase() !== "UPCOMING" || isLockedByTime || isCompleted;

  const handleAnswerChange = (questionId: string, value: string) => {
    if (isPredictionLocked) return;
    setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, value } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (answers.some(a => !a.value.trim())) {
      setError("Strategic inputs required: Please answer all questions before locking in your picks.");
      setShowErrorModal(true);
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
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error(data.error || "Submission failed. Please try again.");
      }

      setShowSuccessModal(true);
      // Wait 2 seconds then redirect
      setTimeout(() => {
        router.push("/site/matches?tab=MY_PICKS");
      }, 2500);

    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        setIsSessionValid(false);
        setError("Your session has timed out. Please re-login to proceed.");
        setShowErrorModal(true);
      } else {
        setError(err.message);
        setShowErrorModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-text-secondary uppercase tracking-[0.3em] text-[10px] opacity-70">Loading Arena...</p>
    </div>
  );

  if (error && !match) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-6">
        <X className="text-error w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight mb-2">Notice</h2>
      <p className="text-text-secondary font-bold max-w-xs">{error}</p>
      <button onClick={() => router.back()} className="mt-8 px-8 py-3 bg-surface border border-border rounded-xl text-text-primary font-black uppercase text-[10px] tracking-widest hover:border-accent transition-colors">Return</button>
    </div>
  );

  if (!match) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 pt-8 px-4 transition-colors duration-500">

      {/* Match Context Card */}
      <div className="bg-surface rounded-[2.5rem] p-10 lg:p-14 border border-border shadow-sm relative overflow-hidden text-center group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/[0.03] rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex-1 text-center md:text-right">
            <div className="relative inline-block group-hover:scale-105 transition-transform duration-500">
              {match.teamA?.logoUrl ? (
                <img src={match.teamA.logoUrl} alt="A" className="w-32 h-32 md:w-36 md:h-36 rounded-3xl border border-border bg-white shadow-xl relative z-10 object-contain p-5" />
              ) : (
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl border border-border bg-background shadow-xl relative z-10 flex items-center justify-center text-4xl font-black text-text-primary uppercase">{match.teamA?.shortName}</div>
              )}
            </div>
            <h2 className="text-2xl font-black mt-6 text-text-primary tracking-tighter uppercase leading-tight">{match.teamA?.name}</h2>
          </div>

          <div className="px-4 shrink-0 flex flex-col items-center">
            <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm mb-6 relative group/vs transition-colors">
              <span className="text-4xl font-black text-text-secondary opacity-40 italic tracking-tighter">VS</span>
              {match.status?.toUpperCase() === "LIVE" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[8px] font-black px-3 py-1 rounded-full animate-pulse uppercase tracking-[0.2em]">
                  Live
                </div>
              )}
              {match.status?.toUpperCase() === "COMPLETED" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                  Finished
                </div>
              )}
            </div>
            <div className="space-y-1 opacity-80">
              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                {new Date(match.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-tight text-text-secondary max-w-[120px] truncate">{match.venue || 'Stadium'}</p>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="relative inline-block group-hover:scale-105 transition-transform duration-500">
              {match.teamB?.logoUrl ? (
                <img src={match.teamB.logoUrl} alt="B" className="w-32 h-32 md:w-36 md:h-36 rounded-3xl border border-border bg-white shadow-xl relative z-10 object-contain p-5" />
              ) : (
                <div className="w-32 h-32 md:w-36 md:h-36 rounded-3xl border border-border bg-background shadow-xl relative z-10 flex items-center justify-center text-4xl font-black text-text-primary uppercase">{match.teamB?.shortName}</div>
              )}
            </div>
            <h2 className="text-2xl font-black mt-6 text-text-primary tracking-tighter uppercase leading-tight">{match.teamB?.name}</h2>
          </div>
        </div>
      </div>

      {/* Prediction Action Hub */}
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-[2.5rem] p-8 md:p-14 shadow-sm space-y-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/40"></div>

        {/* Predict & Conquer */}
        <div className="border-b border-border pb-10 text-center relative z-10 space-y-8">
          <h2 className="text-3xl font-black text-text-primary tracking-tighter uppercase italic">Predict & Conquer</h2>

          {prediction?.totalPoints !== undefined && match.status?.toUpperCase() === "COMPLETED" ? (
            <div className="mt-6 inline-flex items-center gap-6 bg-accent/5 border border-accent/10 rounded-3xl p-6 px-10">
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent opacity-80 mb-1">Total Score</p>
                <p className="text-4xl font-black text-accent tracking-tighter italic">
                  {prediction?.totalPoints ?? 0}
                </p>
              </div>
              <div className="w-px h-10 bg-accent/10"></div>
              <div className="text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent opacity-80 mb-1">Match Rank</p>
                <p className="text-4xl font-black text-accent tracking-tighter italic">
                  #{prediction?.rank || '-'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-text-secondary mt-3 font-bold tracking-tight max-w-lg mx-auto leading-relaxed text-sm">
              {match.status?.toUpperCase() === "COMPLETED"
                ? "The game has ended. Official results and leaderboard are now live."
                : match.status?.toUpperCase() === "LIVE"
                  ? "The match is currently live. Predictions are sealed."
                  : isLockedByTime
                    ? "The prediction window has closed. The match is starting soon!"
                    : match.isLocked
                      ? "Your predictions are sealed. Good luck with the game!"
                      : "Finalize your strategic picks before the entry window closes (locks 1 min before start)."}
            </p>
          )}

          {/* Prediction Summary for Locked Matches */}
          {isPredictionLocked && prediction && (
            <div className="max-w-2xl mx-auto bg-surface-hover/60 border border-border/50 rounded-[2rem] p-8 text-left animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-60 italic">Your Locked Picks</h4>
                <span className="px-3 py-1 bg-accent/10 text-accent text-[8px] font-black rounded-full uppercase tracking-widest">Sealed</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {prediction.answers.map((ans: any, idx: number) => {
                  const q = match.questions?.find(q => String(q._id) === String(ans.questionId));
                  return (
                    <div key={idx} className="flex justify-between items-center pb-2 border-b border-border/40 group/pick">
                      <span className="text-[10px] font-bold text-text-secondary uppercase opacity-70 group-hover/pick:opacity-100 transition-opacity">{q?.text || `Q${idx + 1}`}</span>
                      <span className="text-[11px] font-black text-text-primary uppercase">{ans.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!isSessionValid && (
            <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <p className="text-amber-600 text-[11px] font-black uppercase tracking-wider italic">An active session is required to record your moves.</p>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest px-8 py-2.5 rounded-xl transition shadow-lg shadow-amber-600/10"
              >
                Authenticate
              </button>
            </div>
          )}
        </div>

        {!isMatchToday(match.startTime) && match.status?.toUpperCase() === "UPCOMING" ? (
          <div className="py-24 text-center bg-background/30 rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
              <Lock className="text-accent opacity-40" size={24} />
            </div>
            <h4 className="text-lg font-black text-text-primary uppercase tracking-tight mb-2">Predictions Sealed</h4>
            <p className="text-text-secondary font-bold tracking-tight max-w-[240px] text-sm">The entry window opens 24 hours before match kickoff.</p>
          </div>
        ) : (
          <div className="space-y-14 relative z-10">
            {match.questions?.map((q, index) => {
              const answerObj = answers.find(a => String(a.questionId) === String(q._id));
              const currentAnswer = (answerObj?.value || "").trim();
              const officialResult = (q.result || "").trim();
              const earnedPoints = answerObj?.points ?? 0;
              const isResolved = match.status?.toUpperCase() === "COMPLETED" && officialResult;

              // Scoring Logic based on User Rules
              const isRunsQuestion = q.text.toLowerCase().includes("total runs");
              const isWinnerQuestion = q.text.toLowerCase().includes("who will win");
              const maxPoints = isRunsQuestion ? 30 : isWinnerQuestion ? 10 : 20;

              const isCorrect = earnedPoints === maxPoints;
              const isPartial = earnedPoints > 0 && earnedPoints < maxPoints;

              const statusColor = isCorrect ? "text-emerald-500" : (isPartial ? "text-amber-500" : "text-rose-500");
              const bgColor = isCorrect ? "bg-emerald-500/5" : (isPartial ? "bg-amber-500/5" : "bg-rose-500/5");
              const borderColor = isCorrect ? "border-emerald-500/20" : (isPartial ? "border-amber-500/20" : "border-rose-500/20");

              return (
                <div key={q._id} className={`space-y-6 group/item p-6 md:p-8 rounded-[2rem] transition-all duration-500 ${isResolved ? `${bgColor} border ${borderColor} shadow-sm` : ""}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-5">
                      <span className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border 
                        ${isResolved
                          ? (isCorrect ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" : isPartial ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-rose-500/20 text-rose-500 border-rose-500/30")
                          : "bg-accent/10 text-accent border-accent/20"}`}>
                        {index + 1}
                      </span>
                      <h3 className={`text-lg font-black leading-tight tracking-tight uppercase transition-colors ${isResolved ? (isCorrect ? "text-emerald-600 dark:text-emerald-400" : isPartial ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400") : "text-text-primary group-hover/item:text-accent"}`}>
                        {q.text}
                      </h3>
                    </div>

                    {isResolved && (
                      <div className="text-right flex flex-col items-end">
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-1 ${isCorrect ? "bg-emerald-500/20 text-emerald-500" : isPartial ? "bg-amber-500/20 text-amber-500" : "bg-rose-500/20 text-rose-500"}`}>
                          {isCorrect ? "Correct" : isPartial ? "Points Gained" : "Incorrect"}
                        </div>
                        <p className={`text-xl font-black ${statusColor} tracking-tighter`}>
                          {earnedPoints}
                          <span className="text-[10px] opacity-40 ml-1 uppercase">Pts</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pl-0 md:pl-16 space-y-4">
                    <div className="relative group/input">
                      {q.type === 'OPTIONS' ? (
                        <PlayerSearchSelect
                          players={q.options}
                          value={currentAnswer}
                          disabled={isPredictionLocked}
                          onChange={(val) => handleAnswerChange(q._id, val)}
                          placeholder="Choose from official options..."
                        />
                      ) : (
                        (() => {
                          const t = q.text.toLowerCase();
                          const isPlayerQ = (t.includes("player") || t.includes("who") || t.includes("man of the match") || t.includes("wicket")) && !t.includes("total") && !t.includes("how many");

                          if (match.players && match.players.length > 0 && isPlayerQ) {
                            return (
                              <PlayerSearchSelect
                                players={match.players}
                                value={currentAnswer}
                                disabled={isPredictionLocked}
                                onChange={(val) => handleAnswerChange(q._id, val)}
                                placeholder="Search from match squads..."
                              />
                            );
                          }
                          return (
                            <input
                              type="text"
                              value={currentAnswer}
                              disabled={isPredictionLocked}
                              onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                              placeholder="Type your unique prediction..."
                              className="w-full bg-background border border-border focus:border-accent rounded-2xl px-6 py-4 text-text-primary text-base font-bold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-accent/5 disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          );
                        })()
                      )}
                    </div>

                    {isResolved && match.status?.toUpperCase() === "COMPLETED" && (
                      <div className={`mt-4 p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-500 
                        ${isCorrect ? "bg-emerald-500/5 border-emerald-500/10" : "bg-rose-500/5 border-rose-500/10"}`}>
                        <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCorrect ? "bg-emerald-500/20" : isPartial ? "bg-amber-500/20" : "bg-rose-500/20"}`}>
                            <Trophy size={16} className={isCorrect ? "text-emerald-500" : isPartial ? "text-amber-500" : "text-rose-500"} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 leading-none mb-1">Official Result</p>
                            <p className={`font-black uppercase tracking-tight ${isCorrect ? "text-emerald-600" : isPartial ? "text-amber-600" : "text-rose-600"}`}>
                              {officialResult}
                            </p>
                          </div>
                        </div>

                        {q.text.toLowerCase().includes("total runs") && (
                          <div className="text-[10px] font-bold text-text-secondary opacity-40 italic">
                            Points = 30 - |{currentAnswer} - {q.result}|
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="pt-10 border-t border-border mt-16 text-center">
              {isPredictionLocked ? (
                <div className="p-8 rounded-[2rem] bg-surface-hover/50 border border-border flex flex-col items-center justify-center space-y-3">
                  <CheckCircle2 className="text-success opacity-40" size={32} />
                  <p className="text-text-primary text-xl font-black uppercase tracking-tight opacity-60">Picks Sealed</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <button
                    type="submit"
                    disabled={isSubmitting || !isSessionValid}
                    className="w-full bg-accent hover:bg-accent-hover text-white font-black text-lg py-5 rounded-[1.5rem] transition-all duration-500 shadow-xl shadow-accent/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 uppercase tracking-widest relative"
                  >
                    {isSubmitting ? "Locking in Arena..." : answers.some(a => a.value) ? "Update My Picks" : "Confirm My Picks"}
                  </button>
                  <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.4em] opacity-30 italic">
                    You can update your entries until 1 minute before kickoff.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </form>

      {showErrorModal && <ErrorModal error={error} onClose={() => setShowErrorModal(false)} />}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-surface border border-border w-full max-w-md rounded-[3rem] p-10 md:p-14 shadow-2xl text-center relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-700">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-success to-accent"></div>

            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-4 ring-success/5">
              <CheckCircle2 className="text-success w-12 h-12" />
            </div>

            <h2 className="text-3xl font-black text-text-primary tracking-tighter uppercase italic mb-4">Entry Locked!</h2>
            <p className="text-text-secondary font-bold tracking-tight mb-8 leading-relaxed">
              Your strategic picks have been successfully recorded in the arena.
              <br /><br />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Evaluations will begin post-match</span>
            </p>

            <div className="flex flex-col items-center space-y-4">
              <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-accent animate-[loading_2.5s_linear_forwards]"></div>
              </div>
              <p className="text-[9px] font-black text-text-secondary uppercase tracking-widest opacity-30">Redirecting to History...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
