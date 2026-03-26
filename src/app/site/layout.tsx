import Nav from "../../components/layout/Nav/Nav";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-sans bg-background transition-colors duration-500 relative overflow-x-hidden">

      {/* Dynamic Background: Stadium for Dark, Clean for Light */}
      <div
        className="fixed inset-0 bg-cover bg-center transition-all duration-1000 opacity-0 dark:opacity-100 z-0 pointer-events-none grayscale-[20%] scale-105"
        style={{ backgroundImage: "url('/stadium-bg.avif')" }}
      >
        <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-[2px]"></div>
      </div>

      {/* Persistent Navigation with high z-index and blurred background */}
      <div className="relative z-[100]">
        <Nav />
      </div>

      {/* Main Content Area: Centered, Responsive, and Semantic */}
      <main className="max-w-7xl mx-auto pt-28 lg:pt-36 pb-12 px-4 sm:px-6 lg:px-8 relative z-10 text-text-primary transition-colors duration-500">
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {children}
        </div>
      </main>

      {/* Subtle background glow for light mode */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 dark:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full"></div>
      </div>
    </div>
  );
}
