import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { AvailabilityBlock } from "../types";

// Path: availability/{userId}/blocks/{blockId}
function blocksRef(userId: string) {
  return collection(db, "availability", userId, "blocks");
}

function blockDoc(userId: string, dayOfWeek: number, start: string) {
  const id = `${dayOfWeek}_${start.replace(":", "")}`;
  return doc(db, "availability", userId, "blocks", id);
}

/** Save (or overwrite) one availability block for a user. */
export async function saveAvailability(
  userId: string,
  block: Omit<AvailabilityBlock, "userId">
): Promise<void> {
  const ref = blockDoc(userId, block.dayOfWeek, block.start);
  await setDoc(ref, { dayOfWeek: block.dayOfWeek, start: block.start, end: block.end });
}

/** Delete one availability block for a user. */
export async function deleteAvailability(
  userId: string,
  block: Omit<AvailabilityBlock, "userId">
): Promise<void> {
  const ref = blockDoc(userId, block.dayOfWeek, block.start);
  await deleteDoc(ref);
}

/** Fetch all availability blocks for a list of group members. */
export async function fetchGroupAvailability(
  memberIds: string[]
): Promise<AvailabilityBlock[]> {
  if (memberIds.length === 0) return [];

  const results: AvailabilityBlock[] = [];

  await Promise.all(
    memberIds.map(async (userId) => {
      const snap = await getDocs(blocksRef(userId));
      snap.forEach((d) => {
        const data = d.data();
        results.push({
          userId,
          dayOfWeek: data.dayOfWeek,
          start: data.start,
          end: data.end,
        });
      });
    })
  );

  return results;
}
