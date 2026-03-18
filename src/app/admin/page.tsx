import { getSession } from "@/src/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Calendar, 
  Trophy, 
  Users, 
  TrendingUp, 
  Clock, 
  ArrowRight
} from "lucide-react";

export default async function AdminDashboard() {
  const session = await getSession() as { role?: string, name?: string } | null;
  
  if (!session || session.role !== 'ADMIN') {
    redirect("/admin/login");
  }

  const stats = [
    { label: "Active Matches", value: "12", icon: Calendar, color: "bg-blue-500", trend: "+2 this week" },
    { label: "Total Users", value: "1,240", icon: Users, color: "bg-purple-500", trend: "+12.5% monthly" },
    { label: "Predictions", value: "8,542", icon: TrendingUp, color: "bg-emerald-500", trend: "+24% this IPL" },
    { label: "Prizes Claimed", value: "450", icon: Trophy, color: "bg-amber-500", trend: "+12 امروز" },
  ];

  const quickActions = [
    { 
      title: "Schedule Match", 
      desc: "Add new cricket matches to the predictor.", 
      href: "/admin/matches", 
      icon: Calendar,
      btnColor: "bg-blue-600 hover:bg-blue-700"
    },
    { 
      title: "Declare Winners", 
      desc: "Assign points and winners for ended matches.", 
      href: "/admin/results", 
      icon: Trophy,
      btnColor: "bg-emerald-600 hover:bg-emerald-700"
    },
    { 
      title: "Manage Users", 
      desc: "Review participant details and activity.", 
      href: "/admin/users", 
      icon: Users,
      btnColor: "bg-purple-600 hover:bg-purple-700"
    },
    { 
        title: "Leaderboard Settings", 
        desc: "Configure prize lists and rankings.", 
        href: "/admin/results", 
        icon: TrendingUp,
        btnColor: "bg-amber-600 hover:bg-amber-700"
      },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      {/* Welcome Header */}
      <section>
        <h1 className="text-3xl font-extrabold text-[#001f3f]">
          Welcome back, <span className="text-blue-600">{session.name || "Admin"}</span>!
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Here&apos;s what&apos;s happening with the Cricket Predictor today.
        </p>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{stat.value}</p>
                <div className="flex items-center mt-2 text-xs font-bold text-emerald-600">
                  <span>{stat.trend}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} text-white shadow-lg`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6 text-white pb-10">
          <h2 className="text-xl font-bold text-[#001f3f] flex items-center">
            Quick Management Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, i) => (
              <Link 
                key={i} 
                href={action.href}
                className="group p-6 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
              >
                <div className="flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${action.btnColor} text-white`}>
                    <action.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{action.title}</h3>
                  <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed">{action.desc}</p>
                  <div className="mt-auto pt-6 flex items-center text-blue-600 font-bold text-sm">
                    Open Tool <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity Mini-Widget */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-fit">
          <h3 className="text-lg font-bold text-[#001f3f] mb-6 flex items-center">
            <Clock size={20} className="mr-2 text-blue-500" />
            Recent Log
          </h3>
          <div className="space-y-6">
            {[
              { text: "New match scheduled: MI vs CSK", time: "10 mins ago", type: "match" },
              { text: "Winner declared for RCB vs KKR", time: "1 hour ago", type: "winner" },
              { text: "50 new users registered", time: "2 hours ago", type: "user" },
              { text: "Server maintenance completed", time: "1 day ago", type: "system" },
            ].map((activity, i) => (
              <div key={i} className="flex space-x-4">
                <div className="mt-1.5 flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                  {i < 3 && <div className="w-px h-full bg-slate-100 mt-1"></div>}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 tracking-tight">{activity.text}</p>
                  <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-tighter">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 py-3 text-sm font-bold text-[#001f3f] border border-[#001f3f]/10 rounded-xl hover:bg-slate-50 transition-colors bg-white">
            View All Logs
          </button>
        </div>
      </div>
    </div>
  );
}
