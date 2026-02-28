"use client";

// Dev 2 owns this page.
// Responsibilities: group chat, member list, session proposals.

import { use } from "react";
import AvailabilityPanel from "./availability";

export default function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Group</h1>
      <p className="text-sm text-zinc-400">groupId: {groupId}</p>

      {/* Dev 3 — Availability & Suggestions */}
      <AvailabilityPanel groupId={groupId} />
    </div>
  );
}
