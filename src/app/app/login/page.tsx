"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(email, password);
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.register(email, password);
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-5">
      <div className="fixed inset-0 -z-10 opacity-10 bg-gradient-to-br from-[#667eea] to-[#764ba2]" />

      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <a
            href="/"
            className="inline-block text-2xl font-bold bg-gradient-to-r from-brand-500 to-[#8b5cf6] bg-clip-text text-transparent mb-2"
          >
            qodefly
          </a>
          <p className="text-[#64748b] text-sm">
            {tab === "login"
              ? "Welcome back"
              : "Create your account"}
          </p>
        </div>

        <div className="bg-[#1e293b] border border-white/10 rounded-2xl p-8">
          <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === "login"
                  ? "bg-brand-500 text-white"
                  : "text-[#64748b] hover:text-white"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === "register"
                  ? "bg-brand-500 text-white"
                  : "text-[#64748b] hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#64748b]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#64748b]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-1 py-3.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-[15px] font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#64748b]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#64748b]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  minLength={8}
                  className="px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25"
                />
                <span className="text-xs text-[#64748b]">Minimum 8 characters</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#64748b]">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-1 py-3.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-[15px] font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-xs text-[#64748b]">
          <a href="/" className="text-brand-500 hover:underline">
            ← Back to qodefly.io
          </a>
        </p>
      </div>
    </div>
  );
}
