import type { Timestamp } from "firebase/firestore";

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  name: string;
  shareLocation: boolean;
  createdAt?: Timestamp;
}

// ─── Group ────────────────────────────────────────────────────────────────────

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  inviteCode: string;
  createdAt?: Timestamp;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  dayOfWeek: number; // 0 = Sun … 6 = Sat
  start: string;     // "14:00"
  end: string;       // "16:00"
  proposedBy: string;
  rsvps: string[];   // userIds
}

// ─── Location ─────────────────────────────────────────────────────────────────

export interface LocationData {
  lat: number;
  lng: number;
  updatedAt: Timestamp;
}

// ─── Availability ─────────────────────────────────────────────────────────────

/**
 * Stored at: availability/{userId}/blocks/{blockId}
 * userId is injected client-side when fetched (not stored in the document).
 */
export interface AvailabilityBlock {
  userId: string;    // populated from path, not stored in Firestore
  dayOfWeek: number; // 0 = Sun … 6 = Sat
  start: string;     // "14:00"
  end: string;       // "16:00"
}

// ─── Recommendation Engine ────────────────────────────────────────────────────

export interface SuggestedSlot {
  dayOfWeek: number;
  start: string;
  end: string;
  overlapCount: number;
}
