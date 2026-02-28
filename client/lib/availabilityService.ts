import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { AvailabilityBlock } from "../types";

/** Firestore ref for a user's availability blocks subcollection. */
function blocksRef(userId: string) {
  return collection(db, "availability", userId, "blocks");
}

/**
 * Save a new availability block for a user.
 * Uses addDoc so each block gets a unique auto-generated ID.
 * Returns the new document ID.
 */
export async function saveAvailability(
  userId: string,
  block: Omit<AvailabilityBlock, "userId">
): Promise<string> {
  const ref = await addDoc(blocksRef(userId), {
    dayOfWeek: block.dayOfWeek,
    start: block.start,
    end: block.end,
  });
  return ref.id;
}

/** Delete one availability block by its document ID. */
export async function deleteAvailability(
  userId: string,
  blockId: string
): Promise<void> {
  await deleteDoc(doc(db, "availability", userId, "blocks", blockId));
}

/** Fetch all availability blocks for a single user. */
export async function fetchUserAvailability(
  userId: string
): Promise<AvailabilityBlock[]> {
  const snap = await getDocs(blocksRef(userId));
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      userId,
      dayOfWeek: data.dayOfWeek as number,
      start: data.start as string,
      end: data.end as string,
    };
  });
}

/**
 * Fetch availability for multiple users and group by userId.
 * Returns a record mapping each userId to their AvailabilityBlock[].
 */
export async function fetchGroupAvailability(
  userIds: string[]
): Promise<Record<string, AvailabilityBlock[]>> {
  if (userIds.length === 0) return {};

  const result: Record<string, AvailabilityBlock[]> = {};

  await Promise.all(
    userIds.map(async (userId) => {
      result[userId] = await fetchUserAvailability(userId);
    })
  );

  return result;
}
