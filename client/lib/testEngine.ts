/**
 * Quick smoke-test for the recommendation engine.
 * Run with:  npx tsx lib/testEngine.ts
 *
 * dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
 */
import { getTopSuggestedSlots } from "./recommendationEngine";
import type { AvailabilityBlock } from "../types";

const blocks: AvailabilityBlock[] = [
  // Alice and Bob both free Monday (1) 14–16 → 2-person, 120 min → score 240
  { userId: "alice", dayOfWeek: 1, start: "14:00", end: "16:00" },
  { userId: "bob",   dayOfWeek: 1, start: "13:00", end: "17:00" },

  // All three free Tuesday (2) 10–11 → 3-person, 60 min → score 180
  { userId: "alice", dayOfWeek: 2, start: "09:00", end: "12:00" },
  { userId: "bob",   dayOfWeek: 2, start: "10:00", end: "11:00" },
  { userId: "carol", dayOfWeek: 2, start: "10:00", end: "13:00" },

  // Carol not in the group — should be ignored
  { userId: "carol", dayOfWeek: 3, start: "08:00", end: "20:00" },
];

const groupMembers = ["alice", "bob", "carol"];

const results = getTopSuggestedSlots(blocks, groupMembers);

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

console.log("Top suggested slots:");
results.forEach((s, i) =>
  console.log(
    `  ${i + 1}. ${DAY[s.dayOfWeek]} ${s.start}–${s.end}  (${s.overlapCount} members)`
  )
);

console.assert(results.length <= 3, "Should return at most 3 slots");
console.assert(results[0].dayOfWeek === 1, "Best slot should be Monday");
console.assert(results[0].overlapCount === 2, "Monday slot has 2 members");
console.assert(results[1].dayOfWeek === 2, "Second slot should be Tuesday");
console.assert(results[1].overlapCount === 3, "Tuesday slot has 3 members");

console.log("\nAll assertions passed ✓");
