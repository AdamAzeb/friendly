"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import type { UserProfile, StudyStatus } from "../types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Omit<UserProfile, "createdAt">>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  updateProfile: async () => {},
});

const DEFAULT_PROFILE: Omit<UserProfile, "createdAt"> = {
  name: "Anonymous",
  university: "Robert Gordon University (RGU)",
  degree: "",
  year: "",
  interests: [],
  shareLocation: false,
  status: "invisible" as StudyStatus,
  avatarUrl: "",
  groupIds: [],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        await signInAnonymously(auth);
        return;
      }

      setUser(firebaseUser);

      const userRef = doc(db, "users", firebaseUser.uid);

      // Retry once if Firestore hasn't connected yet (common on first Turbopack load)
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
      } catch {
        await new Promise(r => setTimeout(r, 1500));
        userSnap = await getDoc(userRef);
      }

      if (!userSnap.exists()) {
        await setDoc(userRef, { ...DEFAULT_PROFILE, createdAt: serverTimestamp() });
        setProfile({ ...DEFAULT_PROFILE });
      } else {
        const data = userSnap.data();
        setProfile({
          name: data.name ?? "Anonymous",
          university: data.university ?? "Robert Gordon University (RGU)",
          degree: data.degree ?? "",
          year: data.year ?? "",
          interests: data.interests ?? [],
          shareLocation: data.shareLocation ?? false,
          status: (data.status ?? "invisible") as StudyStatus,
          avatarUrl: data.avatarUrl ?? "",
          groupIds: data.groupIds ?? [],
          lat: data.lat,
          lng: data.lng,
        });
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateProfile = async (updates: Partial<Omit<UserProfile, "createdAt">>) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, updates as Record<string, unknown>);
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
