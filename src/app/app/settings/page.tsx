"use client";

import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.getMe().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
      <p className="text-sm text-[#64748b] mb-8">Manage your account</p>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#64748b] block mb-1">Email</label>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[15px]">
              {user?.email || "Loading..."}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#64748b] block mb-1">Account type</label>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[15px] flex items-center gap-2">
              {user?.is_beta && (
                <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full text-xs font-medium">
                  Beta Tester
                </span>
              )}
              <span className="text-white">Free plan</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#64748b] block mb-1">Member since</label>
            <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-[15px]">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Loading..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}