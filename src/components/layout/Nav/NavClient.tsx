"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "../../ThemeToggle";

interface UserSession {
    name: string;
    role: string;
}

export default function NavClient() {
    const [user, setUser] = useState<UserSession | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch session
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch("/api/auth/session");

                if (!res.ok) {
                    setUser(null);
                    return;
                }

                const data = await res.json();

                if (data?.user) {
                    setUser(data.user);
                }
            } catch (error) {
                console.error("Session fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
            });

            setUser(null);
            setDropdownOpen(false);
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/40 backdrop-blur-xl border-b border-border transition-all duration-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center w-full py-4">

                    {/* Left: Logo & Links */}
                    <div className="flex items-center gap-10">
                        <Link href="/" className="shrink-0 group">
                            <img
                                src="/yb-ipl-logo.png"
                                alt="Yes Bharath"
                                className="h-10 md:h-12 w-auto drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
                            />
                        </Link>

                        <div className="hidden lg:flex items-center space-x-8 text-[10px] font-black tracking-[0.2em] text-text-primary uppercase">
                            <Link href="/site/fixtures" className="hover:text-accent transition-all">Fixtures & Results</Link>
                            <Link href="/site/points-table" className="hover:text-accent transition-all">Points Table</Link>
                            <Link href="/site/stats" className="hover:text-accent transition-all">Overall Stats</Link>
                            <Link href="/site/teams" className="hover:text-accent transition-all">All Teams</Link>
                        </div>
                    </div>

                    {/* Right: Theme & User */}
                    <div className="flex items-center space-x-6">
                        <ThemeToggle />

                        <div className="h-6 w-px bg-border hidden sm:block"></div>

                        {/* Highlighted Start Prediction Button */}
                        <Link 
                            href="/site/matches"
                            className="hidden md:flex bg-accent text-white font-black text-[10px] uppercase tracking-[0.2em] px-6 py-2.5 rounded-xl shadow-lg shadow-accent/20 hover:scale-105 hover:bg-accent-hover transition-all active:scale-95 border border-white/10"
                        >
                            Start Prediction
                        </Link>

                        {loading ? (
                            <div className="w-10 h-10 rounded-full border-2 border-border border-t-accent animate-spin"></div>
                        ) : user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-3 bg-surface border border-border px-5 py-2.5 rounded-2xl shadow-sm hover:shadow-md hover:border-accent transition-all group"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent ring-2 ring-accent/5">
                                         <span className="text-[10px] font-black uppercase">{user?.name?.charAt(0) || 'U'}</span>
                                    </div>
                                    <span className="font-black text-[11px] text-text-primary uppercase tracking-tighter">
                                        {user?.name?.split(' ')[0] || 'User'}
                                    </span>

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-4 w-4 text-text-secondary transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={3}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-surface border border-border rounded-[1.5rem] shadow-2xl py-3 overflow-hidden animate-in fade-in zoom-in-95 duration-300 origin-top-right z-[60]">
                                        <div className="px-5 py-4 border-b border-border bg-surface-hover/30">
                                            <p className="text-[9px] text-text-secondary uppercase font-black tracking-widest opacity-40 mb-1">Authenticated Account</p>
                                            <p className="text-text-primary font-black text-sm truncate uppercase tracking-tight">{user.name}</p>
                                            <p className="text-[9px] text-accent font-black uppercase mt-1 tracking-tighter italic">{user.role}</p>
                                        </div>

                                        <div className="px-2 py-2 space-y-1">
                                            <Link
                                                href="/site/profile"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center px-4 py-3 text-[11px] font-black text-text-primary hover:bg-surface-hover rounded-xl transition uppercase tracking-tighter"
                                            >
                                                My Profile Settings
                                            </Link>
                                            <Link
                                                href="/site/matches?tab=MY_PICKS"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center px-4 py-3 text-[11px] font-black text-text-primary hover:bg-surface-hover rounded-xl transition uppercase tracking-tighter"
                                            >
                                                My Prediction History
                                            </Link>
                                            <Link
                                                href="/site/matches"
                                                onClick={() => setDropdownOpen(false)}
                                                className="flex items-center px-4 py-3 text-[11px] font-black text-text-primary hover:bg-surface-hover rounded-xl transition uppercase tracking-tighter"
                                            >
                                                Available Matches
                                            </Link>
                                        </div>

                                        <div className="px-2 pt-2 border-t border-border mt-2">
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center px-4 py-3 text-[11px] font-black text-error hover:bg-error/5 rounded-xl transition uppercase tracking-widest"
                                            >
                                                Secure Exit
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-8 py-2.5 bg-accent hover:bg-accent-hover text-white font-black rounded-2xl transition shadow-lg shadow-accent/20 text-[11px] uppercase tracking-widest active:scale-95"
                            >
                                Get Started
                            </Link>
                        )}

                    </div>
                </div>
            </div>
        </nav>
    );
}