import type { AvailabilityBlock, SuggestedSlot } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "14:30" → 870 */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 870 → "14:30" */
function toTimeString(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// ─── Sweep-Line ───────────────────────────────────────────────────────────────

type Event = { time: number; kind: "start" | "end"; userId: string };

/**
 * Finds all contiguous segments on a single day where ≥2 members overlap.
 * Uses a Map<userId, count> so users with multiple blocks on the same day
 * are never double-counted.
 */
function findDayOverlaps(
  blocks: AvailabilityBlock[]
): Omit<SuggestedSlot, "dayOfWeek">[] {
  const events: Event[] = [];

  for (const b of blocks) {
    events.push({ time: toMinutes(b.start), kind: "start", userId: b.userId });
    events.push({ time: toMinutes(b.end),   kind: "end",   userId: b.userId });
  }

  // At equal times, process "end" before "start" to avoid zero-length ghosts.
  events.sort((a, b) =>
    a.time !== b.time ? a.time - b.time : a.kind === "end" ? -1 : 1
  );

  const active = new Map<string, number>(); // userId → open block count
  const slots: Omit<SuggestedSlot, "dayOfWeek">[] = [];
  let segmentStart = -1;

  for (const ev of events) {
    const count = active.size;

    // Close the current overlap segment before updating state.
    if (count >= 2 && ev.time > segmentStart) {
      slots.push({
        start: toTimeString(segmentStart),
        end:   toTimeString(ev.time),
        overlapCount: count,
      });
    }

    if (ev.kind === "start") {
      active.set(ev.userId, (active.get(ev.userId) ?? 0) + 1);
    } else {
      const next = (active.get(ev.userId) ?? 1) - 1;
      next <= 0 ? active.delete(ev.userId) : active.set(ev.userId, next);
    }

    if (active.size >= 2) segmentStart = ev.time;
  }

  return slots;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the top 3 suggested study slots for a group.
 *
 * Scoring:
 *   base  = overlapCount × durationMinutes
 *   bonus = +1 per member sharing location (passed in via sharingIds)
 *
 * @param availabilities  All AvailabilityBlocks fetched from Firestore
 * @param groupMemberIds  Member IDs in this group
 * @param sharingIds      Members currently sharing their location (optional)
 */
export function getTopSuggestedSlots(
  availabilities: AvailabilityBlock[],
  groupMemberIds: string[],
  sharingIds: string[] = []
): SuggestedSlot[] {
  const memberSet  = new Set(groupMemberIds);
  const sharingSet = new Set(sharingIds);

  // 1. Filter to group members only.
  const filtered = availabilities.filter((a) => memberSet.has(a.userId));

  // 2. Group by dayOfWeek.
  const byDay = new Map<number, AvailabilityBlock[]>();
  for (const block of filtered) {
    if (!byDay.has(block.dayOfWeek)) byDay.set(block.dayOfWeek, []);
    byDay.get(block.dayOfWeek)!.push(block);
  }

  // 3. Find overlapping segments per day and score them.
  const candidates: (SuggestedSlot & { score: number })[] = [];

  for (const [dayOfWeek, blocks] of byDay) {
    for (const slot of findDayOverlaps(blocks)) {
      const duration    = toMinutes(slot.end) - toMinutes(slot.start);
      const activeUsers = blocks
        .filter(
          (b) =>
            toMinutes(b.start) <= toMinutes(slot.start) &&
            toMinutes(b.end)   >= toMinutes(slot.end)
        )
        .map((b) => b.userId);

      const locationBonus = activeUsers.filter((id) => sharingSet.has(id)).length;
      const score = slot.overlapCount * duration + locationBonus;

      candidates.push({ dayOfWeek, ...slot, score });
    }
  }

  // 4. Sort by score, return top 3.
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ score: _score, ...rest }) => rest);
}
