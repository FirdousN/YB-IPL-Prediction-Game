"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redundant session check removed to prevent flickering. 
  // Middleware (src/middleware.ts) handles redirection if already logged in.

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name: name || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2); // Move to OTP
      } else {
        setError(data.error || "Failed to send OTP");
        if (res.status === 404 && step !== 0) {
           // User not found -> Switch to Registration
           setStep(0);
        }
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStep = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSendOtp(e);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, name: name || undefined }),
      });

      const data = await res.json();

      if (res.ok) {
        // Use redirectTo from response or default
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
        } else if (data.user.role === 'admin') {
          window.location.href = "/admin";
        } else {
          window.location.href = "/site/fixtures"; // Redirect correctly to matches list
        }
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[5px] p-4 scrollbar-y-hidden">

      {/* Background elements to match home page vibe if needed, but keeping container focused */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900 to-black opacity-90"></div>

      <div
        className="relative z-10 flex flex-col gap-3 p-8 rounded-2xl w-full max-w-sm bg-black/30 
          border border-white/10 items-center justify-center
          shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-md overflow-hidden"
      >
        <span
          className="pointer-events-none absolute inset-0 z-[-5] rounded-2xl"
          style={{
            padding: "1px",
            background:
              "linear-gradient(135deg, #ff8a00, #e52e71, #9d50bb, #00c9ff, #92fe9d)",
            opacity: 0.60,
          }}
          aria-hidden="true"
        />
        {/* Subtle top sheen */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Brand Logo - User should place logo.png in public folder */}
        <div className="relative z-10 mb-4">
          {/* Fallback to text if image fails or while waiting for file */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-1.png"
            alt="Yes Bharath"
            className="w-48 h-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md hidden">
            Yes<span className="text-yellow-400">Bharath</span>
          </h1>
        </div>

        <div className="relative text-center text-white w-full">
          <h2 className="text-2xl font-bold mb-2 ">
            {step === 2 ? 'Enter OTP' : (step === 0 ? 'Create Account' : 'Login to Play')}
          </h2>
          <p className="text-gray-100 mb-6 text-sm">
            {step === 2 ? `Sent to +91 ${phone}` : 'Sign in securely to try your luck!'}
          </p>

          {step !== 2 ? (
            <>
              {/* Name & Phone Form */}
              <form onSubmit={step === 0 ? handleRegisterStep : handleSendOtp} className="space-y-3 mb-6">
                {step === 0 && (
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-white/80 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    required
                  />
                )}

                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full p-3 rounded-xl bg-white/80 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : (step === 0 ? 'Register & Get OTP' : 'Get OTP')}
                </button>

                <p className="text-xs text-gray-200 mt-2">
                  {step === 0 ? "Already have an account? " : "New here? "}
                  <button
                    type="button"
                    onClick={() => {
                      setStep(step === 0 ? 1 : 0);
                      setError("");
                    }}
                    className="text-yellow-300 hover:text-yellow-100 font-bold underline"
                  >
                    {step === 0 ? "Login" : "Create an account"}
                  </button>
                </p>
              </form>
            </>
          ) : (
            /* OTP Input Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full p-3 rounded-xl bg-white/80 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center tracking-widest text-xl font-bold"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                }}
                className="text-xs text-white underline hover:text-yellow-300"
              >
                Change Number
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-red-100 bg-red-600/80 p-2 rounded text-sm font-bold animate-pulse">{error}</p>}

        </div>
      </div>
    </div>
  );
}
