import type { Timestamp } from "firebase/firestore";

// ─── User ─────────────────────────────────────────────────────────────────────

export type StudyStatus =
  | "locked_in"   // Studying hard, don't disturb
  | "come_study"  // Come study with me!
  | "free"        // Free time, come join
  | "eating"      // Going to eat
  | "invisible";  // Hidden from map

export interface UserProfile {
  name: string;
  university: string;
  degree: string;
  year: string;
  interests: string[];
  shareLocation: boolean;
  status: StudyStatus;
  avatarUrl?: string;
  lat?: number;
  lng?: number;
  locationUpdatedAt?: Timestamp;
  groupIds?: string[];
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

export interface GroupMember {
  uid: string;
  name: string;
  joinedAt?: Timestamp;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
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
  createdAt?: Timestamp;
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

// ─── Friends & DMs ────────────────────────────────────────────────────────────

export interface FriendRequest {
  id: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  status: "pending" | "accepted" | "declined";
  createdAt?: Timestamp;
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export interface MapUser {
  uid: string;
  name: string;
  lat: number;
  lng: number;
  status: StudyStatus;
  avatarUrl?: string;
  isPlaceholder?: boolean;
}
