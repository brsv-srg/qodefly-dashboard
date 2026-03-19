"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

export default function NewProjectRedirect() {
  useEffect(() => {
    api.createProject().then((project) => {
      window.location.href = `/app/project/${project.id}?tab=chat`;
    }).catch(() => {
      window.location.href = "/app";
    });
  }, []);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
