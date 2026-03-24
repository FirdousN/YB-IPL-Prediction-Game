"use client";

import { useState, useEffect } from "react";
import { Plus, Settings2, Trash2, List, Filter, ArrowLeft, DownloadCloud, X } from "lucide-react";
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

interface QuestionForm {
  id: string;
  text: string;
  type: "OPTIONS" | "TEXT";
  options: string[];
}

interface ApiFixture {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  teamInfo?: { name: string; shortname: string }[];
}

const DEFAULT_QUESTIONS: QuestionForm[] = [
  { id: "q1", text: "Who will win the match?", type: "OPTIONS", options: [] },
  { id: "q2", text: "Who will score the most runs in this match?", type: "TEXT", options: [] },
  { id: "q3", text: "Who will take the most wickets in this match?", type: "TEXT", options: [] },
  { id: "q4", text: "Total runs scored by the winning team?", type: "TEXT", options: [] },
  { id: "q5", text: "Player / Man of the Match?", type: "TEXT", options: [] }
];

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "LIVE" | "COMPLETED">("ALL");
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFixturesModal, setShowFixturesModal] = useState(false);
  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);

  const [formData, setFormData] = useState({
    teamA: "",
    teamB: "",
    startTime: "",
    endTime: "",
    venue: "",
    group: ""
  });

  const [questions, setQuestions] = useState<QuestionForm[]>([...DEFAULT_QUESTIONS]);

  useEffect(() => {
    fetchMatches();
    fetchTeams();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/matches");
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch {
      console.error("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      if (res.ok) setTeams(await res.json());
    } catch {
      console.error("Failed to load teams");
    }
  };

  const loadFixtures = async () => {
    setLoadingFixtures(true);
    setShowFixturesModal(true);
    try {
      const res = await fetch("/api/admin/fetch-fixtures");
      if (res.ok) {
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
           setFixtures(data.data.filter((f: any) => f.matchType !== 'test')); // Filter out Test matches for cleaner lists initially if preferred, but we show all for now
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to fetch actual fixtures.");
      }
    } catch (err: any) {
      alert("Error contacting fixture API");
    } finally {
      setLoadingFixtures(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    updateQ1(name === "teamA" ? value : formData.teamA, name === "teamB" ? value : formData.teamB);
  };

  const updateQ1 = (effectiveTeamAId: string, effectiveTeamBId: string) => {
    setTimeout(() => {
      setQuestions(prevQ => {
         const newQ = [...prevQ];
         const q1Index = newQ.findIndex(q => q.id === "q1");
         if (q1Index !== -1 && newQ[q1Index].type === "OPTIONS") {
            const teamAObj = teams.find(t => t._id === effectiveTeamAId);
            const teamBObj = teams.find(t => t._id === effectiveTeamBId);
            newQ[q1Index].options = [teamAObj?.name || "", teamBObj?.name || ""].filter(Boolean);
         }
         return newQ;
      });
    }, 0);
  };

  const handleQuestionChange = (id: string, field: keyof QuestionForm, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleAddQuestion = () => {
    const newId = `custom_${Date.now()}`;
    setQuestions([...questions, { id: newId, text: "New Custom Question?", type: "TEXT", options: [] }]);
  };

  const applyFixture = (fixture: ApiFixture) => {
     try {
       // Format dates for datetime-local (YYYY-MM-DDTHH:mm)
       const start = new Date(fixture.dateTimeGMT || fixture.date);
       const startLocal = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
       
       // Default end time to 4 hours later
       const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
       const endLocal = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

       let matchedTeamAId = "";
       let matchedTeamBId = "";

       // Attempt auto-matching Team IDs from the DB using names or shortnames
       if (fixture.teamInfo && fixture.teamInfo.length >= 2) {
          const apiTeamAInfo = fixture.teamInfo[0];
          const apiTeamBInfo = fixture.teamInfo[1];
          
          const dbTeamA = teams.find(t => 
             t.name.toLowerCase() === apiTeamAInfo.name.toLowerCase() || 
             t.shortName.toLowerCase() === apiTeamAInfo.shortname.toLowerCase()
          );
          if (dbTeamA) matchedTeamAId = dbTeamA._id;

          const dbTeamB = teams.find(t => 
             t.name.toLowerCase() === apiTeamBInfo.name.toLowerCase() || 
             t.shortName.toLowerCase() === apiTeamBInfo.shortname.toLowerCase()
          );
          if (dbTeamB) matchedTeamBId = dbTeamB._id;
       } else if (fixture.teams && fixture.teams.length >= 2) {
          const apiTeamA = fixture.teams[0];
          const apiTeamB = fixture.teams[1];
          
          const dbTeamA = teams.find(t => t.name.toLowerCase().includes(apiTeamA.toLowerCase()) || apiTeamA.toLowerCase().includes(t.name.toLowerCase()));
          if (dbTeamA) matchedTeamAId = dbTeamA._id;

          const dbTeamB = teams.find(t => t.name.toLowerCase().includes(apiTeamB.toLowerCase()) || apiTeamB.toLowerCase().includes(t.name.toLowerCase()));
          if (dbTeamB) matchedTeamBId = dbTeamB._id;
       }

       setFormData({
         teamA: matchedTeamAId,
         teamB: matchedTeamBId,
         startTime: startLocal,
         endTime: endLocal,
         venue: fixture.venue || "",
         group: fixture.matchType ? fixture.matchType.toUpperCase() + " SET" : "Cricket Series"
       });

       updateQ1(matchedTeamAId, matchedTeamBId);
       setShowFixturesModal(false);
     } catch (err) {
       console.error("Fixture parsing failed:", err);
       alert("Could not parse fixture properly. Please fill details manually.");
     }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (!formData.teamA || !formData.teamB || !formData.startTime || !formData.endTime) {
        throw new Error("Please fill all required fields, including Teams and Dates.");
      }
      if (formData.teamA === formData.teamB) {
        throw new Error("Team A and Team B cannot be the same.");
      }
      if (questions.length === 0) {
        throw new Error("You must include at least 1 prediction question.");
      }

      const cleanedQuestions = questions.map(q => ({
        ...q,
        options: q.type === "OPTIONS" ? q.options.filter(opt => opt.trim() !== "") : []
      }));

      const submitData = { ...formData, questions: cleanedQuestions };

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        alert("Match Created Successfully!");
        setFormData({ teamA: "", teamB: "", startTime: "", endTime: "", venue: "", group: "" });
        setQuestions([...DEFAULT_QUESTIONS]);
        setShowCreateForm(false);
        fetchMatches();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to create match");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteMatch = async (id: string) => {
     alert("Archive/Delete functionality pending endpoint build.");
  };

  const filteredMatches = filter === "ALL" ? matches : matches.filter(m => m.status === filter);

  if (showCreateForm) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-gray-50 dark:bg-[#001f3f] min-h-screen text-gray-800 dark:text-gray-200 rounded-xl space-y-8 pb-24 relative">
        
        {/* FIXTURE MODAL COMPONENT */}
        {showFixturesModal && (
           <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 dark:border-gray-700">
                 <div className="p-6 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-900">
                    <div>
                      <h2 className="text-xl font-bold flex items-center"><DownloadCloud className="mr-2 text-blue-500" /> Live Cricket Fixtures</h2>
                      <p className="text-xs text-slate-500 font-medium">Powered by API.CricketData.org</p>
                    </div>
                    <button onClick={() => setShowFixturesModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-full transition">
                       <X size={20} />
                    </button>
                 </div>
                 <div className="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-gray-800 custom-scrollbar">
                    {loadingFixtures ? (
                      <div className="text-center py-12 font-bold text-slate-400">Fetching Network Global Fixtures...</div>
                    ) : fixtures.length === 0 ? (
                      <div className="text-center py-12 font-bold text-slate-400">No upcoming matches available.</div>
                    ) : (
                      <div className="space-y-3">
                         {fixtures.map((f) => (
                           <button 
                             key={f.id} 
                             onClick={() => applyFixture(f)}
                             className="w-full text-left bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-2xl p-4 hover:border-blue-500 hover:shadow-md transition group"
                           >
                              <div className="flex justify-between items-start">
                                <h3 className="font-extrabold text-[#001f3f] dark:text-gray-100 group-hover:text-blue-600 transition">{f.name}</h3>
                                <span className="text-[10px] uppercase font-black tracking-widest bg-blue-100 text-blue-600 px-2 py-0.5 rounded">{f.matchType}</span>
                              </div>
                              <p className="text-sm font-bold text-slate-500 mt-2 flex items-center">{new Date(f.dateTimeGMT || f.date).toLocaleString()} • {f.venue}</p>
                           </button>
                         ))}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
           <div className="flex items-center space-x-4 w-full md:w-auto">
              <button title="Go Back" onClick={() => setShowCreateForm(false)} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow hover:bg-slate-100 transition shrink-0">
                 <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-black text-blue-600 tracking-tight">Create Match</h1>
                <p className="text-slate-500 font-medium text-sm">Configure details manually or import directly from API.</p>
              </div>
           </div>
           
           <button onClick={loadFixtures} className="bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold py-2.5 px-6 rounded-xl transition shadow-sm flex items-center w-full md:w-auto justify-center">
              <DownloadCloud size={18} className="mr-2 fill-current opacity-50" />
              Fetch Live Fixtures
           </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700">
           <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="space-y-6">
                 <h2 className="text-xl font-bold border-b pb-2 dark:border-gray-600">Match Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                         Team A
                         {formData.teamA === "" && <span className="text-red-400 text-[10px]">*Required DB Object</span>}
                      </label>
                      <select name="teamA" value={formData.teamA} onChange={handleTeamChange} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" required>
                        <option value="">Select Team</option>
                        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
                         Team B
                         {formData.teamB === "" && <span className="text-red-400 text-[10px]">*Required DB Object</span>}
                      </label>
                      <select name="teamB" value={formData.teamB} onChange={handleTeamChange} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" required>
                        <option value="">Select Team</option>
                        {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Start Time</label>
                      <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">End Time</label>
                      <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Venue</label>
                      <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Stadium, City" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Tournament</label>
                      <input type="text" name="group" value={formData.group} onChange={handleInputChange} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. IPL 2026" />
                    </div>
                  </div>
              </div>

              {/* Questions Builder */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center border-b pb-2 dark:border-gray-600">
                    <h2 className="text-xl font-bold">Prediction Form Builder</h2>
                    <button type="button" onClick={handleAddQuestion} className="text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition border border-blue-200 shadow-sm flex items-center">
                       <Plus size={16} className="mr-1"/> Add Question
                    </button>
                 </div>
                 
                 <div className="space-y-4 max-h-[500px] overflow-y-auto overflow-x-hidden pr-2">
                    {questions.map((q, i) => (
                      <div key={q.id} className="bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-600 rounded-2xl p-4 relative group">
                         <div className="flex items-start gap-4">
                            <div className="font-black text-slate-300 dark:text-slate-600 text-lg mt-1">{i + 1}.</div>
                            <div className="flex-1 space-y-3">
                              
                              <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                   type="text" 
                                   value={q.text} 
                                   onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)}
                                   className="flex-1 p-3 rounded-xl border border-slate-300 dark:bg-gray-800 dark:border-gray-600 font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
                                   placeholder="Question text (e.g., Who will win?)"
                                />
                                <select 
                                  value={q.type}
                                  onChange={(e) => handleQuestionChange(q.id, 'type', e.target.value)}
                                  className="p-3 rounded-xl border border-slate-300 dark:bg-gray-800 dark:border-gray-600 font-bold bg-white text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                  <option value="OPTIONS">Multiple Choice</option>
                                  <option value="TEXT">Fill-in (Text/Num)</option>
                                </select>
                              </div>

                              {q.type === "OPTIONS" && (
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-blue-100 dark:border-gray-700">
                                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Answer Options (Comma Separated)</label>
                                  <input 
                                     type="text"
                                     value={q.options.join(", ")}
                                     onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value.split(",").map(opt => opt.trimStart()))}
                                     placeholder="e.g. India, Australia, Over 200"
                                     className="w-full text-sm font-medium p-2 border-b-2 border-slate-200 dark:border-gray-700 focus:border-blue-500 bg-transparent outline-none transition"
                                  />
                                </div>
                              )}
                            </div>
                            <button type="button" onClick={() => handleRemoveQuestion(q.id)} className="text-slate-300 hover:text-red-500 p-2 bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-slate-200 dark:border-gray-700 transition">
                               <Trash2 size={20} />
                            </button>
                         </div>
                      </div>
                    ))}
                    {questions.length === 0 && (
                      <div className="p-8 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-2xl">
                        No questions added. You must add at least one question.
                      </div>
                    )}
                 </div>
              </div>

              <div className="pt-6 border-t dark:border-gray-700">
                <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-black py-4 rounded-xl transition shadow-xl shadow-blue-500/20 text-lg">
                  Deploy Match Configuration
                </button>
                {error && <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl mt-4 font-bold text-center">{error}</div>}
              </div>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 dark:bg-[#001f3f] min-h-screen text-gray-800 dark:text-gray-200 rounded-xl space-y-8">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-blue-600 tracking-tight">Match Directory</h1>
          <p className="text-slate-500 font-medium">Manage existing matches and track incoming predictions.</p>
        </div>
        <button 
           onClick={() => setShowCreateForm(true)}
           className="bg-[#001f3f] hover:bg-blue-900 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Create New Match
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200 p-8 h-full">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h2 className="text-xl font-bold flex items-center">
               <Settings2 className="mr-2" size={24} /> Existing Matches
            </h2>
            
            <div className="flex bg-slate-100 dark:bg-gray-900 p-1 rounded-xl border border-slate-200 dark:border-gray-700 w-full sm:w-auto overflow-x-auto no-scrollbar">
               {(["ALL", "UPCOMING", "LIVE", "COMPLETED"] as const).map(f => (
                 <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition flex-1 sm:flex-none whitespace-nowrap ${filter === f ? "bg-white dark:bg-gray-700 shadow text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                 >
                   {f}
                 </button>
               ))}
            </div>
        </div>
        
        {loading ? (
          <p className="text-center py-12 text-slate-500 font-bold">Loading match repository...</p>
        ) : filteredMatches.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <p className="text-slate-500 font-bold text-lg">No matches found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div key={match._id} className="bg-white dark:bg-gray-700 p-6 rounded-2xl border border-slate-200 dark:border-gray-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-lg transition group">
                
                <div className="flex items-center space-x-5">
                  {match.teamA?.logoUrl && match.teamB?.logoUrl ? (
                     <div className="flex -space-x-4 shrink-0">
                        <img src={match.teamA.logoUrl} className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-md object-contain z-10" alt="A" />
                        <img src={match.teamB.logoUrl} className="w-16 h-16 rounded-full border-4 border-white bg-white shadow-md object-contain z-0" alt="B" />
                     </div>
                  ) : (
                     <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-400 shrink-0 border border-slate-200">VS</div>
                  )}
                  
                  <div>
                    <h3 className="font-extrabold text-[#001f3f] text-xl tracking-tight">
                      {match.teamA?.name || 'Unknown'} <span className="text-slate-300 italic font-semibold px-1">vs</span> {match.teamB?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm font-bold text-slate-500 mt-1 flex items-center">
                      {new Date(match.startTime).toLocaleString()}
                      <span className={`ml-3 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest ${match.status === 'LIVE' ? 'bg-red-100 text-red-600 animate-pulse' : match.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {match.status}
                      </span>
                    </p>
                    <p className="text-xs font-semibold text-slate-400 mt-1">{match.venue} • {match.group}</p>
                  </div>
                </div>
                
                <div className="flex w-full md:w-auto space-x-3 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <Link href={`/admin/matches/${match._id}`} className="flex-1 md:flex-none text-center px-6 py-3 bg-[#001f3f] hover:bg-blue-900 text-white font-bold text-sm rounded-xl transition flex items-center justify-center shadow-md">
                     <List size={18} className="mr-2" />
                     Predictions
                  </Link>
                  <button onClick={() => deleteMatch(match._id)} className="px-4 py-3 border-2 border-slate-100 text-slate-400 group-hover:text-red-500 group-hover:border-red-100 rounded-xl hover:bg-red-50 transition shadow-sm">
                    <Trash2 size={20} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
