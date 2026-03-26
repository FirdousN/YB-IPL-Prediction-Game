"use client";

import { useState, useEffect } from "react";
import { Plus, Settings2, Trash2, List, Filter, ArrowLeft, DownloadCloud, X, Users, Search, Trophy, LayoutDashboard } from "lucide-react";
import PlayerSearchSelect from "@/src/components/PlayerSearchSelect";
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
  result?: string;
  winner?: string;
  teamAScore?: { r: number; w: number; o: string };
  teamBScore?: { r: number; w: number; o: string };
  questions?: any[];
  players?: string[];
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

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    teamA: "",
    teamB: "",
    startTime: "",
    endTime: "",
    venue: "",
    group: "",
    status: "UPCOMING",
    result: "",
    winner: "",
    teamAScore: { r: 0, w: 0, o: "" },
    teamBScore: { r: 0, w: 0, o: "" }
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
        // Sort matches chronologically by default
        const sorted = data.sort((a: Match, b: Match) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setMatches(sorted);
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
          setFixtures(data.data.filter((f: any) => f.matchType !== 'test')); 
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
      const start = new Date(fixture.dateTimeGMT || fixture.date);
      const startLocal = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
      const endLocal = new Date(end.getTime() - end.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

      let matchedTeamAId = "";
      let matchedTeamBId = "";

      if (fixture.teamInfo && fixture.teamInfo.length >= 2) {
        const apiTeamAInfo = fixture.teamInfo[0];
        const apiTeamBInfo = fixture.teamInfo[1];
        const dbTeamA = teams.find(t => t.name.toLowerCase() === apiTeamAInfo.name.toLowerCase() || t.shortName.toLowerCase() === apiTeamAInfo.shortname.toLowerCase());
        if (dbTeamA) matchedTeamAId = dbTeamA._id;
        const dbTeamB = teams.find(t => t.name.toLowerCase() === apiTeamBInfo.name.toLowerCase() || t.shortName.toLowerCase() === apiTeamBInfo.shortname.toLowerCase());
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
        teamA: matchedTeamAId, teamB: matchedTeamBId, startTime: startLocal, endTime: endLocal, venue: fixture.venue || "",
        group: fixture.matchType ? fixture.matchType.toUpperCase() + " SET" : "Cricket Series",
        status: "UPCOMING", result: "", winner: "", teamAScore: { r: 0, w: 0, o: "" }, teamBScore: { r: 0, w: 0, o: "" }
      });

      updateQ1(matchedTeamAId, matchedTeamBId);
      setShowFixturesModal(false);
    } catch (err) { alert("Could not parse fixture properly."); }
  };

  const editMatch = (match: Match) => {
    setFormData({
      teamA: match.teamA._id, teamB: match.teamB._id,
      startTime: new Date(new Date(match.startTime).getTime() - new Date(match.startTime).getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      endTime: new Date(new Date(match.startTime).getTime() + 4 * 60 * 60 * 1000 - new Date(match.startTime).getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      venue: match.venue || "", group: match.group || "", status: match.status || "UPCOMING", result: match.result || "", winner: match.winner || "",
      teamAScore: match.teamAScore || { r: 0, w: 0, o: "" }, teamBScore: match.teamBScore || { r: 0, w: 0, o: "" }
    });

    if (match.questions && match.questions.length > 0) {
      setQuestions(match.questions.map(q => ({ id: q._id || `custom_${Date.now()}_${Math.random()}`, text: q.text, type: q.type, options: q.options || [] })));
    } else {
      setQuestions([...DEFAULT_QUESTIONS]);
      updateQ1(match.teamA._id, match.teamB._id);
    }
    setEditingMatchId(match._id);
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (!formData.teamA || !formData.teamB || !formData.startTime || !formData.endTime) throw new Error("Please fill all required fields.");
      if (formData.teamA === formData.teamB) throw new Error("Team A and Team B cannot be the same.");
      if (questions.length === 0) throw new Error("You must include at least 1 prediction question.");

      const cleanedQuestions = questions.map(q => ({ ...q, options: q.type === "OPTIONS" ? q.options.filter(opt => opt.trim() !== "") : [] }));
      const submitData = { ...formData, questions: cleanedQuestions };

      let res;
      if (editingMatchId) {
        res = await fetch(`/api/admin/matches/${editingMatchId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(submitData) });
      } else {
        res = await fetch("/api/matches", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(submitData) });
      }

      if (res.ok) {
        alert(`Match ${editingMatchId ? 'Updated' : 'Created'} Successfully!`);
        setShowCreateForm(false);
        fetchMatches();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to save match");
      }
    } catch (err: any) { setError(err.message); }
  };

  const deleteMatch = async (id: string) => {
     if (!confirm("Are you sure you want to delete this match?")) return;
     try {
        const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
        if (res.ok) { alert("Match deleted"); fetchMatches(); }
        else alert("Failed to delete match");
     } catch (e) { alert("Delete error"); }
  };

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultFormData, setResultFormData] = useState({
    id: "", teamAName: "", teamBName: "", teamAId: "", teamBId: "", status: "COMPLETED", winner: "", resultText: "",
    teamAScore: { r: 0, w: 0, o: "" }, teamBScore: { r: 0, w: 0, o: "" }, questions: [] as any[], players: [] as string[]
  });

  const openResultModal = (match: Match) => {
    setResultFormData({
      id: match._id, teamAName: match.teamA.name, teamBName: match.teamB.name, teamAId: match.teamA._id, teamBId: match.teamB._id,
      status: match.status, winner: match.winner || "", resultText: match.result || "",
      teamAScore: match.teamAScore || { r: 0, w: 0, o: "" }, teamBScore: match.teamBScore || { r: 0, w: 0, o: "" },
      questions: match.questions?.map(q => ({ _id: q._id, text: q.text, result: q.result || "", type: q.type, options: q.options })) || [],
      players: match.players || []
    });
    setShowResultModal(true);
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/matches/${resultFormData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: resultFormData.status, winner: resultFormData.winner, result: resultFormData.resultText,
          teamAScore: resultFormData.teamAScore, teamBScore: resultFormData.teamBScore, questions: resultFormData.questions
        })
      });
      if (res.ok) { alert("Result updated!"); setShowResultModal(false); fetchMatches(); }
    } catch (e) { alert("Save error"); }
  };

  const filteredMatches = filter === "ALL" ? matches : matches.filter(m => m.status === filter);

  if (showCreateForm) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-background min-h-screen text-text-primary rounded-xl space-y-8 pb-24 relative">
        {showFixturesModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-surface rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden border border-border">
              <div className="p-6 border-b border-border flex justify-between items-center bg-surface-hover/30">
                <div>
                  <h2 className="text-xl font-bold flex items-center"><DownloadCloud className="mr-2 text-blue-500" /> Live Cricket Fixtures</h2>
                  <p className="text-xs text-text-secondary font-medium">Powered by API.CricketData.org</p>
                </div>
                <button onClick={() => setShowFixturesModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-full transition">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-surface-hover/10 custom-scrollbar">
                {loadingFixtures ? (
                  <div className="text-center py-12 font-bold text-text-secondary">Fetching Network Global Fixtures...</div>
                ) : fixtures.length === 0 ? (
                  <div className="text-center py-12 font-bold text-text-secondary">No upcoming matches available.</div>
                ) : (
                  <div className="space-y-3">
                    {fixtures.map((f) => (
                      <button key={f.id} onClick={() => applyFixture(f)} className="w-full text-left bg-surface border border-border rounded-2xl p-4 hover:border-accent hover:shadow-md transition group">
                        <div className="flex justify-between items-start">
                          <h3 className="font-extrabold text-text-primary group-hover:text-accent transition">{f.name}</h3>
                          <span className="text-[10px] uppercase font-black tracking-widest bg-accent/10 text-accent px-2 py-0.5 rounded">{f.matchType}</span>
                        </div>
                        <p className="text-sm font-bold text-text-secondary mt-2 flex items-center">{new Date(f.dateTimeGMT || f.date).toLocaleString()} • {f.venue}</p>
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
            <button onClick={() => setShowCreateForm(false)} className="p-2 bg-surface rounded-full shadow hover:bg-surface-hover transition shrink-0">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-accent tracking-tight">Create Match</h1>
              <p className="text-text-secondary font-medium text-sm">Configure details manually or import directly from API.</p>
            </div>
          </div>
          <button onClick={loadFixtures} className="bg-transparent border-2 border-accent text-accent hover:bg-accent hover:text-white font-bold py-2.5 px-6 rounded-xl transition shadow-sm flex items-center w-full md:w-auto justify-center uppercase tracking-widest text-xs">
            <DownloadCloud size={18} className="mr-2" />
            Fetch Live Fixtures
          </button>
        </div>

        <div className="bg-surface p-8 rounded-3xl shadow-sm border border-border">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-xl font-bold border-b border-border pb-2">Match Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Team A</label>
                  <select name="teamA" value={formData.teamA} onChange={handleTeamChange} className="w-full p-3 rounded-xl border border-border bg-surface-hover focus:ring-2 focus:ring-accent outline-none" required>
                    <option value="">Select Team</option>
                    {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Team B</label>
                  <select name="teamB" value={formData.teamB} onChange={handleTeamChange} className="w-full p-3 rounded-xl border border-border bg-surface-hover focus:ring-2 focus:ring-accent outline-none" required>
                    <option value="">Select Team</option>
                    {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Start Time</label>
                  <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-border bg-surface-hover focus:ring-2 focus:ring-accent outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">End Time</label>
                  <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-border bg-surface-hover focus:ring-2 focus:ring-accent outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Venue</label>
                  <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-border bg-surface-hover focus:ring-2 focus:ring-accent outline-none" placeholder="Stadium, City" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Tournament</label>
                  <input type="text" name="group" value={formData.group} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-border bg-surface-hover focus:ring-2 focus:ring-accent outline-none" placeholder="e.g. IPL 2026" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">Status</label>
                  <select name="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full p-3 rounded-xl border border-border bg-surface-hover focus:ring-2 focus:ring-accent outline-none">
                    {["UPCOMING", "LIVE", "COMPLETED", "ABANDONED"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h2 className="text-xl font-bold">Prediction Form Builder</h2>
                <button type="button" onClick={handleAddQuestion} className="text-sm font-bold text-accent bg-accent/10 px-4 py-2 rounded-lg transition border border-accent/20 flex items-center">
                  <Plus size={16} className="mr-1" /> Add Question
                </button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, i) => (
                  <div key={q.id} className="bg-surface-hover/10 border border-border rounded-2xl p-4 relative">
                    <div className="flex items-start gap-4">
                      <div className="font-black text-text-secondary opacity-20 text-lg mt-1">{i + 1}.</div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" value={q.text} onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)} className="flex-1 p-3 rounded-xl border border-border bg-surface font-bold focus:ring-2 focus:ring-accent outline-none text-text-primary" placeholder="Question text" />
                          <select value={q.type} onChange={(e) => handleQuestionChange(q.id, 'type', e.target.value as any)} className="p-3 rounded-xl border border-border bg-surface font-bold text-accent outline-none">
                            <option value="OPTIONS">Multiple Choice</option>
                            <option value="TEXT">Fill-in (Text/Num)</option>
                          </select>
                        </div>
                        {q.type === "OPTIONS" && (
                          <div className="bg-surface p-3 rounded-xl border border-border">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Answer Options (Comma Separated)</label>
                            <input type="text" value={q.options.join(", ")} onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value.split(",").map(opt => opt.trimStart()))} placeholder="e.g. MI, CSK, Over 200" className="w-full text-sm font-medium p-2 border-b border-border bg-transparent outline-none focus:border-accent text-text-primary transition" />
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => handleRemoveQuestion(q.id)} className="text-text-secondary hover:text-error p-2 bg-surface shadow-sm rounded-xl border border-border transition">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white font-black py-4 rounded-xl transition shadow-xl shadow-accent/20 text-lg uppercase tracking-widest">
                Deploy Match Configuration
              </button>
              {error && <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl mt-4 font-bold text-center">{error}</div>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-background min-h-screen text-text-primary rounded-xl space-y-8 transition-colors duration-500">
      
      {showResultModal && (
        <div className="fixed inset-0 z-50 bg-background/60 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-500">
          <div className="bg-surface rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-surface-hover/30">
              <div>
                <h2 className="text-xl font-bold flex items-center uppercase tracking-tight text-text-primary"><Trophy className="mr-2 text-amber-500" /> Enter Match Result</h2>
                <p className="text-xs text-text-secondary font-bold">{resultFormData.teamAName} vs {resultFormData.teamBName}</p>
              </div>
              <button onClick={() => setShowResultModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-full transition text-text-secondary">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResultSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-text-secondary mb-2">Status</label>
                  <select value={resultFormData.status} onChange={(e) => setResultFormData({ ...resultFormData, status: e.target.value })} className="w-full p-4 rounded-2xl border border-border bg-surface text-text-primary font-bold outline-none focus:border-accent">
                    {["UPCOMING", "LIVE", "COMPLETED", "ABANDONED"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-text-secondary mb-2">Winner</label>
                  <select value={resultFormData.winner} onChange={(e) => setResultFormData({ ...resultFormData, winner: e.target.value })} className="w-full p-4 rounded-2xl border border-border bg-surface text-text-primary font-bold outline-none focus:border-accent">
                    <option value="">No Winner</option>
                    <option value={resultFormData.teamAId}>{resultFormData.teamAName}</option>
                    <option value={resultFormData.teamBId}>{resultFormData.teamBName}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-text-secondary mb-2">Result Text</label>
                <input type="text" value={resultFormData.resultText} onChange={(e) => setResultFormData({ ...resultFormData, resultText: e.target.value })} placeholder="e.g. MI won by 7 wickets" className="w-full p-4 rounded-2xl border border-border bg-surface text-text-primary font-bold focus:border-accent outline-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="bg-surface-hover/40 p-5 rounded-2xl border border-border">
                  <h4 className="text-[10px] font-black uppercase text-accent mb-4">{resultFormData.teamAName} Score</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-text-secondary block mb-1">Runs</label>
                      <input type="number" value={resultFormData.teamAScore.r} onChange={(e) => setResultFormData({ ...resultFormData, teamAScore: { ...resultFormData.teamAScore, r: parseInt(e.target.value) || 0 } })} className="w-full p-3 rounded-xl border border-border bg-surface font-bold text-center text-text-primary" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-secondary block mb-1">Wkts</label>
                      <input type="number" value={resultFormData.teamAScore.w} onChange={(e) => setResultFormData({ ...resultFormData, teamAScore: { ...resultFormData.teamAScore, w: parseInt(e.target.value) || 0 } })} className="w-full p-3 rounded-xl border border-border bg-surface font-bold text-center text-text-primary" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-secondary block mb-1">Overs</label>
                      <input type="text" value={resultFormData.teamAScore.o} onChange={(e) => setResultFormData({ ...resultFormData, teamAScore: { ...resultFormData.teamAScore, o: e.target.value } })} placeholder="0.0" className="w-full p-3 rounded-xl border border-border bg-surface font-bold text-center text-text-primary" />
                    </div>
                  </div>
                </div>
                <div className="bg-surface-hover/40 p-5 rounded-2xl border border-border">
                  <h4 className="text-[10px] font-black uppercase text-accent mb-4">{resultFormData.teamBName} Score</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-text-secondary block mb-1">Runs</label>
                      <input type="number" value={resultFormData.teamBScore.r} onChange={(e) => setResultFormData({ ...resultFormData, teamBScore: { ...resultFormData.teamBScore, r: parseInt(e.target.value) || 0 } })} className="w-full p-3 rounded-xl border border-border bg-surface font-bold text-center text-text-primary" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-secondary block mb-1">Wkts</label>
                      <input type="number" value={resultFormData.teamBScore.w} onChange={(e) => setResultFormData({ ...resultFormData, teamBScore: { ...resultFormData.teamBScore, w: parseInt(e.target.value) || 0 } })} className="w-full p-3 rounded-xl border border-border bg-surface font-bold text-center text-text-primary" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-text-secondary block mb-1">Overs</label>
                      <input type="text" value={resultFormData.teamBScore.o} onChange={(e) => setResultFormData({ ...resultFormData, teamBScore: { ...resultFormData.teamBScore, o: e.target.value } })} placeholder="0.0" className="w-full p-3 rounded-xl border border-border bg-surface font-bold text-center text-text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4 border-t border-border">
                <h4 className="text-[10px] font-black uppercase text-accent mb-2">Detailed Question Results</h4>
                <div className="space-y-4">
                  {resultFormData.questions.map((q, idx) => {
                    const t = q.text.toLowerCase();
                    const isPlayerQ = (t.includes("player") || t.includes("who") || t.includes("man of the match") || t.includes("wicket")) && !t.includes("total") && !t.includes("how many") && !t.includes("win");
                    const isTeamWinnerQ = t.includes("win") && !t.includes("wicket") && !t.includes("run");

                    return (
                      <div key={q._id} className="bg-surface-hover/20 p-4 rounded-xl border border-border">
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">{idx + 1}. {q.text}</label>
                        {q.type === 'OPTIONS' && q.options && q.options.length > 0 ? (
                          <PlayerSearchSelect players={q.options} value={q.result} onChange={(val) => { const newQ = [...resultFormData.questions]; newQ[idx].result = val; setResultFormData({...resultFormData, questions: newQ}); }} placeholder="Select winning option..." />
                        ) : isPlayerQ && resultFormData.players && resultFormData.players.length > 0 ? (
                          <PlayerSearchSelect players={resultFormData.players} value={q.result} onChange={(val) => { const newQ = [...resultFormData.questions]; newQ[idx].result = val; setResultFormData({...resultFormData, questions: newQ}); }} placeholder="Select valid player..." />
                        ) : isTeamWinnerQ ? (
                          <select value={q.result} onChange={(e) => { const newQ = [...resultFormData.questions]; newQ[idx].result = e.target.value; setResultFormData({...resultFormData, questions: newQ}); }} className="w-full p-4 rounded-xl border border-border bg-surface text-text-primary font-bold outline-none focus:border-accent">
                             <option value="">Select winner team...</option>
                             <option value={resultFormData.teamAName}>{resultFormData.teamAName}</option>
                             <option value={resultFormData.teamBName}>{resultFormData.teamBName}</option>
                          </select>
                        ) : (
                          <input type="text" value={q.result} onChange={(e) => { const newQ = [...resultFormData.questions]; newQ[idx].result = e.target.value; setResultFormData({...resultFormData, questions: newQ}); }} placeholder="Enter final correct value..." className="w-full p-4 rounded-xl border border-border bg-surface text-text-primary font-bold" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6 flex flex-col gap-3">
                <button type="submit" className="w-full bg-[#001f3f] hover:bg-blue-900 text-white font-black py-4 rounded-2xl transition shadow-xl text-lg uppercase tracking-wider">Save Partial Results</button>
                <button 
                  type="button" 
                  onClick={async () => {
                     if (!confirm("This will calculate all user points and declare a final match winner. Proceed?")) return;
                     try {
                        await fetch(`/api/admin/matches/${resultFormData.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resultFormData) });
                        const res = await fetch(`/api/admin/matches/${resultFormData.id}/resolve`, { method: "POST" });
                        if (res.ok) { alert(`Match Resolved!`); setShowResultModal(false); fetchMatches(); }
                        else { const data = await res.json(); alert("Error: " + data.error); }
                     } catch (e) { alert("Resolution failed"); }
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 text-white font-black py-4 rounded-2xl transition shadow-xl text-lg uppercase tracking-wider"
                >
                  Calculate & Finalize Scores
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-accent tracking-tight uppercase italic">Match Directory</h1>
          <p className="text-text-secondary font-bold tracking-tight">Manage existing matches and track incoming predictions.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={async () => {
            if (!confirm("Delete all test matches?")) return;
            const res = await fetch("/api/admin/cleanup-dummies", { method: "DELETE" });
            if (res.ok) { alert("Cleanup finished!"); fetchMatches(); }
          }} className="bg-error/10 hover:bg-error/20 text-error border border-error/20 font-bold py-3 px-6 rounded-xl transition flex items-center">
            <Trash2 size={20} className="mr-2" /> Cleanup Test Data
          </button>
          <button onClick={async () => {
            if (!confirm("Sync IPL 2026 fixtures?")) return;
            const res = await fetch("/api/admin/sync-ipl", { method: "POST" });
            if (res.ok) { alert("Sync finished!"); fetchMatches(); }
          }} className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-6 rounded-xl transition flex items-center">
            <DownloadCloud size={20} className="mr-2" /> Sync IPL 2026
          </button>
          <button onClick={() => setShowCreateForm(true)} className="bg-accent hover:bg-accent-hover text-white font-bold py-3 px-6 rounded-xl transition shadow-lg flex items-center uppercase tracking-widest text-[11px]">
            <Plus size={20} className="mr-2" /> Create New Match
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-3xl shadow-sm border border-border p-8 h-full transition-colors">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-xl font-bold flex items-center"><Settings2 className="mr-2 text-accent" size={24} /> Existing Matches</h2>
          <div className="flex bg-surface-hover/50 p-1 rounded-xl border border-border w-full sm:w-auto overflow-x-auto no-scrollbar">
            {(["ALL", "UPCOMING", "LIVE", "COMPLETED"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition flex-1 sm:flex-none whitespace-nowrap ${filter === f ? "bg-surface shadow text-accent" : "text-text-secondary hover:text-text-primary"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center py-12 text-text-secondary font-bold">Loading match repository...</p>
        ) : filteredMatches.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <p className="text-text-secondary font-bold text-lg">No matches found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMatches.map((match) => (
              <div key={match._id} className="bg-surface-hover/10 p-6 rounded-2xl border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-lg transition-all group">
                <div className="flex items-center space-x-5">
                  {match.teamA?.logoUrl && match.teamB?.logoUrl ? (
                    <div className="flex -space-x-4 shrink-0">
                      <img src={match.teamA.logoUrl} className="w-16 h-16 rounded-full border-4 border-surface bg-surface shadow-md object-contain z-10" alt="A" />
                      <img src={match.teamB.logoUrl} className="w-16 h-16 rounded-full border-4 border-surface bg-surface shadow-md object-contain z-0" alt="B" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center font-bold text-sm text-text-secondary shrink-0 border border-border">VS</div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-text-primary text-xl tracking-tight uppercase italic">
                      {match.teamA?.name || 'Unknown'} <span className="text-text-secondary opacity-40 italic font-semibold px-2 tracking-tighter">vs</span> {match.teamB?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm font-bold text-text-secondary mt-1 flex items-center tracking-tight">
                      {new Date(match.startTime).toLocaleString()}
                      <span className={`ml-3 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-black tracking-widest ${match.status === 'LIVE' ? 'bg-error/10 text-error animate-pulse' : match.status === 'COMPLETED' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'}`}>
                        {match.status}
                      </span>
                    </p>
                    <p className="text-xs font-bold text-text-secondary opacity-40 mt-1 uppercase tracking-widest">{match.venue} • {match.group}</p>
                  </div>
                </div>
                <div className="flex w-full md:w-auto space-x-3 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-border flex-wrap gap-y-2">
                  <button onClick={async () => {
                    if (!confirm("Fetch real squads?")) return;
                    const res = await fetch(`/api/admin/matches/${match._id}/players`, { method: 'POST' });
                    if (res.ok) alert(`Fetched successfully!`);
                  }} className="px-4 py-3 border border-border text-text-secondary hover:text-accent hover:border-accent rounded-xl hover:bg-surface transition transition shadow-sm font-bold flex items-center">
                    <Users size={16} className="mr-2" /> Players
                  </button>
                  <button onClick={() => editMatch(match)} className="px-4 py-3 border border-border text-text-secondary hover:text-accent hover:border-accent rounded-xl hover:bg-surface transition font-black text-[10px] uppercase tracking-widest flex items-center">
                    <Settings2 size={16} className="mr-2" /> Edit
                  </button>
                  <button onClick={() => openResultModal(match)} className="px-4 py-3 border border-border text-text-secondary hover:text-amber-500 hover:border-amber-500 rounded-xl hover:bg-surface transition font-black text-[11px] uppercase tracking-widest flex items-center">
                    <Trophy size={16} className="mr-2" /> Result
                  </button>
                  <Link href={`/admin/matches/${match._id}`} className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-black text-[11px] uppercase tracking-widest rounded-xl transition flex items-center justify-center shadow-lg shadow-accent/10">Predictions</Link>
                  <button onClick={() => deleteMatch(match._id)} className="px-3 py-3 border border-border text-text-secondary hover:text-error hover:border-error rounded-xl hover:bg-surface transition shadow-sm"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
