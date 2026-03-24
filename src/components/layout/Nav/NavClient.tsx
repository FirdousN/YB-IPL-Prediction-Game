// /src/components/layout/Nav/NavClient.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

    // Logout handler (better than cookie hack)
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
        <nav className="fixed top-0 w-full z-50 bg-gray-900/40 backdrop-blur-md border-b border-gray-800">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center w-full py-3">

                    {/* Logo */}
                    <Link
                        href="/"
                        className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
                    >
                        <img
                            src="/yb-ipl-logo.png"
                            alt="Yes Bharath"
                            className="h-10 md:h-10 lg:h-12 xl:h-16 w-auto"
                        />
                    </Link>

                    {/* Center Navigation Links */}
                    <div className="hidden lg:flex items-center space-x-8 text-sm font-black tracking-widest text-gray-300 uppercase">
                        <Link href="/site/fixtures" className="hover:text-white hover:text-shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all">Fixtures & Results</Link>
                        <Link href="/site/points-table" className="hover:text-white hover:text-shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all">Points Table</Link>
                        <Link href="/site/stats" className="hover:text-white hover:text-shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all">Overall Stats</Link>
                        <Link href="/site/teams" className="hover:text-white hover:text-shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all">All Teams</Link>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center space-x-6">

                        {loading ? (
                            <div className="text-gray-400 text-sm">Loading...</div>
                        ) : user ? (
                            <div className="relative">

                                {/* User Button */}
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md transition border border-white/10"
                                >
                                    <span className="font-semibold text-blue-300">
                                        {user.name}
                                    </span>

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""
                                            }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {/* Dropdown */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                                        {/* User Info */}
                                        <div className="px-4 py-3 border-b border-gray-800">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                                Signed in as
                                            </p>
                                            <p className="text-white font-bold truncate">
                                                {user.name}
                                            </p>
                                        </div>

                                        {/* Links */}
                                        <Link
                                            href="/site/profile"
                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition"
                                        >
                                            Profile
                                        </Link>

                                        <Link
                                            href="/site/matches?tab=MY_PICKS"
                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition"
                                        >
                                            My Picks / History
                                        </Link>

                                        <Link
                                            href="/site/matches"
                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition"
                                        >
                                            Matches
                                        </Link>

                                        {/* Logout */}
                                        <div className="border-t border-gray-800 mt-2 pt-2">
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="px-6 py-2 border border-blue-400 text-blue-400 font-bold rounded-full hover:bg-blue-400 hover:text-black transition shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                            >
                                Login
                            </Link>
                        )}

                    </div>
                </div>
            </div>
        </nav>
    );
}