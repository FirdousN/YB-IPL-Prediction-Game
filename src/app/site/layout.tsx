import Link from "next/link";
import Nav from "../../components/layout/Nav/Nav";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="min-h-screen text-white font-sans bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: "url('/stadium-bg.png')" }}
    >
      <div className="absolute inset-0 bg-gray-900/70 z-0 pointer-events-none"></div>

      {/* Persistent Header */}
      <div className="relative z-50">
        <Nav />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-24 lg:pt-32 pb-6 px-4 sm:px-6 lg:px-8 relative z-10">
        {children}
      </main>
    </div>
  );
}
