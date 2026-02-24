"use client";

export default function DashboardPage() {
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
        <button className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-lg text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all inline-flex items-center gap-2">
          ✨ New Project
        </button>
      </div>

      {/* Empty state */}
      <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
        <div className="w-20 h-20 bg-brand-500/10 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">
          🚀
        </div>
        <h2 className="text-xl font-semibold text-white mb-3">
          Create your first project
        </h2>
        <p className="text-[#64748b] max-w-md mx-auto mb-8 text-sm leading-relaxed">
          Describe what you want to build, and our AI will generate it for you.
          No coding required — just your ideas.
        </p>
        <button className="px-8 py-3 bg-gradient-to-r from-brand-500 to-[#8b5cf6] rounded-xl text-sm font-semibold text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-500/30 transition-all inline-flex items-center gap-2">
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
    </div>
  );
}
