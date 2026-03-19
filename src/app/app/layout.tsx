"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, User, Project } from "@/lib/api";

type SubPage = "chat" | "properties" | "design" | "resources" | "content" | "decisions";

const SUB_PAGES: { key: SubPage; label: string }[] = [
  { key: "chat", label: "Chat" },
  { key: "properties", label: "Properties" },
  { key: "design", label: "Design" },
  { key: "resources", label: "Resources" },
  { key: "content", label: "Content" },
  { key: "decisions", label: "Decisions" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  // Extract active project ID from pathname
  const projectMatch = pathname.match(/\/app\/project\/(\d+)/);
  const activeProjectId = projectMatch ? Number(projectMatch[1]) : null;

  useEffect(() => {
    if (pathname === "/app/login") {
      setLoading(false);
      return;
    }

    if (!api.isAuthenticated()) {
      window.location.href = "/app/login";
      return;
    }

    api
      .getMe()
      .then((u) => {
        setUser(u);
        setLoading(false);
      })
      .catch(() => {
        api.clearToken();
        window.location.href = "/app/login";
      });

    // Load projects for sidebar
    api.listProjects().then((data) => setProjects(data.projects)).catch(() => {});
  }, [pathname]);

  // Auto-expand active project
  useEffect(() => {
    if (activeProjectId) {
      setExpandedId(activeProjectId);
    }
  }, [activeProjectId]);

  // Login page — no layout
  if (pathname === "/app/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function handleLogout() {
    api.clearToken();
    window.location.href = "/";
  }

  async function handleNewProject() {
    if (creating) return;
    setCreating(true);
    try {
      const project = await api.createProject();
      setProjects((prev) => [project, ...prev]);
      setExpandedId(project.id);
      window.location.href = `/app/project/${project.id}?tab=chat`;
    } catch {
      setCreating(false);
    }
  }

  function toggleExpand(id: number) {
    setExpandedId(expandedId === id ? null : id);
  }

  // Get current tab from URL query
  function getCurrentTab(): SubPage {
    if (typeof window === "undefined") return "chat";
    const params = new URLSearchParams(window.location.search);
    return (params.get("tab") as SubPage) || "chat";
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-white/10 flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-white/10">
          <a href="/app" className="text-lg font-bold bg-gradient-to-r from-brand-500 to-[#8b5cf6] bg-clip-text text-transparent">
            qodefly
          </a>
        </div>

        {/* New Project button */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={handleNewProject}
            disabled={creating}
            className="w-full py-2 text-xs font-medium text-brand-400 border border-brand-500/30 rounded-lg hover:bg-brand-500/10 transition-all disabled:opacity-50"
          >
            {creating ? "Creating..." : "+ New Project"}
          </button>
        </div>

        {/* Project tree */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {projects.map((p) => {
            const isExpanded = expandedId === p.id;
            const isActive = activeProjectId === p.id;
            const currentTab = getCurrentTab();

            return (
              <div key={p.id} className="mb-0.5">
                {/* Project name */}
                <button
                  onClick={() => {
                    toggleExpand(p.id);
                    if (!isActive) {
                      window.location.href = `/app/project/${p.id}?tab=chat`;
                    }
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left ${
                    isActive
                      ? "text-white bg-white/[0.05]"
                      : "text-[#94a3b8] hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="text-[10px]">{isExpanded ? "▼" : "▶"}</span>
                  <span className="truncate flex-1">{p.name}</span>
                  {!p.html_code && (
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60 shrink-0" title="No HTML yet" />
                  )}
                </button>

                {/* Sub-pages */}
                {isExpanded && (
                  <div className="ml-5 border-l border-white/5 pl-2 py-0.5">
                    {SUB_PAGES.map((sp) => {
                      const isActiveTab = isActive && currentTab === sp.key;
                      return (
                        <a
                          key={sp.key}
                          href={`/app/project/${p.id}?tab=${sp.key}`}
                          className={`block px-3 py-1.5 rounded text-xs transition-all ${
                            isActiveTab
                              ? "text-brand-400 bg-brand-500/10"
                              : "text-[#64748b] hover:text-white hover:bg-white/[0.03]"
                          }`}
                        >
                          {sp.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {projects.length === 0 && !loading && (
            <p className="text-xs text-[#475569] text-center py-8 px-4">
              No projects yet. Create one to get started.
            </p>
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/10">
          <a
            href="/app/settings"
            className={`flex items-center gap-2 px-5 py-2.5 text-xs transition-all ${
              pathname === "/app/settings"
                ? "text-brand-400"
                : "text-[#64748b] hover:text-white"
            }`}
          >
            Settings
          </a>
          <div className="px-4 py-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500/20 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-400 shrink-0">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-[11px] text-[#64748b] truncate flex-1">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-[10px] text-[#475569] hover:text-white transition-colors shrink-0"
            >
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
