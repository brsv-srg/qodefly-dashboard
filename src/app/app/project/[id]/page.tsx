"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { api, Project } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Chat state
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [generating, setGenerating] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating]);

  // Load project on mount
  useEffect(() => {
    if (!projectId) return;
    api
      .getProject(projectId)
      .then((p) => {
        setProject(p);
        setName(p.name);
        setHtml(p.html_code || null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [projectId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || generating) return;

    const userMsg = prompt.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setPrompt("");
    setGenerating(true);

    try {
      const result = await api.updateProject(projectId, userMsg);
      setHtml(result.html);
      setProject((prev) =>
        prev ? { ...prev, version: result.version } : prev
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Updated to v${result.version}. Check the preview — describe more changes or you're done!`,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!html || saving) return;
    setSaving(true);
    try {
      const result = await api.updateProject(projectId, "");
      setProject((prev) =>
        prev ? { ...prev, version: result.version } : prev
      );
      setSaving(false);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <p className="text-red-400 mb-4">{error || "Project not found"}</p>
          <button
            onClick={() => (window.location.href = "/app")}
            className="text-brand-400 hover:text-brand-300 text-sm transition-colors"
          >
            ← Back to projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (window.location.href = "/app")}
            className="text-[#64748b] hover:text-white text-sm transition-colors"
          >
            ← Back
          </button>

          {editingName ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingName(false);
              }}
              className="text-lg font-semibold text-white bg-white/5 border border-white/12 rounded-lg px-3 py-1 outline-none focus:border-brand-500 transition-all"
            />
          ) : (
            <h1
              onClick={() => setEditingName(true)}
              className="text-lg font-semibold text-white cursor-pointer hover:text-brand-400 transition-colors"
              title="Click to rename"
            >
              {name}
            </h1>
          )}

          <span className="text-xs text-[#64748b] bg-white/5 px-2 py-1 rounded-md">
            v{project.version}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              project.status === "live"
                ? "bg-green-500/10 text-green-400"
                : "bg-yellow-500/10 text-yellow-400"
            }`}
          >
            {project.status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {html && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-lg text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
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
                <div className="text-4xl mb-4">🛠️</div>
                <h2 className="text-lg font-semibold text-white mb-2">
                  Iterate on your project
                </h2>
                <p className="text-sm text-[#64748b] max-w-xs mx-auto mb-6">
                  Describe changes you want to make. The AI will update
                  your project and show the preview.
                </p>
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  {[
                    "Change the color scheme to blue and white",
                    "Add a contact form at the bottom",
                    "Make the header sticky with a blur effect",
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
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
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

            {generating && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <div
                      className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe changes..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25"
                disabled={generating}
              />
              <button
                type="submit"
                disabled={generating || !prompt.trim()}
                className="px-4 py-3 bg-brand-500 rounded-xl text-white text-sm font-medium hover:bg-brand-600 transition-all disabled:opacity-40"
              >
                {generating ? "..." : "→"}
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
                  preview — v{project.version}
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
                No HTML generated yet — describe changes to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
