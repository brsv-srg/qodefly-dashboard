"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NewProjectPage() {
  const router = useRouter();

  // Setup step
  const [step, setStep] = useState<"setup" | "build">("setup");
  const [designPrefs, setDesignPrefs] = useState("");
  const [hasDesignPrefs, setHasDesignPrefs] = useState<boolean | null>(null);

  // Build step
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [html, setHtml] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleStartBuilding() {
    setStep("build");
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMsg = prompt.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setPrompt("");
    setLoading(true);

    try {
      const result = await api.generateProject(
        userMsg,
        undefined,
        hasDesignPrefs ? designPrefs : undefined
      );
      setHtml(result.html);
      if (!projectName) {
        setProjectName(result.name);
        setProjectDesc(result.description);
      }
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Done! Check the preview on the right. You can describe changes or save the project.",
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!html || saving) return;
    setSaving(true);
    try {
      await api.saveProject(projectName, projectDesc, html);
      window.location.href = "/app";
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  // ===== SETUP STEP =====
  if (step === "setup") {
    return (
      <div className="h-screen flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <button
            onClick={() => window.location.href = "/app"}
            className="text-[#64748b] hover:text-white text-sm transition-colors mb-8 block"
          >
            ← Back to projects
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">New Project</h1>
          <p className="text-[#64748b] mb-8">
            Let&apos;s set up your project before we start building.
          </p>

          <div className="space-y-6">
            <div>
              <p className="text-white text-sm font-medium mb-3">
                Do you have design preferences?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setHasDesignPrefs(true)}
                  className={`flex-1 p-4 rounded-xl border text-sm text-left transition-all ${
                    hasDesignPrefs === true
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-[#94a3b8] hover:border-white/20"
                  }`}
                >
                  <span className="text-lg block mb-1">🎨</span>
                  Yes, I have preferences
                </button>
                <button
                  onClick={() => {
                    setHasDesignPrefs(false);
                    setDesignPrefs("");
                  }}
                  className={`flex-1 p-4 rounded-xl border text-sm text-left transition-all ${
                    hasDesignPrefs === false
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-[#94a3b8] hover:border-white/20"
                  }`}
                >
                  <span className="text-lg block mb-1">✨</span>
                  Surprise me — AI decides
                </button>
              </div>
            </div>

            {hasDesignPrefs === true && (
              <div className="animate-in">
                <label className="text-white text-sm font-medium block mb-2">
                  Describe your design preferences
                </label>
                <textarea
                  value={designPrefs}
                  onChange={(e) => setDesignPrefs(e.target.value)}
                  placeholder="e.g. Dark theme, minimalist, blue accents, rounded corners, modern sans-serif font..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25 resize-none"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    "Dark theme, modern",
                    "Light & clean",
                    "Colorful & playful",
                    "Corporate & professional",
                    "Minimalist, lots of whitespace",
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setDesignPrefs(preset)}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-[#94a3b8] hover:text-white hover:border-white/20 transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasDesignPrefs !== null && (
              <button
                onClick={handleStartBuilding}
                className="w-full py-3.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all"
              >
                Start Building →
              </button>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes animate-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-in { animation: animate-in 0.3s ease-out; }
        `}</style>
      </div>
    );
  }

  // ===== BUILD STEP =====
  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.href = "/app"}
            className="text-[#64748b] hover:text-white text-sm transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-semibold text-white">
            {projectName || "New Project"}
          </h1>
          {designPrefs && (
            <span className="text-xs text-[#64748b] bg-white/5 px-2 py-1 rounded-md">
              🎨 {designPrefs.slice(0, 30)}
              {designPrefs.length > 30 ? "..." : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {html && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-lg text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-60"
            >
              {saving ? "Saving..." : "💾 Save Project"}
            </button>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat panel */}
        <div className="w-[400px] border-r border-white/10 flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">✨</div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  Describe your project
                </h2>
                <p className="text-sm text-[#64748b] max-w-xs mx-auto mb-6">
                  Tell the AI what you want to build. Be specific about content,
                  sections, and functionality.
                </p>
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  {[
                    "Landing page for a coffee shop with menu and hours",
                    "Personal portfolio with dark theme and projects section",
                    "Feedback form with star ratings and comments",
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example)}
                      className="w-full p-3 text-left text-sm text-[#94a3b8] bg-white/[0.03] border border-white/10 rounded-xl hover:border-brand-500/50 hover:text-white transition-all"
                    >
                      &quot;{example}&quot;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-brand-500 text-white rounded-br-md"
                      : "bg-white/[0.05] text-[#e2e8f0] border border-white/10 rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleGenerate} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={html ? "Describe changes..." : "Describe your project..."}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="px-4 py-3 bg-brand-500 rounded-xl text-white text-sm font-medium hover:bg-brand-600 transition-all disabled:opacity-40"
              >
                {loading ? "..." : "→"}
              </button>
            </div>
          </form>
        </div>

        {/* Preview panel */}
        <div className="flex-1 bg-[#0a0f1a] flex items-center justify-center">
          {html ? (
            <div className="w-full h-full flex flex-col">
              <div className="px-4 py-2 border-b border-white/10 flex items-center gap-3 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 px-3 py-1 bg-white/5 rounded-md text-xs text-[#64748b] text-center">
                  preview
                </div>
              </div>
              <iframe
                srcDoc={html}
                className="flex-1 w-full bg-white"
                sandbox="allow-scripts"
                title="Preview"
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-20">🖥️</div>
              <p className="text-[#64748b] text-sm">
                Preview will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
