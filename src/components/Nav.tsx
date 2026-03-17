import Link from "next/link";
import { useState, useEffect } from "react";

interface UserSession {
    name: string;
    role: string;
}

export default function Nav() {
    const [user, setUser] = useState<UserSession | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        // Check session on mount
        fetch('/api/auth/session')
            .then(res => {
                if (res.ok) {
                    return res.json();
                }
                return null;
            })
            .then(data => {
                if (data && data.user) {
                    setUser(data.user);
                }
            })
            .catch(() => { });
    }, []);

    return (
        <nav className="sticky top-0 w-full z-50 bg-gray-900/40 backdrop-blur-md border-b border-gray-800">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-row justify-between items-center w-full h-auto py-3">
                    {/* Logo / Title */}
                    <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        <img src="/yb-ipl-logo.png" alt="Yes Bharath" className="h-10 md:h-10 lg:h-12 xl:h-16 w-auto" />
                    </Link>

                    {/* Right Side: Navigation & Profile */}
                    <div className="flex items-center space-x-6">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-md transition border border-white/10"
                                >
                                    <span className="font-semibold text-blue-300">{user.name}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-800">
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Signed in as</p>
                                            <p className="text-white font-bold truncate">{user.name}</p>
                                        </div>

                                        <Link href="/site/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition">
                                            Profile
                                        </Link>
                                        <Link href="/site/matches?tab=MY_PICKS" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition">
                                            My Picks / History
                                        </Link>
                                        <Link href="/site/results" className="block px-4 py-2 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition">
                                            Results
                                        </Link>

                                        <div className="border-t border-gray-800 mt-2 pt-2">
                                            <button
                                                onClick={() => {
                                                    // Quick hack for logout if API absent, typically should allow clearing cookie
                                                    document.cookie = "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                                                    setUser(null);
                                                    setDropdownOpen(false);
                                                    window.location.reload();
                                                }}
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
                                className="px-6 py-2 bg-transparent border border-blue-400 text-blue-400 font-bold rounded-full hover:bg-blue-400 hover:text-black transition shadow-[0_0_15px_rgba(59,130,246,0.5)]"
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