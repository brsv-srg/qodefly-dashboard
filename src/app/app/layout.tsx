"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api, User } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip auth check on login page
    if (pathname === "/app/login") {
      setLoading(false);
      return;
    }

    if (!api.isAuthenticated()) {
      router.push("/app/login");
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
        router.push("/app/login");
      });
  }, [pathname, router]);

  // Login page — no layout
  if (pathname === "/app/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[#64748b] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  function handleLogout() {
    api.clearToken();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 flex flex-col shrink-0">
        <div className="p-6">
          <div className="text-xl font-bold bg-gradient-to-r from-brand-500 to-[#8b5cf6] bg-clip-text text-transparent">
            qodefly
          </div>
        </div>

        <nav className="flex-1 px-3">
          <a
            href="/app"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
              pathname === "/app"
                ? "bg-brand-500/10 text-brand-400"
                : "text-[#64748b] hover:text-white hover:bg-white/5"
            }`}
          >
            <span>📁</span>
            Projects
          </a>
          <a
            href="/app/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all mb-1 ${
              pathname === "/app/settings"
                ? "bg-brand-500/10 text-brand-400"
                : "text-[#64748b] hover:text-white hover:bg-white/5"
            }`}
          >
            <span>⚙️</span>
            Settings
          </a>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-xs font-bold text-brand-400">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.email}</p>
              {user?.is_beta && (
                <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                  Beta
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-xs text-[#64748b] hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
