"use client";

import { useState, useEffect } from "react";

interface Match {
  _id: string;
  teamA: string;
  teamB: string;
  startTime: string;
  status: string;
  venue?: string;
  group?: string;
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    teamA: "",
    teamB: "",
    startTime: "",
    endTime: "",
    venue: "",
    group: "",
    question: "Who will win?",
    options: ["", ""] // Initialize with 2 options
  });

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      } else {
        setError("Failed to fetch matches");
      }
    } catch {
      setError("Error fetching matches");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.teamA || !formData.teamB || !formData.startTime || !formData.endTime) {
        setError("Please fill all required fields, including the exact start and end dates/times.");
        setLoading(false);
        return;
      }
      // Auto-populate options if empty (Default to Team names)
      const submitData = { ...formData };
      if (!submitData.options[0]) submitData.options[0] = submitData.teamA;
      if (!submitData.options[1]) submitData.options[1] = submitData.teamB;

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        alert("Match Created Successfully!");
        setFormData({
          teamA: "",
          teamB: "",
          startTime: "",
          endTime: "",
          venue: "",
          group: "",
          question: "Who will win?",
          options: ["", ""]
        });
        fetchMatches(); // Refresh list
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create match");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 dark:bg-[#001f3f] min-h-screen text-gray-800 dark:text-gray-200 rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-blue-600">Manage Matches</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* CREATE MATCH FORM & API ASSISTANT */}
        <div className="lg:col-span-1 space-y-6">
          {/* API Assistant Block */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl shadow-sm border border-blue-100 dark:border-blue-900/30">
            <h2 className="text-lg font-bold mb-2 flex items-center text-blue-700 dark:text-blue-400">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Auto-Fill via CricketData
            </h2>
            <p className="text-xs text-blue-600/80 dark:text-blue-300/80 mb-4 leading-relaxed">
              Fetch upcoming fixtures from cricketdata.org to instantly pre-fill the match creation form.
            </p>
            <button 
              type="button"
              onClick={async () => {
                setLoading(true);
                setError("");
                try {
                  const res = await fetch('/api/admin/fetch-fixtures');
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to fetch fixture data');
                  
                  // Filter valid upcoming matches
                  const upcomingMatches = data.data?.filter((m: any) => m.matchType !== '') || [];
                  if (upcomingMatches.length === 0) throw new Error("No upcoming matches found in API response.");

                  // Auto-fill the first available match for the demo/assist
                  const nextMatch = upcomingMatches[0];
                  
                  // Calculate an approximate end time (e.g. 4 hours later for T20)
                  const startDate = new Date(nextMatch.dateTimeGMT);
                  const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
                  
                  setFormData({
                    teamA: nextMatch.teamInfo?.[0]?.name || nextMatch.teams?.[0] || "",
                    teamB: nextMatch.teamInfo?.[1]?.name || nextMatch.teams?.[1] || "",
                    startTime: startDate.toISOString().slice(0, 16),
                    endTime: endDate.toISOString().slice(0, 16),
                    venue: nextMatch.venue || "",
                    group: nextMatch.series_name || "IPL 2026",
                    question: "Who will win?",
                    options: [
                      nextMatch.teamInfo?.[0]?.name || nextMatch.teams?.[0] || "",
                      nextMatch.teamInfo?.[1]?.name || nextMatch.teams?.[1] || ""
                    ]
                  });
                  alert("Successfully auto-filled from CricketData API! You can now adjust and click Create Match.");
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 text-blue-700 dark:text-blue-100 font-bold py-2.5 rounded-lg transition text-sm flex items-center justify-center space-x-2"
            >
              <span>Fetch Next Live Match Info</span>
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-6 border-b pb-2 dark:border-gray-600">Manual Entry Form</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Team A</label>
                  <input type="text" name="teamA" value={formData.teamA} onChange={handleInputChange} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600" placeholder="e.g. India" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Team B</label>
                  <input type="text" name="teamB" value={formData.teamB} onChange={handleInputChange} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600" placeholder="e.g. Australia" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Venue</label>
                <input type="text" name="venue" value={formData.venue} onChange={handleInputChange} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600" placeholder="Stadium, City" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tournament / Group</label>
                <input type="text" name="group" value={formData.group} onChange={handleInputChange} className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600" placeholder="e.g. IPL 2026" />
              </div>

              {/* Auto-populated options usually, but allow edit */}
              <div>
                <label className="block text-sm font-medium mb-1">Options (Defaults to Team Names)</label>
                <div className="flex gap-2">
                  <input type="text" value={formData.options[0]} onChange={(e) => handleOptionChange(0, e.target.value)} className="w-1/2 p-2 rounded border dark:bg-gray-700 dark:border-gray-600" placeholder="Option 1" />
                  <input type="text" value={formData.options[1]} onChange={(e) => handleOptionChange(1, e.target.value)} className="w-1/2 p-2 rounded border dark:bg-gray-700 dark:border-gray-600" placeholder="Option 2" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#001f3f] hover:bg-blue-900 text-white font-bold py-3 rounded-lg transition mt-4 shadow-lg active:scale-[0.98]">
                {loading ? "Creating..." : "Create Match"}
              </button>
              {error && <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 mt-2">{error}</div>}
            </form>
          </div>
        </div>

        {/* MATCH LIST */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold mb-4">Existing Matches</h2>
          {matches.length === 0 ? (
            <p className="text-gray-500">No matches found.</p>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div key={match._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{match.teamA} vs {match.teamB}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(match.startTime).toLocaleString()} | <span className={`font-semibold ${match.status === 'LIVE' ? 'text-red-500' : 'text-green-500'}`}>{match.status}</span>
                    </p>
                    <p className="text-xs text-gray-400">{match.venue} • {match.group}</p>
                  </div>
                  <div className="flex space-x-2">
                    {/* Future: Add Edit/Delete buttons */}
                    <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600">Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
