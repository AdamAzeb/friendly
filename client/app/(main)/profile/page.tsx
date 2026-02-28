"use client";

// Dev 1 owns this page.
// Responsibilities: display name, location sharing toggle.

import { useAuth } from "../../../context/AuthContext";

export default function ProfilePage() {
  const { user, profile } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Profile</h1>
      <p className="text-sm text-zinc-500">Name: {profile?.name}</p>
      <p className="text-sm text-zinc-400 break-all">uid: {user?.uid}</p>
    </div>
  );
}
