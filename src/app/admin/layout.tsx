"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Trophy, 
  Users, 
  Calendar, 
  LogOut,
  ChevronRight,
  Menu,
  X,
  Shield
} from "lucide-react";
import { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // If we are on the login page, don't show the sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Teams", href: "/admin/teams", icon: Shield },
    { name: "Matches", href: "/admin/matches", icon: Calendar },
    { name: "Results", href: "/admin/results", icon: Trophy },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Winners", href: "/admin/winners", icon: Trophy },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed", error);
      // Fallback: manually clear session cookie if API fails
      document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      router.push("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-[#001f3f] text-white transition-all duration-300 flex flex-col shadow-xl z-20`}
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className={`font-bold text-xl tracking-tight overflow-hidden transition-all duration-300 ${isSidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}>
            YB <span className="text-blue-400">ADMIN</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 mt-6 px-3 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center p-3 rounded-xl transition-all group ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" 
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon size={22} className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"} transition-colors`} />
                <span className={`ml-4 font-medium transition-all duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 w-0"}`}>
                  {item.name}
                </span>
                {isActive && isSidebarOpen && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center p-3 rounded-xl text-red-300 hover:bg-red-500/20 hover:text-red-100 transition-all group`}
          >
            <LogOut size={22} className="text-red-400" />
            <span className={`ml-4 font-medium transition-all duration-300 ${isSidebarOpen ? "opacity-100" : "opacity-0 w-0"}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 uppercase tracking-wide">
            {menuItems.find(item => item.href === pathname)?.name || "Admin"}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
              A
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-slate-700">Administrator</p>
              <p className="text-xs text-slate-400 uppercase tracking-tighter">Super Access</p>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
