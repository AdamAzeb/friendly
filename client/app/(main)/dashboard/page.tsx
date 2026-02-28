"use client";

// Dev 2 owns this page.
// Responsibilities: list user's groups, create group, join group via invite code.

import { useAuth } from "../../../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <p className="text-sm text-zinc-400">uid: {user?.uid}</p>
    </div>
  );
}
