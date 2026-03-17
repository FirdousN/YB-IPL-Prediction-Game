import Link from "next/link";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {/* Persistent Header */}
      <nav className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-row justify-between items-center w-full h-auto py-3">
            {/* Logo / Title */}
            <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              <img src="/yb-ipl-logo.png" alt="Yes Bharath" className="h-24 w-auto" />
            </Link>

            {/* Right Side: Navigation & Profile */}
            <div className="flex items-center space-x-6">
              <Link
                href="/site/profile"
                className="p-2 rounded-full hover:bg-gray-800 transition"
                aria-label="User Profile"
              >
                {/* Profile Icon Placeholder */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold border border-white/20">
                  U
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
