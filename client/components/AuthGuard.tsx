"use client";

import { useAuth } from "../context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D0D0F]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#3B82F6] border-t-transparent animate-spin" />
          <p className="text-xs text-white/30 tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
