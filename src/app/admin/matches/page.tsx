"use client";

import { useState, useEffect } from "react";
import { Plus, Settings2, Trash2, List, Filter, ArrowLeft, DownloadCloud, X, Users, Search, Trophy, LayoutDashboard, Archive, ArchiveRestore, Lock } from "lucide-react";
import PlayerSearchSelect from "@/src/components/PlayerSearchSelect";
import ErrorModal from "@/src/components/ErrorModal";
import SuccessModal from "@/src/components/SuccessModal";
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
  endTime?: string;
  status: string;
  venue?: string;
  group?: string;
  result?: string;
  winner?: string;
  teamAScore?: { r: number; w: number; o: string };
  teamBScore?: { r: number; w: number; o: string };
  questions?: any[];
  players?: string[];
  isArchived?: boolean;
  hasPredictions?: boolean;
}

interface QuestionForm {
  id: string;
  text: string;
  type: "OPTIONS" | "TEXT";
  options: string[];
  points: number;
  ruleType: "EXACT" | "NEAREST";
  maxRange?: number;
  unit: "RUNS" | "PLAYER" | "TEAM" | "WICKETS" | "BOUNDARIES" | "OVERS" | "NONE";
  result?: string;
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
  { id: "q1", text: "Who will win the match?", type: "OPTIONS", options: [], points: 20, ruleType: "EXACT", unit: "TEAM", result: "" },
  { id: "q2", text: "Who will score the most runs in this match?", type: "TEXT", options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", result: "" },
  { id: "q3", text: "Who will take the most wickets in this match?", type: "TEXT", options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", result: "" },
  { id: "q4", text: "Total runs scored by the winning team?", type: "TEXT", options: [], points: 30, ruleType: "NEAREST", maxRange: 30, unit: "RUNS", result: "" },
  { id: "q5", text: "Player / Man of the Match?", type: "TEXT", options: [], points: 20, ruleType: "EXACT", unit: "PLAYER", result: "" }
];

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UPCOMING" | "LIVE" | "COMPLETED" | "ARCHIVED">("ALL");
  const [dbDefaultQuestions, setDbDefaultQuestions] = useState<QuestionForm[]>([]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFixturesModal, setShowFixturesModal] = useState(false);
  const [fixtures, setFixtures] = useState<ApiFixture[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);

  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editingHasPredictions, setEditingHasPredictions] = useState(false);

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
    teamBScore: { r: 0, w: 0, o: "" },
    isArchived: false
  });

  const [statusConflict, setStatusConflict] = useState<{
    newStatus: string;
    computedStatus: string;
    source: 'FORM' | 'RESULT';
    startTime?: string;
    endTime?: string;
  } | null>(null);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const getComputedStatus = (startTime: string, endTime: string, currentStatus: string) => {
    const now = new Date();
    if (!startTime) return 'UPCOMING';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + 4 * 60 * 60 * 1000);

    if (currentStatus === 'COMPLETED' || currentStatus === 'ABANDONED') return currentStatus;
    if (now >= start && now < end) return 'LIVE';
    if (now >= end) return 'COMPLETED';
    return 'UPCOMING';
  };

  const handleStatusChange = (newStatus: string, source: 'FORM' | 'RESULT') => {
    if (source === 'FORM') setFormData({ ...formData, status: newStatus as any });
    else setResultFormData({ ...resultFormData, status: newStatus as any });
  };

  const [questions, setQuestions] = useState<QuestionForm[]>([...DEFAULT_QUESTIONS]);

  useEffect(() => {
    fetchMatches();
    fetchTeams();
    fetchDefaultQuestions();
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

  const fetchDefaultQuestions = async () => {
    try {
      const res = await fetch("/api/admin/default-questions");
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map((q: any) => ({
          id: q._id || `default_${Math.random()}`,
          text: q.text,
          type: q.type,
          options: q.options || [],
          points: q.points || 20,
          ruleType: q.ruleType || "EXACT",
          maxRange: q.maxRange || 30,
          unit: q.unit || "NONE",
          result: ""
        }));
        setDbDefaultQuestions(formatted);
      }
    } catch (error) {
      console.error("Failed to fetch default questions", error);
    }
  };

  const seedDefaultQuestions = async () => {
    try {
      const res = await fetch("/api/admin/default-questions", { method: "POST" });
      if (res.ok) {
        alert("Default questions seeded successfully!");
        fetchDefaultQuestions();
      }
    } catch (error) {
      alert("Failed to seed default questions");
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
        const q1Index = newQ.findIndex(q => q.id === "q1" || q.text.toLowerCase().includes("who will win the match"));
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
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleAddQuestion = () => {
    const newId = `custom_${Date.now()}_${Math.random()}`;
    setQuestions(prev => [...prev, { 
      id: newId, 
      text: "Enter your question here...", 
      type: "TEXT", 
      options: [], 
      points: 20, 
      ruleType: "EXACT", 
      unit: "NONE", 
      result: "" 
    }]);
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
        status: "UPCOMING", result: "", winner: "", teamAScore: { r: 0, w: 0, o: "" }, teamBScore: { r: 0, w: 0, o: "" },
        isArchived: false
      });

      updateQ1(matchedTeamAId, matchedTeamBId);
      setShowFixturesModal(false);
    } catch (err) { alert("Could not parse fixture properly."); }
  };

  // Edit match
  const editMatch = (match: Match) => {
    setFormData({
      teamA: match.teamA._id, teamB: match.teamB._id,
      startTime: new Date(new Date(match.startTime).getTime() - new Date(match.startTime).getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      endTime: new Date(new Date(match.startTime).getTime() + 4 * 60 * 60 * 1000 - new Date(match.startTime).getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      venue: match.venue || "", group: match.group || "", status: match.status || "UPCOMING", result: match.result || "", winner: match.winner || "",
      teamAScore: match.teamAScore || { r: 0, w: 0, o: "" }, teamBScore: match.teamBScore || { r: 0, w: 0, o: "" },
      isArchived: match.isArchived || false
    });
    setEditingHasPredictions(!!match.hasPredictions);

    if (match.questions && match.questions.length > 0) {
      setQuestions(match.questions.map(q => ({
        id: String(q._id),
        text: q.text,
        type: q.type,
        options: q.options || [],
        points: q.points ?? 20,
        ruleType: q.ruleType || "EXACT",
        maxRange: q.maxRange ?? 30,
        unit: q.unit || "NONE",
        result: q.result || ""
      })));
    } else {
      setQuestions(dbDefaultQuestions.length > 0 ? [...dbDefaultQuestions] : [...DEFAULT_QUESTIONS]);
      updateQ1(match.teamA._id, match.teamB._id);
    }
    setEditingMatchId(match._id);
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.teamA || !formData.teamB || !formData.startTime || !formData.endTime) {
        throw new Error("Please fill all required fields.");
      }
      if (formData.teamA === formData.teamB) {
        throw new Error("Team A and Team B cannot be the same.");
      }

      const currentQuestions = questions;
      if (!currentQuestions || currentQuestions.length === 0) {
        throw new Error("You must include at least 1 prediction question.");
      }

      // Check for empty question text
      const emptyQuestion = currentQuestions.find(q => !q.text || q.text.trim() === "");
      if (emptyQuestion) {
        throw new Error("All questions must have text.");
      }

      const cleanedQuestions = currentQuestions.map(q => {
        const base = {
          text: q.text,
          type: q.type,
          options: q.type === "OPTIONS"
            ? q.options.filter(opt => opt.trim() !== "")
            : [],
          points: q.points,
          ruleType: q.ruleType,
          maxRange: q.ruleType === "NEAREST" ? q.maxRange : undefined,
          unit: q.unit,
          result: q.result
        };

        // CREATE
        if (!editingMatchId) return base;

        // UPDATE
        if (q.id && q.id.length === 24) {
          return { _id: q.id, ...base };
        }

        // NEW QUESTION in edit
        return base;
      });

      const submitData = { ...formData, questions: cleanedQuestions };

      const url = editingMatchId ? `/api/admin/matches/${editingMatchId}` : "/api/admin/matches";
      const method = editingMatchId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(submitData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong while saving the match.");
      }

      setModalMessage("Match saved successfully!");
      setShowSuccessModal(true);
      setShowCreateForm(false);
      fetchMatches();
    } catch (err: any) {
      setModalMessage(err.message || "Something went wrong");
      setShowErrorModal(true);
    }
  };

  const toggleArchive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/matches/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !currentStatus })
      });
      if (res.ok) { fetchMatches(); }
      else alert("Failed to toggle archive status");
    } catch (e) { alert("Archive error"); }
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
    teamAScore: { r: 0, w: 0, o: "" }, teamBScore: { r: 0, w: 0, o: "" }, questions: [] as any[], players: [] as string[],
    startTime: "", endTime: ""
  });

  const openResultModal = (match: Match) => {
    setResultFormData({
      id: match._id, teamAName: match.teamA.name, teamBName: match.teamB.name, teamAId: match.teamA._id, teamBId: match.teamB._id,
      status: match.status, winner: match.winner || "", resultText: match.result || "",
      teamAScore: match.teamAScore || { r: 0, w: 0, o: "" }, teamBScore: match.teamBScore || { r: 0, w: 0, o: "" },
      questions: match.questions?.map(q => ({ ...q, result: q.result || "" })) || [],
      players: match.players || [],
      startTime: match.startTime, endTime: match.endTime || ""
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
          teamAScore: resultFormData.teamAScore, teamBScore: resultFormData.teamBScore, 
          questionResults: resultFormData.questions.map(q => ({
            _id: q._id,
            result: q.result
          }))
        })
      });
      if (res.ok) { alert("Result updated!"); setShowResultModal(false); fetchMatches(); }
    } catch (e) { alert("Save error"); }
  };

  const filteredMatches = matches.filter(m => {
    if (filter === "ARCHIVED") return m.isArchived === true;
    if (m.isArchived) return false; // Hide archived matches from other tabs
    return filter === "ALL" ? true : m.status === filter;
  });

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
                  <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-border bg-surface-hover focus:ring-2 focus://ring-accent outline-none" required />
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
                  <select name="status" value={formData.status} onChange={(e) => handleStatusChange(e.target.value, 'FORM')} className="w-full p-3 rounded-xl border border-border bg-surface-hover focus:ring-2 focus:ring-accent outline-none">
                    {["UPCOMING", "LIVE", "COMPLETED", "ABANDONED"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 gap-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">Prediction Form Builder</h2>
                  {editingHasPredictions && (
                    <p className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg inline-flex items-center uppercase tracking-widest animate-pulse border border-amber-500/20">
                      <Lock size={12} className="mr-1.5" /> Rules & points locked after predictions started
                    </p>
                  )}
                </div>
                {!editingHasPredictions && (
                  <button type="button" onClick={handleAddQuestion} className="w-full sm:w-auto text-sm font-bold text-accent bg-accent/10 px-6 py-3 rounded-xl transition border border-accent/20 flex items-center justify-center">
                    <Plus size={18} className="mr-2" /> Add Question
                  </button>
                )}
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, i) => (
                  <div key={q.id} className="bg-surface-hover/10 border border-border rounded-2xl p-4 relative">
                    <div className="flex items-start gap-4">
                      <div className="font-black text-text-secondary opacity-20 text-lg mt-1">{i + 1}.</div>
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" value={q.text} onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)} disabled={editingHasPredictions} className={`flex-1 p-3 rounded-xl border border-border bg-surface font-bold outline-none text-text-primary ${editingHasPredictions ? "opacity-60 cursor-not-allowed bg-surface-hover/5" : "focus:ring-2 focus:ring-accent"}`} placeholder="Question text" />
                          <select value={q.type} onChange={(e) => handleQuestionChange(q.id, 'type', e.target.value as any)} disabled={editingHasPredictions} className={`p-3 rounded-xl border border-border bg-surface font-bold text-accent outline-none ${editingHasPredictions ? "opacity-60 cursor-not-allowed" : ""}`}>
                            <option value="OPTIONS">Multiple Choice</option>
                            <option value="TEXT">Fill-in (Text/Num)</option>
                          </select>
                        </div>

                        {/* Configurable Scoring Rules */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex-1 min-w-[120px]">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Points</label>
                            <input type="number" value={q.points} onChange={(e) => handleQuestionChange(q.id, 'points', parseInt(e.target.value) || 0)} disabled={editingHasPredictions} className={`w-full p-2.5 rounded-xl border border-border bg-surface font-black text-center text-text-primary outline-none ${editingHasPredictions ? "opacity-60 cursor-not-allowed" : "focus:ring-2 focus:ring-accent"}`} min="0" max="100" />
                          </div>
                          <div className="flex-[2] min-w-[150px]">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Rule Type</label>
                            <select value={q.ruleType} onChange={(e) => handleQuestionChange(q.id, 'ruleType', e.target.value as any)} disabled={editingHasPredictions} className={`w-full p-2.5 rounded-xl border border-border bg-surface font-bold text-text-primary outline-none ${editingHasPredictions ? "opacity-60 cursor-not-allowed" : "focus:ring-2 focus:ring-accent"}`}>
                              <option value="EXACT">EXACT Match</option>
                              <option value="NEAREST">NEAREST (Numerical)</option>
                            </select>
                          </div>
                          <div className="flex-[2] min-w-[150px]">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Target Unit</label>
                            <select value={q.unit} onChange={(e) => handleQuestionChange(q.id, 'unit', e.target.value as any)} disabled={editingHasPredictions} className={`w-full p-2.5 rounded-xl border border-border bg-surface font-bold text-text-primary outline-none ${editingHasPredictions ? "opacity-60 cursor-not-allowed" : "focus:ring-2 focus:ring-accent"}`}>
                              <option value="NONE">General / Other</option>
                              <option value="PLAYER">Player name</option>
                              <option value="TEAM">Team name</option>
                              <option value="RUNS">Runs / Number</option>
                              <option value="WICKETS">Wickets</option>
                              <option value="BOUNDARIES">Boundaries / Sixes</option>
                              <option value="OVERS">Overs / Dots</option>
                            </select>
                          </div>
                          {q.ruleType === "NEAREST" && (
                            <div className="flex-1 min-w-[120px]">
                              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Max Range</label>
                              <input type="number" value={q.maxRange} onChange={(e) => handleQuestionChange(q.id, 'maxRange', parseInt(e.target.value) || 0)} disabled={editingHasPredictions} className={`w-full p-2.5 rounded-xl border border-border bg-surface font-black text-center text-accent outline-none ${editingHasPredictions ? "opacity-60 cursor-not-allowed" : "focus:ring-2 focus:ring-accent"}`} placeholder="e.g. 30" />
                            </div>
                          )}
                        </div>
                        {q.type === "OPTIONS" && (
                          <div className="bg-surface p-3 rounded-xl border border-border">
                            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Answer Options (Comma Separated)</label>
                            <input type="text" value={q.options.join(", ")} onChange={(e) => handleQuestionChange(q.id, 'options', e.target.value.split(",").map(opt => opt.trimStart()))} disabled={editingHasPredictions} placeholder="e.g. MI, CSK, Over 200" className={`w-full text-sm font-medium p-2 border-b border-border bg-transparent outline-none text-text-primary transition ${editingHasPredictions ? "opacity-60 cursor-not-allowed" : "focus:border-accent"}`} />
                          </div>
                        )}
                        <div className="bg-accent/5 p-3 rounded-xl border border-accent/10">
                          <label className="text-[10px] font-bold text-accent uppercase tracking-widest block mb-1">Official Correct Result</label>
                          <input type="text" value={q.result || ""} onChange={(e) => handleQuestionChange(q.id, 'result', e.target.value)} placeholder="Enter the final correct answer" className="w-full text-sm font-bold p-2 bg-transparent outline-none border-b border-accent/20 focus:border-accent text-text-primary transition" />
                        </div>
                      </div>
                      {!editingHasPredictions && (
                        <button type="button" onClick={() => handleRemoveQuestion(q.id)} className="text-text-secondary hover:text-error p-2 bg-surface shadow-sm rounded-xl border border-border transition">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white font-black py-4 rounded-xl transition shadow-xl shadow-accent/20 text-lg uppercase tracking-widest">
                Deploy Match Configuration
              </button>
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

            <form onSubmit={handleResultSubmit} className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-text-secondary mb-2">Status</label>
                  <select value={resultFormData.status} onChange={(e) => handleStatusChange(e.target.value, 'RESULT')} className="w-full p-4 rounded-2xl border border-border bg-surface text-text-primary font-bold outline-none focus:border-accent">
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
                    const isPlayerQ = q.unit === "PLAYER" || ((t.includes("player") || t.includes("who") || t.includes("man of the match") || t.includes("wicket")) && !t.includes("total") && !t.includes("how many") && !t.includes("win"));
                    const isTeamWinnerQ = q.unit === "TEAM" || (t.includes("win") && !t.includes("wicket") && !t.includes("run"));

                    return (
                      <div key={q._id} className="bg-surface-hover/20 p-4 rounded-xl border border-border">
                        <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">{idx + 1}. {q.text}</label>
                        {q.type === 'OPTIONS' && q.options && q.options.length > 0 ? (
                          <PlayerSearchSelect players={q.options} value={q.result} onChange={(val) => { const newQ = [...resultFormData.questions]; newQ[idx].result = val; setResultFormData({ ...resultFormData, questions: newQ }); }} placeholder="Select winning option..." />
                        ) : isPlayerQ && resultFormData.players && resultFormData.players.length > 0 ? (
                          <PlayerSearchSelect players={resultFormData.players} value={q.result} onChange={(val) => { const newQ = [...resultFormData.questions]; newQ[idx].result = val; setResultFormData({ ...resultFormData, questions: newQ }); }} placeholder="Select valid player..." />
                        ) : isTeamWinnerQ ? (
                          <select value={q.result} onChange={(e) => { const newQ = [...resultFormData.questions]; newQ[idx].result = e.target.value; setResultFormData({ ...resultFormData, questions: newQ }); }} className="w-full p-4 rounded-xl border border-border bg-surface text-text-primary font-bold outline-none focus:border-accent">
                            <option value="">Select winner team...</option>
                            <option value={resultFormData.teamAName}>{resultFormData.teamAName}</option>
                            <option value={resultFormData.teamBName}>{resultFormData.teamBName}</option>
                          </select>
                        ) : (
                          <input type="text" value={q.result} onChange={(e) => { const newQ = [...resultFormData.questions]; newQ[idx].result = e.target.value; setResultFormData({ ...resultFormData, questions: newQ }); }} placeholder="Enter final correct value..." className="w-full p-4 rounded-xl border border-border bg-surface text-text-primary font-bold" />
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
                      await fetch(`/api/admin/matches/${resultFormData.id}`, { 
                        method: "PUT", 
                        headers: { "Content-Type": "application/json" }, 
                        body: JSON.stringify({
                          status: resultFormData.status,
                          winner: resultFormData.winner,
                          result: resultFormData.resultText,
                          teamAScore: resultFormData.teamAScore,
                          teamBScore: resultFormData.teamBScore,
                          questionResults: resultFormData.questions.map(q => ({
                            _id: q._id,
                            result: q.result
                          }))
                        }) 
                      });
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

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-accent tracking-tighter uppercase italic leading-none">Match Directory</h1>
          <p className="text-text-secondary font-bold tracking-tight text-sm mt-1">Manage existing matches and track incoming predictions.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <button onClick={async () => {
            if (!confirm("Delete all test matches?")) return;
            const res = await fetch("/api/admin/cleanup-dummies", { method: "DELETE" });
            if (res.ok) { alert("Cleanup finished!"); fetchMatches(); }
          }} className="flex-1 lg:flex-none justify-center bg-error/10 hover:bg-error text-error hover:text-white border border-error/20 font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center shadow-sm">
            <Trash2 size={18} className="mr-2" /> <span className="text-xs uppercase tracking-widest">Cleanup</span>
          </button>
          <button onClick={async () => {
            if (!confirm("Sync IPL 2026 fixtures?")) return;
            const res = await fetch("/api/admin/sync-ipl", { method: "POST" });
            if (res.ok) { alert("Sync finished!"); fetchMatches(); }
          }} className="flex-1 lg:flex-none justify-center bg-surface border border-border text-text-primary hover:border-accent hover:text-accent font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center shadow-sm">
            <DownloadCloud size={18} className="mr-2" /> <span className="text-xs uppercase tracking-widest">Sync IPL</span>
          </button>
          {dbDefaultQuestions.length === 0 && (
            <button onClick={seedDefaultQuestions} className="flex-1 lg:flex-none justify-center bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white border border-amber-500/20 font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center shadow-sm">
              <DownloadCloud size={18} className="mr-2" /> <span className="text-xs uppercase tracking-widest">Seed Defaults</span>
            </button>
          )}
          <button onClick={() => { 
            setEditingMatchId(null); 
            setEditingHasPredictions(false); 
            setShowCreateForm(true); 
            setQuestions(dbDefaultQuestions.length > 0 ? [...dbDefaultQuestions] : [...DEFAULT_QUESTIONS]);
          }} className="w-full lg:w-auto justify-center bg-accent hover:bg-accent-hover text-white font-black py-4 px-8 rounded-2xl transition shadow-xl shadow-accent/20 flex items-center uppercase tracking-[0.15em] text-[11px]">
            <Plus size={20} className="mr-2" /> Create New Match
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-3xl shadow-sm border border-border p-8 h-full transition-colors">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-xl font-bold flex items-center"><Settings2 className="mr-2 text-accent" size={24} /> Existing Matches</h2>
          {/* <div className="flex justify-center space-x-1 bg-surface-hover/30 p-1.5 rounded-2xl max-w-2xl mx-auto backdrop-blur-md border border-border overflow-x-auto no-scrollbar shadow-sm"> */}
          <div className="flex bg-surface-hover/50 p-1.5 rounded-2xl border border-border w-full lg:w-auto overflow-x-auto no-scrollbar scroll-smooth">
            {(["ALL", "UPCOMING", "LIVE", "COMPLETED", "ARCHIVED"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`flex-1 py-3 px-6 rounded-xl text-[10px] font-black transition-all duration-300 uppercase tracking-[0.15em] min-w-max flex items-center justify-center ${filter === t ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="min-w-[1000px] space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="text-center py-20 bg-surface rounded-[3rem] border-2 border-dashed border-border/50">
                <p className="text-text-secondary font-black opacity-40 uppercase tracking-widest">No matches found in this category.</p>
              </div>
            ) : (
              filteredMatches.map((match) => (
                <div key={match._id} className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-sm group hover:border-accent hover:shadow-xl hover:shadow-accent/5 transition-all duration-500 overflow-hidden relative">
                  {/* Match Info Left */}
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-center space-x-6 shrink-0 w-[300px]">
                      {/* Team Vs Team */}
                      <div className="flex -space-x-4">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-border p-3 shadow-sm flex items-center justify-center relative z-10">
                          {match.teamA.logoUrl ? <img src={match.teamA.logoUrl} alt={match.teamA.shortName} className="object-contain" /> : <span className="font-black text-xs">{match.teamA.shortName}</span>}
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-white border border-border p-3 shadow-sm flex items-center justify-center relative z-0">
                          {match.teamB.logoUrl ? <img src={match.teamB.logoUrl} alt={match.teamB.shortName} className="object-contain" /> : <span className="font-black text-xs">{match.teamB.shortName}</span>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-black text-lg text-text-primary uppercase tracking-tighter leading-tight italic">
                          {match.teamA.shortName} <span className="text-text-secondary opacity-30 mx-1">VS</span> {match.teamB.shortName}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black tracking-widest uppercase ${match.status === 'LIVE' ? 'bg-red-500/10 text-red-500' :
                              match.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                                'bg-accent/10 text-accent'
                            }`}>{match.status}</span>
                          <span className="text-[10px] font-bold text-text-secondary opacity-40 italic">{new Date(match.startTime).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Details Middle */}
                    <div className="flex-1 min-w-[200px] border-l border-r border-border/50 px-8 text-center sm:text-left">
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] opacity-40 mb-1">{match.group || "IPL 2026"}</p>
                      <p className="text-xs font-bold text-text-secondary line-clamp-2">{match.venue}</p>
                    </div>

                    {/* Actions Right */}
                    <div className="flex items-center space-x-3 shrink-0">
                      <Link href={`/admin/matches/${match._id}`} className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl hover:bg-blue-500 hover:text-white transition shadow-sm border border-blue-500/20 flex items-center" title="Manage Players">
                        <Users size={18} />
                      </Link>
                      {/* Edit Button */}
                      <button onClick={() => editMatch(match)} className="flex items-center space-x-2 px-5 py-3 bg-surface border border-border hover:border-accent hover:bg-accent/5 rounded-2xl transition group/btn shadow-sm">
                        <Settings2 size={16} className="text-text-secondary group-hover/btn:text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary group-hover/btn:text-accent">Edit</span>
                      </button>
                      {/* Result Button */}
                      <button onClick={() => openResultModal(match)} className="flex items-center space-x-2 px-5 py-3 bg-surface border border-border hover:border-amber-500 hover:bg-amber-500/5 rounded-2xl transition group/res shadow-sm">
                        <Trophy size={16} className="text-text-secondary group-hover/res:text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary group-hover/res:text-amber-500">Result</span>
                      </button>
                      {/* Predictions Button */}
                      <Link href={`/admin/matches/${match._id}/predictions`} className="flex items-center space-x-2 px-6 py-3 bg-accent text-white rounded-2xl hover:bg-accent-hover transition shadow-lg shadow-accent/20">
                        <LayoutDashboard size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Predictions</span>
                      </Link>
                      <button onClick={() => toggleArchive(match._id, match.isArchived || false)} className={`p-3 rounded-2xl transition shadow-sm border ${match.isArchived ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500' : 'bg-surface-hover text-text-secondary border-border hover:bg-error hover:text-white'}`} title={match.isArchived ? "Unarchive" : "Archive"}>
                        {match.isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Status Conflict Warning Modal */}
      {statusConflict && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl w-full max-w-md shadow-2xl border border-error/20 overflow-hidden">
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Status Conflict Detected</h2>
              <p className="text-text-secondary font-medium">
                {statusConflict.newStatus === 'UPCOMING' && statusConflict.computedStatus === 'LIVE' ? (
                  "The match has already started based on the scheduled date & time."
                ) : (
                  `You are setting the status to ${statusConflict.newStatus}, but based on time it should be ${statusConflict.computedStatus}.`
                )}
              </p>

              <div className="bg-surface-hover/50 p-6 rounded-3xl border border-border text-left space-y-4">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Update Schedule Instead?</p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-text-secondary uppercase mb-1 block">New Start Time</label>
                    <input
                      type="datetime-local"
                      value={statusConflict.startTime}
                      onChange={(e) => setStatusConflict({ ...statusConflict, startTime: e.target.value })}
                      className="w-full p-3 rounded-xl border border-border bg-surface text-sm font-bold outline-none focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-text-secondary uppercase mb-1 block">New End Time</label>
                    <input
                      type="datetime-local"
                      value={statusConflict.endTime}
                      onChange={(e) => setStatusConflict({ ...statusConflict, endTime: e.target.value })}
                      className="w-full p-3 rounded-xl border border-border bg-surface text-sm font-bold outline-none focus:border-accent"
                    />
                  </div>
                </div>
                <button
                  onClick={async () => {
                    // Update current record and close modal
                    if (statusConflict.source === 'FORM') {
                      setFormData({ ...formData, startTime: statusConflict.startTime!, endTime: statusConflict.endTime! });
                    } else {
                      setResultFormData({ ...resultFormData, startTime: statusConflict.startTime!, endTime: statusConflict.endTime! });
                      // Promptly update the DB if in Result modal
                      await fetch(`/api/admin/matches/${resultFormData.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ startTime: statusConflict.startTime, endTime: statusConflict.endTime })
                      });
                      fetchMatches();
                    }
                    setStatusConflict(null);
                  }}
                  className="w-full py-3 bg-accent text-white font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-accent-hover transition shadow-lg shadow-accent/10"
                >
                  Confirm & Update Time
                </button>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={() => {
                    if (statusConflict.source === 'FORM') setFormData({ ...formData, status: statusConflict.newStatus });
                    else setResultFormData({ ...resultFormData, status: statusConflict.newStatus });
                    setStatusConflict(null);
                  }}
                  className="w-full py-4 bg-error text-white font-black rounded-xl uppercase tracking-widest text-xs hover:bg-error/90 transition shadow-lg shadow-error/20"
                >
                  Keep Status Override
                </button>
                <button
                  onClick={() => {
                    if (statusConflict.source === 'RESULT') {
                      setShowResultModal(false);
                      const m = matches.find(m => m._id === resultFormData.id);
                      if (m) editMatch(m);
                    }
                    setStatusConflict(null);
                  }}
                  className="w-full py-4 bg-surface border border-border text-text-primary font-black rounded-xl uppercase tracking-widest text-xs hover:bg-surface-hover transition"
                >
                  {statusConflict.source === 'RESULT' ? "Open Edit Form" : "Go Back"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ErrorModal error={showErrorModal ? modalMessage : ""} onClose={() => setShowErrorModal(false)} />
      <SuccessModal message={showSuccessModal ? modalMessage : ""} onClose={() => setShowSuccessModal(false)} />
    </div>
  );
}
