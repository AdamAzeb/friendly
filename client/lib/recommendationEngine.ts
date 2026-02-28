import type { AvailabilityBlock, SuggestedSlot } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert "HH:MM" to total minutes. "14:30" → 870 */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Convert total minutes back to "HH:MM". 870 → "14:30" */
function toTimeString(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** Check whether two time blocks overlap: A.start < B.end && B.start < A.end */
function blocksOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number }
): boolean {
  return a.start < b.end && b.start < a.end;
}

// ─── Overlap detection (sweep-line per day) ───────────────────────────────────

interface TimeEvent {
  time: number;
  kind: "start" | "end";
  userId: string;
}

/**
 * Finds contiguous segments on a single day where ≥ 2 distinct members overlap.
 * Uses a Map so a user with multiple blocks on the same day is never double-counted.
 */
function findDayOverlaps(
  blocks: AvailabilityBlock[]
): Omit<SuggestedSlot, "dayOfWeek">[] {
  const events: TimeEvent[] = [];

  for (const b of blocks) {
    events.push({ time: toMinutes(b.start), kind: "start", userId: b.userId });
    events.push({ time: toMinutes(b.end), kind: "end", userId: b.userId });
  }

  // Process "end" before "start" at equal times to avoid zero-length ghosts
  events.sort((a, b) =>
    a.time !== b.time ? a.time - b.time : a.kind === "end" ? -1 : 1
  );

  const active = new Map<string, number>(); // userId → open block count
  const slots: Omit<SuggestedSlot, "dayOfWeek">[] = [];
  let segmentStart = -1;

  for (const ev of events) {
    const distinctCount = active.size;

    // Close current overlap segment before updating state
    if (distinctCount >= 2 && ev.time > segmentStart) {
      slots.push({
        start: toTimeString(segmentStart),
        end: toTimeString(ev.time),
        overlapCount: distinctCount,
      });
    }

    if (ev.kind === "start") {
      active.set(ev.userId, (active.get(ev.userId) ?? 0) + 1);
    } else {
      const next = (active.get(ev.userId) ?? 1) - 1;
      if (next <= 0) active.delete(ev.userId);
      else active.set(ev.userId, next);
    }

    if (active.size >= 2) segmentStart = ev.time;
  }

  return slots;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the top 3 suggested study slots for a group.
 *
 * Sorting priority:
 *   1. Highest overlapCount (most members free)
 *   2. Longest duration
 *   3. Earliest time (dayOfWeek then start time)
 *
 * @param allAvailability  Record mapping userId → their AvailabilityBlock[]
 * @param memberIds        Member IDs in this group (used for filtering)
 */
export function getTopSuggestedSlots(
  allAvailability: Record<string, AvailabilityBlock[]>,
  memberIds: string[]
): SuggestedSlot[] {
  const memberSet = new Set(memberIds);

  // 1. Flatten to a single array, keeping only group members
  const flat: AvailabilityBlock[] = [];
  for (const [userId, blocks] of Object.entries(allAvailability)) {
    if (!memberSet.has(userId)) continue;
    for (const b of blocks) {
      flat.push({ ...b, userId });
    }
  }

  // 2. Group blocks by dayOfWeek
  const byDay = new Map<number, AvailabilityBlock[]>();
  for (const block of flat) {
    if (!byDay.has(block.dayOfWeek)) byDay.set(block.dayOfWeek, []);
    byDay.get(block.dayOfWeek)!.push(block);
  }

  // 3. Find overlap segments per day
  const candidates: SuggestedSlot[] = [];

  for (const [dayOfWeek, blocks] of byDay) {
    for (const slot of findDayOverlaps(blocks)) {
      candidates.push({ dayOfWeek, ...slot });
    }
  }

  // 4. Sort: overlapCount desc → duration desc → dayOfWeek asc → start asc
  candidates.sort((a, b) => {
    if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount;

    const durA = toMinutes(a.end) - toMinutes(a.start);
    const durB = toMinutes(b.end) - toMinutes(b.start);
    if (durB !== durA) return durB - durA;

    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return toMinutes(a.start) - toMinutes(b.start);
  });

  // 5. Return top 3
  return candidates.slice(0, 3);
}
