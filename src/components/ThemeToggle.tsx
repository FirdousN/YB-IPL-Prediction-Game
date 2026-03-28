"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Initial check
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-surface-hover border border-border flex items-center p-1 transition-all duration-500 hover:border-accent hover:shadow-lg hover:shadow-accent/10 group"
      aria-label="Toggle Theme"
    >
      {/* Track Background Accent */}
      <div className={`absolute inset-0 rounded-full transition-opacity duration-500 ${theme === 'dark' ? 'bg-accent/10 opacity-100' : 'bg-amber-500/10 opacity-0'}`}></div>
      
      {/* Thumb */}
      <div
        className={`
          w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 z-10
          ${theme === "dark" ? "translate-x-7 bg-accent shadow-lg shadow-accent/40" : "translate-x-0 bg-amber-500 shadow-lg shadow-amber-500/40"}
          group-active:scale-90
        `}
      >
        {theme === "dark" ? (
          <Moon size={12} className="text-white animate-in zoom-in-50 duration-500" />
        ) : (
          <Sun size={12} className="text-white animate-in zoom-in-50 duration-500" />
        )}
      </div>

      {/* Decorative Icons on track */}
      <div className="absolute inset-0 flex justify-between items-center px-1.5 focus:pointer-events-none">
        <Sun size={10} className={`${theme === 'light' ? 'text-amber-500' : 'text-text-secondary'}`} />
        <Moon size={10} className={`${theme === 'dark' ? 'text-accent' : 'text-text-secondary'}`} />
      </div>
    </button>
  );
}
