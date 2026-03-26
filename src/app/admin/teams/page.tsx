"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";

interface Team {
  _id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    logoUrl: ""
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/admin/teams");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch teams");
      setTeams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const editTeam = (team: Team) => {
    setFormData({
      name: team.name,
      shortName: team.shortName,
      logoUrl: team.logoUrl || ""
    });
    setEditingTeamId(team._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      let res;
      if (editingTeamId) {
        res = await fetch(`/api/admin/teams/${editingTeamId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetch("/api/admin/teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(formData)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${editingTeamId ? 'update' : 'create'} team`);

      if (editingTeamId) {
        setTeams(teams.map(t => t._id === editingTeamId ? data : t));
        setEditingTeamId(null);
      } else {
        setTeams([...teams, data]);
      }

      setFormData({ name: "", shortName: "", logoUrl: "" });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team? It might break existing matches.")) return;
    setIsDeleting(id);

    try {
      const res = await fetch(`/api/admin/teams/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete team");
      }
      setTeams(teams.filter(t => t._id !== id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#001f3f] tracking-tight">Manage Teams</h1>
        <p className="text-slate-500 font-medium">Create and manage participating teams and their logos.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#001f3f] flex items-center">
            {editingTeamId ? <Edit className="mr-2" size={24} /> : <Plus className="mr-2" size={24} />}
            {editingTeamId ? "Edit Team Details" : "Add New Team"}
          </h2>
          {editingTeamId && (
            <button
              type="button"
              onClick={() => {
                setEditingTeamId(null);
                setFormData({ name: "", shortName: "", logoUrl: "" });
              }}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 underline transition"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Team Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="e.g. Mumbai Indians"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Short Name</label>
            <input
              type="text"
              value={formData.shortName}
              onChange={e => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="e.g. MI"
              maxLength={4}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Upload Team Logo (PNG/JPG)</label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, image/avif"
                onChange={handleImageUpload}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none"
              />
              {formData.logoUrl && (
                <img src={formData.logoUrl} alt="Preview" className="h-12 w-12 rounded bg-slate-100 object-contain p-1 border border-slate-200" />
              )}
            </div>
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className={`w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg ${editingTeamId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#001f3f] hover:bg-blue-900'}`}
            >
              {editingTeamId ? "Save Updates" : "Create Team"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-xl font-bold text-[#001f3f]">Team Roster</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold">Loading Teams...</div>
        ) : teams.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No teams created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Logo</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Short Code</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teams.map((team) => (
                  <tr key={team._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      {team.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={team.logoUrl} alt={team.name} className="w-10 h-10 rounded-full bg-white object-contain border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                          {team.shortName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#001f3f]">{team.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full">{team.shortName}</span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end">
                      <button
                        onClick={() => editTeam(team)}
                        className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors mr-2"
                        title="Edit Team"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team._id)}
                        disabled={isDeleting === team._id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Team"
                      >
                        <Trash2 size={20} />
                      </button>
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
