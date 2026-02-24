"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [modal, setModal] = useState<
    "register" | "login" | "waitlist" | null
  >(null);
  const [tab, setTab] = useState<"register" | "login">("register");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function openModal(mode: "register" | "login" | "waitlist") {
    setModal(mode);
    setTab(mode === "login" ? "login" : "register");
    setError("");
    setSuccess(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setModal(mode);
  }

  function closeModal() {
    setModal(null);
    setError("");
    setSuccess(null);
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
      setSuccess("register");
      setTimeout(() => router.push("/app"), 1500);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.login(email, password);
      setSuccess("login");
      setTimeout(() => router.push("/app"), 1500);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.submitWaitlist(email);
      setSuccess("waitlist");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    {
      icon: "🤖",
      title: "AI-Native Platform",
      desc: "Built for Claude, ChatGPT, and AI coding tools. Your AI writes code, we deploy it instantly.",
    },
    {
      icon: "✨",
      title: "Vibe Coding Ready",
      desc: "No config files. No DevOps headaches. Just describe your vision and ship it instantly.",
    },
    {
      icon: "⚡",
      title: "Lightning Fast Deploys",
      desc: "From idea to live app in under a minute. AI generates, we deploy. That simple.",
    },
    {
      icon: "🌿",
      title: "Preview Every Iteration",
      desc: "Every change gets a live preview before publishing. Iterate fearlessly with AI.",
    },
    {
      icon: "🔒",
      title: "Automatic Everything",
      desc: "SSL, scaling, monitoring — all handled. You focus on building, we handle the infrastructure.",
    },
    {
      icon: "🎯",
      title: "AI API Integration",
      desc: "Built-in access to Claude, OpenAI, and open-source models. Build AI-powered apps faster.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] font-sans overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 opacity-10 bg-gradient-to-br from-[#667eea] to-[#764ba2]" />
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 animate-pulse opacity-30 bg-[radial-gradient(circle_at_20%_50%,rgba(99,102,241,0.2),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.2),transparent_50%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-8">
        <div className="max-w-[1200px] mx-auto px-5 flex justify-between items-center">
          <div className="text-[28px] font-bold bg-gradient-to-r from-brand-500 to-[#8b5cf6] bg-clip-text text-transparent tracking-tight">
            qodefly
          </div>
          <div className="flex gap-3 items-center">
            <button
              onClick={() => openModal("login")}
              className="px-5 py-2.5 bg-transparent border border-white/10 rounded-lg text-sm text-[#64748b] hover:text-white hover:border-white/30 transition-all"
            >
              Log in
            </button>
            <button
              onClick={() => openModal("register")}
              className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-lg text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
            >
              Get Beta Access
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-32 text-center">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-brand-500/10 border border-brand-500/30 rounded-full text-sm text-brand-500">
              ✨ AI-Powered · Vibe Coding · 2026
            </span>
            <span className="inline-block ml-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-sm text-green-500">
              🧪 Beta Open
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 bg-gradient-to-br from-white to-white/70 bg-clip-text text-transparent">
            Build Fast.
            <br />
            Deploy Faster.
          </h1>

          <p className="text-lg md:text-xl text-[#64748b] max-w-[600px] mx-auto mb-12">
            The hosting platform built for AI-assisted development. Describe
            your project, AI builds it, one-click deploy — no code, no Git, no
            DevOps.
          </p>

          <div className="flex gap-4 justify-center items-center flex-wrap mb-4">
            <button
              onClick={() => openModal("register")}
              className="px-8 py-4 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-base font-semibold text-white hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/30 transition-all inline-flex items-center gap-2"
            >
              🚀 Join Beta — It&apos;s Free
            </button>
            <button
              onClick={() => openModal("waitlist")}
              className="px-8 py-4 bg-white/5 border border-white/15 rounded-xl text-base font-semibold text-white hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
            >
              📬 Notify Me at Launch
            </button>
          </div>
          <p className="text-xs text-[#64748b]">
            Beta: limited spots. Build & deploy real projects today.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="p-10 bg-white/[0.03] border border-white/10 rounded-2xl hover:-translate-y-1 hover:border-brand-500 hover:bg-white/[0.05] transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-[#8b5cf6] rounded-xl flex items-center justify-center text-2xl mb-5">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {f.title}
                </h3>
                <p className="text-[#64748b] text-[15px] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 text-center text-[#64748b] text-sm border-t border-white/10 mt-24">
        <div className="max-w-[1200px] mx-auto px-5">
          &copy; 2026 Qodefly. The hosting platform for the AI generation.
        </div>
      </footer>

      {/* ===== MODAL ===== */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl max-w-[440px] w-full p-10 relative shadow-2xl animate-in">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 bg-white/5 border border-white/10 rounded-lg text-[#64748b] hover:text-white hover:bg-white/10 flex items-center justify-center transition-all"
            >
              ✕
            </button>

            {/* SUCCESS STATES */}
            {success === "register" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🚀
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Welcome to Qodefly!
                </h3>
                <p className="text-[#64748b] text-sm">
                  Redirecting to dashboard...
                </p>
              </div>
            )}

            {success === "login" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  👋
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Welcome back!
                </h3>
                <p className="text-[#64748b] text-sm">
                  Redirecting to dashboard...
                </p>
              </div>
            )}

            {success === "waitlist" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  ✨
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  You&apos;re on the list!
                </h3>
                <p className="text-[#64748b] text-sm">
                  We&apos;ll notify you when Qodefly launches publicly.
                </p>
              </div>
            )}

            {/* AUTH FORMS */}
            {!success && modal !== "waitlist" && (
              <>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {tab === "register" ? "Join the Beta" : "Welcome Back"}
                </h2>
                <p className="text-sm text-[#64748b] mb-7">
                  {tab === "register"
                    ? "Create your account and start building"
                    : "Log in to your account"}
                </p>

                <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-7">
                  <button
                    onClick={() => {
                      setTab("register");
                      setError("");
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      tab === "register"
                        ? "bg-brand-500 text-white"
                        : "text-[#64748b] hover:text-white"
                    }`}
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => {
                      setTab("login");
                      setError("");
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      tab === "login"
                        ? "bg-brand-500 text-white"
                        : "text-[#64748b] hover:text-white"
                    }`}
                  >
                    Log In
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {tab === "register" ? (
                  <form
                    onSubmit={handleRegister}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#64748b]">
                        Email
                      </label>
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
                      <label className="text-xs font-medium text-[#64748b]">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        minLength={8}
                        className="px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25"
                      />
                      <span className="text-xs text-[#64748b]">
                        Minimum 8 characters
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#64748b]">
                        Confirm password
                      </label>
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
                      className="mt-1 py-3.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-[15px] font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Creating account..." : "Create Account"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[#64748b]">
                        Email
                      </label>
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
                      <label className="text-xs font-medium text-[#64748b]">
                        Password
                      </label>
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
                      className="mt-1 py-3.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-[15px] font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Logging in..." : "Log In"}
                    </button>
                  </form>
                )}

                <p className="text-center mt-5 text-xs text-[#64748b]">
                  {tab === "register" ? (
                    <>
                      Already have an account?{" "}
                      <button
                        onClick={() => {
                          setTab("login");
                          setError("");
                        }}
                        className="text-brand-500 hover:underline"
                      >
                        Log in
                      </button>
                    </>
                  ) : (
                    <>
                      No account yet?{" "}
                      <button
                        onClick={() => {
                          setTab("register");
                          setError("");
                        }}
                        className="text-brand-500 hover:underline"
                      >
                        Join the beta
                      </button>
                    </>
                  )}
                </p>
              </>
            )}

            {/* WAITLIST FORM */}
            {!success && modal === "waitlist" && (
              <>
                <h2 className="text-2xl font-bold text-white mb-1">
                  Stay in the Loop
                </h2>
                <p className="text-sm text-[#64748b] mb-7">
                  We&apos;ll email you when Qodefly launches publicly
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={handleWaitlist}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#64748b]">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 py-3.5 bg-gradient-to-r from-slate-600 to-slate-500 rounded-xl text-[15px] font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Joining..." : "📬 Notify Me at Launch"}
                  </button>
                </form>

                <p className="text-center mt-5 text-xs text-[#64748b]">
                  Want to try now?{" "}
                  <button
                    onClick={() => {
                      setModal("register");
                      setTab("register");
                      setError("");
                    }}
                    className="text-brand-500 hover:underline"
                  >
                    Join the beta instead
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-in {
          animation: animate-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
