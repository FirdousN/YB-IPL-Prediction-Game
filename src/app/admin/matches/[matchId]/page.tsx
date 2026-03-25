"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Users, Calendar, MapPin, Search } from "lucide-react";
import Link from "next/link";

interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
}

interface Match {
  _id: string;
  teamA: Team;
  teamB: Team;
  startTime: string;
  status: string;
  venue?: string;
  group?: string;
  questions?: any[];
}

interface Prediction {
  _id: string;
  userId: {
     _id: string;
     name: string;
     email: string;
     participantId: string;
  };
  answers: { questionId: string; value: string }[];
  predictedAt: string;
}

export default function AdminMatchPredictionsPage({ params }: { params: Promise<{ matchId: string }> }) {
  const resolvedParams = use(params);
  const [match, setMatch] = useState<Match | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchRes, predRes] = await Promise.all([
          fetch(`/api/matches/${resolvedParams.matchId}`),
          fetch(`/api/admin/matches/${resolvedParams.matchId}/predictions`)
        ]);

        if (!matchRes.ok) throw new Error("Failed to load match details");
        const matchData = await matchRes.json();
        setMatch(matchData);

        if (predRes.ok) {
          const predData = await predRes.json();
          setPredictions(predData);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [resolvedParams.matchId]);

  if (loading) return <div className="p-8 text-slate-500 font-bold text-center">Loading Prediction Roster...</div>;
  if (error || !match) return <div className="p-8 text-red-500 font-bold text-center">{error || "Match not found"}</div>;

  const filteredPredictions = predictions.filter(p => 
    p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userId?.participantId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 dark:bg-[#001f3f] min-h-screen text-gray-800 dark:text-gray-200 rounded-xl space-y-8 pb-24">
      
      <div className="flex items-center space-x-4">
        <Link href="/admin/matches" className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-slate-100 dark:hover:bg-gray-700 transition">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-blue-600 tracking-tight">Prediction Roster</h1>
          <p className="text-slate-500 font-medium">Review all user submissions for this match.</p>
        </div>
      </div>

      {/* Match Overview Card */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center space-x-6 flex-1 min-w-0">
           {match.teamA?.logoUrl && match.teamB?.logoUrl ? (
              <div className="flex items-center space-x-4 shrink-0">
                 <img src={match.teamA.logoUrl} className="w-20 h-20 shrink-0 rounded-full shadow-lg border-4 border-slate-100 bg-white object-contain p-1" alt="A" />
                 <span className="text-2xl shrink-0 font-black text-slate-300 dark:text-gray-500 flex-shrink-0 italic">VS</span>
                 <img src={match.teamB.logoUrl} className="w-20 h-20 shrink-0 rounded-full shadow-lg border-4 border-slate-100 bg-white object-contain p-1" alt="B" />
              </div>
           ) : (
             <div className="text-4xl font-black shrink-0 text-slate-800 dark:text-gray-200">
                {match.teamA?.shortName} vs {match.teamB?.shortName}
             </div>
           )}
           
           <div className="hidden md:block min-w-0 flex-1">
             <h2 className="text-2xl font-black text-[#001f3f] dark:text-gray-100 truncate">{match.teamA?.name} vs {match.teamB?.name}</h2>
             <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 font-medium">
                <span className="flex items-center whitespace-nowrap"><Calendar size={16} className="mr-1"/> {new Date(match.startTime).toLocaleDateString()}</span>
                <span className="flex items-center whitespace-nowrap max-w-full truncate"><MapPin size={16} className="mr-1 shrink-0"/> <span className="truncate">{match.venue || 'TBD'}</span></span>
                <span className={`px-2 py-0.5 rounded uppercase font-black tracking-widest text-[10px] shrink-0 ${match.status === 'LIVE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {match.status}
                </span>
             </div>
           </div>
        </div>
        
        <div className="text-center bg-blue-50 dark:bg-gray-900 border border-blue-100 dark:border-gray-700 p-6 rounded-2xl min-w-[200px]">
           <div className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center justify-center">
             <Users size={16} className="mr-2" /> Total Entries
           </div>
           <div className="text-5xl font-black text-blue-600">
             {predictions.length}
           </div>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        
        <div className="p-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
           <h2 className="text-xl font-bold text-[#001f3f] dark:text-gray-200">Submitted Answers</h2>
           <div className="relative w-full sm:w-auto">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search players..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full sm:w-80 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
             />
           </div>
        </div>

        {filteredPredictions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">
             No predictions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Player</th>
                  {match.questions?.map((q, i) => (
                    <th key={q._id} className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest max-w-[200px] truncate" title={q.text}>
                       Q{i + 1}. {q.text}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredPredictions.map(pred => (
                  <tr key={pred._id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition whitespace-nowrap">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#001f3f] dark:text-gray-200">{pred.userId?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500">{pred.userId?.email}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-1">{pred.userId?.participantId}</div>
                    </td>
                    
                    {match.questions?.map((q) => {
                      const answer = pred.answers.find(a => String(a.questionId) === String(q._id))?.value || "-";
                      return (
                         <td key={q._id} className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                           <div className="truncate max-w-[150px]" title={answer}>{answer}</div>
                         </td>
                      );
                    })}
                    
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                      {new Date(pred.predictedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
