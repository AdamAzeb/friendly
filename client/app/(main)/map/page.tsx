"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { collection, onSnapshot, doc, updateDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import { STATUS_CONFIG } from "../../../components/MapClient";
import type { MapUser, StudyStatus } from "../../../types";
import { MapPin, Eye, EyeOff } from "lucide-react";

const MapClient = dynamic(() => import("../../../components/MapClient"), { ssr: false });

const PLACEHOLDERS: MapUser[] = [
  { uid: "p1", name: "Layla",  lat: 57.1305, lng: -2.1380, status: "come_study", isPlaceholder: true },
  { uid: "p2", name: "Marcus", lat: 57.1295, lng: -2.1395, status: "locked_in",  isPlaceholder: true },
  { uid: "p3", name: "Amira",  lat: 57.1310, lng: -2.1360, status: "free",       isPlaceholder: true },
  { uid: "p4", name: "Rory",   lat: 57.1285, lng: -2.1410, status: "eating",     isPlaceholder: true },
  { uid: "p5", name: "Priya",  lat: 57.1320, lng: -2.1385, status: "come_study", isPlaceholder: true },
  { uid: "p6", name: "Finn",   lat: 57.1300, lng: -2.1405, status: "free",       isPlaceholder: true },
  { uid: "p7", name: "Yasmin", lat: 57.1292, lng: -2.1370, status: "locked_in",  isPlaceholder: true },
];

const STATUS_OPTIONS: { value: StudyStatus; label: string }[] = [
  { value: "locked_in",  label: "Locked in"   },
  { value: "come_study", label: "Study buddy"  },
  { value: "free",       label: "Free"         },
  { value: "eating",     label: "Eating"       },
  { value: "invisible",  label: "Invisible"    },
];

export default function MapPage() {
  const { user, profile, updateProfile } = useAuth();
  const [liveUsers, setLiveUsers]  = useState<MapUser[]>([]);
  const [sharing,   setSharing]    = useState(false);
  const [myStatus,  setMyStatus]   = useState<StudyStatus>("invisible");
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!profile) return;
    setSharing(profile.shareLocation ?? false);
    setMyStatus(profile.status ?? "invisible");
  }, [profile]);

  useEffect(() => {
    const q = query(collection(db, "users"), where("shareLocation", "==", true));
    const unsub = onSnapshot(q, snap => {
      const loaded: MapUser[] = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.lat && data.lng && d.id !== user?.uid) {
          loaded.push({ uid: d.id, name: data.name ?? "Someone", lat: data.lat, lng: data.lng, status: (data.status ?? "invisible") as StudyStatus, avatarUrl: data.avatarUrl ?? "" });
        }
      });
      setLiveUsers(loaded);
    });
    return unsub;
  }, [user?.uid]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startWatching = useCallback(() => {
    if (!user || !navigator.geolocation) return;
    stopWatching();
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        updateDoc(doc(db, "users", user.uid), {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          locationUpdatedAt: serverTimestamp(),
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  }, [user, stopWatching]);

  useEffect(() => {
    if (sharing) {
      startWatching();
    } else {
      stopWatching();
      if (user) updateDoc(doc(db, "users", user.uid), { lat: null, lng: null });
    }
    return stopWatching;
  }, [sharing, user, startWatching, stopWatching]);

  async function toggleSharing() {
    const next = !sharing;
    setSharing(next);
    await updateProfile({ shareLocation: next });
  }

  async function changeStatus(s: StudyStatus) {
    setMyStatus(s);
    await updateProfile({ status: s });
  }

  const myMarker: MapUser | null =
    sharing && profile?.lat && profile?.lng
      ? { uid: user?.uid ?? "me", name: profile.name, lat: profile.lat, lng: profile.lng, status: myStatus, avatarUrl: profile.avatarUrl }
      : null;

  const allUsers: MapUser[] = [...PLACEHOLDERS, ...liveUsers, ...(myMarker ? [myMarker] : [])];

  return (
    <div className="flex flex-col gap-3" style={{ height: "calc(100vh - 90px)" }}>

      {/* Location toggle */}
      <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3 shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: sharing ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)" }}
        >
          {sharing
            ? <Eye size={15} className="text-[#3B82F6]" />
            : <EyeOff size={15} className="text-white/30" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {sharing ? "You are visible on the map" : "Share your location"}
          </p>
          <p className="text-xs text-white/30 mt-0.5 truncate">
            {sharing ? "Others can see your pin" : "Tap to appear on the map"}
          </p>
        </div>
        <button
          onClick={toggleSharing}
          className={`relative w-12 h-6 rounded-full shrink-0 transition-all duration-300 ${sharing ? "bg-[#3B82F6] shadow-[0_0_10px_rgba(59,130,246,0.4)]" : "bg-white/[0.1]"}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${sharing ? "translate-x-6" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Status chips — inline, no dropdown, no z-index clash with map */}
      {sharing && (
        <div className="flex gap-2 overflow-x-auto shrink-0 pb-0.5" style={{ scrollbarWidth: "none" }}>
          {STATUS_OPTIONS.map(opt => {
            const cfg = STATUS_CONFIG[opt.value];
            const active = myStatus === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => changeStatus(opt.value)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-all border"
                style={active ? {
                  background: cfg.color + "20",
                  borderColor: cfg.color + "60",
                  color: cfg.color,
                } : {
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: active ? cfg.color : "rgba(255,255,255,0.2)" }}
                />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 shrink-0">
        {(Object.entries(STATUS_CONFIG) as [StudyStatus, { color: string; label: string }][])
          .filter(([k]) => k !== "invisible")
          .map(([, v]) => (
            <div key={v.label} className="flex items-center gap-1.5 text-xs text-white/25">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: v.color }} />
              {v.label}
            </div>
          ))}
        <div className="flex items-center gap-1.5 text-xs text-white/15">
          <MapPin size={10} />
          Faded = demo users
        </div>
      </div>

      {/* Map — takes remaining height */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-white/[0.07] min-h-0">
        <MapClient users={allUsers} currentUserId={user?.uid} />
      </div>
    </div>
  );
}
