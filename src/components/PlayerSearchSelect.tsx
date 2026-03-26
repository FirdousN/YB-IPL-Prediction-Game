"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

interface PlayerSearchSelectProps {
  players: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function PlayerSearchSelect({
  players,
  value,
  onChange,
  disabled,
  placeholder = "Search and select a player..."
}: PlayerSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredPlayers = players.filter(p =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full bg-surface-hover border-2 rounded-[1.25rem] px-6 py-5 flex items-center justify-between cursor-pointer transition-all duration-300
          ${isOpen ? "border-accent ring-8 ring-accent/5" : "border-border hover:border-accent/40"}
          ${disabled ? "opacity-30 cursor-not-allowed" : "shadow-sm hover:shadow-md"}
        `}
      >
        <span className={`text-lg transition-colors ${value ? "text-text-primary font-black" : "text-text-secondary opacity-60"}`}>
          {value || placeholder}
        </span>
        <ChevronDown className={`text-text-secondary transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} size={20} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-3 bg-surface border border-border rounded-[1.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 origin-top">
          <div className="p-4 border-b border-border flex items-center gap-3 bg-surface-hover/50">
            <Search className="text-text-secondary opacity-40" size={18} />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search squad..."
              className="bg-transparent border-none focus:ring-0 text-text-primary w-full placeholder:text-text-secondary opacity-60 font-black text-sm uppercase tracking-wider"
              onClick={(e) => e.stopPropagation()}
            />
            {search && (
              <X
                className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                size={18}
                onClick={(e) => { e.stopPropagation(); setSearch(""); }}
              />
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => (
                <div
                  key={player}
                  onClick={() => {
                    onChange(player);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`
                    flex items-center justify-between px-5 py-4 rounded-xl cursor-pointer transition-all duration-200
                    ${value === player ? "bg-accent/10 text-accent font-black shadow-inner" : "text-text-primary hover:bg-surface-hover hover:translate-x-1"}
                  `}
                >
                  <span className="text-sm font-bold uppercase tracking-tight">{player}</span>
                  {value === player && <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-lg shadow-accent/20"><Check size={12} className="text-white" /></div>}
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center text-text-secondary font-bold opacity-40 text-xs uppercase tracking-widest italic">
                No match found for "{search}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
