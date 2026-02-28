# Friendly – Team Guide

## Setup (everyone does this first)

```bash
git clone https://github.com/AdamAzeb/friendly.git
cd friendly/client
npm install
```

Create `client/.env.local` and paste the Firebase config values (get from Adam):

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

> `.env.local` is gitignored — never commit it.

Then run:

```bash
npm run dev
# open http://localhost:3000
```

You should see a navbar with Dashboard / Map / Profile and your anonymous user ID.

---

## Git workflow

```bash
git checkout -b dev2-groups-chat   # Dev 2
git checkout -b dev3-availability  # Dev 3
git checkout -b dev4-ui-map        # Dev 4
```

- **Never push directly to `main`.**
- Open a pull request when your feature is ready.
- If you need to add a shared type, add it to `client/types/index.ts` — never overwrite lines that are already there.

---

## Project structure

```
client/
  app/
    (main)/              ← all pages with Navbar live here
      dashboard/         ← Dev 2
      group/[groupId]/   ← Dev 2
      map/               ← Dev 4
      profile/           ← Dev 1
    layout.tsx           ← root layout (AuthProvider)
  components/
    Navbar.tsx           ← Dev 4 can style this
    AuthGuard.tsx        ← do not touch
  context/
    AuthContext.tsx      ← do not touch
  lib/
    firebase.ts          ← do not touch
    recommendationEngine.ts  ← Dev 3
    availabilityService.ts   ← Dev 3
  types/
    index.ts             ← shared types, add don't overwrite
```

---

## Key imports every dev will use

```ts
// Current Firebase user + Firestore profile
import { useAuth } from "../../../context/AuthContext";
const { user, profile, loading } = useAuth();
// user.uid  → the user's unique ID (string)
// profile.name → display name (default: "Anonymous")

// Firestore db instance
import { db } from "../../../lib/firebase";

// Shared types
import type { Group, Message, Session, AvailabilityBlock } from "../../../types";
```

---

## Firestore collections

| Collection | Path | Notes |
|---|---|---|
| Users | `users/{userId}` | Created automatically on first load |
| Groups | `groups/{groupId}` | Dev 2 creates these |
| Messages | `groups/{groupId}/messages/{messageId}` | Dev 2, realtime listener |
| Sessions | `groups/{groupId}/sessions/{sessionId}` | Dev 3 proposes these |
| Locations | `groups/{groupId}/locations/{userId}` | Dev 4 writes here |
| Availability | `availability/{userId}/blocks/{blockId}` | Dev 3 reads/writes |

---

## Dev 1 – Adam (Auth + Infrastructure) ✅ Done

Everything below is already built and on `main`.

- Firebase anonymous auth
- `AuthContext` — signs in anonymously, creates `users/{userId}` doc on first visit
- Route structure with Navbar and loading guard
- All shared types in `types/index.ts`

**Still to do:**
- Profile page: let users set their display name
- Location sharing toggle on profile page (sets `shareLocation: true/false` on user doc)

---

## Dev 2 – Groups + Chat

**Branch:** `git checkout -b dev2-groups-chat`

**Files to work in:**
- `app/(main)/dashboard/page.tsx`
- `app/(main)/group/[groupId]/page.tsx`

### Step 1 – Create a group

```ts
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase";

async function createGroup(name: string, userId: string) {
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ref = await addDoc(collection(db, "groups"), {
    name,
    createdBy: userId,
    inviteCode,
    createdAt: serverTimestamp(),
  });
  return ref.id; // groupId
}
```

### Step 2 – Join a group via invite code

```ts
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";

async function joinGroup(inviteCode: string, userId: string) {
  const q = query(collection(db, "groups"), where("inviteCode", "==", inviteCode));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Group not found");
  const groupId = snap.docs[0].id;
  await setDoc(doc(db, "groups", groupId, "members", userId), { joinedAt: serverTimestamp() });
  return groupId;
}
```

### Step 3 – Fetch user's groups

```ts
import { collectionGroup, query, where, getDocs } from "firebase/firestore";

async function getUserGroups(userId: string) {
  const q = query(collectionGroup(db, "members"), where("__name__", "==", userId));
  // simpler: store groupIds on the user doc and fetch each group
}
```

> Tip: easiest approach is to store `groupIds: string[]` on the user's doc and update it when they join/create a group.

### Step 4 – Realtime chat

```ts
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

// Listen for messages
const q = query(
  collection(db, "groups", groupId, "messages"),
  orderBy("timestamp", "asc")
);
const unsubscribe = onSnapshot(q, (snap) => {
  const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  setMessages(messages);
});

// Send a message
await addDoc(collection(db, "groups", groupId, "messages"), {
  senderId: user.uid,
  text: "Hello!",
  timestamp: serverTimestamp(),
});
```

**Call `unsubscribe()` in a `useEffect` cleanup.**

---

## Dev 3 – Availability + Recommendation Engine

**Branch:** `git checkout -b dev3-availability`

**Files to work in:**
- Create `app/(main)/group/[groupId]/availability.tsx` (component)
- `lib/recommendationEngine.ts` — already built, do not change the function signature
- `lib/availabilityService.ts` — already built, use these functions

### Save an availability block

```ts
import { saveAvailability } from "../../../lib/availabilityService";

// dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
await saveAvailability(user.uid, { dayOfWeek: 1, start: "14:00", end: "16:00" });
```

### Get suggested slots for a group

```ts
import { fetchGroupAvailability } from "../../../lib/availabilityService";
import { getTopSuggestedSlots } from "../../../lib/recommendationEngine";

const memberIds = ["uid1", "uid2", "uid3"]; // from group members subcollection
const allBlocks = await fetchGroupAvailability(memberIds);
const suggestions = getTopSuggestedSlots(allBlocks, memberIds);

// suggestions = [{ dayOfWeek: 1, start: "14:00", end: "16:00", overlapCount: 3 }, ...]
```

### Display a suggested slot

```ts
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

suggestions.map(slot => (
  <div key={`${slot.dayOfWeek}-${slot.start}`}>
    {DAYS[slot.dayOfWeek]} {slot.start}–{slot.end} · {slot.overlapCount} members free
  </div>
))
```

---

## Dev 4 – Map + UI

**Branch:** `git checkout -b dev4-ui-map`

**Files to work in:**
- `app/(main)/map/page.tsx`
- `components/Navbar.tsx` (styling)
- Global styles in `app/globals.css`

### Write user location to Firestore

```ts
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

function startSharingLocation(groupId: string, userId: string) {
  navigator.geolocation.watchPosition((pos) => {
    setDoc(doc(db, "groups", groupId, "locations", userId), {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      updatedAt: serverTimestamp(),
    });
  });
}
```

### Listen for all group members' locations

```ts
import { collection, onSnapshot } from "firebase/firestore";

const unsubscribe = onSnapshot(
  collection(db, "groups", groupId, "locations"),
  (snap) => {
    const locations = snap.docs.map(d => ({ userId: d.id, ...d.data() }));
    // update map pins
  }
);
```

### Mapbox setup

```bash
npm install mapbox-gl
npm install -D @types/mapbox-gl
```

```ts
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const map = new mapboxgl.Map({
  container: "map", // id of your div
  style: "mapbox://styles/mapbox/streets-v12",
  center: [-73.99, 40.73], // update to your campus coords
  zoom: 15,
});
```

Add `NEXT_PUBLIC_MAPBOX_TOKEN=your_token` to `.env.local`. Get a free token at mapbox.com.

---

## Firebase Console checklist

Make sure these are enabled (ask Adam to confirm):

- [ ] Authentication → Sign-in method → **Anonymous** → Enabled
- [ ] Firestore Database → created (start in **test mode**)
