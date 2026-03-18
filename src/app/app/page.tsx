"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Project } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listProjects()
      .then((data) => {
        setProjects(data.projects);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Create and manage your web projects
          </p>
        </div>
        <button
          onClick={() => window.location.href = "/app/new"}
          className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-lg text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all inline-flex items-center gap-2"
        >
          ✨ New Project
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : projects.length > 0 ? (
        /* Projects grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-brand-500/50 transition-all group"
            >
              {/* Preview thumbnail */}
              <div
                className="h-40 bg-[#0a0f1a] border-b border-white/10 flex items-center justify-center cursor-pointer"
                onClick={() => router.push(`/app/project/${p.id}`)}
              >
                <span className="text-3xl opacity-30">🖥️</span>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className="text-white font-medium text-sm truncate cursor-pointer hover:text-brand-400 transition-colors"
                    onClick={() => router.push(`/app/project/${p.id}`)}
                  >
                    {p.name}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                      p.status === "live"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <p className="text-[#64748b] text-xs line-clamp-2 mb-3">
                  {p.description}
                </p>

                <div className="flex items-center justify-between text-xs text-[#64748b]">
                  <span>v{p.version}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/app/project/${p.id}`)}
                      className="text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
          <div className="w-20 h-20 bg-brand-500/10 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">
            🚀
          </div>
          <h2 className="text-xl font-semibold text-white mb-3">
            Create your first project
          </h2>
          <p className="text-[#64748b] max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Describe what you want to build, and our AI will generate it for
            you. No coding required — just your ideas.
          </p>
          <button
            onClick={() => window.location.href = "/app/new"}
            className="px-8 py-3 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all inline-flex items-center gap-2"
          >
            ✨ Create with AI
          </button>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl text-left">
              <p className="text-white text-sm font-medium mb-1">
                💬 &quot;Landing page for my coffee shop&quot;
              </p>
              <p className="text-[#64748b] text-xs">Landing page</p>
            </div>
            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl text-left">
              <p className="text-white text-sm font-medium mb-1">
                💬 &quot;Portfolio with my recent work&quot;
              </p>
              <p className="text-[#64748b] text-xs">Portfolio</p>
            </div>
            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl text-left">
              <p className="text-white text-sm font-medium mb-1">
                💬 &quot;Feedback form for customers&quot;
              </p>
              <p className="text-[#64748b] text-xs">Web app</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
