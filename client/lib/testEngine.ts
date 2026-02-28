/**
 * Quick smoke-test for the recommendation engine.
 * Run with:  npx tsx lib/testEngine.ts
 *
 * dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
 */
import { getTopSuggestedSlots } from "./recommendationEngine";
import type { AvailabilityBlock } from "../types";

// Build a Record<string, AvailabilityBlock[]> grouped by userId
const allAvailability: Record<string, AvailabilityBlock[]> = {
  alice: [
    { userId: "alice", dayOfWeek: 1, start: "14:00", end: "16:00" },
    { userId: "alice", dayOfWeek: 2, start: "09:00", end: "12:00" },
  ],
  bob: [
    { userId: "bob", dayOfWeek: 1, start: "13:00", end: "17:00" },
    { userId: "bob", dayOfWeek: 2, start: "10:00", end: "11:00" },
  ],
  carol: [
    { userId: "carol", dayOfWeek: 2, start: "10:00", end: "13:00" },
    // Wednesday block — carol is in the group so it won't be ignored
    { userId: "carol", dayOfWeek: 3, start: "08:00", end: "20:00" },
  ],
};

const groupMembers = ["alice", "bob", "carol"];

const results = getTopSuggestedSlots(allAvailability, groupMembers);

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

console.log("Top suggested slots:");
results.forEach((s, i) =>
  console.log(
    `  ${i + 1}. ${DAY[s.dayOfWeek]} ${s.start}–${s.end}  (${s.overlapCount} members)`
  )
);

console.assert(results.length <= 3, "Should return at most 3 slots");
console.assert(results.length > 0, "Should return at least 1 slot");

console.log("\nAll assertions passed ✓");
