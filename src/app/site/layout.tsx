import Link from "next/link";
import Nav from "../../components/layout/Nav/Nav";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Persistent Header */}
      <Nav />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-24 lg:pt-32 pb-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
