"use client";

import { Search, Filter, SortDesc, X } from "lucide-react";

interface MatchFilterSortProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  filterTeam: string;
  setFilterTeam: (val: string) => void;
  filterTournament: string;
  setFilterTournament: (val: string) => void;
  teams: string[];
  tournaments: string[];
}

export default function MatchFilterSort({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  filterTeam,
  setFilterTeam,
  filterTournament,
  setFilterTournament,
  teams,
  tournaments
}: MatchFilterSortProps) {
  const clearFilters = () => {
    setSearchQuery("");
    setFilterTeam("");
    setFilterTournament("");
    setSortBy("date-asc");
  };

  const hasActiveFilters = searchQuery !== "" || filterTeam !== "" || filterTournament !== "";

  return (
    <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm space-y-4 mb-8">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-primary" size={18} />
          <input
            type="text"
            placeholder="Search teams, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-hover/50 border border-border rounded-2xl focus:ring-2 focus:ring-accent outline-none font-bold text-sm transition-all"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-wrap gap-3">
          {/* Team Filter */}
          <div className="relative min-w-[140px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary shrink-0" size={14} />
            <select
              value={filterTeam}
              onChange={(e) => setFilterTeam(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-surface-hover/50 border border-border rounded-2xl focus:ring-2 focus:ring-accent outline-none font-bold text-[11px] uppercase tracking-widest appearance-none cursor-pointer"
            >
              <option value="">All Teams</option>
              {teams.sort().map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Tournament Filter */}
          <div className="relative min-w-[140px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary shrink-0" size={14} />
            <select
              value={filterTournament}
              onChange={(e) => setFilterTournament(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-surface-hover/50 border border-border rounded-2xl focus:ring-2 focus:ring-accent outline-none font-bold text-[11px] uppercase tracking-widest appearance-none cursor-pointer"
            >
              <option value="">All Tours</option>
              {tournaments.sort().map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div className="relative min-w-[140px]">
            <SortDesc className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary shrink-0" size={14} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-surface-hover/50 border border-border rounded-2xl focus:ring-2 focus:ring-accent outline-none font-bold text-[11px] uppercase tracking-widest appearance-none cursor-pointer"
            >
              <option value="date-asc">Oldest First</option>
              <option value="date-desc">Newest First</option>
            </select>
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-3 bg-error/5 text-error hover:bg-error/10 border border-error/20 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
