"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { api, Project, ChatMessage, Resource, ContentBlock } from "@/lib/api";
import { PALETTE_PRESETS, FONT_PAIRS, SITE_SECTIONS } from "@/lib/presets";

type SubPage = "chat" | "properties" | "design" | "resources" | "content" | "decisions";

export default function ProjectPage() {
  const params = useParams();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Tab
  const [activeTab, setActiveTab] = useState<SubPage>("chat");

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Properties
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [propsSaving, setPropsSaving] = useState(false);

  // Design
  const [designPrefs, setDesignPrefs] = useState<Record<string, unknown>>({});
  const [designSaving, setDesignSaving] = useState(false);

  // Resources
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

  // Content
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [contentLoaded, setContentLoaded] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);

  // Decisions
  const [decisions, setDecisions] = useState<Record<string, unknown>>({});
  const [decisionsSaving, setDecisionsSaving] = useState(false);

  // Scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Read tab from URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const tab = p.get("tab") as SubPage;
    if (tab && ["chat", "properties", "design", "resources", "content", "decisions"].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Load project + messages
  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      api.getProject(projectId),
      api.getMessages(projectId),
    ]).then(([p, m]) => {
      setProject(p);
      setName(p.name);
      setDescription(p.description || "");
      setHtml(p.html_code || null);
      setDesignPrefs(p.design_preferences || {});
      setDecisions(p.decisions || {});
      setMessages(m.messages);
      setLoading(false);
    }).catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, [projectId]);

  // Lazy-load resources
  useEffect(() => {
    if (activeTab === "resources" && !resourcesLoaded) {
      api.listResources(projectId).then((d) => {
        setResources(d.resources);
        setResourcesLoaded(true);
      }).catch(() => setResourcesLoaded(true));
    }
  }, [activeTab, projectId, resourcesLoaded]);

  // Lazy-load content
  useEffect(() => {
    if (activeTab === "content" && !contentLoaded) {
      api.getContentBlocks(projectId).then((d) => {
        setContentBlocks(d.blocks);
        setContentLoaded(true);
      }).catch(() => setContentLoaded(true));
    }
  }, [activeTab, projectId, contentLoaded]);

  // Switch tab and update URL
  const switchTab = useCallback((tab: SubPage) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/app/project/${projectId}?tab=${tab}`);
  }, [projectId]);

  // === Chat ===
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || sending) return;
    const text = prompt.trim();
    setPrompt("");
    setSending(true);

    // Optimistic user message
    const tempMsg: ChatMessage = { id: 0, role: "user", content: text, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.sendMessage(projectId, text);
      setMessages((prev) => [...prev.slice(0, -1), { ...tempMsg, id: res.message.id - 1 }, res.message]);

      // Apply project updates
      if (res.project_updates.html_code) {
        setHtml(res.project_updates.html_code);
        setProject((p) => p ? { ...p, version: res.project_updates.version || p.version } : p);
      }
      if (res.project_updates.design_preferences) {
        setDesignPrefs(res.project_updates.design_preferences);
      }
      if (res.project_updates.decisions) {
        setDecisions(res.project_updates.decisions);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setMessages((prev) => [...prev, { id: 0, role: "assistant", content: `Error: ${msg}`, created_at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  }

  // === Properties ===
  async function handleSaveProperties() {
    setPropsSaving(true);
    try {
      await api.updateProject(projectId, { name, description });
      setProject((p) => p ? { ...p, name, description } : p);
    } catch {}
    setPropsSaving(false);
  }

  // === Design ===
  async function handleSaveDesign() {
    setDesignSaving(true);
    try {
      await api.updateProject(projectId, { design_preferences: designPrefs });
      setProject((p) => p ? { ...p, design_preferences: designPrefs } : p);
    } catch {}
    setDesignSaving(false);
  }

  // === Resources ===
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const desc = window.prompt("Description:", "") || "";
    const section = window.prompt(`Section (${SITE_SECTIONS.join(", ")}):`, "hero") || "";
    try {
      const res = await api.uploadFileResource(projectId, file, file.type.startsWith("image/") ? "image" : "logo", desc);
      if (section) await api.patchResource(projectId, res.id, { section });
      setResources((prev) => [{ ...res, section }, ...prev]);
    } catch {}
    e.target.value = "";
  }

  async function handleAddTextResource() {
    const rname = window.prompt("Resource name:");
    if (!rname) return;
    const content = window.prompt("Content:");
    if (!content) return;
    try {
      const res = await api.addTextResource(projectId, rname, content);
      setResources((prev) => [res, ...prev]);
    } catch {}
  }

  // === Content ===
  function updateBlock(section: string, field: string, content: string) {
    setContentBlocks((prev) => {
      const idx = prev.findIndex((b) => b.section === section && b.field === field);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], content };
        return next;
      }
      return [...prev, { section, field, content, sort_order: 0 }];
    });
  }

  async function handleSaveContent() {
    setContentSaving(true);
    try {
      await api.upsertContentBlocks(projectId, contentBlocks);
    } catch {}
    setContentSaving(false);
  }

  // === Decisions ===
  async function handleSaveDecisions() {
    setDecisionsSaving(true);
    try {
      await api.updateDecisions(projectId, decisions);
    } catch {}
    setDecisionsSaving(false);
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
          <a href="/app" className="text-brand-400 text-sm">Back to projects</a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-white">{project.name}</h1>
          <span className="text-[10px] text-[#64748b] bg-white/5 px-2 py-0.5 rounded">v{project.version}</span>
        </div>
        <button
          disabled
          title="Coming soon"
          className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-[#64748b] cursor-not-allowed flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
          Fly
        </button>
      </div>

      {/* Main: sub-page + preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sub-page panel */}
        <div className="w-[420px] border-r border-white/10 flex flex-col shrink-0 overflow-hidden">
          {/* ====== CHAT ====== */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <h2 className="text-base font-semibold text-white mb-2">Start building</h2>
                    <p className="text-xs text-[#64748b] max-w-xs mx-auto mb-5">
                      Describe your project idea. The assistant will guide you through setup.
                    </p>
                    {["Landing page for a coffee shop", "Portfolio site with dark theme", "SaaS product page with pricing"].map((ex, i) => (
                      <button key={i} onClick={() => setPrompt(ex)} className="block w-full max-w-xs mx-auto mb-2 p-2.5 text-left text-xs text-[#94a3b8] bg-white/[0.03] border border-white/10 rounded-lg hover:border-brand-500/50 hover:text-white transition-all">
                        &quot;{ex}&quot;
                      </button>
                    ))}
                  </div>
                )}

                {messages.filter((m) => m.role !== "system").map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand-500 text-white rounded-br-sm"
                        : "bg-white/[0.05] text-[#e2e8f0] border border-white/10 rounded-bl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
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

              <form onSubmit={handleSend} className="p-3 border-t border-white/10 shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your idea or ask for changes..."
                    className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-brand-500 transition-all placeholder:text-white/25"
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !prompt.trim()} className="px-4 py-2.5 bg-brand-500 rounded-xl text-white text-sm font-medium hover:bg-brand-600 transition-all disabled:opacity-40">
                    Send
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ====== PROPERTIES ====== */}
          {activeTab === "properties" && (
            <div className="p-4 space-y-4 overflow-y-auto">
              <h2 className="text-sm font-semibold text-white">Project Properties</h2>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Slug</label>
                <div className="px-3 py-2 bg-white/[0.02] border border-white/5 rounded-lg text-xs text-[#64748b]">
                  {project.slug}.qodefly.io
                </div>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Brief description of your project..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-brand-500 resize-none placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Status</label>
                <span className={`text-xs px-2 py-0.5 rounded-full ${project.status === "live" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                  {project.status}
                </span>
              </div>
              <button onClick={handleSaveProperties} disabled={propsSaving} className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 transition-all disabled:opacity-60">
                {propsSaving ? "Saving..." : "Save Properties"}
              </button>
            </div>
          )}

          {/* ====== DESIGN ====== */}
          {activeTab === "design" && (
            <div className="p-4 space-y-5 overflow-y-auto">
              <h2 className="text-sm font-semibold text-white">Design Preferences</h2>

              {/* Palette presets */}
              <div>
                <label className="text-xs text-[#94a3b8] block mb-2">Color Palette</label>
                <div className="grid grid-cols-2 gap-2">
                  {PALETTE_PRESETS.map((p) => {
                    const active = designPrefs.palette_preset === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setDesignPrefs({ ...designPrefs, palette_preset: p.id, colors: { primary: p.primary, secondary: p.secondary, accent: p.accent, bg: p.bg, text: p.text } })}
                        className={`p-2.5 rounded-lg border text-left transition-all ${active ? "border-brand-500 bg-brand-500/10" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}
                      >
                        <div className="flex gap-1 mb-1.5">
                          {[p.primary, p.secondary, p.accent, p.bg].map((c, i) => (
                            <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <span className="text-[11px] text-white">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font pairs */}
              <div>
                <label className="text-xs text-[#94a3b8] block mb-2">Font Pair</label>
                <div className="space-y-1.5">
                  {FONT_PAIRS.map((f) => {
                    const active = designPrefs.font_pair === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setDesignPrefs({ ...designPrefs, font_pair: f.id, fonts: { heading: f.heading, body: f.body } })}
                        className={`w-full px-3 py-2 rounded-lg border text-left text-xs transition-all ${active ? "border-brand-500 bg-brand-500/10 text-white" : "border-white/10 bg-white/[0.02] text-[#94a3b8] hover:border-white/20 hover:text-white"}`}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Style tags */}
              <div>
                <label className="text-xs text-[#94a3b8] block mb-2">Style</label>
                <div className="flex flex-wrap gap-1.5">
                  {["Modern", "Minimalist", "Bold", "Elegant", "Playful", "Corporate", "Rounded", "Sharp edges"].map((tag) => {
                    const tags = (designPrefs.style_tags as string[]) || [];
                    const active = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          const next = active ? tags.filter((t) => t !== tag) : [...tags, tag];
                          setDesignPrefs({ ...designPrefs, style_tags: next });
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${active ? "bg-brand-500/20 border border-brand-500 text-brand-300" : "bg-white/5 border border-white/10 text-[#94a3b8] hover:text-white"}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Spacing */}
              <div>
                <label className="text-xs text-[#94a3b8] block mb-2">Spacing</label>
                <div className="flex gap-2">
                  {["compact", "normal", "spacious"].map((s) => (
                    <button key={s} onClick={() => setDesignPrefs({ ...designPrefs, spacing: s })}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] transition-all ${designPrefs.spacing === s ? "bg-brand-500/20 border border-brand-500 text-brand-300" : "bg-white/5 border border-white/10 text-[#94a3b8]"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Design notes */}
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Notes</label>
                <textarea
                  value={(designPrefs.notes as string) || ""}
                  onChange={(e) => setDesignPrefs({ ...designPrefs, notes: e.target.value })}
                  rows={2}
                  placeholder="Additional design instructions..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-brand-500 resize-none placeholder:text-white/20"
                />
              </div>

              <button onClick={handleSaveDesign} disabled={designSaving} className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 transition-all disabled:opacity-60">
                {designSaving ? "Saving..." : "Save Design"}
              </button>
            </div>
          )}

          {/* ====== RESOURCES ====== */}
          {activeTab === "resources" && (
            <div className="p-4 space-y-3 overflow-y-auto">
              <h2 className="text-sm font-semibold text-white">Resources</h2>
              <div className="flex gap-2">
                <label className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-[#94a3b8] hover:border-brand-500/50 transition-all cursor-pointer text-center">
                  Upload file
                  <input type="file" accept="image/*,.svg,.pdf" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={handleAddTextResource} className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-[#94a3b8] hover:border-brand-500/50 transition-all">
                  Add text
                </button>
              </div>

              {!resourcesLoaded ? (
                <div className="text-center py-8"><div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : resources.length === 0 ? (
                <p className="text-xs text-[#64748b] text-center py-8">No resources yet. Upload images or add text content.</p>
              ) : (
                <div className="space-y-2">
                  {resources.map((r) => (
                    <div key={r.id} className="flex items-center gap-2.5 p-2.5 bg-white/[0.03] border border-white/10 rounded-lg">
                      <div className="w-7 h-7 bg-white/5 rounded flex items-center justify-center text-[10px] text-[#64748b] shrink-0">
                        {r.resource_type === "text" ? "Aa" : "Img"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs truncate">{r.name}</p>
                        <p className="text-[#64748b] text-[10px] truncate">{r.section ? `Section: ${r.section}` : r.description || "No section"}</p>
                      </div>
                      <select
                        value={r.section || ""}
                        onChange={async (e) => {
                          const section = e.target.value;
                          await api.patchResource(projectId, r.id, { section });
                          setResources((prev) => prev.map((x) => x.id === r.id ? { ...x, section } : x));
                        }}
                        className="bg-white/5 border border-white/10 rounded text-[10px] text-[#94a3b8] px-1.5 py-1 outline-none"
                      >
                        <option value="">Section...</option>
                        {SITE_SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => { api.deleteResource(projectId, r.id); setResources((prev) => prev.filter((x) => x.id !== r.id)); }}
                        className="text-red-400/50 hover:text-red-400 text-[10px] shrink-0">Del</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====== CONTENT ====== */}
          {activeTab === "content" && (
            <div className="p-4 space-y-4 overflow-y-auto">
              <h2 className="text-sm font-semibold text-white">Content Blocks</h2>
              <p className="text-[10px] text-[#64748b]">Define text content for each section. The AI will use this exact text.</p>

              {SITE_SECTIONS.filter((s) => s !== "other").map((section) => {
                const fields = ["headline", "subheadline", "body", "button_text"];
                return (
                  <div key={section} className="border border-white/10 rounded-lg p-3">
                    <h3 className="text-xs font-medium text-white capitalize mb-2">{section}</h3>
                    {fields.map((field) => {
                      const block = contentBlocks.find((b) => b.section === section && b.field === field);
                      return (
                        <div key={field} className="mb-2">
                          <label className="text-[10px] text-[#64748b] capitalize block mb-0.5">{field.replace("_", " ")}</label>
                          {field === "body" ? (
                            <textarea
                              value={block?.content || ""}
                              onChange={(e) => updateBlock(section, field, e.target.value)}
                              rows={2}
                              className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs outline-none focus:border-brand-500 resize-none placeholder:text-white/15"
                              placeholder={`${section} ${field}...`}
                            />
                          ) : (
                            <input
                              type="text"
                              value={block?.content || ""}
                              onChange={(e) => updateBlock(section, field, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs outline-none focus:border-brand-500 placeholder:text-white/15"
                              placeholder={`${section} ${field}...`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              <button onClick={handleSaveContent} disabled={contentSaving} className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 transition-all disabled:opacity-60">
                {contentSaving ? "Saving..." : "Save Content"}
              </button>
            </div>
          )}

          {/* ====== DECISIONS ====== */}
          {activeTab === "decisions" && (
            <div className="p-4 space-y-4 overflow-y-auto">
              <h2 className="text-sm font-semibold text-white">Decisions &amp; Description</h2>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Project Description</label>
                <textarea
                  value={(decisions.description as string) || ""}
                  onChange={(e) => setDecisions({ ...decisions, description: e.target.value })}
                  rows={4}
                  placeholder="Detailed description of what this project is about..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-brand-500 resize-none placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Layout</label>
                <div className="flex gap-2">
                  {["single-page", "multi-page"].map((l) => (
                    <button key={l} onClick={() => setDecisions({ ...decisions, layout: l })}
                      className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${decisions.layout === l ? "bg-brand-500/20 border border-brand-500 text-brand-300" : "bg-white/5 border border-white/10 text-[#94a3b8]"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Sections</label>
                <div className="flex flex-wrap gap-1.5">
                  {SITE_SECTIONS.filter((s) => s !== "other").map((s) => {
                    const sections = (decisions.sections as string[]) || [];
                    const active = sections.includes(s);
                    return (
                      <button key={s} onClick={() => {
                        const next = active ? sections.filter((x) => x !== s) : [...sections, s];
                        setDecisions({ ...decisions, sections: next });
                      }}
                        className={`px-2.5 py-1 rounded-md text-[11px] capitalize transition-all ${active ? "bg-brand-500/20 border border-brand-500 text-brand-300" : "bg-white/5 border border-white/10 text-[#94a3b8]"}`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#94a3b8] block mb-1">Notes</label>
                <textarea
                  value={(decisions.notes as string) || ""}
                  onChange={(e) => setDecisions({ ...decisions, notes: e.target.value })}
                  rows={3}
                  placeholder="Key decisions, constraints, or architectural notes..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-brand-500 resize-none placeholder:text-white/20"
                />
              </div>
              <button onClick={handleSaveDecisions} disabled={decisionsSaving} className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 transition-all disabled:opacity-60">
                {decisionsSaving ? "Saving..." : "Save Decisions"}
              </button>
            </div>
          )}
        </div>

        {/* Preview */}
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
              <iframe srcDoc={html} className="flex-1 w-full bg-white" sandbox="allow-scripts" title="Preview" />
            </div>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-20">&#128421;</div>
              <p className="text-[#64748b] text-xs">Preview will appear here after generation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
