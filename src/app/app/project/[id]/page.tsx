"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { api, Project, Resource } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Tab = "chat" | "design" | "resources" | "context";

const STYLE_PRESETS = [
  "Dark theme",
  "Light & clean",
  "Minimalist",
  "Colorful",
  "Corporate",
  "Modern",
  "Rounded corners",
  "Sharp edges",
  "Gradient accents",
  "Flat design",
];

export default function ProjectPage() {
  const params = useParams();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  // Chat state
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [generating, setGenerating] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");

  // Design state
  const [designPrefs, setDesignPrefs] = useState<Record<string, unknown>>({});
  const [designSaving, setDesignSaving] = useState(false);

  // Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  // Context state
  const [contextMd, setContextMd] = useState("");
  const [contextSaving, setContextSaving] = useState(false);

  // Setup mode (for newly created projects)
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating]);

  // Check for setup=true query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("setup") === "true") {
      setIsSetup(true);
      setActiveTab("design");
    }
  }, []);

  // Load project on mount
  useEffect(() => {
    if (!projectId) return;
    api
      .getProject(projectId)
      .then((p) => {
        setProject(p);
        setName(p.name);
        setHtml(p.html_code || null);
        setDesignPrefs(p.design_preferences || {});
        setContextMd(p.context_md || "");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [projectId]);

  // Load resources when tab opens
  useEffect(() => {
    if (activeTab === "resources" && resources.length === 0 && !resourcesLoading) {
      setResourcesLoading(true);
      api
        .listResources(projectId)
        .then((data) => {
          setResources(data.resources);
          setResourcesLoading(false);
        })
        .catch(() => setResourcesLoading(false));
    }
  }, [activeTab, projectId]);

  // === Handlers ===

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || generating) return;

    const userMsg = prompt.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setPrompt("");
    setGenerating(true);

    try {
      const result = await api.updateProject(projectId, { prompt: userMsg });
      setHtml(result.html);
      setProject((prev) =>
        prev ? { ...prev, version: result.version } : prev
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Updated to v${result.version}. Check the preview!`,
        },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${message}` },
      ]);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveName() {
    setEditingName(false);
    if (name !== project?.name) {
      try {
        await api.updateProject(projectId, { name });
        setProject((prev) => (prev ? { ...prev, name } : prev));
      } catch {}
    }
  }

  async function handleSaveDesign() {
    setDesignSaving(true);
    try {
      await api.updateProject(projectId, { design_preferences: designPrefs });
      setProject((prev) =>
        prev ? { ...prev, design_preferences: designPrefs } : prev
      );
      if (isSetup) {
        setIsSetup(false);
        setActiveTab("chat");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      alert(message);
    } finally {
      setDesignSaving(false);
    }
  }

  async function handleSaveContext() {
    setContextSaving(true);
    try {
      await api.updateProject(projectId, { context_md: contextMd });
      setProject((prev) =>
        prev ? { ...prev, context_md: contextMd } : prev
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Save failed";
      alert(message);
    } finally {
      setContextSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const desc = window.prompt("Description (optional):", "") || "";
      const rtype = file.type.startsWith("image/") ? "image" : "logo";
      const res = await api.uploadFileResource(projectId, file, rtype, desc);
      setResources((prev) => [res, ...prev]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      alert(message);
    }
    e.target.value = "";
  }

  async function handleAddTextResource() {
    const name = window.prompt("Resource name:");
    if (!name) return;
    const content = window.prompt("Content:");
    if (!content) return;
    const desc = window.prompt("Description (optional):", "") || "";
    try {
      const res = await api.addTextResource(projectId, name, content, desc);
      setResources((prev) => [res, ...prev]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed";
      alert(message);
    }
  }

  async function handleDeleteResource(id: number) {
    if (!confirm("Delete this resource?")) return;
    try {
      await api.deleteResource(projectId, id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  }

  function toggleStyleTag(tag: string) {
    const tags: string[] = (designPrefs.style_tags as string[]) || [];
    const next = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    setDesignPrefs({ ...designPrefs, style_tags: next });
  }

  // === Render ===

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
          <p className="text-red-400 mb-4">{error || "Project not found"}</p>
          <button
            onClick={() => (window.location.href = "/app")}
            className="text-brand-400 hover:text-brand-300 text-sm transition-colors"
          >
            Back to projects
          </button>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "chat", label: "Chat" },
    { key: "design", label: "Design" },
    { key: "resources", label: "Resources" },
    { key: "context", label: "Context" },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => (window.location.href = "/app")}
            className="text-[#64748b] hover:text-white text-sm transition-colors"
          >
            Back
          </button>

          {editingName ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
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
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-[400px] border-r border-white/10 flex flex-col shrink-0">
          {/* Tab bar */}
          <div className="flex border-b border-white/10 shrink-0">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2.5 text-xs font-medium transition-all ${
                  activeTab === t.key
                    ? "text-brand-400 border-b-2 border-brand-500"
                    : "text-[#64748b] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "chat" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && !html && (
                    <div className="text-center py-16">
                      <h2 className="text-lg font-semibold text-white mb-2">
                        Describe your project
                      </h2>
                      <p className="text-sm text-[#64748b] max-w-xs mx-auto mb-6">
                        Tell the AI what you want to build or change.
                      </p>
                      <div className="space-y-2 text-left max-w-xs mx-auto">
                        {[
                          "Landing page for a coffee shop with menu",
                          "Personal portfolio with dark theme",
                          "Add a contact form at the bottom",
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

                  {messages.length === 0 && html && (
                    <div className="text-center py-16">
                      <h2 className="text-lg font-semibold text-white mb-2">
                        Iterate on your project
                      </h2>
                      <p className="text-sm text-[#64748b] max-w-xs mx-auto">
                        Describe changes you want to make.
                      </p>
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
                          <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-4 border-t border-white/10 shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={html ? "Describe changes..." : "Describe your project..."}
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/12 rounded-xl text-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all placeholder:text-white/25"
                      disabled={generating}
                    />
                    <button
                      type="submit"
                      disabled={generating || !prompt.trim()}
                      className="px-4 py-3 bg-brand-500 rounded-xl text-white text-sm font-medium hover:bg-brand-600 transition-all disabled:opacity-40"
                    >
                      {generating ? "..." : "Send"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "design" && (
              <div className="p-4 space-y-6">
                {isSetup && (
                  <div className="bg-brand-500/10 border border-brand-500/30 rounded-xl p-4 text-sm text-brand-300">
                    Set your design preferences before starting. You can always change these later.
                  </div>
                )}

                {/* Style tags */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">Style</label>
                  <div className="flex flex-wrap gap-2">
                    {STYLE_PRESETS.map((tag) => {
                      const tags = (designPrefs.style_tags as string[]) || [];
                      const active = tags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleStyleTag(tag)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                            active
                              ? "bg-brand-500/20 border border-brand-500 text-brand-300"
                              : "bg-white/5 border border-white/10 text-[#94a3b8] hover:border-white/20 hover:text-white"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colors */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">Colors</label>
                  <div className="space-y-2">
                    {["primary", "secondary", "background", "text"].map((key) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-[#94a3b8] w-20 capitalize">{key}</span>
                        <input
                          type="color"
                          value={((designPrefs.colors as Record<string, string>) || {})[key] || "#3b82f6"}
                          onChange={(e) => {
                            const colors = { ...(designPrefs.colors as Record<string, string> || {}) };
                            colors[key] = e.target.value;
                            setDesignPrefs({ ...designPrefs, colors });
                          }}
                          className="w-8 h-8 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                        />
                        <input
                          type="text"
                          value={((designPrefs.colors as Record<string, string>) || {})[key] || ""}
                          onChange={(e) => {
                            const colors = { ...(designPrefs.colors as Record<string, string> || {}) };
                            colors[key] = e.target.value;
                            setDesignPrefs({ ...designPrefs, colors });
                          }}
                          placeholder="#hex"
                          className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-brand-500 placeholder:text-white/20"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fonts */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">Fonts</label>
                  <div className="space-y-2">
                    {["heading", "body"].map((key) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-[#94a3b8] w-20 capitalize">{key}</span>
                        <input
                          type="text"
                          value={((designPrefs.fonts as Record<string, string>) || {})[key] || ""}
                          onChange={(e) => {
                            const fonts = { ...(designPrefs.fonts as Record<string, string> || {}) };
                            fonts[key] = e.target.value;
                            setDesignPrefs({ ...designPrefs, fonts });
                          }}
                          placeholder="e.g. Inter, Poppins..."
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-brand-500 placeholder:text-white/20"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spacing */}
                <div>
                  <label className="text-white text-sm font-medium block mb-3">Spacing</label>
                  <div className="flex gap-2">
                    {["compact", "normal", "spacious"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setDesignPrefs({ ...designPrefs, spacing: s })}
                        className={`flex-1 py-2 rounded-lg text-xs transition-all ${
                          designPrefs.spacing === s
                            ? "bg-brand-500/20 border border-brand-500 text-brand-300"
                            : "bg-white/5 border border-white/10 text-[#94a3b8] hover:border-white/20"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-white text-sm font-medium block mb-2">Design notes</label>
                  <textarea
                    value={(designPrefs.notes as string) || ""}
                    onChange={(e) => setDesignPrefs({ ...designPrefs, notes: e.target.value })}
                    placeholder="Any additional design instructions..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-500 transition-all placeholder:text-white/25 resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveDesign}
                  disabled={designSaving}
                  className="w-full py-3 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-60"
                >
                  {designSaving ? "Saving..." : isSetup ? "Save & Start Building" : "Save Design"}
                </button>
              </div>
            )}

            {activeTab === "resources" && (
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                  <label className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-[#94a3b8] hover:border-brand-500/50 transition-all cursor-pointer text-center">
                    Upload file
                    <input
                      type="file"
                      accept="image/*,.svg,.pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <button
                    onClick={handleAddTextResource}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-[#94a3b8] hover:border-brand-500/50 transition-all"
                  >
                    Add text
                  </button>
                </div>

                {resourcesLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : resources.length === 0 ? (
                  <div className="text-center py-12 text-[#64748b] text-sm">
                    <p>No resources yet.</p>
                    <p className="mt-1 text-xs">Upload images, logos, or add text content that the AI can use.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {resources.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/10 rounded-xl"
                      >
                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-xs text-[#64748b]">
                          {r.resource_type === "text" ? "Aa" : r.resource_type === "logo" ? "L" : "Img"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{r.name}</p>
                          {r.description && (
                            <p className="text-[#64748b] text-xs truncate">{r.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteResource(r.id)}
                          className="text-red-400/60 hover:text-red-400 text-xs transition-colors shrink-0"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "context" && (
              <div className="p-4 space-y-4">
                <p className="text-xs text-[#64748b]">
                  Project notes, history, and instructions. Auto-updated after each generation.
                  You can also edit manually.
                </p>
                <textarea
                  value={contextMd}
                  onChange={(e) => setContextMd(e.target.value)}
                  placeholder="e.g. Never use red buttons. Brand name is AcmeCo. Primary audience: developers."
                  rows={16}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-500 transition-all placeholder:text-white/25 resize-none font-mono"
                />
                <button
                  onClick={handleSaveContext}
                  disabled={contextSaving}
                  className="w-full py-3 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-60"
                >
                  {contextSaving ? "Saving..." : "Save Context"}
                </button>
              </div>
            )}
          </div>
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
                  preview &mdash; v{project.version}
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
              <div className="text-6xl mb-4 opacity-20">&#128421;</div>
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
